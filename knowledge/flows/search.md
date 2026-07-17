---
id: flow/search
type: flow
links:
  - module/search
  - module/content
  - module/search-ask-panels
  - concept/single-source-of-truth
---

# Flow: Full-text search

## Overview
Lexical search across every slide in the knowledge base. The reader opens the
search panel (`/` key or "Search" button), types a query, and gets ranked
sections with highlighted snippets that link straight to the slide. Ranking is
BM25 computed in-process over the same `Slide` objects the reader renders — no
separate index, no embeddings (see OVERVIEW "Lexical RAG").

## Entry Point
`GET /api/search?q=<query>&limit=<n>` — `src/app/api/search/route.ts`
(`runtime = "nodejs"`). Called by `SearchPanel` via `fetch`, debounced ~180ms.

## Steps
1. `SearchPanel` debounces input and issues `fetch('/api/search?q=...')` with an
   `AbortController` (stale requests are cancelled) — owner: module/search-ask-panels — sync.
2. The route reads `q` and optional `limit`, returns `{ query: "", results: [] }`
   immediately for empty `q` — owner: module/search — sync.
3. `searchSlides(query, limit)` tokenizes the query, then calls `getAllSlides()`
   and builds per-document term counts — owner: module/search → module/content — sync.
4. BM25 scoring runs (k1=1.2, b=0.75), with title terms weighted ×3
   (`TITLE_WEIGHT`); zero-score docs are dropped, ties broken by `globalIndex` — owner: module/search — sync.
5. `makeSnippet` builds a ~160-char snippet centered on the best-matching term
   (via `toPlainText`); results are clamped to `limit` (default 8, max 20) — owner: module/search — sync.
6. The route projects each `SearchResult` to the wire shape (drops the full
   `slide` object) and returns `{ query, results }` — owner: module/search — sync.

```mermaid
sequenceDiagram
    participant Panel as SearchPanel
    participant API as GET /api/search
    participant Search as module/search
    participant Content as module/content
    Panel->>API: fetch ?q=...&limit=...
    API->>Search: searchSlides(query, limit)
    Search->>Content: getAllSlides()
    Content-->>Search: Slide[]
    Note over Search: tokenize + BM25 (title ×3) + snippet
    Search-->>API: SearchResult[] (ranked)
    API-->>Panel: JSON { query, results }
    Panel-->>Panel: render list; Enter → router.push(href)
```

## End Condition
`SearchPanel` renders the ranked list; Enter or click navigates to
`result.href` (which enters flow/slide-rendering). Empty query or no matches
shows a hint / "No matches" message.

## Failure Modes
| Failure | Handling |
|---|---|
| Empty / whitespace query | Route short-circuits to `{ results: [] }`; panel shows the prompt hint |
| Non-numeric `limit` | `clampLimit` falls back to default (8), bounded to [1, 20] |
| No BM25 match | All scores filtered out → empty `results`; panel shows "No matches" |
| Fetch fails / non-OK | Panel catches (ignoring `AbortError`) and shows "Search isn't available yet." |

## Transaction Boundaries
Synchronous, read-only, single Node process. No persistence; the corpus is
rebuilt in memory from `getAllSlides()` per request (fine at ~200 slides — see
OVERVIEW scaling notes). No external service is involved.
