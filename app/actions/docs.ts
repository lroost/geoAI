"use server"

import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { searchDocs } from "@/lib/search"

const isValidPath = (fullPath: string) => fullPath.startsWith(process.cwd())

// Verzeichnisse, die als Projekt-Quellcode gelten (relativ zum Projekt-Root)
const PROJECT_SOURCE_DIRS = ["components/", "app/", "lib/", "src/"]

const isProjectFile = (file: string) =>
    PROJECT_SOURCE_DIRS.some((dir) => file.startsWith(dir))

export async function getDocList(): Promise<string[]> {
    const docsPath = path.join(process.cwd(), "local-docs")

    if (!existsSync(docsPath)) {
        try {
            await fs.mkdir(docsPath, { recursive: true })
            console.info("Info: Ordner 'local-docs' wurde automatisch erstellt.")
        } catch (error) {
            console.error("Fehler beim Erstellen des Ordners:", error)
            return []
        }
    }

    try {
        const files = await fs.readdir(docsPath)
        return files.filter((f) => f.endsWith(".md") || f.endsWith(".txt"))
    } catch (error) {
        console.error("Fehler beim Laden der Dateiliste:", error)
        return []
    }
}

/**
 * Dynamische Inhaltsabfrage: Erkennt, ob es ein Doc oder ein Project-File ist.
 */
export async function getSelectedDocsContent(selectedFiles: string[], query = ""): Promise<string> {
    if (selectedFiles.length === 0) return ""

    let combinedContent = ""
    const docsPath = path.join(process.cwd(), "local-docs")

    try {
        for (const file of selectedFiles) {
            const projectFile = isProjectFile(file)
            const filePath = projectFile
                ? path.join(process.cwd(), file)
                : path.join(docsPath, file)

            if (existsSync(filePath) && isValidPath(filePath)) {
                const content = await fs.readFile(filePath, "utf-8")
                const label = projectFile ? "SOURCE CODE" : "DOKUMENT"
                const excerpt = buildRelevantExcerpt(content, query, MAX_FILE_EXCERPT_TOKENS)
                const nextContent = `${combinedContent}\n--- ${label}: ${file} ---\n${excerpt}\n`
                const estimatedTokens = Math.ceil(nextContent.length / 4)
                if (estimatedTokens > MAX_MANUAL_CONTEXT_TOKENS) break
                combinedContent = nextContent
            }
        }
        return combinedContent
    } catch (error) {
        console.error("Fehler beim Lesen der Dokumentinhalte:", error)
        return ""
    }
}

export async function getProjectFiles(): Promise<string[]> {
    const componentsPath = path.join(process.cwd(), "components")

    if (!existsSync(componentsPath)) return []

    try {
        // recursive: true liest auch Unterordner in /components
        const files = await fs.readdir(componentsPath, { recursive: true })
        return (files as string[]).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    } catch (error) {
        console.error("Fehler beim Laden der Projekt-Files:", error)
        return []
    }
}

export interface AutoContextResult {
    content: string
    matchedChunks: { heading: string; category: string; score: number }[]
    tokens: number
}

const MAX_AUTO_CONTEXT_TOKENS = 800
const MAX_CHUNK_TOKENS = 280
const MAX_MANUAL_CONTEXT_TOKENS = 1_600
const MAX_FILE_EXCERPT_TOKENS = 500
const QUERY_ALIASES: Record<string, string[]> = {
    shadcn: ["shadcn", "radix", "ui", "component"],
    tailwind: ["tailwind", "utility", "class", "css"],
    maplibre: ["maplibre", "map", "layer", "source", "style"],
    maptiler: ["maptiler", "tiles", "style", "geocoding", "api"],
}

function tokenizeQuery(text: string): string[] {
    const baseTokens = text
        .toLowerCase()
        .replace(/[^a-z0-9äöüß-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2)

    const expanded = new Set(baseTokens)
    for (const token of baseTokens) {
        const aliases = QUERY_ALIASES[token]
        if (!aliases) continue
        for (const alias of aliases) expanded.add(alias)
    }

    return [...expanded]
}

function countOccurrences(haystack: string, needle: string): number {
    if (!needle) return 0

    let idx = 0
    let count = 0
    while (idx < haystack.length) {
        const found = haystack.indexOf(needle, idx)
        if (found === -1) break
        count += 1
        idx = found + needle.length
    }
    return count
}

function buildRelevantExcerpt(content: string, query: string, maxTokens: number): string {
    const maxChars = maxTokens * 4
    if (content.length <= maxChars) return content

    const queryTokens = tokenizeQuery(query)
    if (queryTokens.length === 0) return truncateChunk(content, maxTokens)

    const lines = content.split("\n")
    const windows: { text: string; score: number }[] = []

    for (let i = 0; i < lines.length; i += 8) {
        const windowText = lines.slice(i, i + 12).join("\n")
        const lowered = windowText.toLowerCase()
        const score = queryTokens.reduce((sum, token) => sum + countOccurrences(lowered, token), 0)
        if (score > 0) windows.push({ text: windowText, score })
    }

    if (windows.length === 0) return truncateChunk(content, maxTokens)

    const selected: string[] = []
    let totalChars = 0
    for (const section of windows.sort((a, b) => b.score - a.score)) {
        const withPadding = `${section.text}\n`
        if (totalChars + withPadding.length > maxChars) break
        selected.push(withPadding)
        totalChars += withPadding.length
    }

    if (selected.length === 0) return truncateChunk(content, maxTokens)
    return `${selected.join("\n")}\n[... relevante Auszüge ...]`
}

function truncateChunk(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4
    if (text.length <= maxChars) return text
    const truncated = text.slice(0, maxChars)
    const lastNewline = truncated.lastIndexOf("\n")
    return (
        (lastNewline > maxChars * 0.5 ? truncated.slice(0, lastNewline) : truncated) +
        "\n\n[... gekürzt ...]"
    )
}

export async function getAutoContext(query: string): Promise<AutoContextResult> {
    if (!query.trim()) return { content: "", matchedChunks: [], tokens: 0 }

    try {
        const results = await searchDocs(query, 3)
        if (results.length === 0) return { content: "", matchedChunks: [], tokens: 0 }

        let totalContent = ""
        const matchedChunks: AutoContextResult["matchedChunks"] = []

        for (const { chunk, score } of results) {
            const trimmedContent = buildRelevantExcerpt(chunk.content, query, MAX_CHUNK_TOKENS)
            const chunkText = `\n--- REFERENZ: ${chunk.category} > ${chunk.heading} ---\n${trimmedContent}\n`
            const newTotal = totalContent + chunkText
            const estimatedTokens = Math.ceil(newTotal.length / 4)

            if (estimatedTokens > MAX_AUTO_CONTEXT_TOKENS) break

            totalContent = newTotal
            matchedChunks.push({
                heading: chunk.heading,
                category: chunk.category,
                score: Math.round(score * 100) / 100,
            })
        }

        return {
            content: totalContent,
            matchedChunks,
            tokens: Math.ceil(totalContent.length / 4),
        }
    } catch (error) {
        console.error("Auto-Kontext Fehler:", error)
        return { content: "", matchedChunks: [], tokens: 0 }
    }
}
