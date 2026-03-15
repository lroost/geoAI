"use client"

import { Bot, Code2, FileText, History as HistoryIcon, Map as MapIcon } from "lucide-react"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"

interface ChatHistoryItem {
    id: string
    title?: string
    agentMode?: boolean
    workDir?: string
}

interface AppSidebarProps {
    files: string[]
    projectFiles: string[]
    selectedFiles: string[]
    onToggleFile: (file: string) => void
    history: ChatHistoryItem[]
    onLoadChat: (id: string) => void
    currentChatId?: string
}

export function AppSidebar({
    files,
    projectFiles,
    selectedFiles,
    onToggleFile,
    history = [],
    onLoadChat,
    currentChatId,
}: AppSidebarProps) {
    const [showDocs, setShowDocs] = useState(false)
    const [showCode, setShowCode] = useState(false)

    return (
        <Sidebar className="border-r border-border/50">
            <SidebarHeader className="p-6 flex flex-row items-center justify-between bg-secondary/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary text-secondary-foreground shadow-sm">
                        <MapIcon className="w-5 h-5" />
                    </div>
                    <span className="font-display font-bold tracking-tight text-secondary">
                        Local LLM
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-2 space-y-2">
                {/* SEKTION: HISTORIE (Immer sichtbar) */}
                <SidebarGroup>
                    <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-display">
                        Chat Historie
                    </SidebarGroupLabel>
                    <SidebarMenu className="px-2 gap-1">
                        {history.length > 0 ? (
                            history.map((chat) => (
                                <SidebarMenuItem key={chat.id}>
                                    <SidebarMenuButton
                                        onClick={() => onLoadChat(chat.id)}
                                        className={`text-xs h-auto min-h-8 py-1.5 ${currentChatId === chat.id ? "bg-secondary/10 text-secondary" : ""}`}
                                    >
                                        {chat.agentMode ? (
                                            <Bot className="w-3.5 h-3.5 mr-2 shrink-0 text-primary/60" />
                                        ) : (
                                            <HistoryIcon className="w-3.5 h-3.5 mr-2 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="truncate font-medium w-full">
                                                {chat.title || "Unbenannter Chat"}
                                            </span>
                                            {chat.agentMode && chat.workDir && (
                                                <span className="truncate text-[9px] font-mono text-primary/40 w-full">
                                                    {chat.workDir.split("/").slice(-2).join("/")}
                                                </span>
                                            )}
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))
                        ) : (
                            <p className="px-4 py-2 text-[10px] text-muted-foreground italic">
                                Keine Historie
                            </p>
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                <div className="h-px bg-border/40 my-2 mx-4" />

                {/* SEKTION: LOKALE DOKUMENTATION (Collapsible + Switch) */}
                <Collapsible open={showDocs} onOpenChange={setShowDocs}>
                    <SidebarGroup>
                        <div className="flex items-center justify-between px-4 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-display">
                                Docs Mode
                            </span>
                            <Switch
                                checked={showDocs}
                                onCheckedChange={setShowDocs}
                                className="data-[state=checked]:bg-secondary scale-75"
                            />
                        </div>
                        <CollapsibleContent className="space-y-1 px-2 animate-in slide-in-from-top-1 duration-200">
                            {files.map((file) => (
                                <SidebarMenuItem key={`doc-${file}`} className="list-none">
                                    <SidebarMenuButton
                                        asChild
                                        className="h-8 transition-all rounded-lg hover:bg-secondary/5"
                                    >
                                        <div className="flex items-center gap-3 w-full cursor-pointer py-1">
                                            <Checkbox
                                                id={`doc-${file}`}
                                                checked={selectedFiles.includes(file)}
                                                onCheckedChange={() => onToggleFile(file)}
                                                className="h-3.5 w-3.5 border-secondary/30 data-[state=checked]:bg-secondary"
                                            />
                                            <label
                                                htmlFor={`doc-${file}`}
                                                className="flex items-center gap-2 cursor-pointer flex-1 truncate text-xs"
                                            >
                                                <FileText className="w-3 h-3 text-secondary/70" />
                                                <span className="truncate">{file}</span>
                                            </label>
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* SEKTION: DEV MODE (Collapsible + Switch) */}
                <Collapsible open={showCode} onOpenChange={setShowCode}>
                    <SidebarGroup>
                        <div className="flex items-center justify-between px-4 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-display">
                                Dev Mode
                            </span>
                            <Switch
                                checked={showCode}
                                onCheckedChange={setShowCode}
                                className="data-[state=checked]:bg-primary scale-75"
                            />
                        </div>
                        <CollapsibleContent className="space-y-1 px-2 animate-in slide-in-from-top-1 duration-200">
                            {projectFiles.map((file) => {
                                const path = `components/${file}`
                                return (
                                    <SidebarMenuItem key={`code-${file}`} className="list-none">
                                        <SidebarMenuButton
                                            asChild
                                            className="h-8 transition-all rounded-lg hover:bg-primary/5"
                                        >
                                            <div className="flex items-center gap-3 w-full cursor-pointer py-1">
                                                <Checkbox
                                                    id={`code-${file}`}
                                                    checked={selectedFiles.includes(path)}
                                                    onCheckedChange={() => onToggleFile(path)}
                                                    className="h-3.5 w-3.5 border-primary/30 data-[state=checked]:bg-primary"
                                                />
                                                <label
                                                    htmlFor={`code-${file}`}
                                                    className="flex items-center gap-2 cursor-pointer flex-1 truncate text-xs"
                                                >
                                                    <Code2 className="w-3 h-3 text-primary/70" />
                                                    <span className="truncate">{file}</span>
                                                </label>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>
            </SidebarContent>
        </Sidebar>
    )
}
