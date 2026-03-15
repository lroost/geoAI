import { streamText } from "ai"
import { ollama } from "ollama-ai-provider-v2"

interface Message {
    role: "user" | "assistant" | "system"
    content: string
}

const USER_QUERY_MARKER = "BENUTZERANFRAGE:\n"
const MAX_HISTORY_MESSAGES = 12

function extractUserQuery(content: string): string {
    const markerIndex = content.lastIndexOf(USER_QUERY_MARKER)
    if (markerIndex === -1) return content
    return content.slice(markerIndex + USER_QUERY_MARKER.length).trim()
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return new Response("Ungültige Nachrichten-Struktur", { status: 400 })
        }

        const parsedMessages: Message[] = messages.map(
            (m: {
                role?: string
                parts?: Array<{ type: string; text: string }>
                content?: string
            }) => {
                const content = Array.isArray(m.parts)
                    ? m.parts
                          .filter((p) => p.type === "text")
                          .map((p) => p.text)
                          .join("")
                    : m.content || ""

                return {
                    role: (m.role ?? "user") as "user" | "assistant" | "system",
                    content,
                }
            },
        )

        const lastUserIdx = [...parsedMessages]
            .reverse()
            .findIndex((message) => message.role === "user")
        const normalizedMessages = parsedMessages.map((message, index, all) => {
            if (message.role !== "user") return message
            if (lastUserIdx === -1) return message

            const absoluteLastUserIdx = all.length - 1 - lastUserIdx
            if (index === absoluteLastUserIdx) return message

            return { ...message, content: extractUserQuery(message.content) }
        })
        const coreMessages = normalizedMessages.slice(-MAX_HISTORY_MESSAGES)

        const model = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b"
        const numCtx = parseInt(process.env.OLLAMA_NUM_CTX ?? "2048", 10)
        const result = streamText({
            model: ollama(model),
            providerOptions: {
                ollama: {
                    options: { num_ctx: numCtx },
                },
            },
            system: `Du bist ein Experte für React und Geoinformationen.
Regeln: 4 Spaces Indent, Double Quotes, Semikolons, TailwindCSS, Shadcn UI.
Wenn Kontextblöcke mitgeliefert werden, nutze sie priorisiert und antworte darauf konkret.
Bei Fragen zu deinen Fähigkeiten oder Zugriffsrechten (z. B. MCP, externe Tools) antworte klar und kurz, ohne Ausweichtexte.
Behaupte keine Zugriffe, die nicht explizit gegeben sind.`,
            messages: coreMessages,
        })

        return result.toUIMessageStreamResponse()
    } catch (error) {
        console.error("Chat API Error:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}
