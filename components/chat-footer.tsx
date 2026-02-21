"use client"

import { Loader2, Send } from "lucide-react"
import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ChatFooterProps {
    input: string
    setInput: (value: string) => void
    onSubmit: (e: FormEvent<HTMLFormElement>) => void
    isLoading: boolean
}

export function ChatFooter({ input, setInput, onSubmit, isLoading }: ChatFooterProps) {
    return (
        <form className="flex gap-3" onSubmit={onSubmit}>
            <Input
                className="flex-1 border-none bg-transparent text-sm font-sans placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={input}
                disabled={isLoading}
                placeholder={
                    isLoading
                        ? "KI analysiert Daten..."
                        : "Frag nach Komponenten, GeoJSON oder Tailwind..."
                }
                onChange={(e) => setInput(e.target.value)}
            />
            <Button
                type="submit"
                size="icon"
                className="rounded-xl bg-primary shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
                disabled={!input.trim() || isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="h-4 w-4" />
                )}
            </Button>
        </form>
    )
}
