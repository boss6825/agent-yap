---
id: module/search-ask-panels
type: module
links:
  - flow/search
  - flow/ask-the-docs
  - module/reader
---

# Module: Search & Ask panels (`src/components/SearchPanel.tsx`, `src/components/AskPanel.tsx`)

## Responsibility
The two client-side discovery modals mounted by `ReaderChrome` (module/reader).
`SearchPanel` debounces input (~180ms), calls `GET /api/search` with an
`AbortController`, renders ranked results, and supports keyboard selection
(↑/↓/Enter) → `router.push(href)`. `AskPanel` POSTs to `/api/ask`, renders the
markdown answer plus a "Sources" citation list, offers static suggestions, and
shows a banner when `configured === false`. Both use the shared `Modal`.

## Key Boundaries
These own only UI/UX and the client-side fetch contract; ranking (module/search)
and answer generation (module/ask) live server-side. They consume the wire
shapes from `docs/api-contract.md` and locally re-declare `SearchResult` /
`AskResponse` interfaces to match. Navigating a result/citation enters
flow/slide-rendering.

Status: Stub — auto-generated; expand when this module gains complexity.
