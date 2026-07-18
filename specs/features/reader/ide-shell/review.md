# Design Review: Reader — IDE Shell

> G3 pre-code gate. Reviewer: **adversarial Codex (GPT-5.5) session** — fresh
> context, non-author model (spec/plan authored by Claude Fable 5). Full review
> transcript summarized below; owner (@arpit) directed same-day execution, so the
> next-day cooling self-sign is recorded as a deviation in `compliance.md`, not
> simulated here.

## 1. Property → Test Mapping

| Property (P-ID) | Verification name | Type | Location |
|---|---|---|---|
| P-READER-002 | reload persistence + network-tab audit; grep: `progress.ts` imported only by reader UI, never by fetch helpers | manual + static grep | reader pages, devtools |
| P-READER-003 | WebGL-off render, storage-blocked browse, reduced-motion pass, 375px/desktop layout pass on short + long + code slides | manual + build | reader pages |
| P-CHAT-001 | single call site in `src/lib/chat/gemini.ts` (hardcoded Google base URL, key only in `x-goog-api-key`); fallback body is exactly `{question}`; network-tab negative check on `/api/**` | type/code + manual | `src/lib/chat/gemini.ts`, `ChatPanel` |
| SSG surface | `npm run build` output lists all slide routes (181) — count compared before/after | build (T-gate) | CI/local build |

Reviewer note (accepted): "for any environment/sequence" phrasing overclaims what
manual checks prove — verification demonstrates the covered cases; properties remain
the design intent, not exhaustively proven theorems (no test runner, per CLAUDE.md).

## 2. Blast Radius Confirmation

Reviewer confirmed: no planned touch violates May-Modify; exclusive-access files
untouched. `page.tsx`/`template.tsx` are danger-list SSG surface → every slice
touching them is RIGOR + build-verified (accepted; already the plan).

## 3. Dependencies & Contracts

- `POST /api/ask` used as no-key fallback with body **exactly** `{question}` — no
  slide markdown, no history, no key (C4 preserved; reviewer risk #11 accepted).
- Browser → `https://generativelanguage.googleapis.com` (BYOK only). No CSP exists
  in this repo today (`next.config.ts` sets only `turbopack.root`); if a CSP is ever
  added, it MUST include `connect-src https://generativelanguage.googleapis.com`.
- `@paper-design/shaders-react` pinned exact 0.0.77; no other package.json changes.

## 4. Risks & Mitigations (adversarial findings → adopted responses)

| # | Risk (severity) | Adopted mitigation |
|---|---|---|
| 1 | localStorage-driven checkmarks hydrate-mismatch SSG HTML (high) | progress hook returns `undefined` until after mount; server HTML and first client render are both neutral; decoration appears post-hydration only |
| 2 | keyboard listener steals keys from chat textarea / panels (high) | typing guard widened to input/textarea/select/`isContentEditable`/`isComposing`; modals keep `anyOverlay` gating; Escape scoped per surface |
| 3 | CSP blocks BYOK calls (high) | none configured today — documented `connect-src` requirement here + in spec; ship-gate check that no CSP was introduced meanwhile |
| 4 | slide bridge bloats/breaks SSG page (high) | `generateStaticParams` untouched; bridge is a zero-UI client component receiving only plain string fields of the current slide |
| 5 | mark-on-view aggressive / StrictMode double-fire (med) | `markSlideRead` idempotent set-write + ~1.2s dwell timer before marking |
| 6 | storage corruption/quota (med) | versioned payload, defensive parse (discard corrupt), try/catch quota writes, zero-state UI |
| 7 | slide-context race with panel mount order (med) | module store with snapshot + subscribe consumed via `useSyncExternalStore` |
| 8 | theme-switch shader remount / context loss (med) | swap is a rare explicit user action; error boundary + CSS gradient fallback; no remount loops (boundary latches) |
| 9 | template padding breaks centering (med) | manual pass on short/long/code slides at 375px + desktop before slice sign-off |
| 10 | overlay focus management (med) | mobile rail focuses its close control and restores focus to the toggle on close; chat focuses composer on open; Escape deterministic |
| 11 | fallback leaks context to `/api/ask` (med) | fallback body frozen to `{question}`; page-context features labeled key-only |
| 12 | art manifest shape breaks build (low) | typed accessor validates entries; missing chapter → no image rendered |
| 13 | slide-count regression invisible (low) | build-output route count recorded in compliance entry |

## 5. Open Questions

- Paid chat tier: deferred by owner (BYOK-only v1). Owner of follow-up: @arpit.
- LiquidMetal landing scene + wiring 5 remaining books: agreed fast follow-ups.

## Approval

reviewer: adversarial Codex (GPT-5.5) fresh session, non-author — verdict **revise**;
revisions above adopted into spec/plan before implementation of affected slices.
decision: revise → proceed with adopted mitigations (owner-directed same-day execution)
date: 2026-07-19
rationale: all four high-severity findings have concrete design-level mitigations now
bound into the plan; remaining risk is manual-verification breadth, tracked in /check.
