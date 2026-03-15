"use client"

import { Bot, Loader2, Send } from "lucide-react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatFooterProps {
    input: string
    setInput: (value: string) => void
    onSubmit: (e: FormEvent<HTMLFormElement>) => void
    isLoading: boolean
    agentMode?: boolean
}

export function ChatFooter({ input, setInput, onSubmit, isLoading, agentMode }: ChatFooterProps) {
    const placeholder = isLoading
        ? agentMode
            ? "Agent führt Aufgabe aus..."
            : "KI analysiert Daten..."
        : agentMode
          ? "Beschreibe was der Agent implementieren soll..."
          : "Stell eine Frage..."

    return (
        <form className="flex gap-3" onSubmit={onSubmit}>
            <Input
                className="flex-1 border-none bg-transparent text-sm font-sans placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={input}
                disabled={isLoading}
                placeholder={placeholder}
                onChange={(e) => setInput(e.target.value)}
            />
            <Button
                type="submit"
                size="icon"
                className={`rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 ${
                    agentMode
                        ? "bg-primary/90 shadow-primary/30 hover:bg-primary"
                        : "bg-primary shadow-primary/20 hover:bg-primary/90"
                }`}
                disabled={!input.trim() || isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : agentMode ? (
                    <Bot className="h-4 w-4" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    )
}
