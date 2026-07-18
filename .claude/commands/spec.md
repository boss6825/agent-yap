# Spec — write the feature spec (Tier 4)
**Arguments:** $ARGUMENTS

## When to use
After `/define` (or `/prd-to-spec`) to author
`specs/features/<area>/<slug>/spec.md` from `specs/TEMPLATE.md`. The spec is the
source of truth (C1); code that disagrees with it is wrong.

## When NOT to use
- No confirmed brief yet → `/define`.
- Spec already exists and you are starting implementation → `/plan`.
- You only need to change existing behavior's plan, not its contract → `/plan`.

## Preamble
Read: `specs/TEMPLATE.md`, `specs/CONSTITUTION.md` (cite C-IDs, do not restate),
`specs/INDEX.md`, `specs/properties/invariants.md`, existing specs under
`specs/features/`, relevant `specs/learnings/`.

## Phase 1: Overlap detection
> **Normative:** Search `specs/features/**` and `specs/INDEX.md` for an existing
> spec covering this behavior. If found, STOP and route to `/plan` — do not fork
> a duplicate spec.
Gate: no overlapping spec, or overlap resolved with the human.

## Phase 2: Draft from TEMPLATE
> **Normative:** Copy `specs/TEMPLATE.md` to `specs/features/<area>/<slug>/spec.md`.
> The slug MUST match the PRD slug and the `FEATURE-STATUS.md` row. Fill every
> section: behavior, Input/Output contracts, Errors table, Pre/Post, Constraints,
> Acceptance Criteria, Examples (happy + edge + error), Out of Scope.
> **Advisory:** State SSG/static-generation and content-rule (C5) impact under Constraints.
Gate: no section left as a placeholder comment.

## Phase 3: Properties & testability gate (C10)
> **Normative:** Write **≥2** invariants as `P-<MODULE>-NNN`. Each must be
> **specific, falsifiable, and mapped to a verification** — since there is no test
> runner (ADR-005), verification is `type system | build | manual reproduction |
> future test`, never fabricated test evidence.
> **Normative:** ID-collision check against `specs/properties/invariants.md`;
> register every new P-ID there.
Gate: ≥2 P-IDs, each falsifiable + verification named + registered.

## Phase 4: Blast radius (C8)
> **Normative:** Fill **May modify / Must NOT modify / Must NOT break**. Name the
> API contract, the static build, and `src/lib/content.ts` explicitly if in range.
> **Advisory:** If the radius crosses a lane (C2) or a danger-list item, note that this is RIGOR.
Gate: three blast-radius lists concrete (files/dirs, not prose).

## Phase 5: Register & route
> **Normative:** Add the spec to `specs/INDEX.md` (unlisted = does not exist).
> Set spec Status: Pending. Do not commit/push (C9).
Gate: INDEX row added. Route → `/plan`.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "One invariant is enough" | C10 requires ≥2. One property rarely pins behavior. |
| "No runner, so properties are pointless" | ADR-005: type/build/manual verification still falsifies. Name it, don't skip it. |
| "Blast radius is the whole app" | Then the spec is too big. Narrow it or split it (C8). |
| "I'll add it to INDEX later" | Unlisted specs don't exist to the agent (P2). Add the row now. |
| "Em dashes are fine in examples" | Content that renders on-site is C5: no em dashes, practitioner tone. |

## Red Flags
- P-IDs that no observation could ever contradict.
- Overlap with an existing spec you didn't check.
- Blast radius that silently includes `content.ts` or `docs/api-contract.md` without flagging RIGOR.

## Exit Criteria
- [ ] `spec.md` at `specs/features/<area>/<slug>/` from TEMPLATE, all sections filled
- [ ] ≥2 falsifiable P-IDs, each with a named verification, registered in invariants.md
- [ ] Blast radius: May / Must-NOT-modify / Must-NOT-break concrete
- [ ] Added to `specs/INDEX.md`; not committed
- [ ] Routed to `/plan`
