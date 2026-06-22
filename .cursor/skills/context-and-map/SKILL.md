---
name: context-and-map
description: Full project context plus folder map for Agent YAP, the AI agent engineering education site. Use when onboarding to the repo, locating content or code, adding chapters, building interactive features, or when you need both what the project is and where things live.
---

# Agent YAP — Context and Map

## Project context

### What this is

An educational website teaching **AI agent engineering**: RAG, context engineering, agentic memory, multi-agent systems, coding agent harnesses (Claude Code, Codex, Cursor, Manus), and full agent system design.

### Content pipeline

1. Collect source articles, blog posts, and research papers.
2. Feed sources to Claude for structured chapter generation.
3. Publish generated markdown through the slide reader.

`sources/` folders hold **generation inputs only** (not rendered on the site).

### Delivery model

- Markdown → Next.js **slide reader** (one `##` section = one slide, intro before first H2).
- No auth, no content database.
- Search (`/api/search`) and Ask the docs (`/api/ask`) over indexed slides.

### Content rules

- **No em dashes** in any generated content.
- **Practitioner-focused:** explain mechanisms, not marketing summaries.

### Current phase

- All module chapter content is written.
- Now adding **interactive elements** (MCQs, coding challenges).
- Only one book is live in the reader today; other modules await `index.md` + `chapter-NN-*.md` integration.

---

## Repository map

```
agent YAP/
├── AGENTS.md / CLAUDE.md     Agent + lane rules (frontend vs backend ownership)
├── README.md                 Human-facing project overview
├── docs/
│   └── api-contract.md       Search + Ask API contract (backend must follow)
├── .env.example              ANTHROPIC_API_KEY for Ask the docs
├── content/                  Markdown knowledge base (see module table below)
├── public/                   Static assets (SVGs)
└── src/
    ├── app/                  Next.js App Router
    │   ├── page.tsx          Landing page
    │   ├── layout.tsx        Root layout
    │   ├── globals.css       Tailwind v4 + design tokens
    │   ├── read/
    │   │   ├── page.tsx      Reader entry / redirect
    │   │   └── [book]/
    │   │       ├── page.tsx          Book TOC
    │   │       ├── layout.tsx        Book shell
    │   │       └── [chapter]/[slide]/
    │   │           ├── page.tsx      Slide page (SSG)
    │   │           └── template.tsx  Slide transition wrapper
    │   └── api/
    │       ├── search/route.ts       Full-text search endpoint
    │       └── ask/route.ts          RAG Ask the docs endpoint
    ├── components/
    │   ├── Home.tsx            Landing UI
    │   ├── SearchPanel.tsx     / keyboard search
    │   ├── AskPanel.tsx        Ask the docs UI
    │   ├── Markdown.tsx        Slide markdown renderer
    │   ├── Modal.tsx
    │   ├── Wordmark.tsx
    │   └── reader/
    │       ├── ReaderChrome.tsx  Nav, progress, TOC drawer
    │       └── nav-direction.ts
    └── lib/
        ├── content.ts          **Source of truth:** fs → books → chapters → slides
        ├── search.ts           BM25 search over slides
        ├── ask.ts              RAG retrieval + Anthropic Claude
        └── chapter-color.ts    Per-chapter accent colors
```

---

## Content modules (`content/`)

| Folder | Topic | Chapters | Live on site? | Notes |
|--------|-------|----------|---------------|-------|
| `architecture-and-system-design/` | Full agent system design (18 chapters) | `chapter-01` … `chapter-18` + `index.md` | **Yes** | Primary published book |
| `rag/` | Naive RAG → agentic RAG | 4 chapters + overview | No | Files named `Chapter N - …md`; needs `index.md` + rename |
| `context engineering/` | Context engineering | 4 chapters + overview | No | Same naming pattern |
| `agentic memory/` | Agent memory systems | 5 chapters + overview | No | Same naming pattern |
| `multi-agent/` | Multi-agent debate & patterns | 5 chapters + overview | No | Same naming pattern |
| `building coding agents and harnesses/` | Harness internals | 17 chapters in `explained/` | No | `explained/index.md` + `chapter-NN-*.md`; book-level `index.md` missing |
| `glossary/` | Shared glossary | `Glossary.md` | No | Standalone reference |

### Per-module layout pattern

Most modules follow:

```
content/<module>/
├── 00 - Overview and Reading Order.md   (or index.md when integrated)
├── Chapter N - Title.md                 (generated teaching content)
└── sources/                             (input articles/papers — NOT on site)
```

`architecture-and-system-design/` uses the **site-ready** pattern:

```
content/architecture-and-system-design/
├── index.md                 # Book title (# H1) + description (> blockquote)
└── chapter-NN-slug.md       # Only files matching chapter-\d+*.md are loaded
```

`building coding agents and harnesses/` adds:

```
content/building coding agents and harnesses/
├── explained/
│   ├── index.md
│   ├── chapter-01-what-is-a-harness.md … chapter-17-…
│   └── glossary/index.md
└── sources/                 (harness research inputs)
```

---

## How `content.ts` discovers books

A folder under `content/` becomes a **book** only if:

1. It has `index.md` at the book root (first `#` = title, first `>` blockquote = description).
2. It contains chapter files matching `chapter-\d+*.md`.

Everything else on disk (overview files, `Chapter N - …` names, `sources/`, nested `explained/`) is **ignored** by the parser until renamed and indexed.

Slide URL shape: `/read/{bookSlug}/{chapterSlug}/{sectionIndex}`

---

## Architecture lanes (from AGENTS.md)

| Lane | Owns | Do not touch (other lane) |
|------|------|---------------------------|
| Frontend | `src/app` (except api), `src/components`, reader UX | `src/lib/content.ts`, API routes |
| Backend | `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`, `.env.example` | Reader UI, `content.ts` |

Import content from `src/lib/content.ts`; never re-parse markdown elsewhere.

---

## Commands

```bash
npm run dev      # localhost:3000
npm run build    # production build + type/static validation
npm run lint     # eslint
```

---

## Interactive work (current focus)

When adding MCQs or coding challenges:

- Decide whether they live **inside chapter markdown** (new slide sections) or as **separate components** wired into the reader.
- Respect content rules (no em dashes, practitioner tone).
- Target modules that will ship next, or prototype in `architecture-and-system-design/` first since it is live.

For project goals without this folder detail, use the lighter **`context`** skill.
