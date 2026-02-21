"use client"

import { Database, Search, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AutoMatch {
    heading: string
    category: string
    score: number
}

interface ContextMonitorProps {
    fileCount: number
    estimatedTokens: number
    autoMatches?: AutoMatch[]
    autoTokens?: number
}

export function ContextMonitor({
    fileCount,
    estimatedTokens,
    autoMatches,
    autoTokens,
}: ContextMonitorProps) {
    const hasManual = fileCount > 0
    const hasAuto = autoMatches && autoMatches.length > 0
    if (!hasManual && !hasAuto) return null

    const totalTokens = estimatedTokens + (autoTokens ?? 0)

    return (
        <div className="flex flex-col gap-2 mb-2 px-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-wrap gap-2">
                {hasManual && (
                    <Badge
                        variant="secondary"
                        className="bg-secondary/10 text-secondary border-secondary/20 flex gap-1.5 items-center font-display text-[11px]"
                    >
                        <Database className="w-3 h-3" />
                        {fileCount} Files aktiv
                    </Badge>
                )}
                {hasAuto && (
                    <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 flex gap-1.5 items-center font-display text-[11px]"
                    >
                        <Sparkles className="w-3 h-3" />
                        {autoMatches.length} Auto-Referenzen
                    </Badge>
                )}
                {totalTokens > 0 && (
                    <Badge
                        variant="outline"
                        className="text-muted-foreground border-border/50 font-mono text-[11px]"
                    >
                        ~{totalTokens.toLocaleString()} Tokens
                    </Badge>
                )}
            </div>
            {hasAuto && (
                <div className="flex flex-wrap gap-1.5">
                    {autoMatches.map((m) => (
                        <span
                            key={`${m.category}-${m.heading}`}
                            className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                            <Search className="w-2.5 h-2.5" />
                            {m.category} &rsaquo; {m.heading}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
