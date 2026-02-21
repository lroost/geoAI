"use server"

import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { searchDocs } from "@/lib/search"

/**
 * Hilfsfunktion zur Pfad-Validierung (Security First)
 */
const isValidPath = (fullPath: string) => fullPath.startsWith(process.cwd())

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
export async function getSelectedDocsContent(selectedFiles: string[]): Promise<string> {
    if (selectedFiles.length === 0) return ""

    let combinedContent = ""
    const docsPath = path.join(process.cwd(), "local-docs")

    try {
        for (const file of selectedFiles) {
            // Check: Startet der Pfad mit 'components/'? Dann nimm Projekt-Root, sonst docsPath
            const isProjectFile = file.startsWith("components/")
            const filePath = isProjectFile
                ? path.join(process.cwd(), file)
                : path.join(docsPath, file)

            if (existsSync(filePath) && isValidPath(filePath)) {
                const content = await fs.readFile(filePath, "utf-8")
                const label = isProjectFile ? "SOURCE CODE" : "DOKUMENT"
                combinedContent += `\n--- ${label}: ${file} ---\n${content}\n`
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

export async function estimateTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4)
}

export interface AutoContextResult {
    content: string
    matchedChunks: { heading: string; category: string; score: number }[]
    tokens: number
}

const MAX_AUTO_CONTEXT_TOKENS = 4_000
const MAX_CHUNK_TOKENS = 2_000

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
        const results = await searchDocs(query, 5)
        if (results.length === 0) return { content: "", matchedChunks: [], tokens: 0 }

        let totalContent = ""
        const matchedChunks: AutoContextResult["matchedChunks"] = []

        for (const { chunk, score } of results) {
            const trimmedContent = truncateChunk(chunk.content, MAX_CHUNK_TOKENS)
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
