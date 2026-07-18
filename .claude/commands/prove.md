# Prove — property coverage over all P-IDs (Tier 4)
**Arguments:** $ARGUMENTS

## When to use
After `/implement`, to demonstrate that **100% of the spec's P-IDs** are covered —
each either verified or explicitly justified.

## When NOT to use
- Code not built yet → `/implement`.
- Adversarial correctness/security pass → `/challenge`.

## Preamble
Read: the feature `spec.md` (P-IDs), `plan.md`, `/red`'s acceptance checks,
`specs/CONSTITUTION.md` (C10, ADR-005). **No test runner exists.**

## Phase 1: LITE / N-A mode (ADR-005)
> **Normative:** With no runner, "property-based test" becomes a **documented
> verification** per P-ID: how the **type system**, `npm run build` (type-check +
> static prerender of ALL slides), or a **manual reproduction** establishes the
> invariant. **NEVER fabricate test output or coverage numbers.**
> **Advisory:** Prefer type/build proofs (deterministic) over manual where possible.
Gate: mode declared.

## Phase 2: Coverage matrix
> **Normative:** Build a matrix over **100% of P-IDs**: each row is `covered`
> (with the verification vehicle + evidence: the type that holds, the build that
> prerenders, or the reproduction steps) or `justified` (why it cannot be verified
> now, e.g. deferred to a future runner). No P-ID left blank.
Gate: every P-ID is covered or justified.

## Phase 3: Domain-typed reasoning
> **Advisory:** When describing input classes, reason over **domain types**
> (books, chapters, slides, contract shapes) not raw primitives — a property about
> "any slide index" is stronger than one about "any int".
Gate: verifications reference real domain inputs.

## Phase 4: Handoff
> **Normative:** Record the matrix in the feature folder (e.g. append to `plan.md`
> or a `prove.md` sibling). Do not commit/push (C9). Route → `/challenge`.
Gate: matrix persisted.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "No runner, so coverage is meaningless" | Coverage here = each P-ID has a named type/build/manual verification (ADR-005). Still 100%. |
| "Build passes, that proves everything" | The build proves what the types + prerender encode. Map each P-ID to what actually verifies it. |
| "I'll mark the hard one covered" | If it isn't verifiable now, mark it `justified` with a reason. Don't fake coverage. |
| "Manual repro is too tedious to write down" | An unrecorded repro isn't evidence. Write the steps + expected result. |

## Red Flags
- Invented coverage percentages or test counts.
- A P-ID silently dropped from the matrix.
- "Covered" rows with no evidence vehicle named.

## Exit Criteria
- [ ] LITE / N-A mode declared (ADR-005)
- [ ] Coverage matrix over 100% of P-IDs — each covered (with evidence) or justified
- [ ] Verifications reason over domain types, no fabricated output
- [ ] Matrix persisted; nothing committed
- [ ] Routed to `/challenge`
