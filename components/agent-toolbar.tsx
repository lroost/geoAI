"use client"

import { Code2, FolderOpen, FolderSearch, Globe, Layers } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export type TechStack = "vanilla" | "react-vite" | "nextjs" | "free"

const STACKS: { id: TechStack; label: string; sub: string; icon: React.ReactNode }[] = [
    {
        id: "vanilla",
        label: "HTML / CSS / JS",
        sub: "Kein Build-Tool",
        icon: <Globe className="h-3.5 w-3.5" />,
    },
    {
        id: "react-vite",
        label: "React + Vite",
        sub: "+ Tailwind CSS",
        icon: <Layers className="h-3.5 w-3.5" />,
    },
    {
        id: "nextjs",
        label: "Next.js",
        sub: "+ Tailwind + Shadcn",
        icon: <Code2 className="h-3.5 w-3.5" />,
    },
    {
        id: "free",
        label: "Frei wählen",
        sub: "Kein Vorgabe",
        icon: <span className="text-[11px]">✦</span>,
    },
]

interface AgentToolbarProps {
    workDir: string
    onWorkDirChange: (path: string) => void
    techStack: TechStack
    onTechStackChange: (stack: TechStack) => void
}

export function AgentToolbar({
    workDir,
    onWorkDirChange,
    techStack,
    onTechStackChange,
}: AgentToolbarProps) {
    const [isPicking, setIsPicking] = useState(false)
    const [pickerUnavailable, setPickerUnavailable] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const openPicker = async () => {
        setIsPicking(true)
        try {
            const res = await fetch("/api/pick-directory", { method: "POST" })
            const data = (await res.json()) as {
                path?: string
                cancelled?: boolean
                unavailable?: boolean
                error?: string
            }
            if (data.unavailable) {
                setPickerUnavailable(true)
                setIsEditing(true)
                setTimeout(() => inputRef.current?.focus(), 50)
            } else if (data.path) {
                onWorkDirChange(data.path)
            }
        } catch {
            setPickerUnavailable(true)
        } finally {
            setIsPicking(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        // Auf macOS liefert drag-and-drop eines Ordners den Pfad via item.getAsFile()
        if (file) {
            // Der Pfad ist unter webkitRelativePath oder name nicht verlässlich,
            // aber auf macOS kann man den Ordner-Pfad via DataTransfer.items lesen
            const item = e.dataTransfer.items[0]
            if (item) {
                const entry = item.webkitGetAsEntry?.()
                if (entry?.isDirectory) {
                    // Kein direkter Pfad-Zugriff im Browser — Fallback auf manuell
                    setIsEditing(true)
                    setTimeout(() => inputRef.current?.focus(), 50)
                }
            }
        }
    }

    const isDefault = !workDir
    const displayPath = workDir || ""

    return (
        <div className="shrink-0 border-b border-primary/20 bg-primary/5 px-6 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="mx-auto max-w-3xl space-y-4">

                {/* Projekttyp */}
                <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary/60">
                        Projekttyp
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {STACKS.map((s) => {
                            const active = techStack === s.id
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => onTechStackChange(s.id)}
                                    className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all ${
                                        active
                                            ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                                            : "border-border/40 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                                    }`}
                                >
                                    <span className={active ? "text-primary" : "text-muted-foreground"}>
                                        {s.icon}
                                    </span>
                                    <span className="text-[11px] font-semibold leading-tight">
                                        {s.label}
                                    </span>
                                    <span className="text-[10px] opacity-60 leading-tight">{s.sub}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Zielverzeichnis */}
                <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-primary/60">
                        Zielverzeichnis
                    </p>
                    <div
                        className="flex items-center gap-3"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        <div
                            className={`flex flex-1 items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                                isDefault
                                    ? "border-dashed border-amber-500/40 bg-amber-500/5 cursor-pointer hover:border-amber-500/60"
                                    : "border-primary/30 bg-background/80"
                            }`}
                            onClick={() => { setIsEditing(true); setTimeout(() => inputRef.current?.focus(), 50) }}
                        >
                            <FolderOpen
                                className={`h-4 w-4 shrink-0 ${
                                    isDefault ? "text-amber-500/60" : "text-primary/70"
                                }`}
                            />
                            {isEditing ? (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={workDir}
                                    onChange={(e) => onWorkDirChange(e.target.value)}
                                    onBlur={() => setIsEditing(false)}
                                    onKeyDown={(e) => { if (e.key === "Enter") setIsEditing(false) }}
                                    placeholder="/Users/dein-name/mein-projekt"
                                    className="flex-1 bg-transparent font-mono text-xs text-foreground/80 outline-none placeholder:text-muted-foreground/40"
                                    spellCheck={false}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <span
                                    className={`flex-1 truncate font-mono text-xs ${
                                        isDefault ? "italic text-amber-600/60 dark:text-amber-400/60" : "text-foreground/80"
                                    }`}
                                    title={displayPath}
                                >
                                    {isDefault ? "Klicken oder Ordner hierher ziehen…" : displayPath}
                                </span>
                            )}
                            {!isDefault && !isEditing && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onWorkDirChange("") }}
                                    className="shrink-0 text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors"
                                    title="Zurücksetzen"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {!pickerUnavailable && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={openPicker}
                                disabled={isPicking}
                                className="h-9 shrink-0 gap-2 border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10 hover:border-primary/50"
                            >
                                <FolderSearch className="h-3.5 w-3.5" />
                                {isPicking ? "Wählen..." : "Durchsuchen"}
                            </Button>
                        )}
                    </div>

                    {isDefault && (
                        <p className="mt-1.5 text-[10px] text-amber-500/80 font-medium">
                            Pflichtfeld — ohne Verzeichnis werden keine Dateien gespeichert.
                        </p>
                    )}
                </div>

            </div>
        </div>
    )
}
