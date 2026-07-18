# Challenge — adversarial review (Tier 4, A-gate)
**Arguments:** $ARGUMENTS

## When to use
After `/prove`, to run an adversarial correctness/design review of the change
before the deterministic `/check`. Output is **PROVISIONAL** (A-gate): an agent's
"all clear" clears nothing (C9) — it surfaces findings for the human and `/check`.

## When NOT to use
- Deterministic build/lint/rules gate → `/check` (that is the T-gate).
- Pre-code design review → `/plan`'s G3 `review.md`.

## Preamble
Read: the feature `spec.md`, `plan.md`, `review.md`, the diff, `specs/CONSTITUTION.md`.
Cite constitution rules **by ID** (C1..C10) — the definitions live in `/check`;
never restate them here.

## Phase 1: Severity-graded findings
> **Normative:** Review adversarially for correctness, missed edge cases, spec
> deviations, lane violations (C2), API-contract drift (C4), content-rule breaks
> (C5), blast-radius overreach (C8). Grade each finding **Critical / Major / Minor**.
> **Advisory:** Prefer a fresh-session reviewer perspective (mirrors solo G3).
Gate: each finding has a severity and a cited rule ID where applicable.

## Phase 2: Critical block
> **Normative:** **Critical findings block merge.** They must be resolved (code or
> spec change via the diagnostic loop) and re-reviewed, not waved through.
Gate: zero unresolved Critical findings.

## Phase 3: Record & route
> **Normative:** Record findings + resolutions in the feature folder. Mark the
> review **provisional (A-gate)** — trust attaches only at `/check` (T) and human
> sign-off (C9). Do not commit/push.
Gate: findings recorded. Route → `/check`.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "Challenge passed, so it's safe to merge" | A-gate is provisional. Only `/check` (T) + human clears anything (C9). |
| "I'll restate what C4 means here" | Rules are defined once, in `/check`. Cite "C4"; don't fork the wording. |
| "This Critical is probably fine" | Critical blocks merge by definition. Resolve or downgrade with reason, then re-review. |
| "Found nothing, done" | An adversarial pass that finds nothing on a real change is a smell. Look harder at edges. |

## Red Flags
- Treating your own approval as a merge clearance.
- Findings with no severity or no rule citation.
- Restating constitution rule text instead of citing IDs.

## Exit Criteria
- [ ] Findings graded Critical/Major/Minor with cited C-IDs
- [ ] Zero unresolved Critical findings
- [ ] Review recorded and marked provisional (A-gate)
- [ ] Nothing committed; routed to `/check`
