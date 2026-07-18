# Design Review: <feature>
<!-- The pre-code design gate (G3). In solo mode the reviewer is an adversarial
     agent in a FRESH session + your own next-day sign-off. -->

## 1. Property → Test Mapping
<!-- A property without a named verification is a gap. No test runner here, so
     "verification" may be a build check, a type guarantee, or a manual reproduction. -->
| Property (P-ID) | Verification name | Type (build/type/manual/future-test) | Location |
|---|---|---|---|

## 2. Blast Radius Confirmation
<!-- Cross-checked against spec.md — list any discrepancy. -->

## 3. Dependencies & Contracts
<!-- Interfaces called, API-contract touchpoints (C4), lane boundary crossings (C2). -->

## 4. Risks & Mitigations
| Risk | Mitigation |
|---|---|

## 5. Open Questions
<!-- Each resolved or deferred-with-owner before approval. -->

## Approval
reviewer: <@handle — MUST NOT be the spec author; solo: adversarial agent session + next-day self-sign>
decision: approve | revise | reject
date: YYYY-MM-DD
rationale: <one line>
