import { streamText, tool } from "ai"
import { ollama } from "ollama-ai-provider-v2"
import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { exec } from "node:child_process"
import { promisify } from "node:util"
import { z } from "zod"

const execAsync = promisify(exec)

const ALLOWED_COMMAND_PREFIXES = [
    "npm run",
    "npm install",
    "npm ci",
    "npx ",
    "node ",
    "cat ",
]

const BLOCKED_FILE_PATTERNS = [".env", ".key", ".pem", "id_rsa", ".secret", ".password"]

function isBlockedFile(filePath: string): boolean {
    const base = path.basename(filePath).toLowerCase()
    return BLOCKED_FILE_PATTERNS.some((p) => base.includes(p))
}

function isAllowedCommand(cmd: string): boolean {
    const trimmed = cmd.trim().toLowerCase()
    // Allow bare "ls" or "ls <args>" but not lsblk/lsof/etc.
    if (trimmed === "ls" || trimmed.startsWith("ls ")) return true
    return ALLOWED_COMMAND_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { messages, workDir, techStack } = body

        if (!messages || !Array.isArray(messages)) {
            return new Response("Ungültige Nachrichten-Struktur", { status: 400 })
        }

        // Zielverzeichnis: aus Request → Env-Variable → Projekt-Root
        const projectRoot = (() => {
            const candidate =
                (typeof workDir === "string" && workDir.trim()) ||
                process.env.AGENT_WORK_DIR ||
                process.cwd()
            return path.resolve(candidate)
        })()

        // Pfad-Validierung: resolved path muss innerhalb von projectRoot liegen
        function resolveSafe(filePath: string): string {
            const resolved = path.resolve(projectRoot, filePath)
            if (!resolved.startsWith(projectRoot + path.sep) && resolved !== projectRoot) {
                throw new Error(`Path traversal nicht erlaubt: ${filePath}`)
            }
            return resolved
        }

        const STACK_INSTRUCTIONS: Record<string, string> = {
            vanilla: `Tech Stack: HTML + CSS + JavaScript (Vanilla, kein Build-Tool, kein Framework)
Typische Dateistruktur für eine neue App:
  index.html   — Haupt-HTML, verlinkt style.css und script.js
  style.css    — alle Styles
  script.js    — alle Logik

Regeln: Kein npm, kein Build-Schritt. Die App muss direkt im Browser durch Doppelklick auf index.html öffenbar sein.`,

            "react-vite": `Tech Stack: React 18 + Vite + Tailwind CSS
Typische Dateistruktur für eine neue App:
  package.json         — dependencies: react, react-dom; devDependencies: vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer
  vite.config.js       — import react from '@vitejs/plugin-react'; export default { plugins: [react()] }
  tailwind.config.js   — content: ['./index.html','./src/**/*.{js,jsx}']
  postcss.config.js    — plugins: { tailwindcss: {}, autoprefixer: {} }
  index.html           — <div id="root"></div>, <script type="module" src="/src/main.jsx"></script>
  src/main.jsx         — ReactDOM.createRoot(...).render(<App />)
  src/App.jsx          — Haupt-Komponente
  src/index.css        — @tailwind base; @tailwind components; @tailwind utilities;

Nach dem Erstellen aller Dateien: führe "npm install" aus.
Der Nutzer startet dann mit "npm run dev".`,

            nextjs: `Tech Stack: Next.js + Tailwind CSS + Shadcn UI (App Router)
Dies ist das aktuelle Projekt. Neue Features kommen in:
  app/          — neue Routen und Pages
  components/   — neue React-Komponenten
  lib/          — Hilfsfunktionen
Code-Standards: 4 Spaces Indent, Double Quotes, Semikolons, TypeScript.`,

            free: `Tech Stack: Frei — wähle die beste Technologie für die Aufgabe des Nutzers.
Erkläre kurz welchen Stack du wählst und warum, bevor du anfängst.`,
        }

        const stackKey = typeof techStack === "string" ? techStack : "free"
        const stackInstructions = STACK_INSTRUCTIONS[stackKey] ?? STACK_INSTRUCTIONS.free

        const model = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b"
        const numCtx = parseInt(process.env.OLLAMA_NUM_CTX ?? "4096", 10)

        const result = streamText({
            model: ollama(model),
            providerOptions: {
                ollama: { options: { num_ctx: numCtx } },
            },
            maxSteps: 10,
            system: `Du bist ein autonomer Coding-Agent. Du baust echte, vollständige, lauffähige Anwendungen.
Arbeitsverzeichnis: ${projectRoot}

━━━ KRITISCHE REGELN ━━━
1. Du schreibst Code AUSSCHLIESSLICH mit dem write_file Tool. NIEMALS als Markdown-Codeblock im Chat.
2. Jede Datei die zur App gehört MUSS mit write_file erstellt werden.
3. Du zeigst keinen Code im Chat, wenn du eine Datei erstellen oder ändern sollst.
4. Wenn du sagst "Ich erstelle jetzt X" oder "Ich ändere X", MUSST du sofort write_file aufrufen.
5. Baue Apps VOLLSTÄNDIG — alle notwendigen Dateien, nicht nur Teile.

━━━ BEI ÄNDERUNGEN AN BESTEHENDEN DATEIEN ━━━
- Lese die Datei ZUERST mit read_file
- Schreibe dann die VOLLSTÄNDIGE geänderte Datei mit write_file
- NIEMALS nur den geänderten Ausschnitt schreiben — immer die komplette Datei
- Beispiel: "Button rot machen" → read_file("style.css") → write_file("style.css", VOLLSTÄNDIGER_INHALT_MIT_ÄNDERUNG)

━━━ ARBEITSWEISE ━━━
1. Lies die Anfrage und prüfe ob es eine neue App oder eine Änderung ist
2. Bei Änderung: lies erst die betroffene Datei mit read_file
3. Erstelle/überschreibe JEDE Datei mit write_file (vollständiger Inhalt, immer)
4. Führe "npm install" aus wenn package.json erstellt wurde

━━━ ${stackKey.toUpperCase()} ━━━
${stackInstructions}

Erkläre in einem Satz was du als nächstes tust, dann ruf sofort das Tool auf.`,
            messages,
            tools: {
                list_files: tool({
                    description: "Listet Dateien und Unterverzeichnisse in einem Verzeichnis auf",
                    parameters: z.object({
                        directory: z
                            .string()
                            .default(".")
                            .describe("Verzeichnis relativ zum Arbeitsverzeichnis (Standard: .)"),
                    }),
                    execute: async ({ directory }) => {
                        try {
                            const fullPath = resolveSafe(directory)
                            if (!existsSync(fullPath)) {
                                return { error: `Verzeichnis nicht gefunden: ${directory}` }
                            }
                            const entries = await fs.readdir(fullPath, { withFileTypes: true })
                            const items = entries
                                .filter((e) => e.name !== "node_modules" && e.name !== ".git")
                                .map((e) => ({
                                    name: e.name,
                                    type: e.isDirectory() ? "dir" : "file",
                                }))
                            return { directory, root: projectRoot, items }
                        } catch (e) {
                            return { error: String(e) }
                        }
                    },
                }),

                read_file: tool({
                    description: "Liest den vollständigen Inhalt einer Datei",
                    parameters: z.object({
                        path: z.string().describe("Dateipfad relativ zum Arbeitsverzeichnis"),
                    }),
                    execute: async ({ path: filePath }) => {
                        try {
                            if (isBlockedFile(filePath)) {
                                return { error: "Zugriff auf diese Datei ist nicht erlaubt" }
                            }
                            const fullPath = resolveSafe(filePath)
                            if (!existsSync(fullPath)) {
                                return { error: `Datei nicht gefunden: ${filePath}` }
                            }
                            const content = await fs.readFile(fullPath, "utf-8")
                            return { path: filePath, content, lines: content.split("\n").length }
                        } catch (e) {
                            return { error: String(e) }
                        }
                    },
                }),

                write_file: tool({
                    description: "Schreibt oder überschreibt eine Datei mit neuem Inhalt",
                    parameters: z.object({
                        path: z.string().describe("Dateipfad relativ zum Arbeitsverzeichnis"),
                        content: z.string().describe("Vollständiger neuer Dateiinhalt"),
                    }),
                    execute: async ({ path: filePath, content }) => {
                        try {
                            if (isBlockedFile(filePath)) {
                                return { error: "Schreiben in diese Datei ist nicht erlaubt" }
                            }
                            const fullPath = resolveSafe(filePath)
                            const dir = path.dirname(fullPath)
                            await fs.mkdir(dir, { recursive: true })
                            await fs.writeFile(fullPath, content, "utf-8")
                            return { path: filePath, bytes: content.length, success: true }
                        } catch (e) {
                            return { error: String(e) }
                        }
                    },
                }),

                execute_command: tool({
                    description:
                        "Führt einen Shell-Befehl aus. Nur erlaubt: npm run, npm install, npx, node, ls, cat",
                    parameters: z.object({
                        command: z.string().describe("Der Befehl, der ausgeführt werden soll"),
                    }),
                    execute: async ({ command }) => {
                        if (!isAllowedCommand(command)) {
                            return {
                                error: `Befehl nicht erlaubt: "${command}". Erlaubte Prefixe: ${ALLOWED_COMMAND_PREFIXES.join(", ")}`,
                            }
                        }
                        try {
                            const { stdout, stderr } = await execAsync(command, {
                                cwd: projectRoot,
                                timeout: 30_000,
                            })
                            return {
                                command,
                                stdout: stdout.slice(0, 4000),
                                stderr: stderr.slice(0, 1000),
                            }
                        } catch (e: unknown) {
                            const err = e as { stdout?: string; stderr?: string; message?: string }
                            return {
                                command,
                                error: err.message,
                                stdout: err.stdout?.slice(0, 2000),
                                stderr: err.stderr?.slice(0, 2000),
                            }
                        }
                    },
                }),
            },
        })

        return result.toUIMessageStreamResponse()
    } catch (error) {
        console.error("Agent API Error:", error)
        return new Response("Internal Server Error", { status: 500 })
    }
}
