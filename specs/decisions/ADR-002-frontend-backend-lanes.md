# ADR-002: Frontend (Claude) / Backend (Codex) lane split via a frozen API contract

## Status
Accepted

## Date
2026-07-18 (backfilled; decision predates the retrofit)

## Context
Agent YAP is built by multiple AI agents. The reader/UI/content pipeline is
developed with Claude; the search and "Ask the docs" API layer was implemented
by OpenAI Codex against `docs/api-contract.md`. Without a hard boundary, two
agents editing overlapping files produce collisions and contradictory changes.

## Decision
We will split the codebase into two lanes with disjoint ownership, coordinated
through a single frozen contract:
- **Frontend (Claude):** `src/app` (except `api`), `src/components`, reader UX.
- **Backend (Codex):** `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`, `.env.example`.
- **Shared / exclusive-access:** `src/lib/content.ts` and `docs/api-contract.md`.

The API contract (`docs/api-contract.md`) is the interface between lanes.

## Rationale
Disjoint file ownership lets the two lanes run in parallel safely. The contract
is the only synchronization point, so a change to it is a deliberate, coordinated
act rather than an accident.

## Alternatives Considered
| Option | Rejected because |
|---|---|
| Single agent owns everything | Serializes all work; loses parallelism |
| No formal contract, coordinate ad hoc | Contract drift; frontend and backend disagree on shapes |

## Consequences
- Positive: parallel-safe multi-agent development; clear blame boundaries.
- Negative: cross-lane features need coordination and a contract change.
- Risk: contract changes are high blast radius (they land on the RIGOR danger list).

## Constraints for Agents
- Do not edit across the lane boundary (C2).
- Backend implements `docs/api-contract.md` precisely; frontend consumes only what it promises (C4).
- A contract change crosses the boundary → runs RIGOR.
- `docs/api-contract.md` is exclusive-access — coordinate before editing.
