# Fix — bug fix, reproduction-first (Tier 1; --urgent = Tier 2 hotfix)
**Arguments:** $ARGUMENTS

## When to use
A bug: wrong behavior, an error trace, a broken build caused by a defect. Default
is **Tier 1**. `--urgent` (production / "customers hit it") switches to the
**Tier 2 hotfix** variant.

## When NOT to use
- New behavior / feature → `/define` (Tier 4).
- Rename/restructure with no behavior change → `/refactor` (Tier 3).
- Lint/dep chore → `/check` (Tier 0).

## Preamble
Read: `CLAUDE.md`, `specs/WORKFLOW.md` (tiers), `specs/CONSTITUTION.md`, relevant
`specs/learnings/<module>/`. **No test runner (ADR-005):** a "reproduction" is a
documented manual repro, a failing type-check, or a red `npm run build`.

## Phase 1: Failing reproduction FIRST (mandatory)
> **Normative:** Before touching the fix, establish a reproduction that currently
> **fails/demonstrates the bug** — exact steps + expected-vs-actual, or a build/type
> error. No reproduction, no fix. Do not fabricate test evidence.
Gate: a documented failing reproduction exists.

## Phase 2: Minimal fix
> **Normative:** Change the least code that makes the reproduction pass. Respect
> lane discipline (C2) and blast radius — a fix that edits `src/lib/content.ts`,
> the API contract, or crosses lanes is **RIGOR** (WORKFLOW danger list): stop and
> escalate rather than sneak it through Tier 1.
> **Advisory:** Note root cause vs symptom as you go.
Gate: reproduction now passes; diff is minimal and in-lane.

## Phase 3: Verify via /check
> **Normative:** Run `/check` (build → lint → validate.sh if present →
> breaking-change scan). Green before proceeding.
Gate: `/check` green.

## Phase 4: Close out
> **Normative (Tier 1):** Capturing a learning is encouraged for any non-obvious
> fix (`/learn`). Do not commit/push (C9); draft only.
Gate: routed to commit (human) / `/learn` if warranted.

## --urgent variant (Tier 2 hotfix)
> **Normative:** Dial constraints: touch **≤2 files**; run **build + reproduction
> only** (skip the fuller pipeline for speed); use a `hotfix:` branch/commit prefix.
> **Normative:** A **follow-up learning is MANDATORY** — write
> `specs/learnings/<module>/<key>.md` via `/learn` (G7). Skipping it is not allowed.
> **Normative:** Still no push/deploy without human go-ahead (C9); deploy is a human act.
Gate: ≤2 files, build+repro green, mandatory learning filed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "The bug's obvious, skip the repro" | Reproduction-first is mandatory (Tier 1/2). Unreproduced = unfixed. |
| "I'll write the learning later" | For `--urgent` the follow-up learning is MANDATORY (G7). Later means never. |
| "Urgent, so touch whatever I need" | Hotfix caps at ≤2 files. More than that is not a hotfix — escalate. |
| "Fix reaches into content.ts, it's fine" | That's the danger list → RIGOR. Escalate; don't hotfix across it. |

## Red Flags
- Editing before a reproduction exists.
- A "hotfix" spanning many files or crossing a lane.
- `--urgent` with no learning filed.

## Exit Criteria
- [ ] Failing reproduction documented BEFORE the fix
- [ ] Minimal, in-lane fix; danger-list touch escalated to RIGOR
- [ ] `/check` green (Tier 1) or build+repro green (`--urgent`, ≤2 files)
- [ ] `--urgent`: mandatory learning filed via `/learn`
- [ ] Nothing pushed/deployed (C9)
