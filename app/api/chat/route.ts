import { streamText } from "ai"
import { ollama } from "ollama-ai-provider-v2"

interface Message {
    role: "user" | "assistant" | "system"
    content: string
}

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()

        if (!messages || !Array.isArray(messages)) {
            return new Response("Ungültige Nachrichten-Struktur", { status: 400 })
        }

        const coreMessages: Message[] = messages.map(
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
                    content: content,
                }
            },
        )

        const result = streamText({
            model: ollama("qwen2.5-coder:7b"),
            providerOptions: {
                ollama: {
                    options: { num_ctx: 8192 },
                },
            },
            system: `Du bist ein Experte für React und Geoinformationen. 
            Regeln: 4 Spaces Indent, Double Quotes, Semikolons, TailwindCSS, Shadcn UI.`,
            messages: coreMessages,
        })

        return result.toUIMessageStreamResponse()
    } catch (error) {
        console.error("Chat API Error:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}
