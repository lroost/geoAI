const { spawn } = require("node:child_process")
const http = require("node:http")

const OLLAMA_URL = "http://127.0.0.1:11434/api/tags"
const MAX_WAIT_MS = 8000
const POLL_INTERVAL_MS = 500

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isOllamaReachable() {
    return new Promise((resolve) => {
        const req = http.get(OLLAMA_URL, (res) => {
            res.resume()
            resolve(res.statusCode >= 200 && res.statusCode < 500)
        })

        req.on("error", () => resolve(false))
        req.setTimeout(1500, () => {
            req.destroy()
            resolve(false)
        })
    })
}

async function waitForOllama(maxWaitMs) {
    const startedAt = Date.now()
    while (Date.now() - startedAt < maxWaitMs) {
        if (await isOllamaReachable()) return true
        await sleep(POLL_INTERVAL_MS)
    }
    return false
}

async function ensureOllama() {
    if (await isOllamaReachable()) {
        console.log("Ollama ist erreichbar.")
        return
    }

    console.log("Ollama nicht erreichbar. Starte 'ollama serve'...")
    const child = spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
    })
    child.unref()

    const ready = await waitForOllama(MAX_WAIT_MS)
    if (!ready) {
        console.error("Ollama konnte nicht automatisch gestartet werden.")
        console.error("Bitte manuell starten: ollama serve")
        process.exit(1)
    }

    console.log("Ollama wurde erfolgreich gestartet.")
}

void ensureOllama()
