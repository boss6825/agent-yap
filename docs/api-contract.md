# API Contract — Agent YAP backend

The frontend (slide reader) is statically generated from the markdown in
`content/`. The **backend** is two route handlers that power on-site **search**
and an **AI "Ask the docs"** assistant. Codex owns this backend.

Both endpoints build on the existing content layer. **Reuse it, do not
re-parse markdown:**

```ts
import { getAllSlides, toPlainText, type Slide } from "@/lib/content";
```

`getAllSlides()` returns every slide (section) across the book with:
`id, bookSlug, chapterNumber, chapterTitle, chapterSlug, sectionIndex, title,
markdown, text, href, globalIndex`.

---

## 1. `GET /api/search`

Lexical full-text search across all slides.

**Query params**
- `q` (string, required) — the search query.
- `limit` (number, optional, default `8`, max `20`).

**Response `200 application/json`**

```json
{
  "query": "tool design",
  "results": [
    {
      "id": "architecture-and-system-design/03-tool-design/2",
      "chapterNumber": 3,
      "chapterTitle": "Tool Design",
      "sectionIndex": 2,
      "title": "The description is a prompt",
      "snippet": "…a tool's description is read by the model as an instruction…",
      "href": "/read/architecture-and-system-design/03-tool-design/2",
      "score": 12.4
    }
  ]
}
```

**Rules**
- Empty/whitespace `q` → `200` with `{ "query": "", "results": [] }`.
- Case-insensitive. Rank with a sensible lexical score (TF-IDF / BM25-style).
  Title matches should weigh more than body matches.
- `snippet`: ~160 chars of **plain text** (use `toPlainText` / the slide's
  `text`) centered on the best-matching term window, with matched terms intact.
- Sort by `score` desc; cap at `limit`.

---

## 2. `POST /api/ask`

Retrieval-augmented answer grounded in the knowledge base.

**Request body `application/json`**: `{ "question": string }`

**Behavior**
1. Retrieve the top ~6 relevant slides (reuse the same ranking as search).
2. Build a grounded prompt from those slides' `markdown` + their titles.
3. Call **Anthropic Claude** via `@anthropic-ai/sdk` (already installed).
   - Model: `process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"`.
   - API key: `process.env.ANTHROPIC_API_KEY`.
   - System prompt: answer **only** from the provided context; be concise and
     practical; if the answer isn't in the context, say so; never invent.
   - `max_tokens` ~800, low temperature.

**Response `200 application/json`**

```json
{
  "answer": "Markdown answer text…",
  "citations": [
    {
      "chapterNumber": 3,
      "chapterTitle": "Tool Design",
      "title": "The description is a prompt",
      "href": "/read/architecture-and-system-design/03-tool-design/2"
    }
  ],
  "configured": true
}
```

**Rules**
- `citations` = the retrieved slides actually used (deduped, in rank order).
- If `ANTHROPIC_API_KEY` is **missing**, do **not** error. Return `200` with
  `configured: false`, a friendly `answer` explaining the assistant isn't set up
  yet, and still include `citations` (the retrieved slides) so the UI can point
  the reader to the relevant sections.
- Validation errors (missing/empty `question`) → `400` with
  `{ "error": "..." }`.
- Runtime: Node.js (the content layer uses `node:fs`). Do not use the edge runtime.

---

## Implementation notes / lanes

- Put shared retrieval logic in **`src/lib/search.ts`** (a `searchSlides(query,
  limit)` function) and reuse it from BOTH routes. RAG/LLM glue can live in
  **`src/lib/ask.ts`**.
- Route handlers: `src/app/api/search/route.ts`, `src/app/api/ask/route.ts`.
- Add **`.env.example`** documenting `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`.
- **Do not modify** `src/lib/content.ts` (frontend-owned) — only import from it.
  Do not touch the reader UI under `src/app/(reader)` / `src/components`.
- Dependencies are already installed (`@anthropic-ai/sdk`). No need to run
  `npm install`.
- This is **Next.js 16** (App Router, React 19). Route handler `params`/request
  parsing follow Next 16 conventions; read `node_modules/next/dist/docs` if unsure.
