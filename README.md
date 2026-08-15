# Agent YAP

> **Full project analysis:** see [OVERVIEW.md](OVERVIEW.md) for architecture, code structure, product evaluation, Mermaid diagrams, and a detailed explanation of the markdown → slides pipeline.

A public, slide-by-slide field guide to **architecting and designing AI agents**.
It turns a markdown knowledge base into a reader you page through left/right —
each chapter split into bite-size, one-page slides — plus on-site search and an
AI "Ask the docs" assistant grounded in the content.

> The guiding belief of the source material: *the model is the easy part.*
> Everything around it — context, tools, reliability, security — is the system
> design. This site makes that material easy to read and search.

## Features

- **Slide reader.** Every chapter is parsed into an intro slide + one slide per
  `##` section. Navigate with the on-screen arrows, **← / →** keys, swipe, or the
  contents drawer. A progress rail and per-chapter accent colors keep you oriented.
- **Full-text search** (`/api/search`) — BM25-style ranking over every section,
  with snippets. Press **/** anywhere in the reader.
- **Ask the docs** (`/api/ask`) — retrieval-augmented answers grounded only in
  the knowledge base, with citations back to the exact sections. Powered by
  Anthropic Claude.
- Static-generated reader (181 slides prerendered) with dynamic API routes.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** with a custom bold/playful design system
- **framer-motion** for slide transitions
- **react-markdown** + **remark-gfm** + **rehype-highlight** for content
- **@anthropic-ai/sdk** for the Ask assistant

## Getting started

```bash
npm install
npm run dev      # http://localhost:3005
```

Build / run production:

```bash
npm run build
npm start        # http://localhost:3005
```

### Environment

The reader and search work with no configuration. To enable **Ask the docs**,
copy `.env.example` to `.env.local` and add an Anthropic API key:

```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6   # optional override
```

Without a key, `/api/ask` still responds — it returns the most relevant sections
as citations and a note that the assistant isn't configured.

## Project structure

```
content/<book>/            Markdown knowledge base (chapters + index.md)
src/lib/content.ts         Parses markdown → books → chapters → slides (source of truth)
src/lib/search.ts          BM25 lexical search over slides
src/lib/ask.ts             RAG glue → Anthropic Claude
src/app/                   Routes: landing, /read/[book]/[chapter]/[slide], /api/*
src/components/             Reader chrome, search/ask panels, markdown renderer
docs/api-contract.md       The search + ask API contract
```

## Adding content

Drop a new folder under `content/` containing an `index.md` (its first `#` is the
title, its first `>` blockquote is the description) and `chapter-NN-*.md` files.
Each chapter's `##` sections become slides automatically.

## Agent instructions

[`AGENTS.md`](AGENTS.md) is the **single source of truth** for coding-agent
rules (stack, lanes, commands). Cursor and Codex read it directly.

Claude Code reads [`CLAUDE.md`](CLAUDE.md), which only contains `@AGENTS.md` —
an import that expands at load time. Edit `AGENTS.md`; do not duplicate rules in
`CLAUDE.md`.

## Notes

The backend API layer (search + RAG) was implemented by OpenAI Codex against
[`docs/api-contract.md`](docs/api-contract.md); the rest of the project —
content pipeline, reader, and UI — was built alongside it.
