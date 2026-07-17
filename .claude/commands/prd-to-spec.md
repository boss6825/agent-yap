# PRD-to-spec — approved PRD → feature spec (PM loop)
**Arguments:** $ARGUMENTS  <!-- the PRD slug / path -->

## When to use
To convert an **approved** PRD (`docs/pm/prd/<slug>.md`, `status: approved`) into a
feature spec, carrying requirement IDs and open questions across the intent →
contract boundary.

## When NOT to use
- PRD not yet approved → it needs a deliberate human status flip first.
- Idea with no PRD → `/define` then `/spec`.
- Signal triage → `/signal-to-cr`.

## Preamble
Read: the PRD, `docs/pm/prd/README.md`, `specs/TEMPLATE.md`,
`docs/pm/prd/README.md` (PRD lifecycle), `specs/CONSTITUTION.md` (C1).

## Phase 1: Approval gate
> **Normative:** Confirm the PRD `status: approved`. If `draft`, STOP — approval is
> a deliberate human act (ideally on a different day than drafting). Do not
> self-approve.
Gate: PRD is approved.

## Phase 2: Convert to spec (carry IDs)
> **Normative:** Author `specs/features/<area>/<slug>/spec.md` from `TEMPLATE.md`.
> The spec slug MUST equal the PRD slug (traceability key). Carry each PRD
> **R-ID** into the behavioral definition / acceptance criteria, and copy **open
> questions** into the spec so they aren't lost. Then run the `/spec` gates
> (testability P-IDs, ID-collision, overlap, blast radius).
Gate: R-IDs mapped, open questions carried, `/spec` gates satisfied.

## Phase 3: Flip the PRD to converted
> **Normative:** Set the PRD `status: converted`, add
> `spec: specs/features/<area>/<slug>/spec.md`, and stop editing the PRD — it is now
> history. Register the spec in `specs/INDEX.md`.
Gate: PRD converted with `spec:` pointer; INDEX updated.

## Phase 4: Route
> **Normative:** Do not push (C9). Route → `/plan`.
Gate: routed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "PRD's basically approved, convert it" | Only `status: approved` converts. Approval is a human flip. |
| "Drop the open questions, they slow us" | Carry them into the spec — losing them reintroduces ambiguity (C1). |
| "New slug reads better" | Slug is the PRD↔spec↔FEATURE-STATUS key. Keep it identical. |
| "Skip INDEX, it's converted anyway" | Unlisted spec doesn't exist to the agent (P2). Add the row. |

## Red Flags
- Converting a draft PRD.
- Slug mismatch between PRD and spec.
- Open questions dropped in translation.

## Exit Criteria
- [ ] PRD confirmed `approved`
- [ ] Spec authored (same slug), R-IDs + open questions carried, `/spec` gates met
- [ ] PRD flipped to `converted` with `spec:` pointer; spec in `specs/INDEX.md`
- [ ] Nothing pushed; routed to `/plan`
