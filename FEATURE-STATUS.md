# Feature Status

> Single source of truth for product-level implementation status.
> Seeded by a code audit on 2026-07-18 (Phase 1 of the AI-native retrofit).

## Instructions for AI Agents

- Read before starting feature work; update rows as you go.
- ✅ **Done** requires ALL layers implemented and building — verified by a **code
  audit**, never by issue close.
- 🔄 In Progress on start · 〰️ Partial (say what's missing) · ⬜ Pending.
- 〰️ **Pre-existing** is a valid, honest state for work that predates this board.
- Fix any stale row you discover during other work.
- GitHub Issues hold work items; this file holds status. See `plan.md` for product direction.

## Summary

| Section | ✅ | 🔄 | 〰️ | ⬜ |
|---|---|---|---|---|
| Reader & Navigation | 11 | 0 | 0 | 0 |
| Search & Ask (backend) | 4 | 0 | 0 | 0 |
| Content & Modules | 1 | 0 | 6 | 1 |
| Interactivity & Progress | 1 | 0 | 0 | 5 |
| Modes (future) | 0 | 0 | 0 | 3 |
| Discovery & Growth | 0 | 0 | 1 | 3 |

## Reader & Navigation

| # | Feature | Status | Code location | Spec |
|---|---|---|---|---|
| 1 | Slide reader (SSG; intro + one slide per `##`) | ✅ | `src/app/read/[book]/[chapter]/[slide]/page.tsx`, `src/lib/content.ts` | — |
| 2 | Keyboard / arrow / swipe navigation | ✅ | `src/components/reader/ReaderChrome.tsx`, `nav-direction.ts` | — |
| 3 | IDE-shell contents rail (docked chapter/slide tree; mobile overlay) | ✅ | `src/components/reader/Rail.tsx`, `ReaderChrome.tsx` | `specs/features/reader/ide-shell/spec.md` |
| 4 | Chapter title display helper (strips embedded "Chapter N:" prefix) | ✅ | `src/lib/display.ts` (`chapterDisplayTitle`) | — |
| 5 | Slide transitions | ✅ | `src/app/read/[book]/[chapter]/[slide]/template.tsx` | — |
| 6 | Dark theme + theme toggle | ✅ | `src/components/ThemeToggle.tsx`, `src/app/globals.css` | — |
| 7 | Landing page | ✅ | `src/app/page.tsx`, `src/components/Home.tsx` | — |
| 8 | Book TOC + not-found handling | ✅ | `src/app/read/[book]/page.tsx`, `src/app/not-found.tsx` | — |
| 28 | Ambient shader layer + glass reading card (theme-aware, reduced-motion + WebGL fallback) | ✅ | `src/components/reader/AmbientBackdrop.tsx`, `src/app/globals.css` | `specs/features/reader/ide-shell/spec.md` |
| 29 | BYOK Gemini chat panel grounded in current slide (`/api/ask` fallback, key never leaves browser) | ✅ | `src/components/reader/ChatPanel.tsx`, `src/lib/chat/gemini.ts`, `slide-context.ts` | `specs/features/reader/ide-shell/spec.md` |
| 30 | Per-chapter public-domain artwork in the rail (The Met, CC0; build-time fetch script) | ✅ | `scripts/fetch-art.mjs`, `src/lib/art.ts`, `public/art/` | `specs/features/reader/ide-shell/spec.md` |

## Search & Ask (backend — Codex lane)

| # | Feature | Status | Code location | Spec |
|---|---|---|---|---|
| 9 | Full-text search endpoint (BM25) | ✅ | `src/lib/search.ts`, `src/app/api/search/route.ts` | `docs/api-contract.md` |
| 10 | Search panel (`/` shortcut) | ✅ | `src/components/SearchPanel.tsx` | `docs/api-contract.md` |
| 11 | Ask the docs (RAG) endpoint + no-key fallback | ✅ | `src/lib/ask.ts`, `src/app/api/ask/route.ts` | `docs/api-contract.md` |
| 12 | Ask panel UI (grounded answers + citations) | ✅ | `src/components/AskPanel.tsx` | `docs/api-contract.md` |

## Content & Modules

Discovery rule: a folder is a live book only with an `index.md` **and** `chapter-NN-*.md` files (see `src/lib/content.ts`).

| # | Module | Status | Notes |
|---|---|---|---|
| 13 | Architecture & System Design (18 ch) | ✅ | Live. `content/architecture-and-system-design/` — site-ready `index.md` + `chapter-NN`. |
| 14 | RAG (4 ch) | 〰️ | Content authored; not integrated. Needs `index.md` + `chapter-NN` rename. |
| 15 | Context Engineering (4 ch) | 〰️ | Content authored; not integrated (same as above). |
| 16 | Agentic Memory (5 ch) | 〰️ | Content authored; not integrated. |
| 17 | Multi-Agent (5 ch) | 〰️ | Content authored; not integrated. |
| 18 | Building Coding Agents & Harnesses (17 ch in `explained/`) | 〰️ | Chapters + `explained/index.md` exist; missing book-root `index.md`. |
| 19 | Glossary | ⬜ | Standalone `Glossary.md`; not wired as a book/reference view. |
| 28 | Research Papers (~20 explainers, 5 categories) | 〰️ | Row added 2026-07-18 (was missing from this board). Deeply nested `explanations/` folders; needs curation into book(s) + attribution decision. See CR-2026-011. |

## Interactivity & Progress (planned — see `plan.md`)

| # | Feature | Status | Notes |
|---|---|---|---|
| 20 | Quiz / MCQ slide block (fenced ```quiz convention) | ⬜ | plan.md Phase 1. `Markdown.tsx` renders plain markdown only today. |
| 21 | Recap slide per chapter | ⬜ | plan.md Phase 1. |
| 22 | Callout / typography / rhythm pass | ⬜ | plan.md Phase 1. |
| 23 | LocalStorage progress + completion rings | ✅ | Built + code-audited 2026-07-19 (`src/lib/progress.ts`, rail checkmarks/rings, resume pill, landing "Continue reading"). Spec: `specs/features/reader/ide-shell/spec.md`. |
| 24 | Interactive widget (1 per book) | ⬜ | plan.md Phase 3. |
| 29 | Daily challenge (one quiz question/day, localStorage) | ⬜ | CR-2026-013; depends on #20. Tension with plan.md non-goals recorded in the CR; triage decides. |

## Modes (future — see `plan.md`)

| # | Feature | Status | Notes |
|---|---|---|---|
| 25 | Roadmap mode + placement quiz | ⬜ | Deterministic prerequisite graph; localStorage only. |
| 26 | Explore mode (concept cards) | ⬜ | Requires frontmatter tags on chapters. |
| 27 | Podcast mode (build-time TTS) | ⬜ | Ranked last. |

## Discovery & Growth (see `docs/growth/`)

| # | Feature | Status | Notes |
|---|---|---|---|
| 30 | SEO + AI-discovery foundation (sitemap, robots, metadataBase, llms.txt) | 〰️ | Implemented + verified on branch `claude/growth-quick-wins-gx0t42`; flips to ✅ after merge + code audit. CR-2026-009. |
| 31 | Privacy-friendly analytics (cookieless) | ⬜ | CR-2026-010. Prerequisite for measuring everything else here. |
| 32 | Slide shareability (share button + OG images) | ⬜ | CR-2026-012. Per-slide OG touches the SSG route (RIGOR). |
| 33 | Updates feed (RSS/Atom + /changelog) | ⬜ | CR-2026-014. |
