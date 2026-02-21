"use client"

import type { UIMessage } from "ai" // Fix: UIMessage statt Message
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { CopyButton } from "@/components/copy-button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface ChatBubbleProps {
    message: UIMessage | { role: string; content?: string; parts?: UIMessage["parts"]; id?: string }
}

function getTextParts(message: ChatBubbleProps["message"]): { text: string; key: string }[] {
    if (message.parts && message.parts.length > 0) {
        return message.parts
            .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
            .map((p, i) => ({ text: p.text, key: `${message.id ?? "m"}-part-${i}` }))
    }
    const content = (message as { content?: string }).content
    if (content) {
        return [{ text: content, key: `${message.id ?? "m"}-content` }]
    }
    return []
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const isUser = message.role === "user"
    const textParts = getTextParts(message)

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <Card
                className={`max-w-[85%] p-5 shadow-md border-none transition-all ${
                    isUser
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-white dark:bg-muted/20 text-foreground rounded-bl-none border border-border/50"
                }`}
            >
                <div className="flex items-center justify-between gap-4 mb-3">
                    <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-display tracking-wider border-none px-0 ${
                            isUser ? "text-primary-foreground/80" : "text-secondary font-bold"
                        }`}
                    >
                        {isUser ? "Luca" : "Geo-AI Explorer"}
                    </Badge>
                </div>

                {textParts.map(({ text, key }) => (
                    <div
                        key={key}
                        className={`prose prose-sm max-w-none font-sans leading-relaxed ${
                            isUser ? "prose-invert" : "dark:prose-invert"
                        }`}
                    >
                        <ReactMarkdown
                            components={{
                                code({ className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || "")
                                    const codeValue = String(children).replace(/\n$/, "")

                                    if (!match) {
                                        return (
                                            <code
                                                className="bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-mono text-xs font-semibold"
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        )
                                    }

                                    return (
                                        <div className="relative group my-4">
                                            <div className="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <CopyButton value={codeValue} />
                                            </div>
                                            <SyntaxHighlighter
                                                style={oneLight}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-xl border bg-slate-50/50 shadow-sm p-4! pr-12"
                                            >
                                                {codeValue}
                                            </SyntaxHighlighter>
                                        </div>
                                    )
                                },
                            }}
                        >
                            {text}
                        </ReactMarkdown>
                    </div>
                ))}
            </Card>
        </div>
    )
}
