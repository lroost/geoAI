import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

export interface DocChunk {
    fileName: string
    category: string
    heading: string
    content: string
}

export interface SearchResult {
    chunk: DocChunk
    score: number
}

const STOP_WORDS = new Set([
    "der",
    "die",
    "das",
    "ein",
    "eine",
    "und",
    "oder",
    "in",
    "von",
    "zu",
    "mit",
    "für",
    "auf",
    "ist",
    "sind",
    "wie",
    "was",
    "ich",
    "du",
    "wir",
    "the",
    "a",
    "an",
    "is",
    "are",
    "and",
    "or",
    "in",
    "of",
    "to",
    "for",
    "with",
    "how",
    "do",
    "can",
    "this",
    "that",
    "it",
    "be",
    "has",
    "have",
    "not",
    "but",
    "from",
    "at",
    "by",
    "on",
    "as",
    "so",
    "if",
    "my",
    "was",
    "will",
    "would",
    "should",
    "could",
    "been",
    "being",
    "which",
    "when",
    "where",
    "what",
    "who",
    "there",
    "their",
    "them",
    "then",
    "than",
    "also",
    "just",
    "about",
    "more",
    "some",
    "other",
    "into",
    "use",
    "using",
    "used",
    "does",
    "did",
    "make",
    "made",
])

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9äöüß-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

let cachedChunks: DocChunk[] | null = null
let cachedIdf: Map<string, number> | null = null

async function loadChunks(): Promise<DocChunk[]> {
    if (cachedChunks) return cachedChunks

    const chunksDir = path.join(process.cwd(), "local-docs", "chunks")
    if (!existsSync(chunksDir)) return []

    const files = await fs.readdir(chunksDir)
    const mdFiles = files.filter((f) => f.endsWith(".md"))

    const chunks: DocChunk[] = await Promise.all(
        mdFiles.map(async (fileName) => {
            const raw = await fs.readFile(path.join(chunksDir, fileName), "utf-8")

            const categoryMatch = raw.match(/<!-- category: (.+?) -->/)
            const headingMatch = raw.match(/<!-- heading: (.+?) -->/)

            return {
                fileName,
                category: categoryMatch?.[1] ?? "unknown",
                heading: headingMatch?.[1] ?? fileName,
                content: raw.replace(/<!--.*?-->\n*/g, "").trim(),
            }
        }),
    )

    cachedChunks = chunks
    return chunks
}

function buildIdf(chunks: DocChunk[]): Map<string, number> {
    if (cachedIdf) return cachedIdf

    const docCount = chunks.length
    const termDocFreq = new Map<string, number>()

    for (const chunk of chunks) {
        const uniqueTokens = new Set(tokenize(`${chunk.heading} ${chunk.content.slice(0, 2000)}`))
        for (const token of uniqueTokens) {
            termDocFreq.set(token, (termDocFreq.get(token) ?? 0) + 1)
        }
    }

    const idf = new Map<string, number>()
    for (const [term, df] of termDocFreq) {
        idf.set(term, Math.log((docCount + 1) / (df + 1)) + 1)
    }

    cachedIdf = idf
    return idf
}

export async function searchDocs(query: string, topK = 3): Promise<SearchResult[]> {
    const chunks = await loadChunks()
    if (chunks.length === 0) return []

    const idf = buildIdf(chunks)
    const queryTokens = tokenize(query)
    if (queryTokens.length === 0) return []

    const scored: SearchResult[] = chunks.map((chunk) => {
        const headingTokens = new Set(tokenize(chunk.heading))
        const categoryTokens = new Set(tokenize(chunk.category))
        const contentLower = chunk.content.toLowerCase()

        let score = 0
        for (const token of queryTokens) {
            const tf = (contentLower.match(new RegExp(`\\b${token}`, "g")) ?? []).length
            const termIdf = idf.get(token) ?? 1
            let tokenScore = Math.log(1 + tf) * termIdf

            if (headingTokens.has(token)) tokenScore *= 3
            if (categoryTokens.has(token)) tokenScore *= 1.5

            score += tokenScore
        }

        return { chunk, score }
    })

    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter((r) => r.score > 0)
}

export function invalidateCache(): void {
    cachedChunks = null
    cachedIdf = null
}
