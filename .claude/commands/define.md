# Define — idea → requirements brief (Tier 4, entry)
**Arguments:** $ARGUMENTS

## When to use
The **first** step of any Tier-4 change ("add", "implement", "new", any behavior
change) when no spec exists yet. Turns a raw idea into a confirmed requirements
brief **in chat** so `/spec` has something falsifiable to write from.

## When NOT to use
- A spec already exists for this area → skip to `/plan` (WORKFLOW Tier-4 spec gate).
- Bug/error trace → `/fix` (Tier 1) or `/fix --urgent` (Tier 2).
- Rename/restructure with no behavior change → `/refactor` (Tier 3).
- Chore ("fix lint", "bump dep") → `/check`.
- An approved PRD already exists in `docs/pm/prd/` → `/prd-to-spec`.

## Preamble
Read: `CLAUDE.md`, `specs/WORKFLOW.md` (tiers + danger list), `AGENTS.md` (lanes),
any relevant `specs/learnings/<module>/`. This step writes **no files**.

## Phase 1: Frame the request
> **Normative:** Produce a brief covering all five: **persona**, **trigger**,
> **success**, **failure**, and **≥1 explicit not-in-scope** item.
> **Advisory:** Name the likely module and lane (frontend/backend) early.
Interview the human in one grouped message if any of the five is unclear. Do not
invent scope the human did not ask for.
Gate: all five present and the human has not objected.

## Phase 2: Locate lane & risk
> **Normative:** State which lane owns this (C2) and whether the change touches
> the WORKFLOW danger list (content.ts, api-contract, lane crossing, the SSG
> slide route / `generateStaticParams`, book-discovery convention).
> **Advisory:** Flag if it looks RIGOR-bound so `/plan` isn't surprised.
Gate: lane + danger-list assessment stated in chat.

## Phase 3: Confirm & route
> **Normative:** Get an explicit human "yes" on the brief before routing.
Restate the brief, then route: `→ /spec` to write
`specs/features/<area>/<slug>/spec.md`.
Gate: human confirms.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "The ask is obvious, skip the brief" | Undefined success/failure is how agents drift. Five fields, then route. |
| "I'll note out-of-scope later" | Out-of-scope is the cheapest drift-prevention you have. Get one now (C1). |
| "This is small, go straight to code" | No behavior change ships without a spec (C1). Small still needs a brief. |
| "I'll pick the slug in /spec" | Fine, but the slug is the traceability key (PRD ↔ spec ↔ FEATURE-STATUS). Propose it here. |

## Red Flags
- You are editing files. `/define` writes nothing.
- You cannot name a single not-in-scope item.
- You are describing HOW (implementation) instead of WHAT (behavior).

## Exit Criteria
- [ ] Brief has persona, trigger, success, failure, ≥1 not-in-scope
- [ ] Lane (C2) and danger-list status stated
- [ ] Human confirmed
- [ ] Routed to `/spec` (no files written)
