# Signal-to-CR — raw signal → change request (PM loop)
**Arguments:** $ARGUMENTS  <!-- the raw signal / request -->

## When to use
To turn a raw signal (a call, support ticket, analytics note, founder idea) into a
properly-frontmattered Change Request under `docs/pm/feedback/`, or to update an
existing CR's weight when demand repeats.

## When NOT to use
- A bug → route to the fix tier (`/fix`), not a CR. Bugs are not CRs.
- An approved PRD → `/prd-to-spec`.
- Direct spec authoring → `/spec` (CRs feed PRDs, not specs directly).

## Preamble
Read: `docs/pm/feedback/README.md` (CR frontmatter + rules), existing CRs (for dedupe).

## Phase 1: Bug-vs-CR routing
> **Normative:** If the signal describes broken existing behavior, STOP and route
> to `/fix`. A CR captures desired *new/changed* behavior, not defects.
Gate: confirmed this is a CR, not a bug.

## Phase 2: Dedupe on entry
> **Normative:** Search existing CRs. If the same demand exists, **update that CR**
> (bump `source_weight`/`customer_count`, append the signal) — do NOT create a
> duplicate file.
Gate: either an existing CR updated, or confirmed genuinely new.

## Phase 3: Write / update the CR
> **Normative:** For a new CR, create `docs/pm/feedback/CR-YYYY-NNN.md` with the
> frontmatter from `docs/pm/feedback/README.md` (`cr_id`, `source`, `source_weight`,
> `customer_count` — `0` is honest for own ideas — `revenue_impact`, `hypothesis`,
> `status: logged`, `linked`). Body: **Signal** (verbatim-ish evidence, dates) +
> **Notes** (triage reasoning; on rejection, WHY).
> **Advisory:** Default outcome is park/reject; promotion needs repeated weighted demand.
Gate: valid frontmatter + Signal + Notes.

## Phase 4: Close out
> **Normative:** Leave `status: logged` (promotion is a later human act). Do not
> push (C9). Promotion to a PRD is out of scope here.
Gate: staged, not pushed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "New file for this repeat ask" | Dedupe — bump the existing CR's weight/count. |
| "This bug is really a feature request" | If existing behavior is broken, it's a bug → `/fix`. |
| "Promote it straight to a spec" | CR → PRD → spec. Don't skip the intent plane. |
| "Set status: promoted to move fast" | Promotion is a deliberate human act. Log it, don't self-promote. |

## Red Flags
- A duplicate CR for demand already logged.
- A bug filed as a CR.
- `customer_count` inflated for a personal idea.

## Exit Criteria
- [ ] Bug-vs-CR routing done (bugs → `/fix`)
- [ ] Deduped against existing CRs
- [ ] CR created/updated with valid frontmatter + Signal + Notes, `status: logged`
- [ ] Nothing pushed (C9)
