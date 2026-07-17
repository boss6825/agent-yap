# Implement — build the slices (Tier 4)
**Arguments:** $ARGUMENTS

## When to use
After `/red`, to write production code slice by slice, consuming `plan.md` as a
**read-only contract**.

## When NOT to use
- `plan.md` is missing → **STOP.** Do not regenerate it; route to `/plan` (C1: fix
  the input, don't improvise). `/implement` never authors a plan.
- Bug fix → `/fix`. Rename/no-behavior-change → `/refactor`.

## Preamble
Read: `plan.md` (READ-ONLY), the feature `spec.md`, `AGENTS.md` (lanes + the
mandatory **frontend design workflow**, C6), `specs/CONSTITUTION.md`, relevant
`specs/learnings/`. This is Next.js 16 / React 19 / Tailwind v4 — verify APIs
against `node_modules/next/dist/docs/` or `find-docs` before writing framework
code (C7).

## Phase 1: Plan gate
> **Normative:** Confirm `specs/features/<area>/<slug>/plan.md` exists and read it.
> If absent, STOP and route to `/plan`. Treat `plan.md` as read-only — never edit
> or regenerate it here.
Gate: `plan.md` present and read.

## Phase 2: Per-slice TDD-style loop
> **Normative:** For each slice in order: write the code, then verify the slice's
> checks (`npm run build` + `npm run lint`; the P-ID's type/manual check from `/red`).
> Respect the lane (C2): frontend owns `src/app` (except `api`) + `src/components`;
> do not edit backend files (`src/app/api/**`, `src/lib/{search,ask}.ts`) or the
> exclusive-access `src/lib/content.ts` / `docs/api-contract.md` without coordination.
> **Normative (C6):** UI/component/page work runs the AGENTS.md Skills → MCP →
> Skills design workflow. The trigger is the type of work, not the user's phrasing.
Gate: each slice builds + lints green before starting the next.

## Phase 3: Per-slice blast-radius check (C8)
> **Normative:** After each slice, `git diff --name-only` MUST be ⊆ the slice's
> May-Modify list. Files outside it — even if the build passes — are a bug: revert
> or amend the spec's blast radius via the diagnostic loop.
Gate: diff ⊆ May-Modify for every slice.

## Phase 4: Handoff
> **Normative:** Do not commit/push (C9). Update `specs/PROGRESS.md` stage.
Gate: all slices done + green. Route → `/prove`.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "plan.md is missing, I'll just plan as I go" | STOP. `/implement` reads plan.md read-only; a missing plan means run `/plan` (C1). |
| "I touched one extra file, build's green" | Green build ≠ in-scope. Diff ⊆ May-Modify or it's a C8 violation. |
| "It's just a small component, skip the design workflow" | C6 triggers on work type, not size. Run Skills → MCP → Skills. |
| "I know the Next.js API" | Next.js 16 has breaking changes (C7). Verify in node_modules docs / find-docs. |
| "I'll edit content.ts to make it fit" | Exclusive-access + danger list (C3). Coordinate; don't cross the lane. |

## Red Flags
- Editing or regenerating `plan.md`.
- A diff crossing the frontend/backend lane boundary.
- UI written from training memory with no MCP/skill pass.

## Exit Criteria
- [ ] `plan.md` was read read-only (never regenerated)
- [ ] Every slice builds + lints green
- [ ] Per-slice `git diff --name-only` ⊆ May-Modify (C8)
- [ ] Lane discipline held (C2); design workflow run for UI (C6)
- [ ] Nothing committed; routed to `/prove`
