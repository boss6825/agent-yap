# ADR-005: build + lint are the deterministic trust gate (no test runner yet)

## Status
Accepted

## Date
2026-07-18

## Context
The AI-native workflow attaches trust only at deterministic (T) gates, and the
Tier-4 pipeline (`/red`, `/prove`, `/check`) assumes a test framework. Agent YAP
currently ships **no test runner** — the codebase is a static content site whose
correctness is dominated by types and by successful static generation of all
slides. Pretending tests exist would fabricate trust; that is worse than none.

## Decision
We will treat `npm run build` (TypeScript type-check + static prerender of every
slide) plus `npm run lint` (eslint) as the deterministic trust gate for all
tiers. Pipeline steps that require a runner (`/red`, `/prove`, the test sub-step
of `/check`) operate in **LITE / N-A** mode: acceptance criteria and invariants
are verified by the type system, by the build, or by documented manual
reproduction, and this is recorded honestly in `review.md` / `compliance.md`.

## Rationale
`next build` fails on type errors and on any broken static route, so it already
catches the most likely regressions for this codebase. It is deterministic,
reproducible, and cheap. Adding a test runner now would be scope the product
does not yet need.

## Alternatives Considered
| Option | Rejected because |
|---|---|
| Add Vitest/Playwright now | Adds deps and scope before any feature needs unit/E2E coverage |
| Claim tests as the gate anyway | Fabricates T-gate trust; violates the workflow's core safety property |

## Consequences
- Positive: an honest, deterministic gate today; no premature test infrastructure.
- Negative: logic-level regressions not caught by types/build can slip through.
- Revisit trigger: the first interactive feature (quiz scoring, progress state,
  placement logic) with real branching logic → add Vitest and promote G5 to real tests.

## Constraints for Agents
- The T-gate is `npm run build` + `npm run lint`; do not fabricate test evidence (C10).
- When adding logic that warrants unit tests, propose adding a runner via a new
  ADR rather than silently working around this one.
