# Red — acceptance checks, one per P-ID (Tier 4)
**Arguments:** $ARGUMENTS

## When to use
After `/plan`, to define spec-derived black-box **acceptance checks — one per
P-ID** — that establish "not done yet" before production code exists.

## When NOT to use
- No `plan.md` yet → `/plan`.
- A fix regression case → `/fix` (its own failing-reproduction-first rule).

## Preamble
Read: the feature `spec.md` (P-IDs), `plan.md`, `specs/CONSTITUTION.md` (C10,
ADR-005). **This repo has NO test runner.**

## Phase 1: LITE / N-A mode declaration (ADR-005)
> **Normative:** There is no test runner. `/red` runs in **LITE / N-A** mode:
> instead of committing failing test files, record for each P-ID a **falsifiable
> acceptance check** verified by the **type system**, `npm run build`, or a
> **documented MANUAL reproduction** (exact steps + expected-vs-current result).
> **NEVER fabricate test evidence or a phantom test file.**
Gate: mode declared; each P-ID has a chosen verification vehicle.

## Phase 2: Author the checks
> **Normative:** One check per P-ID, named after the P-ID. Each states the
> observable that is currently FAILING/absent (the behavior doesn't exist yet).
> Record them in `plan.md` (or a `red.md` sibling) — not as fake passing tests.
> **Advisory:** For type/build checks, describe the type or prerender that will
> only hold once the code is right.
Gate: 100% of P-IDs have a named, currently-failing acceptance check.

## Phase 3: Brownfield drift
> **Normative:** If a check unexpectedly **passes on existing behavior**, do NOT
> weaken it to make it fail. Log it as **drift** for human adjudication (the spec
> and reality disagree — that's a finding, not a test bug).
Gate: any drift logged for the human; nothing silently adjusted.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "No runner, so skip /red" | The gate is proving "not done yet" up front. A manual reproduction does that without a runner (ADR-005). |
| "I'll write a quick test file anyway" | There's no runner to run it — a green file is fabricated evidence. Use build/type/manual instead. |
| "The check passes already, delete it" | That's drift. Log it for the human (spec vs reality), don't hide it. |
| "One check covers several P-IDs" | One per P-ID. Coverage is per-property, not per-feature. |

## Red Flags
- A committed "test" that no runner executes.
- A P-ID with no failing acceptance check.
- Rewriting a check to force a red result.

## Exit Criteria
- [ ] LITE / N-A mode declared (ADR-005)
- [ ] Every P-ID has a named, currently-failing check (type / build / manual)
- [ ] No fabricated test files or evidence
- [ ] Brownfield drift (if any) logged for human adjudication
- [ ] Routed to `/implement`
