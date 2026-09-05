# Architecture Decision Records

> Why hard-to-reverse decisions were made, so agents stop re-litigating settled
> choices. ADRs are numbered sequentially, never reused, and superseded (never
> deleted). Write one when a decision is hard to reverse, spans modules, or
> trades something meaningful — not for naming or implementation detail.

## Index
| ADR | Decision | Status |
|---|---|---|
| [ADR-001](ADR-001-markdown-first-content-pipeline.md) | Markdown-first content pipeline; `content.ts` is the single source of truth | Accepted |
| [ADR-002](ADR-002-frontend-backend-lanes.md) | Frontend (Claude) / Backend (Codex) lane split via a frozen API contract | Accepted |
| [ADR-003](ADR-003-slide-reader-model.md) | Slide reader: one `##` = one slide, SSG-prerendered, paged | Accepted |
| [ADR-004](ADR-004-nextjs-16-app-router.md) | Next.js 16 App Router; verify APIs against installed docs, not memory | Accepted |
| [ADR-005](ADR-005-build-lint-as-trust-gate.md) | `npm run build` + `npm run lint` are the deterministic trust gate (no test runner yet) | Accepted |
| [ADR-006](ADR-006-streaks-and-anonymous-aggregates.md) | Streaks/leaderboard in scope; "no server-side progress" becomes "no server-side **user** state" | Accepted |
| [ADR-006](ADR-006-streaks-and-anonymous-aggregates.md) | Streaks/leaderboard in scope; "no server-side progress" becomes "no server-side **user** state" | Accepted |

_These 5 were backfilled during the Phase-2 retrofit because they are the
decisions agents kept re-litigating. New decisions get an ADR from now on._
