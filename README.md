# geoAI – Lokales Geo-LLM

Eine lokale Chat-Anwendung mit KI-gestützter Code-Generierung. Läuft komplett offline auf deinem Rechner via [Ollama](https://ollama.com) – keine Cloud, keine API-Keys, volle Datenkontrolle.

## Tech Stack

| Layer | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Webpack) |
| UI | React 19, ShadCN/UI, Radix, Tailwind CSS 4 |
| LLM | Ollama + Qwen 2.5 Coder 7B |
| AI SDK | Vercel AI SDK v6, ollama-ai-provider-v2 |
| Docs-Suche | TF-IDF Keyword-Suche (zero-dependency) |
| Linting | Biome |

## Voraussetzungen

- **Node.js** >= 18
- **Ollama** installiert und laufend (`brew install ollama`)
- **Qwen 2.5 Coder 7B** Modell geladen:

```bash
ollama pull qwen2.5-coder:7b
```

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) im Browser.

## Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Dev-Server starten |
| `npm run build` | Production-Build |
| `npm run lint` | Biome Lint + Format prüfen |
| `npm run lint:fix` | Biome Auto-Fix |
| `npm run format` | Nur Formatierung |
| `npm run chunk-docs` | Dokumentation in Chunks aufteilen |

## Projektstruktur

```
app/
  page.tsx              # Haupt-Chat-UI
  api/chat/route.ts     # Ollama Streaming-Endpoint
  actions/docs.ts       # Docs-Suche + Kontext-Injection
  actions/history.ts    # Chat-Persistenz (.history/)
components/
  app-sidebar.tsx       # Sidebar mit Historie, Docs, Dev Mode
  chat-bubble.tsx       # Nachrichten-Rendering (Markdown + Syntax Highlighting)
  chat-footer.tsx       # Eingabefeld
  context-monitor.tsx   # Anzeige der Auto-Referenzen
  ui/                   # ShadCN UI-Komponenten
lib/
  search.ts             # TF-IDF Suchengine für Doc-Chunks
local-docs/
  chunks/               # Generierte Themen-Chunks (via chunk-docs)
  *.md                  # Quelldokumentation (Flowbite/Tailwind)
scripts/
  chunk-docs.js         # Zerlegt große Docs in thematische Chunks
```

## Dokumentation hinzufügen

1. Lege eine `.md`-Datei in `local-docs/` ab
2. Führe `npm run chunk-docs` aus (Dateien > 50 KB werden automatisch gechunkt)
3. Die Suche findet die neuen Chunks beim nächsten Request

## Wie die Auto-Kontext-Suche funktioniert

Beim Absenden einer Nachricht sucht das System automatisch die relevantesten Doc-Chunks per TF-IDF und injiziert sie in den Prompt:

```
Benutzer tippt Frage
       |
  [TF-IDF Suche] --> Top 2-3 relevante Chunks
       |
  Prompt = Auto-Referenzen + Manueller Kontext + Frage
       |
  [Qwen 2.5 Coder 7B via Ollama] --> Streaming-Antwort
```

Kein Embedding-Modell, keine Vektor-Datenbank – reine Keyword-Relevanz mit Heading-Boost, gecacht im Speicher.

## Lizenz

Privat
