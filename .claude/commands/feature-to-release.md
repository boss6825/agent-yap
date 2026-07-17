# Feature-to-release — runbook + release notes from a spec (PM loop)
**Arguments:** $ARGUMENTS  <!-- the feature slug -->

## When to use
To generate a runbook and release notes from a spec — **only for a
`FEATURE-STATUS.md` row that is ✅ Done via a code audit** (C9).

## When NOT to use
- Row not audited-Done → run the pipeline / `/sprint-sync` first. Do not document
  vapor.
- In-PR runbook during shipping → `/ship` (Phase 3) already drafts it.
- GTM / marketing brief → deferred (no GTM plane; see `/feature-to-brief` tombstone).

## Preamble
Read: the feature `spec.md`, `FEATURE-STATUS.md` (the row), `compliance.md`,
`.claude/rules/docs.md`. (Runbook sections are defined in Phase 2 below.)

## Phase 1: Done-gate
> **Normative:** Confirm the row is ✅ Done AND that a code audit backs it (C9). If
> the status rests on an issue close or a green build alone, STOP — it isn't Done.
Gate: audited ✅ Done confirmed.

## Phase 2: Generate the runbook
> **Normative:** Write/refresh `docs/devops/runbooks/<slug>.md`: What shipped &
> when · Config / env vars · Rollback procedure · Health checks · Known risks &
> what to monitor. GENERATED — regenerate and commit the diff, never hand-edit.
Gate: runbook covers all five sections, sourced from the spec + compliance entry.

## Phase 3: Release notes
> **Normative:** Draft release notes in practitioner voice (no em dashes on any
> on-site content, C5) scoped to what actually shipped per the spec's acceptance
> criteria. Cite the compliance entry / PR.
Gate: notes match audited scope; no unshipped claims.

## Phase 4: Close out
> **Normative:** Do not push/publish/deploy (C9). Draft only; hand to the human.
Gate: staged, handed off.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "Row's Done, skip the audit check" | Done must be audit-backed (C9). Verify before documenting a release. |
| "Hand-edit the runbook, faster" | Runbook is generated. Regenerate; hand-edits drift from the spec. |
| "Add the roadmap items to release notes" | Notes cover only what shipped per acceptance criteria. No forward-promising. |
| "Publish the notes" | Publishing/deploy is a human act (C9). Draft and stop. |

## Red Flags
- Documenting a release for a non-audited row.
- Hand-editing a generated runbook.
- Release notes claiming behavior not in the spec's acceptance criteria.

## Exit Criteria
- [ ] Row confirmed ✅ Done via code audit (C9)
- [ ] Runbook generated (all five sections) from spec + compliance
- [ ] Release notes match audited scope, C5 voice
- [ ] Nothing published/deployed; drafted for human
