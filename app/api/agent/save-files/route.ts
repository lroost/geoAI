import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

// Wie viel kleiner darf ein neuer Block sein, bevor wir ihn als "Snippet" ablehnen?
// 0.4 = wenn der neue Inhalt weniger als 40% der bestehenden Datei ist → kein Überschreiben
const MIN_SIZE_RATIO = 0.4

// Sprache → Standard-Dateiname wenn kein Kommentar gefunden
const LANG_TO_FILE: Record<string, string> = {
    html: "index.html",
    css: "style.css",
    js: "script.js",
    javascript: "script.js",
    jsx: "src/App.jsx",
    tsx: "src/App.tsx",
    ts: "index.ts",
    typescript: "index.ts",
    json: "package.json",
    py: "main.py",
    python: "main.py",
    md: "README.md",
    markdown: "README.md",
    sh: "setup.sh",
    bash: "setup.sh",
    yaml: "config.yaml",
    yml: "config.yml",
}

// Erkennt Dateinamen in der ersten Zeile eines Code-Blocks:
// // index.js   # main.py   <!-- index.html -->   /* style.css */
const FILENAME_PATTERNS = [
    /^\/\/\s*([^\s]+\.[a-zA-Z0-9]+)\s*$/,
    /^#\s*([^\s]+\.[a-zA-Z0-9]+)\s*$/,
    /^<!--\s*([^\s]+\.[a-zA-Z0-9]+)\s*-->\s*$/,
    /^\/\*\s*([^\s]+\.[a-zA-Z0-9]+)\s*\*\/\s*$/,
]

interface ParsedBlock {
    filename: string
    content: string
}

function parseCodeBlocks(text: string): ParsedBlock[] {
    const blocks: ParsedBlock[] = []
    const seen = new Set<string>()

    const regex = /```(\w+)?\n([\s\S]*?)```/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        const lang = (match[1] ?? "").toLowerCase()
        let content = match[2]
        if (!content.trim()) continue

        const lines = content.split("\n")
        const firstLine = lines[0].trim()

        let filename: string | null = null

        // Dateiname aus erster Zeile extrahieren
        for (const pattern of FILENAME_PATTERNS) {
            const m = firstLine.match(pattern)
            if (m) {
                filename = m[1]
                content = lines.slice(1).join("\n") // Kommentar-Zeile entfernen
                break
            }
        }

        // Fallback: Dateiname aus Sprache ableiten
        if (!filename) {
            filename = LANG_TO_FILE[lang] ?? null
        }

        if (!filename) continue

        // Duplikate auflösen: index.html → index-2.html → index-3.html
        let final = filename
        let i = 2
        while (seen.has(final)) {
            const dot = filename.lastIndexOf(".")
            final =
                dot >= 0
                    ? `${filename.slice(0, dot)}-${i}${filename.slice(dot)}`
                    : `${filename}-${i}`
            i++
        }
        seen.add(final)

        blocks.push({ filename: final, content })
    }

    return blocks
}

export async function POST(req: Request) {
    try {
        const { text, workDir } = (await req.json()) as { text: string; workDir: string }

        if (!text || !workDir) {
            return Response.json({ error: "text und workDir sind erforderlich" }, { status: 400 })
        }

        const projectRoot = path.resolve(workDir)
        const blocks = parseCodeBlocks(text)

        if (blocks.length === 0) {
            return Response.json({ written: [] })
        }

        const written: string[] = []
        const skipped: string[] = []
        const errors: string[] = []

        for (const block of blocks) {
            try {
                const fullPath = path.resolve(projectRoot, block.filename)

                // Sicherheit: kein Path-Traversal
                if (!fullPath.startsWith(projectRoot)) {
                    errors.push(`Übersprungen (unsicherer Pfad): ${block.filename}`)
                    continue
                }

                // Schutz vor partiellen Überschreibungen:
                // Wenn die Datei existiert und der neue Inhalt deutlich kürzer ist,
                // handelt es sich wahrscheinlich um ein Snippet, nicht die vollständige Datei.
                if (existsSync(fullPath)) {
                    const existing = await fs.readFile(fullPath, "utf-8")
                    const ratio = block.content.length / existing.length
                    if (ratio < MIN_SIZE_RATIO) {
                        skipped.push(block.filename)
                        continue
                    }
                }

                await fs.mkdir(path.dirname(fullPath), { recursive: true })
                await fs.writeFile(fullPath, block.content, "utf-8")
                written.push(block.filename)
            } catch (e) {
                errors.push(`${block.filename}: ${String(e)}`)
            }
        }

        return Response.json({ written, skipped, errors })
    } catch (e) {
        return Response.json({ error: String(e) }, { status: 500 })
    }
}
