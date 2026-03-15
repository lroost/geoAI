"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChatBubble } from "@/components/chat-bubble"
import { ChatFooter } from "@/components/chat-footer"
import { ContextMonitor } from "@/components/context-monitor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { Bot, CheckCircle2, Loader2, Plus } from "lucide-react"
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ToolInvocationPart } from "@/components/tool-call-view"
import {
    type AutoContextResult,
    getAutoContext,
    getDocList,
    getProjectFiles,
    getSelectedDocsContent,
} from "./actions/docs"
import { estimateTokens } from "@/lib/utils"
import { generateChatTitle, getChatHistory, saveChat, type ChatMeta } from "./actions/history"
import { AgentToolbar, type TechStack } from "@/components/agent-toolbar"

// Erweitertes Interface für die Historie
interface SavedChat {
    id: string
    updatedAt: string
    messages: UIMessage[]
    title?: string
    agentMode?: boolean
    workDir?: string
    techStack?: string
}

type ContextStats = { tokens: number; count: number }
type ContextDirective = {
    query: string
    forceContext: boolean
    disableContext: boolean
}

const CONTEXT_FORCE_PREFIXES = ["/ctx", "@context", "#context"]
const CONTEXT_DISABLE_PREFIXES = ["/noctx", "#noctx", "@no-context"]
const CONTEXT_HINTS = [
    "shadcn",
    "tailwind",
    "maplibre",
    "maptiler",
    "react",
    "next",
    "typescript",
    "javascript",
    "komponente",
    "component",
    "ui",
    "api",
    "route",
    "code",
    "bug",
    "fehler",
    "refactor",
    "implement",
    "snippet",
    "funktion",
    "klasse",
    "css",
    "layout",
    "geojson",
    "layer",
    "tiles",
]

function parseContextDirective(rawInput: string): ContextDirective {
    const normalized = rawInput.trim()
    const lower = normalized.toLowerCase()

    const forcePrefix = CONTEXT_FORCE_PREFIXES.find((prefix) => lower.startsWith(prefix))
    if (forcePrefix) {
        return {
            query: normalized.slice(forcePrefix.length).trim(),
            forceContext: true,
            disableContext: false,
        }
    }

    const disablePrefix = CONTEXT_DISABLE_PREFIXES.find((prefix) => lower.startsWith(prefix))
    if (disablePrefix) {
        return {
            query: normalized.slice(disablePrefix.length).trim(),
            forceContext: false,
            disableContext: true,
        }
    }

    return { query: normalized, forceContext: false, disableContext: false }
}

function isTechnicalPrompt(query: string): boolean {
    const lower = query.toLowerCase()
    return CONTEXT_HINTS.some((hint) => lower.includes(hint))
}

function isCapabilityPrompt(query: string): boolean {
    const lower = query.toLowerCase()
    return (
        lower.includes("mcp") ||
        lower.includes("zugriff") ||
        lower.includes("access") ||
        lower.includes("kannst du") ||
        lower.includes("can you")
    )
}

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
    const [autoContext, setAutoContext] = useState<AutoContextResult | null>(null)
    const [agentMode, setAgentMode] = useState<boolean>(false)
    const [workDir, setWorkDir] = useState<string>("")
    const [techStack, setTechStack] = useState<TechStack>("vanilla")
    const [savedFiles, setSavedFiles] = useState<string[]>([])

    const scrollRef = useRef<HTMLDivElement>(null)
    const lastScrolledMessageIdRef = useRef<string | null>(null)
    const historyRef = useRef(history)
    historyRef.current = history
    const workDirRef = useRef(workDir)
    workDirRef.current = workDir
    const techStackRef = useRef(techStack)
    techStackRef.current = techStack

    const { messages, setMessages, sendMessage, status } = useChat({
        api: agentMode ? "/api/agent" : "/api/chat",
    })
    const isLoading = status === "submitted" || status === "streaming"

    // Leitet aus den laufenden Tool-Calls ab, was der Agent gerade tut
    const agentStatus = useMemo((): string | null => {
        if (!agentMode || !isLoading) return null
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i]
            if (msg.role !== "assistant") continue
            const parts = (msg.parts ?? []) as ToolInvocationPart[]
            for (let j = parts.length - 1; j >= 0; j--) {
                const p = parts[j]
                if (p.type !== "tool-invocation") continue
                if (p.state !== "call" && p.state !== "partial-call") continue
                const arg = (p.args?.path ?? p.args?.directory ?? p.args?.command ?? "") as string
                const short = arg.length > 45 ? `...${arg.slice(-42)}` : arg
                switch (p.toolName) {
                    case "list_files":
                        return short ? `Lese Verzeichnis ${short}` : "Lese Verzeichnis..."
                    case "read_file":
                        return short ? `Lese ${short}` : "Lese Datei..."
                    case "write_file":
                        return short ? `Schreibe ${short}` : "Schreibe Datei..."
                    case "execute_command":
                        return short ? `Führt aus: ${short}` : "Führt Befehl aus..."
                    default:
                        return `${p.toolName}...`
                }
            }
        }
        return null
    }, [messages, isLoading, agentMode])

    const lastMessage = messages[messages.length - 1]
    const lastMessageId = lastMessage?.id ?? null

    const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const scrollToBottom = useCallback((): void => {
        if (scrollTimerRef.current) return // bereits geplant, nicht häufen
        scrollTimerRef.current = setTimeout(() => {
            scrollTimerRef.current = null
            const root = scrollRef.current
            if (!root) return
            const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
            viewport?.scrollTo({ top: viewport.scrollHeight, behavior: "auto" })
        }, 150)
    }, [])

    useEffect(() => {
        if (!lastMessageId) return
        if (lastScrolledMessageIdRef.current === lastMessageId) return

        lastScrolledMessageIdRef.current = lastMessageId
        scrollToBottom()
    }, [lastMessageId, scrollToBottom])

    // Auto-save: wenn Agent-Antwort fertig ist, Code-Blöcke ins Zielverzeichnis schreiben
    const lastAutoSavedMsgIdRef = useRef<string | null>(null)
    useEffect(() => {
        if (!agentMode || status !== "ready") return
        if (!workDirRef.current) return

        const lastMsg = messages[messages.length - 1]
        if (!lastMsg || lastMsg.role !== "assistant") return
        if (lastAutoSavedMsgIdRef.current === lastMsg.id) return
        lastAutoSavedMsgIdRef.current = lastMsg.id

        const text = getMessageText(lastMsg)
        if (!text) return

        void (async () => {
            try {
                const res = await fetch("/api/agent/save-files", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, workDir: workDirRef.current }),
                })
                const data = (await res.json()) as {
                    written?: string[]
                    skipped?: string[]
                }
                const allMentioned = [
                    ...(data.written ?? []),
                    ...(data.skipped ?? []).map((f) => `${f} (Snippet – nicht überschrieben)`),
                ]
                if (allMentioned.length > 0) {
                    setSavedFiles(allMentioned)
                    setTimeout(() => setSavedFiles([]), 8000)
                }
            } catch {
                // Fehler still ignorieren — Schreiben ist best-effort
            }
        })()
    }, [status, agentMode, messages])

    useEffect(() => {
        let cancelled = false
        const run = async (): Promise<void> => {
            if (selectedFiles.length === 0) {
                setContextStats({ tokens: 0, count: 0 })
                return
            }
            try {
                const content = await getSelectedDocsContent(selectedFiles)
                if (cancelled) return
                const tokens = estimateTokens(content)
                if (cancelled) return
                setContextStats({ tokens, count: selectedFiles.length })
            } catch {
                if (cancelled) return
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
                    const meta: ChatMeta = {
                        agentMode,
                        workDir,
                        techStack,
                    }
                    await saveChat(chatId, convertedMessages, currentTitle, meta)
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
            setAutoContext(null)
            setSavedFiles([])
            // Metadaten wiederherstellen
            setAgentMode(selectedChat.agentMode ?? false)
            setWorkDir(selectedChat.workDir ?? "")
            setTechStack((selectedChat.techStack as TechStack | undefined) ?? "vanilla")
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

    const toggleAgentMode = useCallback((): void => {
        setAgentMode((prev) => !prev)
        // Neuen Chat starten wenn der Modus wechselt
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

            setInput("")

            // Im Agent-Modus direkt senden — der Agent liest Dateien selbst
            if (agentMode) {
                sendMessage(
                    { text: trimmed },
                    { body: { workDir: workDirRef.current, techStack: techStackRef.current } },
                )
                return
            }

            const { query, forceContext, disableContext } = parseContextDirective(trimmed)
            if (!query) return

            const currentInput = query
            const shouldUseContext =
                !disableContext &&
                (forceContext || (isTechnicalPrompt(query) && !isCapabilityPrompt(query)))

            void (async () => {
                const auto = shouldUseContext ? await getAutoContext(currentInput) : null
                setAutoContext(auto)
                const manualContext =
                    shouldUseContext && selectedFiles.length > 0
                        ? await getSelectedDocsContent(selectedFiles, currentInput)
                        : ""

                const parts: string[] = []
                const autoContent = auto?.content

                if (autoContent) {
                    parts.push(`AUTOMATISCH GEFUNDENE REFERENZ-DOKUMENTATION:\n${autoContent}`)
                }
                if (manualContext) {
                    parts.push(`MANUELL AUSGEWÄHLTER KONTEXT:\n${manualContext}`)
                }

                if (parts.length === 0) {
                    sendMessage({ text: currentInput })
                    return
                }

                parts.push(`BENUTZERANFRAGE:\n${currentInput}`)
                sendMessage({ text: parts.join("\n\n") })
            })()
        },
        [input, isLoading, sendMessage, selectedFiles, agentMode],
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
                <header className="shrink-0 border-b border-border/40 bg-background/80 px-6 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex h-14 items-center gap-4">
                        <SidebarTrigger className="text-secondary transition-all hover:bg-secondary/10" />
                        <div className="h-4 w-px bg-border/60" />
                        <div className="flex flex-1 items-center justify-between">
                            <h1 className="font-display text-sm font-bold leading-none tracking-tight text-foreground/90">
                                Local AI
                            </h1>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleAgentMode}
                                    className={`h-8 gap-2 border font-display text-xs transition-all ${
                                        agentMode
                                            ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                                            : "border-transparent text-muted-foreground hover:border-border/40 hover:text-secondary"
                                    }`}
                                >
                                    <Bot className="h-3.5 w-3.5" />
                                    <span>Agent</span>
                                </Button>
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
                        </div>
                    </div>
                </header>

                {/* Prominente Verzeichnis-Auswahl im Agent-Modus */}
                {agentMode && (
                    <AgentToolbar
                        workDir={workDir}
                        onWorkDirChange={setWorkDir}
                        techStack={techStack}
                        onTechStackChange={setTechStack}
                    />
                )}

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
                                        {agentMode ? "Agent denkt..." : "KI denkt..."}
                                    </Card>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Saved-files Notification */}
                {savedFiles.length > 0 && (
                    <div className="shrink-0 border-t border-green-500/20 bg-green-500/5 px-6 py-2 animate-in fade-in duration-300">
                        <div className="mx-auto max-w-3xl flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                            <span className="text-[11px] text-green-700 dark:text-green-400 font-medium">
                                Gespeichert in{" "}
                                <span className="font-mono">{workDir || "Projekt-Root"}</span>:{" "}
                                {savedFiles.join(", ")}
                            </span>
                        </div>
                    </div>
                )}

                <div className="shrink-0 bg-background/80 backdrop-blur-xl border-t border-border/10 pt-4 pb-6 px-4 sm:px-6 z-30">
                    <div className="mx-auto max-w-3xl w-full">
                        <div
                            className={`flex flex-col gap-2 rounded-2xl border bg-background/60 p-3 shadow-2xl transition-colors ${
                                agentMode
                                    ? "border-primary/30 shadow-primary/5"
                                    : "border-border/50"
                            }`}
                        >
                            {/* Agent-Status: zeigt live was der Agent gerade tut */}
                            {agentStatus && (
                                <div className="flex items-center gap-2 px-1 animate-in fade-in duration-150">
                                    <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary/60" />
                                    <span className="text-[11px] font-mono text-primary/70 truncate">
                                        {agentStatus}
                                    </span>
                                </div>
                            )}

                            {!agentMode && (
                                <div className="px-1">
                                    <ContextMonitor
                                        fileCount={contextStats.count}
                                        estimatedTokens={contextStats.tokens}
                                        autoMatches={autoContext?.matchedChunks}
                                        autoTokens={autoContext?.tokens}
                                    />
                                </div>
                            )}
                            <ChatFooter
                                input={input}
                                setInput={setInput}
                                onSubmit={onSubmit}
                                isLoading={isLoading}
                                agentMode={agentMode}
                            />
                        </div>
                        <p className="mt-3 text-center font-sans text-[9px] tracking-tight text-muted-foreground/30">
                            {agentMode
                                ? "Agent Mode • Dateizugriff & Ausführung aktiv"
                                : "Lokales LLM"}
                        </p>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
