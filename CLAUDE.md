# Agent YAP — AI Assistant Guide

> **This file is the entry point: a stable map + router, not content.** It points
> at where truth lives and routes every request to the right process. Keep it
> stable; it is read every session. Detailed rules live in the files it links to.

@AGENTS.md

`AGENTS.md` (imported above) is the **single source of truth** for agent rules:
the stack caveat, frontend design workflow, and the frontend/backend lanes. This
map adds navigation and the change-tier router on top of it — it does **not**
restate AGENTS.md's rules. Edit rules in `AGENTS.md`; edit navigation here.

## Quick Navigation

| Need | Location |
|---|---|
| **Feature status (source of truth)** | `FEATURE-STATUS.md` |
| Why a long-lived branch still exists | `docs/branches.md` |
| Growth: GTM research + master plan | `docs/growth/` |
| Agent rules, lanes, frontend workflow | `AGENTS.md` |
| Constitution (rules C1–C10) | `specs/CONSTITUTION.md` |
| Workflow / pipeline / rigor dial | `specs/WORKFLOW.md` |
| Ship gate (G1–G7) | `specs/COMPLIANCE.md` |
| Feature-spec template | `specs/TEMPLATE.md` |
| ADRs (decisions) | `specs/decisions/` |
| Invariant registry (P-IDs) | `specs/properties/invariants.md` |
| Spec index | `specs/INDEX.md` |
| Architecture / how the system fits (explanation) | `OVERVIEW.md` |
| Search + Ask API contract | `docs/api-contract.md` |
| Product direction / roadmap | `plan.md` |
| Human-facing overview | `README.md` |
| Project-context skills | `.claude/skills/context/`, `.claude/skills/context-and-map/` |

> **Arriving in later retrofit phases** (do not link to these until they exist):
> `knowledge/` (module/flow graph) — Phase 4 · `docs/pm/` (CRs, PRDs) — Phase 5.

## Feature → Module Lookup

| Feature area | Code location | Lane |
|---|---|---|
| Content parsing (books → chapters → slides) | `src/lib/content.ts` | shared source of truth |
| Slide reader UI + navigation | `src/app/read/**`, `src/components/reader/**` | frontend (Claude) |
| Landing page | `src/app/page.tsx`, `src/components/Home.tsx` | frontend (Claude) |
| Markdown rendering | `src/components/Markdown.tsx` | frontend (Claude) |
| Search / Ask panels | `src/components/SearchPanel.tsx`, `src/components/AskPanel.tsx` | frontend (Claude) |
| Full-text search | `src/lib/search.ts`, `src/app/api/search/route.ts` | backend (Codex) |
| Ask the docs (RAG) | `src/lib/ask.ts`, `src/app/api/ask/route.ts` | backend (Codex) |

## Commands

```bash
npm run dev      # dev server → http://localhost:3005
npm run build    # production build — ALSO type-checks + prerenders all slides (the real gate)
npm run start    # serve the production build → http://localhost:3005
npm run lint     # eslint
```

> **No test runner is installed.** The deterministic trust gate for this repo is
> `npm run build` (type-check + static generation of every slide) plus `npm run
> lint`. Steps in the Tier-4 pipeline that assume a test framework (`/red`,
> `/prove`, the test sub-step of `/check`) run in **LITE / N-A** mode until a
> runner is added. Do not fabricate test evidence.

## Project Structure

```
content/<book>/          Markdown knowledge base (index.md + chapter-NN-*.md)
src/lib/content.ts       Parses markdown → books → chapters → slides (source of truth)
src/lib/{search,ask}.ts  Backend: BM25 search, RAG glue → Anthropic Claude
src/app/                 Routes: landing, /read/[book]/[chapter]/[slide], /api/*
src/components/          Reader chrome, search/ask panels, markdown renderer
docs/api-contract.md     Search + Ask API contract (backend must follow)
```

Full annotated tree and diagrams: `OVERVIEW.md`.

## Change Tiers & Routing

Route by trigger words/facts, not judgment:

```
"fix lint" / "bump dep" / "update docs"   → Tier 0 Chore   → build + lint → commit
"fix this bug" / error trace              → Tier 1 Fix     → failing regression* → fix → build
"production" / "urgent" / "customers hit" → Tier 2 Hotfix  → fix + build + mandatory learning note
"refactor" / "clean up" / "rename"        → Tier 3 Refactor→ build green before AND after, zero behavior change
"add" / "implement" / "new" / behavior chg→ Tier 4 Feature → full pipeline below
```

\* Regression evidence is a failing reproduction until a test runner exists; see the Commands note.

### Tier-4 pipeline (spec-driven)

```
/define → /spec → /plan → /red → /implement → /prove → /challenge → /check → /ship → /knowledge-sync
   H        A       A       A        A            A         A          T         A+H         A
```

Producer legend: **H** human (accountable) · **A** agent (output is PROVISIONAL) ·
**T** deterministic tool (trust attaches only here). **Pipeline skills are installed
in Phase 6** — until then, follow the steps as a documented manual process.

### Tier-4 spec gate

1. Check `specs/features/` for an existing spec. 2. Exists → `/plan` against it.
3. Missing → enter at `/define`. (`specs/` lands in Phase 2.)

### Ship gate (enforced from Phase 3)

Every PR: a signed entry in `specs/features/<area>/<slug>/compliance.md`, **OR** the
last commit message contains `GATE bypass: <reason>`. Never fabricate signatures.

### Issue convention (applies now)

PRs reference issues as `Updates #N — work-complete | partial | blocked`. **Never
`Closes #N`** (auto-close is banned by convention; a human closes after verification).
A `FEATURE-STATUS.md` row flips to ✅ **Done only after a code audit**, never on issue close.

## Multi-Agent Coordination

Lanes are defined in `AGENTS.md`; the coordination rules:

- **Exclusive access** (one agent at a time, coordinate before editing):
  `src/lib/content.ts` (shared source of truth) and `docs/api-contract.md` (the contract).
- **Parallel-safe** once the contract is frozen: frontend (`src/app` except `api`,
  `src/components`) and backend (`src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`,
  `.env.example`) may proceed independently.

## Claude Code specifics

- Skills in `AGENTS.md` are under `~/.claude/skills/` (global) or
  `.claude/skills/` (project). If a named skill is missing, say so — do not
  pretend you read it.
- Prefer `find-docs` for Context7 CLI lookups when the Context7 MCP is not
  available; same docs source as Context7 MCP.
- MCP servers (shadcn, Context7, Chrome DevTools, Playwright, Figma) should be
  configured in this project's MCP settings. If a call fails or a server is
  disconnected, report that at the end.
- The checklist in `AGENTS.md` is mandatory for every component/page task.
  Trigger is the type of work, not special phrasing from the user.
- Skip the frontend workflow only when the prompt explicitly says to.
- Git: commit each logical unit as you go (feat/fix/refactor/docs/chore/test prefix). Don't push unless asked.
