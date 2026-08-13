# Bypass Ledger

> Machine-maintained record of ship-gate bypasses. Append-only. An entry opens
> OPEN when a push carries `GATE bypass: <reason>`; a later PR carrying
> `correction-of: PR #N` closes it. Audit review triggers if ≥3 entries stay
> OPEN for >14 days.

## Metadata
- status: active
- owner: @boss6825
- last-verified: 2026-07-18

| Date (UTC) | PR / commit | Author | Reason | State | Closed by |
|---|---|---|---|---|---|
| 2026-08-14 | `feature/learning-platform-v2` merge (8e3ef2d..c286a32) | @boss6825 | Content/docs-only backfill of the already-reviewed redesign plan (`0db3386`): Review/MCQ sections, doc-ownership fixes, and planning specs. No `src/` behavior changed; Tier 0/1 doc-and-content chore, no feature spec applicable. | OPEN | |
