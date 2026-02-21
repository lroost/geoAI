"use server"

import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { generateText } from "ai"
import { ollama } from "ollama-ai-provider-v2"

const historyPath = path.join(process.cwd(), ".history")

interface Message {
    role: string
    content: string
}

export async function saveChat(chatId: string, messages: Message[], title?: string) {
    if (!existsSync(historyPath)) {
        await fs.mkdir(historyPath, { recursive: true })
    }
    const filePath = path.join(historyPath, `${chatId}.json`)

    let existingData: { title?: string } = {}
    if (existsSync(filePath)) {
        const content = await fs.readFile(filePath, "utf-8")
        existingData = JSON.parse(content)
    }

    // Wir behalten den alten Titel, außer ein neuer wird explizit geliefert
    const finalTitle = title || existingData.title || "Neuer Chat"

    await fs.writeFile(
        filePath,
        JSON.stringify(
            {
                id: chatId,
                updatedAt: new Date().toISOString(),
                messages,
                title: finalTitle,
            },
            null,
            4,
        ),
    )
}

export async function getChatHistory() {
    if (!existsSync(historyPath)) return []
    const files = await fs.readdir(historyPath)
    const results = await Promise.all(
        files
            .filter((f) => f.endsWith(".json"))
            .map(async (f) => {
                try {
                    const content = await fs.readFile(path.join(historyPath, f), "utf-8")
                    return JSON.parse(content)
                } catch {
                    console.error(`Korrupte Chat-Datei übersprungen: ${f}`)
                    return null
                }
            }),
    )
    return results
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function generateChatTitle(firstMessage: string) {
    try {
        const { text } = await generateText({
            model: ollama("qwen2.5-coder:7b"),
            providerOptions: {
                ollama: {
                    options: { num_ctx: 2048 },
                },
            },
            prompt: `Generiere einen extrem kurzen Titel (max. 4 Wörter) für eine Konversation, die hiermit beginnt: "${firstMessage}". Antworte NUR mit dem Titel, ohne Anführungszeichen.`,
        })
        return text.trim()
    } catch (error) {
        console.error("Fehler beim Generieren des Chat-Titels:", error)
        return "Neuer Geo-Chat"
    }
}
