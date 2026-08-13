# Constitution

> Non-negotiable principles for Agent YAP. These override conventions and
> preferences. Breaking changes to this file require an ADR.
>
> **These rules were EXTRACTED from what the codebase already does** (AGENTS.md,
> README.md, `src/lib/content.ts`, `docs/api-contract.md`) during the Phase-2
> retrofit — they are not new impositions. Each is enforceable and links to its
> governing ADR and/or the enforcement layer.
>
> The canonical rule IDs (**C1..C10**) are defined here and cited by ID from the
> workflow skills' `/check` — other skills say "C3", never restate the rule.

## Metadata
- status: active
- owner: @boss6825
- last-verified: 2026-07-18

## C1. Spec-First (spec-on-touch)
> No Tier-4 feature begins without a spec. The spec is the source of truth; if
> code disagrees with the spec, the code is wrong — fix the code or formally
> change the spec.
- Existing code needs a spec only when next modified (no big-bang backfill).
- If you are hand-editing generated output instead of its source, the workflow
  has failed — fix the input and regenerate.
- Governed by: [ADR-001](decisions/ADR-001-markdown-first-content-pipeline.md), [WORKFLOW.md](WORKFLOW.md)

## C2. Lane Discipline
> Frontend (Claude) and Backend (Codex) own disjoint file sets. Do not edit
> across the lane boundary without coordination.
- Frontend owns `src/app` (except `api`), `src/components`, reader UX.
- Backend owns `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`, `.env.example`.
- Neither lane edits the other's files; `src/lib/content.ts` and
  `docs/api-contract.md` are exclusive-access (coordinate first).
- Governed by: [ADR-002](decisions/ADR-002-frontend-backend-lanes.md); source: `AGENTS.md`

## C3. One Source of Truth for Content
> All book/chapter/slide data comes from `src/lib/content.ts`. Import from it;
> never re-parse markdown anywhere else.
- The content parser is the only code that touches the `content/` filesystem layout.
- A folder becomes a book only with an `index.md` **and** `chapter-NN-*.md` files.
- Governed by: [ADR-001](decisions/ADR-001-markdown-first-content-pipeline.md), [ADR-003](decisions/ADR-003-slide-reader-model.md); source: `AGENTS.md`

## C4. The API Contract Is Binding
> The search and Ask endpoints implement `docs/api-contract.md` precisely. The
> contract is frozen shared territory; changing it is a coordinated, spec-gated act.
- Backend follows the contract; frontend consumes only what the contract promises.
- A contract change is RIGOR (crosses the lane boundary) — see WORKFLOW danger list.
- Governed by: [ADR-002](decisions/ADR-002-frontend-backend-lanes.md); source: `AGENTS.md`, `README.md`

## C5. Content Rules (voice)
> Generated teaching content contains **no em dashes** and stays
> practitioner-focused — explain mechanisms, not marketing summaries.
- Applies to everything under `content/` that renders on the site.
- Governed by: `specs/conventions/content.md`; source: `.claude/skills/context`

## C6. Frontend Design Workflow Is Mandatory
> New/restyled UI, animation/scroll work, or any edit under `components/`,
> `app/`, `pages/`, `ui/` runs the AGENTS.md workflow: **Skills → MCP → Skills**.
- The trigger is the type of work, not special phrasing from the user.
- Skip only when the prompt explicitly says to skip the frontend flow.
- Governed by: `AGENTS.md` (the full checklist and MCP/skills tables live there)

## C7. Stack-Current, Not Memory-Current
> This is Next.js 16 / React 19 / Tailwind v4 — treat training data as stale.
> Verify APIs against `node_modules/next/dist/docs/` or via `find-docs`/Context7
> before writing framework code.
- Heed deprecation notices; do not assume conventions from older versions.
- Governed by: [ADR-004](decisions/ADR-004-nextjs-16-app-router.md); source: `AGENTS.md`

## C8. Blast-Radius Discipline
> Every feature spec declares what it May Modify, Must Not Modify, and Must Not
> Break. A change that touches load-bearing code outside its blast radius is a
> bug even if the build passes.
- Enforced per-slice during `/implement`: `git diff --name-only` ⊆ May-Modify.
- Governed by: [WORKFLOW.md](WORKFLOW.md), `specs/features/_templates/`

## C9. Humans Hold the Trigger
> Agents draft, stage, and prepare — but never push, merge, publish, close
> issues, or deploy without explicit human go-ahead.
- PRs use `Updates #N — work-complete | partial | blocked`; **never `Closes #N`**.
- A `FEATURE-STATUS.md` row flips to ✅ Done only after a **code audit**.
- Governed by: [COMPLIANCE.md](COMPLIANCE.md), the pre-push compliance gate

## C10. Properties Are Testable (build-verified here)
> Every feature spec carries ≥2 verifiable invariants with stable IDs
> (`P-<MODULE>-NNN`), registered in `specs/properties/invariants.md`.
- This repo has **no test runner**; the deterministic trust gate is
  `npm run build` (type-check + static prerender of all slides) + `npm run lint`.
  Invariants are verified by type/build/manual reproduction until a runner exists.
- Governed by: [ADR-005](decisions/ADR-005-build-lint-as-trust-gate.md), [WORKFLOW.md](WORKFLOW.md)

## Quick Reference

| Principle | ADR | Enforcement |
|---|---|---|
| C1 Spec-First | ADR-001 | WORKFLOW spec gate |
| C2 Lane Discipline | ADR-002 | CLAUDE.md coordination + review |
| C3 Content SoT | ADR-001, ADR-003 | code review; content.ts import rule |
| C4 API Contract | ADR-002 | contract-change = RIGOR |
| C5 Content Rules | — (convention) | `specs/conventions/content.md` |
| C6 Frontend Workflow | — (AGENTS.md) | AGENTS.md checklist |
| C7 Stack-Current | ADR-004 | find-docs / Context7 |
| C8 Blast Radius | — (WORKFLOW) | per-slice diff check |
| C9 Human Trigger | — (COMPLIANCE) | pre-push gate, issue convention |
| C10 Testable Properties | ADR-005 | build + lint gate |
