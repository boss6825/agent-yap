# Feature-status — read-only status report (Maintenance)
**Arguments:** $ARGUMENTS  <!-- optional: section or slug to scope -->

## When to use
To get a quick, read-only snapshot of product-level implementation status from
`FEATURE-STATUS.md` and in-flight pipeline state from `specs/PROGRESS.md`. Pure
reporting.

## When NOT to use
- Reconciling/updating status against code + issues → `/sprint-sync`.
- Feature direction / roadmap → `specs/roadmap/`.

## Preamble
Read-only: `FEATURE-STATUS.md`, `specs/PROGRESS.md`, `specs/INDEX.md`. Never edit
in this skill.

## Phase 1: Report
> **Normative:** Summarize the requested scope: the status legend counts
> (✅/🔄/〰️/⬜), the rows and their code locations/specs, and any in-flight pipeline
> stages from `specs/PROGRESS.md`.
> **Advisory:** Note obviously stale-looking rows as **candidates** for `/sprint-sync`
> — do not fix them here.
Gate: report emitted; no files changed.

## Phase 2: Route
> **Normative:** If reconciliation is needed, route to `/sprint-sync` (dry-run).
Gate: routed if needed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "I'll fix that stale row while reporting" | Read-only. Flag it; `/sprint-sync` fixes it with an audit. |
| "Report Done from the issue tracker" | Report what `FEATURE-STATUS.md` says; Done is audit-gated (C9). |

## Red Flags
- Editing any status file from this skill.
- Asserting Done beyond what the board records.

## Exit Criteria
- [ ] Scoped status report from FEATURE-STATUS.md + PROGRESS.md
- [ ] Stale candidates flagged (not fixed)
- [ ] Nothing written
