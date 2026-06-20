<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent YAP

A public website that serves a markdown knowledge base ("Architecture and
System Design for AI Agents") as a **slide reader**: each chapter is split into
one-page sections the reader pages through left/right.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
- **Content:** `content/<book>/` markdown. Parsed by `src/lib/content.ts` into
  books → chapters → slides. That module is the single source of truth — import
  from it, don't re-parse markdown.
- **Frontend (Claude-owned):** the slide reader, landing page, and search/ask
  UI under `src/app` and `src/components`.
- **Backend (Codex-owned):** two route handlers — full-text **search** and an
  AI **"Ask the docs"** RAG endpoint. The exact contract is in
  **`docs/api-contract.md`** — follow it precisely.

## Lanes (avoid collisions)

- Backend work lives in `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`,
  and `.env.example`. Do not modify `src/lib/content.ts` or the reader UI.
- Dependencies are already installed (incl. `@anthropic-ai/sdk`).

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also validates types/static params)
- `npm run lint` — eslint
