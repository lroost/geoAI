const fs = require("node:fs")
const path = require("node:path")

const inputDir = path.join(__dirname, "..", "local-docs")
const outputDir = path.join(__dirname, "..", "local-docs", "chunks")

if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
}
fs.mkdirSync(outputDir, { recursive: true })

const slugify = (text) =>
    text
        .toLowerCase()
        .replace(/[^a-z0-9äöüß]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60)

function chunkMarkdown(content) {
    const lines = content.split("\n")
    const chunks = []
    let currentH3 = "general"
    let currentH4 = ""
    let buffer = []
    let headingLine = ""

    const flush = () => {
        if (buffer.length === 0) return
        const text = buffer.join("\n").trim()
        if (text.length < 50) {
            buffer = []
            return
        }
        chunks.push({
            category: currentH3,
            heading: currentH4 || currentH3,
            headingLine,
            content: text,
        })
        buffer = []
    }

    for (const line of lines) {
        if (line.match(/^### /)) {
            flush()
            currentH3 = line.replace(/^### /, "").trim()
            currentH4 = ""
            headingLine = line
            buffer.push(line)
        } else if (line.match(/^#### /)) {
            flush()
            currentH4 = line.replace(/^#### /, "").trim()
            headingLine = line
            buffer.push(line)
        } else {
            buffer.push(line)
        }
    }
    flush()
    return chunks
}

const bigFiles = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("00-"))
    .map((f) => ({
        name: f,
        size: fs.statSync(path.join(inputDir, f)).size,
    }))
    .filter((f) => f.size > 50_000)

let totalChunks = 0
const seenContent = new Set()

for (const file of bigFiles) {
    const content = fs.readFileSync(path.join(inputDir, file.name), "utf8")
    const chunks = chunkMarkdown(content)
    let fileChunks = 0

    for (const chunk of chunks) {
        const contentHash = chunk.content.slice(0, 500)
        if (seenContent.has(contentHash)) continue
        seenContent.add(contentHash)

        const fileName = `${slugify(chunk.category)}--${slugify(chunk.heading)}.md`

        const header = [
            `<!-- source: ${file.name} -->`,
            `<!-- category: ${chunk.category} -->`,
            `<!-- heading: ${chunk.heading} -->`,
            "",
        ].join("\n")

        fs.writeFileSync(path.join(outputDir, fileName), header + chunk.content)
        totalChunks++
        fileChunks++
    }

    console.log(
        `${file.name}: ${fileChunks} Chunks (${chunks.length - fileChunks} Duplikate übersprungen)`,
    )
}

console.log(`\nFertig: ${totalChunks} Chunks in ${outputDir}`)
