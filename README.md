# Local AI – Dein lokaler KI-Assistent

Ein KI-Chat, der **komplett auf deinem eigenen Computer läuft** – ohne Cloud, ohne API-Keys, ohne Kosten. Deine Daten bleiben bei dir.

---

## Was ist das?

Stell dir ChatGPT vor, aber es läuft komplett lokal auf deinem Mac. Du kannst:
- **Mit einem KI-Modell chatten** und Fragen stellen
- **Im Agent-Modus** die KI eigenständig Dateien lesen, erstellen und Code schreiben lassen – ähnlich wie Replit Agent, aber auf deiner eigenen Maschine

---

## Was du brauchst (einmalige Installation)

### Schritt 1: Node.js installieren

Node.js ist die Laufzeitumgebung für die App.

1. Gehe auf [nodejs.org](https://nodejs.org)
2. Lade die **LTS-Version** herunter (der grüne Button)
3. Starte den Installer und folge den Anweisungen
4. Überprüfe die Installation – öffne das **Terminal** und tippe:

```bash
node --version
```

Du solltest etwas wie `v22.0.0` sehen. Wenn ja, hat es funktioniert. ✓

> **Was ist das Terminal?** Drücke `Cmd + Leertaste`, tippe "Terminal" und drücke Enter.

---

### Schritt 2: Ollama installieren

Ollama ist das Programm, das das KI-Modell auf deinem Computer ausführt.

```bash
brew install ollama
```

> **Was ist Homebrew?** Falls der Befehl nicht funktioniert, installiere zuerst Homebrew von [brew.sh](https://brew.sh) – einfach den dort angezeigten Befehl kopieren und ins Terminal einfügen.

---

### Schritt 3: Das KI-Modell herunterladen

Das Modell ist die eigentliche "KI". Es ist ca. 4 GB gross – einmalig herunterladen:

```bash
ollama pull qwen2.5-coder:7b
```

Das dauert einige Minuten. Du siehst einen Fortschrittsbalken.

---

### Schritt 4: Das Projekt herunterladen und starten

```bash
# 1. In den Projektordner wechseln (den Pfad anpassen)
cd /Users/deinname/Desktop/local-geo-llm

# 2. Abhängigkeiten installieren (einmalig)
npm install

# 3. App starten
npm run dev
```

Öffne dann [http://localhost:3000](http://localhost:3000) im Browser.

**Das war's!** Die App startet Ollama automatisch, falls es noch nicht läuft.

---

## Die App benutzen

### Chat-Modus (Standard)

Einfach eine Frage eintippen und abschicken. Die KI antwortet direkt im Chat.

Die App erkennt automatisch, wenn du nach Code oder Technik fragst, und sucht dabei in deiner lokalen Dokumentation (falls vorhanden).

**Nützliche Befehle:**
| Eingabe | Was passiert |
|---|---|
| `/ctx deine Frage` | Erzwingt Dokumentations-Suche |
| `/noctx deine Frage` | Deaktiviert Dokumentations-Suche |

---

### Agent-Modus

Der Agent kann **selbstständig arbeiten**: Dateien lesen, Code schreiben, Befehle ausführen.

**So aktivierst du ihn:**
1. Klicke auf den **"Agent"**-Button oben rechts (wird blau hervorgehoben)
2. Wähle über **"Durchsuchen"** den Ordner, in dem der Agent arbeiten soll
3. Beschreibe auf Deutsch, was der Agent tun soll – z.B.:
   - *"Erstelle eine neue React-Komponente für eine Karte"*
   - *"Schau dir package.json an und erkläre mir die Dependencies"*
   - *"Refaktoriere die Datei components/map.tsx"*

Der Agent zeigt dir live an, was er gerade macht (welche Dateien er liest/schreibt).

> **Sicherheit:** Der Agent darf nur Befehle wie `npm`, `node`, `ls` ausführen. Sensible Dateien wie `.env` sind geschützt und können nicht gelesen werden.

---

### Dokumentation hinzufügen (optional)

Du kannst eigene Dokumentations-Dateien hinzufügen, die die KI als Referenz nutzt:

1. Lege `.md`- oder `.txt`-Dateien in den Ordner `local-docs/`
2. Führe einmalig aus:
   ```bash
   npm run chunk-docs
   ```
3. Die KI findet die Inhalte nun automatisch beim Chatten

---

## Häufige Probleme

**"Ollama nicht erreichbar"**
→ Starte Ollama manuell: `ollama serve` im Terminal eingeben

**"Modell nicht gefunden"**
→ Führe `npm run ollama:pull` aus, um das Modell herunterzuladen

**Die App lädt ewig**
→ Überprüfe ob Ollama läuft: `npm run ollama:health`

**Ich möchte ein anderes KI-Modell verwenden**
→ Erstelle eine Datei `.env.local` im Projektordner und füge ein:
```
OLLAMA_MODEL=llama3.2:3b
```
Andere Modelle findest du auf [ollama.com/library](https://ollama.com/library)

---

## Nützliche Befehle

```bash
npm run dev          # App starten
npm run ollama:pull  # KI-Modell herunterladen
npm run ollama:health # Prüfen ob Ollama läuft
npm run chunk-docs   # Dokumentation indexieren
npm run build        # Produktions-Build erstellen
```

---

## Technische Details (für Neugierige)

| Komponente | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Shadcn/UI, Tailwind CSS 4 |
| KI-Modell | Qwen 2.5 Coder 7B via Ollama |
| AI SDK | Vercel AI SDK v6 |
| Dokumenten-Suche | TF-IDF (ohne externe Datenbank) |
| Desktop-App | Tauri (optional) |

```
Projektstruktur:
app/
  page.tsx                 → Haupt-Chat-Oberfläche
  api/chat/route.ts        → Verbindung zu Ollama (Chat-Modus)
  api/agent/route.ts       → Agent mit Datei-/Befehlszugriff
  api/pick-directory/      → Nativer Ordner-Auswahl-Dialog
components/
  agent-toolbar.tsx        → Verzeichnis-Auswahl im Agent-Modus
  chat-bubble.tsx          → Nachrichten-Darstellung
  tool-call-view.tsx       → Anzeige der Agent-Aktionen
lib/
  search.ts                → Dokumenten-Suchmaschine
local-docs/                → Deine eigene Dokumentation (optional)
scripts/
  ensure-ollama.js         → Startet Ollama automatisch beim Start
```

---

## Lizenz

Privat
