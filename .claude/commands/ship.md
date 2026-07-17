# Ship — compliance entry + PR draft, then STOP (Tier 4, A+H)
**Arguments:** $ARGUMENTS

## When to use
After a green `/check`, to append the `compliance.md` entry, flip spec status,
generate the in-PR runbook, and **draft** the PR body. Then STOP for the human to
push/merge (C9). This skill never pushes, merges, closes issues, or deploys.

## When NOT to use
- `/check` not green → fix first, re-run `/check`.
- Release notes / runbook for an already-Done feature → `/feature-to-release`.
- GTM/marketing brief → deferred (no GTM plane; see `/feature-to-brief` tombstone).

## Preamble
Read: the feature `spec.md`, `plan.md`, `review.md`, `/challenge` findings,
`specs/COMPLIANCE.md` (G1–G7 + solo G3), `specs/features/_templates/compliance.md`,
`.claude/commands/feature-to-release.md` (runbook shape).

## Phase 1: Compliance entry (append-only)
> **Normative:** Append one block to `specs/features/<area>/<slug>/compliance.md`
> (newest first) using the template. Fill G1–G7 with real sign-offs:
> - **G3** solo: `adversarial-agent + self` with the next-day cooling sign.
> - **G5** = `npm run build` + `npm run lint` green (substitutes CI tests; ADR-005, C10).
> - **G7** = learning/knowledge path or n-a.
> **Never fabricate a signature.** A minimal true entry beats a padded fake one.
Gate: compliance block appended with honest sign-offs.

## Phase 2: Flip spec status
> **Normative:** Set the spec Status to Done **only after the code audit** the row
> claims (C9). Update `specs/PROGRESS.md`. A `FEATURE-STATUS.md` row flips to ✅
> Done only on a code audit — not on issue close.
Gate: statuses reflect audited reality.

## Phase 3: Runbook (in-PR)
> **Normative:** Generate `docs/devops/runbooks/<slug>.md` (What shipped & when ·
> Config/env · Rollback · Health checks · Known risks). It is GENERATED — regenerate,
> never hand-edit.
Gate: runbook present in the change.

## Phase 4: Draft PR body, then STOP
> **Normative:** Draft the PR body referencing the issue as
> `Updates #N — work-complete | partial | blocked`. **NEVER `Closes #N`** (C9).
> Confirm the ship gate is satisfiable: the push updates a `compliance.md`
> (Phase 1) OR the last commit carries `GATE bypass: <reason>`.
> **Normative:** STOP. Do not push, merge, close, or deploy — hand to the human.
Gate: PR body drafted; control handed to the human.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "I'll just merge it, check was green" | Humans hold the trigger (C9). Draft and STOP. |
| "Use Closes #N to auto-close" | Never. `Updates #N` only — closing is a human act (C9). |
| "Sign G3 myself now to finish" | Solo G3 = fresh-session adversarial review + next-day self-sign. No shortcut. |
| "Mark the row ✅ Done, it builds" | ✅ Done needs a code audit, not a green build alone (C9). |
| "Skip the compliance entry, it's small" | The gate checks existence. A minimal honest entry is required — or a logged `GATE bypass`. |

## Red Flags
- Any push/merge/close/deploy performed by the agent.
- `Closes #N` in the PR body.
- Fabricated sign-off or a ✅ Done without an audit.

## Exit Criteria
- [ ] `compliance.md` block appended (G1–G7, honest sign-offs; G5 = build+lint)
- [ ] Spec/PROGRESS/FEATURE-STATUS reflect audited status
- [ ] Runbook generated in-PR
- [ ] PR body drafted with `Updates #N — …` (never `Closes`)
- [ ] Ship gate satisfiable (compliance.md OR GATE bypass); STOPPED for human
