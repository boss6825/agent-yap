# Refactor — zero behavior change (Tier 3)
**Arguments:** $ARGUMENTS

## When to use
"Clean up", "rename", "restructure", "extract" — internal change with **zero
observable behavior change**.

## When NOT to use
- Any behavior change (even "while I'm here") → `/define` (Tier 4).
- Fixing a bug → `/fix` (Tier 1/2).

## Preamble
Read: `CLAUDE.md`, `specs/WORKFLOW.md`, `specs/CONSTITUTION.md`, relevant
`specs/learnings/`. **No test runner (ADR-005):** the behavior-preservation proof
is `npm run build` (type-check + full static prerender) + `npm run lint`, plus any
documented manual reproduction of affected flows.

## Phase 1: Green BEFORE
> **Normative:** Run `/check` (build + lint) and confirm green **before** any edit.
> Record the baseline (build succeeds, slide count / routes prerendered). You cannot
> prove "no change" without a before.
Gate: pre-refactor build + lint green, baseline recorded.

## Phase 2: Refactor within lane & radius
> **Normative:** Preserve all observable behavior: same inputs → same outputs, same
> routes, same rendered slides. Respect lanes (C2); `src/lib/content.ts`,
> `generateStaticParams`/the SSG route, and the API contract are danger-list — a
> refactor touching them is **RIGOR**, not a casual Tier 3.
> **Advisory:** Keep the diff mechanical and reviewable.
Gate: only structure changed; no contract/behavior change intended.

## Phase 3: Green AFTER (identical shape)
> **Normative:** Run `/check` again. Build + lint green, AND the **same set of
> routes/slides prerenders** as the baseline (this repo's stand-in for "same test
> count": the static-generation surface must be unchanged). Any diff in prerendered
> output means behavior changed — revert or re-route to Tier 4.
Gate: post-refactor build + lint green with an unchanged prerender surface.

## Phase 4: Close out
> **Normative:** Do not commit/push (C9). Draft only.
Gate: routed to commit (human).

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "I'll improve behavior a bit too" | Then it's Tier 4, not a refactor. Split it or route to `/define`. |
| "Skip the before-check, it built yesterday" | No baseline = no proof of zero change. Green before AND after. |
| "Prerender output shifted slightly, close enough" | Any prerender-surface change = behavior change. Revert or escalate. |
| "Renaming content.ts internals is harmless" | Danger list → RIGOR. Coordinate; don't treat it as routine. |

## Red Flags
- No before-baseline recorded.
- Behavior/contract/route change smuggled into a "refactor".
- Prerendered slide/route set differs after.

## Exit Criteria
- [ ] Build + lint green BEFORE, baseline (routes/slides) recorded
- [ ] Only structure changed; lanes respected; danger-list touch escalated
- [ ] Build + lint green AFTER with identical prerender surface
- [ ] Nothing committed (C9)
