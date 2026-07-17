# ADR-004: Next.js 16 App Router; verify APIs against installed docs, not memory

## Status
Accepted

## Date
2026-07-18 (backfilled; decision predates the retrofit)

## Context
The project runs Next.js 16, React 19, and Tailwind v4 — versions newer than
most training data. `AGENTS.md` opens with "This is NOT the Next.js you know."
Agents repeatedly write code using older App-Router conventions, deprecated APIs,
or Tailwind v3 patterns, then debug self-inflicted breakage.

## Decision
We will target the Next.js 16 App Router and treat installed docs as ground
truth. Before writing framework code, agents verify APIs against
`node_modules/next/dist/docs/` or via the `find-docs` skill / Context7 MCP, and
heed deprecation notices.

## Rationale
The framework's own installed docs match the exact version in use; training data
does not. Verifying first is cheaper than debugging a stale-API bug after the fact.

## Alternatives Considered
| Option | Rejected because |
|---|---|
| Trust training knowledge | Produces stale-API bugs on a bleeding-edge stack |
| Pin to older Next.js | Gives up React 19 / Tailwind v4 and the current App Router |

## Consequences
- Positive: fewer stale-API bugs; code matches the installed version.
- Negative: a doc-lookup step before framework work.

## Constraints for Agents
- Verify Next.js/React/Tailwind APIs against installed docs or find-docs/Context7 before use (C7).
- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.
- Do not assume App-Router or Tailwind conventions from older versions.
