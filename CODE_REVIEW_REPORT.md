# Code Review Report — local-geo-llm

**Scope:** All key source files under `app/`, `lib/`, `components/` (listed files), and config files.  
**Focus:** Bugs, race conditions, dead code, performance, architecture, complexity, error handling.

---

## 1. CRITICAL (Bugs / Broken behavior)

### 1.1 Loaded chat messages render empty (history format vs. ChatBubble)

- **Files:** `app/page.tsx` (line 195), `components/chat-bubble.tsx` (lines 39–93)
- **Issue:** When loading a chat via `loadChat(id)`, the page does `setMessages(selectedChat.messages)`. Saved messages are `{ role, content }` (see `saveChat` in `app/actions/history.ts` and the conversion in `app/page.tsx` around 167–170). `ChatBubble` only renders `message.parts` (SDK v6 style). Messages loaded from history have no `parts`, so `message.parts?.map(...)` yields nothing and the bubbles are empty.
- **Fix:** Either:
  - **Option A:** In `loadChat`, normalize each message to the shape `useChat` expects, e.g.  
    `parts: [{ type: 'text', text: (m as { content?: string }).content ?? '' }]`, plus `id`/`role` as needed; or
  - **Option B:** In `ChatBubble`, support both formats: if `message.parts` is missing or empty, render `(message as { content?: string }).content` (same fallback as `getMessageText` in `app/page.tsx`).

### 1.2 Sidebar “current chat” highlight never works

- **Files:** `components/app-sidebar.tsx` (lines 31, 41, 71), `app/page.tsx` (lines 254–261)
- **Issue:** `AppSidebar` declares optional prop `currentChatId` and uses it to highlight the active chat (`currentChatId === chat.id`). The page never passes `currentChatId`, so the highlight never appears.
- **Fix:** In `app/page.tsx`, pass `currentChatId={chatId}` to `AppSidebar`.

### 1.3 Form submit handler type and event usage

- **Files:** `components/chat-footer.tsx` (lines 18–21), `app/page.tsx` (lines 217–245)
- **Issue:** Footer calls `onSubmit(e.nativeEvent as SubmitEvent & { currentTarget: HTMLFormElement })`. React form `onSubmit` receives a `React.FormEvent`; using `e.nativeEvent` and casting is brittle (e.g. `currentTarget` can be null in some cases), and the type contract is inconsistent.
- **Fix:** Use the React event in the footer: `onSubmit(e)` and type the page handler as `(e: React.FormEvent<HTMLFormElement>) => void`, using `e.preventDefault()`, `e.currentTarget`, etc. on that event.

---

## 2. IMPORTANT (Robustness / Performance / Correctness)

### 2.1 Race in save-chat effect: cleanup only clears timeout, not async work

- **File:** `app/page.tsx` (lines 144–187)
- **Issue:** The effect uses a 400 ms timeout then runs async work (`generateChatTitle`, `saveChat`, `getChatHistory`). On cleanup it sets `cancelled = true` and clears the timeout, but if the timeout already fired, the async callback can still run and call `setHistory` after unmount or after a later effect run, causing stale updates or warnings.
- **Fix:** Guard every `setState` (and any other post-await side effect) with `if (cancelled) return` and avoid calling setState after unmount. The existing `if (cancelled) return` after `saveChat` and after `getChatHistory` are good; ensure no other setState runs without a cancelled check (e.g. before the first await).

### 2.2 Search cache never invalidated

- **Files:** `lib/search.ts` (lines 36–66, 125–128)
- **Issue:** `loadChunks()` and `buildIdf()` use module-level `cachedChunks` and `cachedIdf`. `invalidateCache()` exists but is never called. Adding or changing files under `local-docs/chunks` will not be reflected until the process restarts.
- **Fix:** Either call `invalidateCache()` when docs/chunks are known to change (e.g. after a “Refresh docs” action or when writing chunk files), or document that a restart is required after changing chunks.

### 2.3 getChatHistory: one corrupt file fails entire list

- **File:** `app/actions/history.ts` (lines 46–57)
- **Issue:** `Promise.all(files.map(...))` with `JSON.parse(content)` means a single malformed or corrupt JSON file causes `getChatHistory()` to reject and the UI gets no history.
- **Fix:** In the `map`, wrap read+parse in try/catch; on error log and return a safe placeholder (e.g. `{ id: f, updatedAt: '0', messages: [], title: 'Corrupt' }`) or skip that file, then sort and return the rest.

### 2.4 CopyButton: no error handling for clipboard

- **File:** `components/copy-button.tsx` (lines 10–14)
- **Issue:** `navigator.clipboard.writeText(value)` can reject (e.g. permission denied, no focus). The failure is unhandled and the UI still shows “copied” if the promise resolves after a delay.
- **Fix:** Use try/catch or `.catch()` and on failure either keep “Copy” state or show a short “Copy failed” state; avoid setting “copied” on rejection.

### 2.5 GeoPreview: map ref not cleared on cleanup

- **File:** `components/geo-preview.tsx` (lines 73–76)
- **Issue:** Cleanup calls `map.remove()` but does not set `mapRef.current = null`. If the effect re-runs (e.g. `data` changes), there is a brief period where `mapRef.current` points to a removed map. Minor and only relevant if `data` changes while mounted.
- **Fix:** In the cleanup function, set `mapRef.current = null` after `map.remove()`.

### 2.6 GeoPreview: unsafe geometry handling

- **File:** `components/geo-preview.tsx` (lines 46–64)
- **Issue:** `(geometry.coordinates as any).flat(Infinity)` assumes a structure that can be flattened to number pairs. Deeply nested or invalid GeoJSON could produce wrong bounds or runtime errors.
- **Fix:** Add guards (e.g. check type and shape of `geometry` and `coordinates`) or use a small GeoJSON helper to extract all coordinate pairs safely; handle Point/LineString/Polygon and Multi* explicitly if needed.

### 2.7 Duplicate JSDoc for getMessageText

- **File:** `app/page.tsx` (lines 27–33)
- **Issue:** Two consecutive JSDoc blocks describe the same function; one is redundant.
- **Fix:** Keep a single JSDoc block (e.g. the one that mentions SDK v6 and content fallback).

### 2.8 Possible unnecessary re-renders on page

- **File:** `app/page.tsx`
- **Issue:** Many `useState` values are passed to children (`availableFiles`, `projectFiles`, `selectedFiles`, `history`, `contextStats`, `autoContext`, etc.). When any of these change, the whole tree re-renders. No `React.memo` on heavy children (e.g. `AppSidebar`, `ChatBubble` list). For a small app this may be fine, but worth being aware of.
- **Suggestion:** If the chat list or sidebar becomes heavy, consider memoizing list items and the sidebar, and ensuring callback props passed to them are stable (e.g. `useCallback` where already used is good).

---

## 3. CLEANUP (Dead code / Unused files / Redundancy)

### 3.1 Unused `lib/docs.ts` and `getLocalDocs`

- **File:** `lib/docs.ts` (entire file)
- **Issue:** `getLocalDocs()` is never imported or called anywhere. The app uses `app/actions/docs.ts` for doc list and content. This file is dead code. It also uses sync `fs` APIs (`existsSync`, `readdirSync`, `readFileSync`), which are better avoided in server/async contexts.
- **Fix:** Remove `lib/docs.ts` or wire it somewhere if you still want a “all docs as one string” helper; otherwise delete it.

### 3.2 Unused `invalidateCache`

- **File:** `lib/search.ts` (lines 125–128)
- **Issue:** `invalidateCache()` is exported but never called. Either it is intended for future use (e.g. “Refresh docs”) or it is dead code.
- **Fix:** Call it when chunk set can change (see 2.2), or remove the export and the cache invalidation API if you do not need it.

### 3.3 Unused component: GeoPreview

- **File:** `components/geo-preview.tsx`
- **Issue:** `GeoPreview` is not imported or used anywhere. It is a self-contained MapLibre + GeoJSON preview component.
- **Fix:** Either integrate it (e.g. when the model returns GeoJSON, show it in the chat), or remove the file and the `maplibre-gl` / `geojson` type dependency if you do not need it.

### 3.4 Unused example components in app tree

- **Files:** `components/example.tsx`, `components/component-example.tsx`
- **Issue:** `ExampleWrapper`, `Example`, and `ComponentExample` are only used inside `component-example.tsx`. No route or page imports `ComponentExample`, so these are effectively unused in the main app.
- **Fix:** If they are for a separate “kitchen sink” or docs route, add that route and link to it; otherwise remove or move to a dedicated demo app/folder.

### 3.5 Redundant dependency check

- **File:** `package.json`
- **Issue:** Both `ai-sdk-ollama` and `ollama-ai-provider-v2` appear; the chat route and history use `ollama-ai-provider-v2`. If `ai-sdk-ollama` is unused, it can be removed to avoid confusion and bundle size.

- **Fix:** Grep for `ai-sdk-ollama`; if unused, remove from dependencies.

---

## 4. ARCHITECTURE / COUPLING

### 4.1 Message format in two places

- **Files:** `app/page.tsx` (`getMessageText`), `components/chat-bubble.tsx` (parts only), `app/api/chat/route.ts` (parts vs content)
- **Issue:** The “message content” contract is duplicated: page and API support both `parts` and `content`, but ChatBubble only supports `parts`. That’s why loading history breaks (see 1.1).
- **Fix:** Centralize “message to display text” in one place (e.g. a small `messageToText(message)` in `lib/` or shared type + helper), use it in both the page and ChatBubble, and ensure history load produces messages in the shape the UI expects (see 1.1).

### 4.2 Path convention for “project file” is implicit

- **Files:** `app/actions/docs.ts` (lines 46–49), `components/app-sidebar.tsx` (line 154)
- **Issue:** “Project file” is inferred by `file.startsWith('components/')` and sidebar builds path as `components/${file}`. This is a magic string and could break if you add other roots (e.g. `app/`, `lib/`).
- **Suggestion:** Introduce a constant (e.g. `PROJECT_FILE_PREFIX = 'components/'`) or a small helper `isProjectFile(path)` / `resolveProjectPath(path)` and use it in both places.

---

## 5. ERROR HANDLING

### 5.1 Chat API: no body size or schema validation

- **File:** `app/api/chat/route.ts` (lines 9–15)
- **Issue:** Only checks that `messages` exists and is an array. Very large bodies could cause memory or performance issues; malformed fields could lead to runtime errors later.
- **Suggestion:** Optionally enforce a max body size and validate message shape (e.g. role, content/parts) with Zod or similar; return 400 with a clear message on failure.

### 5.2 history.ts: JSON.parse can throw on read

- **File:** `app/actions/history.ts` (lines 23–25)
- **Issue:** When updating an existing chat file, `JSON.parse(content)` is used without try/catch. A corrupt file would throw and `saveChat` would fail.
- **Fix:** Wrap in try/catch; on parse error either treat as “no existing data” or return a clear error to the caller.

### 5.3 getSelectedDocsContent: single catch hides which file failed

- **File:** `app/actions/docs.ts` (lines 44–61)
- **Issue:** One try/catch around the loop; on first failure the function returns `""` and logs a generic error, so you don’t know which file or what error.
- **Suggestion:** Log the file path and error (e.g. `console.error('Fehler beim Lesen:', file, error)`), or collect errors and return a partial result plus errors if you want to be resilient.

---

## 6. CONFIGURATION / STYLE

### 6.1 biome.json vs package.json lint script

- **Files:** `biome.json`, `package.json` (lint script)
- **Issue:** Lint script is `"lint": "eslint"`. The project also has Biome configured. Running `npm run lint` only runs ESLint, not Biome, so Biome rules are not enforced by the same command.
- **Suggestion:** Add a `lint:biome` script (e.g. `biome check .`) and optionally `lint:all` that runs both, or switch the main `lint` to Biome if you prefer it.

### 6.2 next.config.ts

- **File:** `next.config.ts`
- **Issue:** Empty config is fine; no issues found. If you use the chat API from the client, consider `api.bodyParser` or route segment config if you ever need to change body size limits.

---

## Summary table

| Severity   | Count | Main items |
|-----------|-------|------------|
| CRITICAL  | 3     | Empty messages when loading history; sidebar currentChatId not passed; form submit event typing |
| IMPORTANT | 8     | Save effect race; search cache never invalidated; getChatHistory one-file failure; clipboard/GeoPreview/duplicate JSDoc; re-renders |
| CLEANUP   | 5     | Dead `lib/docs.ts`, unused `invalidateCache`, unused GeoPreview and example components; redundant dep |
| Architecture | 2  | Message format duplication; magic path for project files |
| Error handling | 3 | Chat API validation; history parse; getSelectedDocsContent error detail |

Recommended order of work: fix **1.1** (loaded messages empty) and **1.2** (currentChatId) first, then **1.3** (form event). Then address **2.2**, **2.3**, and **2.4** for robustness, and **3.1**, **3.3**, **3.4** for cleanup if you want to trim unused code.
