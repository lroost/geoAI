"use client"

import { memo } from "react"
import { CheckCircle2, FileEdit, FileSearch, FolderOpen, Loader2, Terminal, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export interface ToolInvocationPart {
    type: "tool-invocation"
    toolInvocationId: string
    toolName: string
    args: Record<string, unknown>
    state: "partial-call" | "call" | "result"
    result?: unknown
}

const TOOL_META: Record<
    string,
    { label: string; icon: React.ReactNode; accent: string }
> = {
    list_files: {
        label: "Verzeichnis lesen",
        icon: <FolderOpen className="h-3.5 w-3.5" />,
        accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    read_file: {
        label: "Datei lesen",
        icon: <FileSearch className="h-3.5 w-3.5" />,
        accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    write_file: {
        label: "Datei schreiben",
        icon: <FileEdit className="h-3.5 w-3.5" />,
        accent: "text-green-500 bg-green-500/10 border-green-500/20",
    },
    execute_command: {
        label: "Befehl ausführen",
        icon: <Terminal className="h-3.5 w-3.5" />,
        accent: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
}

function formatResult(toolName: string, result: unknown): string {
    if (typeof result !== "object" || result === null) return String(result)
    const r = result as Record<string, unknown>

    if (r.error) return `Fehler: ${r.error}`

    if (toolName === "list_files") {
        const items = r.items as Array<{ name: string; type: string }> | undefined
        if (!items?.length) return "(leer)"
        return items.map((i) => `${i.type === "dir" ? "📁" : "📄"} ${i.name}`).join("\n")
    }

    if (toolName === "read_file") {
        const content = r.content as string | undefined
        if (!content) return "(leer)"
        const lines = content.split("\n")
        return lines.length > 25
            ? lines.slice(0, 25).join("\n") + `\n\n... (+${lines.length - 25} weitere Zeilen)`
            : content
    }

    if (toolName === "write_file") {
        return `✓ ${r.path} — ${r.bytes} Bytes geschrieben`
    }

    if (toolName === "execute_command") {
        const parts: string[] = []
        if (r.stdout) parts.push(String(r.stdout))
        if (r.stderr) parts.push(`[stderr]\n${r.stderr}`)
        return parts.join("\n---\n") || "(kein Output)"
    }

    return JSON.stringify(result, null, 2)
}

export const ToolCallView = memo(function ToolCallView({ part }: { part: ToolInvocationPart }) {
    const meta = TOOL_META[part.toolName]
    const isPending = part.state !== "result"
    const isError =
        part.state === "result" &&
        typeof part.result === "object" &&
        part.result !== null &&
        "error" in (part.result as object)

    const argLabel =
        (part.args.path as string | undefined) ??
        (part.args.directory as string | undefined) ??
        (part.args.command as string | undefined) ??
        ""

    return (
        <Card className="my-2 border border-border/40 bg-muted/5 overflow-hidden">
            <div
                className={`flex items-center gap-2 px-3 py-2 border-b border-border/20 ${meta?.accent ?? "text-muted-foreground"}`}
            >
                {meta?.icon}
                <span className="text-[11px] font-semibold font-mono">{meta?.label ?? part.toolName}</span>
                {argLabel && (
                    <Badge
                        variant="outline"
                        className="ml-1 text-[10px] font-mono px-1.5 py-0 truncate max-w-[240px] border-current/30"
                    >
                        {argLabel}
                    </Badge>
                )}
                <div className="ml-auto shrink-0">
                    {isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : isError ? (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    )}
                </div>
            </div>

            {part.state === "result" && (
                <pre className="text-[11px] font-mono text-muted-foreground/80 whitespace-pre-wrap break-all px-3 py-2.5 max-h-52 overflow-y-auto leading-relaxed">
                    {formatResult(part.toolName, part.result)}
                </pre>
            )}
        </Card>
    )
})
