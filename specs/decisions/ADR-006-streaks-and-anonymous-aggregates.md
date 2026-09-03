# ADR-006: Streaks are in scope, and "no server-side progress" becomes "no server-side user state"

## Status
Accepted

## Date
2026-09-04

## Context

Two recorded non-goals were blocking two milestones, and one of them was already
contradicting itself before any of that work started.

**Streaks.** `docs/redesign-2026/` refused streaks, notifications, certificates
and percentile pressure outright. `CR-2026-013` then revived a softened,
local-only streak. The product owner has since asked for the full version:
streak, emoji calendar, and eventually a leaderboard. That is a legitimate
product call, but it reverses a written non-goal, and in six months nobody would
remember which decision was current.

**Anonymous aggregates.** `plan.md` said "no auth, no server-side progress, no
points/leaderboards", and shipped invariant `P-READER-002` said "no progress data
is ever transmitted over the network". Meanwhile `CR-2026-010` proposes cookieless
analytics and M6 wants item statistics ("68% of readers get this wrong"). Those
two things were already in direct conflict with the invariant, today, with no
assessment code written. `docs/redesign-2026/research/03-prior-decisions.md` had
flagged the collision and drafted the reword; it was never applied.

## Decision

We will:

1. **Put streaks, the emoji calendar, and a leaderboard in scope.** Notifications
   and certificates stay refused, and stay parked in
   `docs/specs/99-deferred-later-iterations.md`.
2. **Reword the non-goal** from "no server-side progress" to "no server-side
   **user** state", and reword `P-READER-002` from "no progress data is ever
   transmitted" to "no **identifying or per-user** progress data is transmitted".
3. **Permit anonymous aggregates only.** A per-item answer counter and cookieless
   page analytics are allowed. Anything that could reconstruct one reader's
   history, or that requires an account, is not.

## Rationale

The invariant's real subject was never "packets". It was **accounts**. The promise
worth keeping to a reader is "we do not have a profile of you", and an unlinkable
counter that increments when anyone gets question 14 wrong does not create one.
Reading it literally as "nothing leaves the browser" would kill the one genuinely
valuable assessment feature and the ability to know whether any of this works,
in exchange for a privacy guarantee nobody asked for at that strength.

Streaks are the weaker half of this ADR and worth naming as such: the original
refusal was reasoned, and reversing it is a preference, not a correction. It is
recorded here so the reversal is visible rather than discovered.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Keep `P-READER-002` literal; no item stats, no analytics | Kills CR-2026-010 and the strongest M6 feature to protect a guarantee stricter than the product's actual promise. |
| Keep the invariant, revisit if a server ever arrives | The contradiction is live now. Deferring means assessment inherits an invariant it is designed to violate. |
| Local-only softened streak (CR-2026-013 form) | Was offered; the product owner chose the full version including the leaderboard. |
| Leave streaks refused | M7's habit loop is most of M7. |

## Consequences

- **M7 unblocked.** `SOL-39` can be split and built. Spec 04 was already written
  to the non-punishing framing, so it needs no rewrite for the streak itself; the
  leaderboard is new surface area not yet specced.
- **M6's data model is unblocked** (`SOL-38`), but now depends on a backend that
  does not exist. Item statistics require somewhere to count. That is a new
  infrastructure question this ADR does not answer.
- **A leaderboard is the one piece that strains the reword.** Ranking readers
  against each other implies distinguishing them. If a leaderboard ever needs a
  stable identity per reader, that is a *new* decision and a new ADR, not
  something this one licenses.
- `P-READER-002` is still unregistered in `specs/properties/invariants.md`, along
  with `P-READER-003` and `P-CHAT-001`. That predates this ADR and is tracked
  separately; it should be fixed before assessment adds more P-IDs.
