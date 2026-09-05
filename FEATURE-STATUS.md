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
| Reader & Navigation | 24 | 0 | 0 | 0 |
| Search & Ask (backend) | 4 | 0 | 0 | 0 |
| Content & Modules | 10 | 0 | 1 | 0 |
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
| 35 | Subject shelf (featured row + tracks, Resume/Start cards) | ✅ | `src/components/SubjectShelf.tsx`, `src/components/SubjectMark.tsx`, `src/lib/shelf.ts` | — |
| 36 | Library index at `/read` (was a redirect to the only book) | ✅ | `src/app/read/page.tsx`, `src/components/Library.tsx` | — |
| 37 | Subject switcher in the reader rail (per-book resume targets) | ✅ | `src/components/reader/Rail.tsx` | — |
| 38 | Single-page reference route with heading anchors | ✅ | `src/app/reference/[slug]/page.tsx`, `src/components/rehype-heading-ids.ts` | — |
| 39 | Global `:focus-visible` ring + `.field-ring` composed fields | ✅ | `src/app/globals.css`, `SearchPanel.tsx`, `AskPanel.tsx`, `ChatPanel.tsx` | SOL-10 |
| 40 | Modal focus trap + focus return to trigger | ✅ | `src/components/Modal.tsx` | SOL-10 |
| 41 | Placeholder contrast ≥ 4.5:1 (global `::placeholder` rule) | ✅ | `src/app/globals.css` | SOL-11 |
| 42 | Chapter art keyed by book (no cross-book collision) | ✅ | `src/lib/art.ts`, `src/lib/art-manifest.json`, `scripts/fetch-art.mjs` | SOL-29 |
| 46 | Contents rail `inert` while off-screen (viewport-aware) | ✅ | `src/components/reader/ReaderChrome.tsx` | SOL-41 |
| 47 | `## Review` → typed `questions[]` (480 items, 0 unparsed) | ✅ | `src/lib/questions.ts`, `src/lib/content.ts` | SOL-17 |
| 48 | `###` sub-splitting above 700 words | ✅ | `src/lib/content.ts` | SOL-18 |
| 49 | Build-time content validation (fatal vs warn) | ✅ | `src/lib/content-validate.ts` | SOL-19 |
| 50 | Frontmatter audit script (idempotent, dry-run first) | ✅ | `scripts/backfill-frontmatter.mjs` | SOL-27 |
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

Discovery rule: a folder is a live **book** with an `index.md` **and**
`chapter-NN-*.md` files, and a live **reference** with an `index.md` whose
frontmatter names a `body` file (see `src/lib/content.ts`). Everything else in
the folder (`sources/`, a nested `glossary/`) is never parsed.

| # | Module | Status | Notes |
|---|---|---|---|
| 13 | Architecture & System Design (18 ch, 191 slides) | ✅ | Live. Stale `old docs/` deleted (SOL-20). 199 → 191 under parser v2: Review became data, one long section sub-split. |
| 14 | Agentic RAG (4 ch, 31 slides) | ✅ | Live at `/read/rag`. Wired 2026-09-01. |
| 15 | Context Engineering (4 ch, 29 slides) | ✅ | Live at `/read/context-engineering`. Wired 2026-09-01. |
| 16 | Agentic Memory (5 ch, 40 slides) | ✅ | Live at `/read/agentic-memory`. Only book using `*` option bullets; thin question set (25 vs 40-180). See SOL-46. |
| 17 | Multi-Agent Systems (5 ch, 41 slides) | ✅ | Live at `/read/multi-agent`. Wired 2026-09-01. |
| 18 | Building Coding Agents & Harnesses (17 ch, 142 slides) | ✅ | Live; `explained/` flattened into the book root. +36 slides from parser v2 sub-splitting its long concept sections. |
| 19 | Glossary | ✅ | Live at `/reference/glossary` as a single-page reference (49 entries). All 47 distinct anchors linked from the corpus resolve to a real heading id. |
| 28 | Research Papers | 〰️ | 3 of 5 categories wired as books (rows 43-45). `03-Applications` and `05-Other-Non-LLM` hold 9 papers with **no explainers written**, so there is nothing to promote. Authoring work, not wiring. |
| 43 | Foundational Modelling (8 ch, 74 slides) | ✅ | Live at `/read/foundational-modelling`. Paper list curated by Henry Shi, credited on the index; explainer prose is ours. SOL-42. |
| 44 | Planning and Reasoning (7 ch, 53 slides) | ✅ | Live at `/read/planning-and-reasoning`. Same attribution. SOL-43. |
| 45 | Benchmarks (5 ch, 39 slides) | ✅ | Live at `/read/benchmarks`. Same attribution. SOL-44. |

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
