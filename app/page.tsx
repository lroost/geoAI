"use client"

import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { Loader2, Plus } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatBubble } from "@/components/chat-bubble"
import { ChatFooter } from "@/components/chat-footer"
import { ContextMonitor } from "@/components/context-monitor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
    type AutoContextResult,
    estimateTokens,
    getAutoContext,
    getDocList,
    getProjectFiles,
    getSelectedDocsContent,
} from "./actions/docs"
import { generateChatTitle, getChatHistory, saveChat } from "./actions/history"

// Erweitertes Interface für die Historie
interface SavedChat {
    id: string
    updatedAt: string
    messages: UIMessage[]
    title?: string // Optionaler Titel
}

type ContextStats = { tokens: number; count: number }

const getMessageText = (message: UIMessage): string => {
    // 1. Check für das neue Format (parts)
    if (message.parts && Array.isArray(message.parts)) {
        return message.parts
            .filter((part) => part.type === "text")
            .map((part) => (part.type === "text" ? part.text : ""))
            .join("")
    }

    // 2. Fallback für das alte Format (content) oder falls parts fehlt
    // Wir nutzen 'as any', da UIMessage laut Typ eigentlich 'parts' haben sollte
    return (message as { content?: string }).content || ""
}

export default function ChatPage() {
    const [input, setInput] = useState<string>("")
    const [chatId, setChatId] = useState<string>(() => crypto.randomUUID())
    const [history, setHistory] = useState<SavedChat[]>([])
    const [availableFiles, setAvailableFiles] = useState<string[]>([])
    const [projectFiles, setProjectFiles] = useState<string[]>([])
    const [selectedFiles, setSelectedFiles] = useState<string[]>([])
    const [contextStats, setContextStats] = useState<ContextStats>({ tokens: 0, count: 0 })
    const [selectedContext, setSelectedContext] = useState<string>("")
    const [autoContext, setAutoContext] = useState<AutoContextResult | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const lastScrolledMessageIdRef = useRef<string | null>(null)
    const historyRef = useRef(history)
    historyRef.current = history

    const { messages, setMessages, sendMessage, status } = useChat()
    const isLoading = status === "submitted" || status === "streaming"

    const lastMessage = messages[messages.length - 1]
    const lastMessageId = lastMessage?.id ?? null

    const scrollToBottom = useCallback((): void => {
        const root = scrollRef.current
        if (!root) return

        const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
        if (!viewport) return

        setTimeout(() => {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: "auto" })
        }, 100)
    }, [])

    useEffect(() => {
        if (!lastMessageId) return
        if (lastScrolledMessageIdRef.current === lastMessageId) return

        lastScrolledMessageIdRef.current = lastMessageId
        scrollToBottom()
    }, [lastMessageId, scrollToBottom])

    useEffect(() => {
        let cancelled = false
        const run = async (): Promise<void> => {
            if (selectedFiles.length === 0) {
                setSelectedContext("")
                setContextStats({ tokens: 0, count: 0 })
                return
            }
            try {
                const content = await getSelectedDocsContent(selectedFiles)
                if (cancelled) return
                setSelectedContext(content)
                const tokens = await estimateTokens(content)
                if (cancelled) return
                setContextStats({ tokens, count: selectedFiles.length })
            } catch {
                if (cancelled) return
                setSelectedContext("")
                setContextStats({ tokens: 0, count: selectedFiles.length })
            }
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [selectedFiles])

    useEffect(() => {
        let cancelled = false
        const run = async (): Promise<void> => {
            try {
                const [docs, proj, chats] = await Promise.all([
                    getDocList(),
                    getProjectFiles(),
                    getChatHistory(),
                ])
                if (cancelled) return
                setAvailableFiles(docs)
                setProjectFiles(proj)
                setHistory(chats as SavedChat[])
            } catch {
                if (cancelled) return
                setAvailableFiles([])
                setProjectFiles([])
                setHistory([])
            }
        }
        void run()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (messages.length === 0) return
        if (status !== "ready") return

        let cancelled = false
        const t = window.setTimeout(() => {
            void (async () => {
                try {
                    let currentTitle: string | undefined
                    const currentHistory = historyRef.current
                    const existingChat = currentHistory.find((h) => h.id === chatId)

                    if (
                        messages.length >= 2 &&
                        (!existingChat || existingChat.title === "Neuer Chat")
                    ) {
                        const firstUserMessage = messages.find((m) => m.role === "user")
                        if (firstUserMessage) {
                            const text = getMessageText(firstUserMessage)
                            currentTitle = await generateChatTitle(text)
                        }
                    }

                    const convertedMessages = messages.map((m) => ({
                        role: m.role,
                        content: getMessageText(m),
                    }))
                    await saveChat(chatId, convertedMessages, currentTitle)
                    if (cancelled) return

                    const chats = await getChatHistory()
                    if (cancelled) return
                    setHistory(chats as SavedChat[])
                } catch (error) {
                    console.error("Fehler beim Speichern:", error)
                }
            })()
        }, 400)

        return () => {
            cancelled = true
            window.clearTimeout(t)
        }
    }, [messages, chatId, status])

    const loadChat = useCallback(
        (id: string): void => {
            const selectedChat = history.find((c) => c.id === id)
            if (!selectedChat) return
            setChatId(id)
            setMessages(selectedChat.messages)
            setInput("")
            lastScrolledMessageIdRef.current = null
            scrollToBottom()
        },
        [history, setMessages, scrollToBottom],
    )

    const startNewChat = useCallback((): void => {
        setChatId(crypto.randomUUID())
        setMessages([])
        setInput("")
        setAutoContext(null)
        lastScrolledMessageIdRef.current = null
    }, [setMessages])

    const toggleFile = useCallback((file: string): void => {
        setSelectedFiles((prev) =>
            prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file],
        )
    }, [])

    const onSubmit = useCallback(
        (e: FormEvent<HTMLFormElement>): void => {
            e.preventDefault()
            const trimmed = input.trim()
            if (!trimmed || isLoading) return

            const currentInput = trimmed
            setInput("")

            void (async () => {
                const auto = await getAutoContext(currentInput)
                setAutoContext(auto)

                const parts: string[] = []

                if (auto.content) {
                    parts.push(`AUTOMATISCH GEFUNDENE REFERENZ-DOKUMENTATION:\n${auto.content}`)
                }
                if (selectedContext) {
                    parts.push(`MANUELL AUSGEWÄHLTER KONTEXT:\n${selectedContext}`)
                }

                parts.push(`BENUTZERANFRAGE:\n${currentInput}`)

                sendMessage({ text: parts.join("\n\n") })
            })()
        },
        [input, isLoading, sendMessage, selectedContext],
    )

    const showAssistantTyping = isLoading && messages[messages.length - 1]?.role !== "assistant"

    return (
        <SidebarProvider>
            <AppSidebar
                files={availableFiles}
                projectFiles={projectFiles}
                selectedFiles={selectedFiles}
                onToggleFile={toggleFile}
                history={history}
                onLoadChat={loadChat}
                currentChatId={chatId}
            />
            <SidebarInset className="flex h-screen flex-col bg-background overflow-hidden">
                <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border/40 bg-background/80 px-6 backdrop-blur-md sticky top-0 z-30">
                    <SidebarTrigger className="text-secondary transition-all hover:bg-secondary/10" />
                    <div className="h-4 w-px bg-border/60" />
                    <div className="flex flex-1 items-center justify-between">
                        <div className="flex flex-col">
                            <h1 className="font-display text-sm font-bold leading-none tracking-tight text-foreground/90">
                                Geo-Explorer
                            </h1>
                            <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
                                Luca's Workspace
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={startNewChat}
                            className="h-8 gap-2 border border-transparent font-display text-xs text-muted-foreground hover:border-border/40 hover:text-secondary"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Neu</span>
                        </Button>
                    </div>
                </header>

                <div className="flex-1 min-h-0 relative">
                    <ScrollArea ref={scrollRef} className="h-full w-full">
                        <div className="mx-auto max-w-3xl space-y-6 pb-32 pt-8 px-4 sm:px-6">
                            {messages.map((m, index) => (
                                <ChatBubble key={m.id || `msg-${index}`} message={m} />
                            ))}
                            {showAssistantTyping && (
                                <div className="flex animate-pulse justify-start">
                                    <Card className="flex max-w-[85%] items-center gap-3 border-dashed border-muted-foreground/10 bg-muted/20 p-4 text-xs italic text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin text-secondary" />
                                        geoAI studiert...
                                    </Card>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="shrink-0 bg-background/80 backdrop-blur-xl border-t border-border/10 pt-4 pb-6 px-4 sm:px-6 z-30">
                    <div className="mx-auto max-w-3xl w-full">
                        <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/60 p-3 shadow-2xl">
                            <div className="px-1">
                                <ContextMonitor
                                    fileCount={contextStats.count}
                                    estimatedTokens={contextStats.tokens}
                                    autoMatches={autoContext?.matchedChunks}
                                    autoTokens={autoContext?.tokens}
                                />
                            </div>
                            <ChatFooter
                                input={input}
                                setInput={setInput}
                                onSubmit={onSubmit}
                                isLoading={isLoading}
                            />
                        </div>
                        <p className="mt-3 text-center font-sans text-[9px] tracking-tight text-muted-foreground/30">
                            Qwen 2.5 Coder 7B • Lokales Geo-System
                        </p>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
