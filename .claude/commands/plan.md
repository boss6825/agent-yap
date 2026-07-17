# Plan — vertical slices + RIGOR dial (Tier 4)
**Arguments:** $ARGUMENTS

## When to use
After a spec exists, to write `specs/features/<area>/<slug>/plan.md`: vertical
slices with per-slice file lists, and to **flip the RIGOR/LITE dial**. This is the
contract `/implement` consumes read-only.

## When NOT to use
- No spec yet → `/spec` (or `/define`).
- Plan already written and approved → `/red` then `/implement`.

## Preamble
Read: the feature `spec.md`, `specs/WORKFLOW.md` (RIGOR dial + danger list),
`specs/features/_templates/review.md`, `AGENTS.md` (lanes), relevant `specs/learnings/`.

## Phase 1: Flip the RIGOR/LITE dial (deterministic)
> **Normative:** Run **RIGOR** iff ANY of: (1) Tier 4; (2) diff touches the
> WORKFLOW danger list (`src/lib/content.ts`, `docs/api-contract.md`, a lane
> crossing, `generateStaticParams`/the SSG slide route, the book-discovery
> convention); (3) blast radius crosses >1 module boundary. Else LITE.
> This is a trigger list, not a judgment call.
Gate: dial state (RIGOR/LITE) recorded in `plan.md` with the triggering reason.

## Phase 2: Vertical slices
> **Normative:** Decompose into slices that each deliver observable behavior and
> build green on their own. For each slice list: the files it may modify (⊆ the
> spec's May-Modify, C8), the P-IDs it satisfies, and its build/verification check.
> **Advisory:** Order slices so the static build (`npm run build`) stays green throughout.
Gate: every slice has a file list ⊆ spec May-Modify and a build check.

## Phase 3: RIGOR review gate (G3)
> **Normative (RIGOR only):** Refresh `review.md` from the template and obtain a
> **signed approval before any code**. Solo mode: run an **adversarial agent
> review in a FRESH session**, then **self-sign the next day** (COMPLIANCE G3).
> The reviewer MUST NOT be the spec author.
> **Advisory (LITE):** Note "LITE — no signed review required" and move on.
Gate: RIGOR → signed `review.md` (decision: approve) exists. LITE → skip noted.

## Phase 4: Finalize
> **Normative:** Do not write production code here. Do not commit/push (C9).
> Update `specs/PROGRESS.md` in-flight row to stage "plan".
Gate: `plan.md` complete; route → `/red`.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "It's Tier 4 but low-risk, run LITE" | Tier 4 alone forces RIGOR. The dial is not negotiable. |
| "I'll get the review after coding" | RIGOR review is a **pre-code** gate (G3). After-the-fact review is not G3. |
| "Self-sign now, it's just me" | Solo G3 needs a fresh-session adversarial pass AND a next-day cooling sign. Both. |
| "One big slice is simpler" | A slice that can't build alone can't blast-radius-check alone (C8). Split it. |

## Red Flags
- A slice's file list exceeds the spec's May-Modify.
- RIGOR triggered but no `review.md` refresh.
- You started editing `src/` — that's `/implement`.

## Exit Criteria
- [ ] `plan.md` written with dial state + triggering reason
- [ ] Slices each have file list (⊆ May-Modify), P-IDs, build check
- [ ] RIGOR → signed `review.md` (non-author / adversarial + next-day self-sign); LITE → noted
- [ ] `specs/PROGRESS.md` updated; nothing committed
- [ ] Routed to `/red`
