# Compliance Log — Reader IDE Shell
> Spec: specs/features/reader/ide-shell/spec.md · Never edit past entries; correct
> by appending a new entry with `correction-of: PR #NNNN`. Newest first.

## Branch `feature/reader-ide-shell` — pre-PR entry (PR not yet opened)
date: 2026-07-19 · tier: 4 · author: Claude Fable 5 (agent), owner @arpit · spec-version: 9572017
summary: Cursor-style reader shell — rail + progress + shaders + BYOK chat + chapter art (slices S1–S5)

### Gates
- G1 spec: owner approved direction in-session (chat, 2026-07-19: "the plans are
  enough now, let's execute"); spec authored by agent — no human signature exists.
- G2 plan: same in-session approval; RIGOR dial + slices recorded in plan.md.
- G3 review: adversarial Codex (GPT-5.5) fresh session, non-author — verdict
  **revise**, all findings adopted pre-code (review.md). Deviation: no next-day
  cooling self-sign (owner directed same-day execution).
- G4 blast-radius: respected — diff ⊆ May-Modify; `src/lib/content.ts`,
  `docs/api-contract.md`, `src/lib/{search,ask}.ts`, `src/app/api/**` untouched
  (verified via git status against the spec list).
- G5 build+lint: `npm run build` green (181 slide routes, 188 pages) +
  `npm run lint` clean, run 2026-07-19 after the final slice.
- G6 accept: pr-review: pending — branch not pushed (owner has not requested
  push/PR yet).
- G7 learn: LightningCSS drops standard `backdrop-filter` when a hand-written
  `-webkit-` prefix is present (fix + note in `src/app/globals.css`); AIC image
  CDN region-blocks even browsers — art sourced from The Met instead (note in
  `scripts/fetch-art.mjs`).

### Deviations
- skip: G3 next-day self-sign — owner-directed same-day execution ("let's
  execute", in-session, 2026-07-19); adversarial review still performed pre-code.
- note: slices S3–S5 shared one build+lint run (S1, S2 each had their own);
  per-slice May-Modify discipline was maintained in the commits.
- note: BYOK happy path (real Gemini key → streamed answer) not exercised by the
  agent — entering API keys is prohibited for it; fallback path, error taxonomy,
  and network-body audit verified instead. Owner should paste a key once to
  confirm streaming end-to-end.
