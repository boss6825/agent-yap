# Plan: Reader — IDE Shell

> Spec: specs/features/reader/ide-shell/spec.md · Consumed read-only by `/implement`.

## RIGOR/LITE dial

**RIGOR.** Triggers (deterministic, per specs/WORKFLOW.md):
1. Tier 4 (new behavior: shell layout, progress, chat, shaders, art).
2. Danger list: the diff touches the SSG slide-route surface
   (`src/app/read/[book]/[chapter]/[slide]/page.tsx` gains a client bridge mount;
   `generateStaticParams` itself is unchanged).
3. Blast radius crosses >1 module boundary (reader, landing, lib).

## Division of labor (owner-directed)

Claude (Fable 5) plans, architects, and implements UI/animation-heavy slices;
Codex (`gpt-5.5` via companion runtime) implements isolated, well-specified modules
from detailed prompts. All Codex output is reviewed by Claude before integration
(agent output is PROVISIONAL; trust attaches at the T-gate build/lint).

## Vertical slices

Each slice builds green on its own (`npm run build` + `npm run lint`); file lists ⊆
spec May-Modify.

### S1 — IDE shell layout (Claude)
Left rail with chapter→slide tree (desktop docked + collapsible; mobile overlay);
chrome restructured from fixed overlays to header + flex row (rail | stage | chat
placeholder); right Contents drawer retired; keyboard bindings preserved.
- Files: `src/components/reader/ReaderChrome.tsx`, `src/components/reader/Rail.tsx` (new),
  `src/app/read/[book]/[chapter]/[slide]/template.tsx`, `src/app/globals.css`
- P-IDs: P-READER-003
- Check: build + manual keyboard/swipe pass

### S2 — Progress (Claude)
`src/lib/progress.ts` localStorage store + `useProgress` hook; slide checks +
chapter ring/count in rail; resume pill; landing "Continue reading" CTA.
- Files: `src/lib/progress.ts` (new), `src/components/reader/{Rail,ReaderChrome}.tsx`,
  `src/components/reader/ResumePill.tsx` (new), `src/components/Home.tsx`
- P-IDs: P-READER-002, P-READER-003
- Check: build + manual (view → reload → verify; network tab shows no progress traffic)

### S3 — Ambient shader layer + glass card (Claude)
`AmbientBackdrop.tsx` (MeshGradient light / DotOrbit dark, theme-observed, reduced-motion
static, error-boundary CSS fallback, stable props) + glass reading card around the stage.
- Files: `src/components/reader/AmbientBackdrop.tsx` (new),
  `src/components/reader/ReaderChrome.tsx`, `src/app/globals.css`
- P-IDs: P-READER-003
- Check: build + manual light/dark/reduced-motion pass

### S4 — BYOK chat (Codex module + Claude UI)
- S4a (Codex, done): `src/lib/chat/gemini.ts` — key storage, SSE streaming client,
  error taxonomy. Reviewed by Claude.
- S4b (Claude): `ChatPanel.tsx` docked panel + key-entry state + streaming grounded in
  current slide via `slide-context.ts` bridge mounted from slide `page.tsx`;
  `PulsingBorder` input frame; `/api/ask` fallback (contract untouched).
- Files: `src/lib/chat/gemini.ts` (new), `src/components/reader/{ChatPanel.tsx,slide-context.ts}` (new),
  `src/components/reader/ReaderChrome.tsx`, `src/app/read/[book]/[chapter]/[slide]/page.tsx`
- P-IDs: P-CHAT-001, P-READER-003
- Check: build + manual (key flow, stream, fallback, network-tab key audit)

### S5 — Chapter art (Codex script + Claude integration)
- S5a (Codex, done): `scripts/fetch-art.mjs` + manifest schema. Reviewed; run by Claude
  (Codex sandbox has no network).
- S5b (Claude): `src/lib/art.ts` typed accessor; rail header artwork + caption.
- Files: `scripts/fetch-art.mjs` (new), `src/lib/art-manifest.json` (new),
  `src/lib/art.ts` (new), `public/art/**` (new), `src/components/reader/Rail.tsx`
- P-IDs: P-READER-003
- Check: build (manifest imported statically) + manual rail render

## Order & build-green strategy

S1 → S2 → S3 → S4 → S5, one commit per slice, `npm run build` before each commit.
Shader dep already installed (pinned 0.0.77) — a dep alone cannot break the build.

## G3 review gate

RIGOR ⇒ signed review required pre-code. Executed as: adversarial review of spec+plan
by a fresh Codex (GPT-5.5) session (non-author model), recorded in `review.md`.
Deviation from the letter of G3 (next-day cooling sign) is recorded honestly in
`compliance.md` as owner-directed ("plans are enough, let's execute", 2026-07-19) —
no signatures fabricated.
