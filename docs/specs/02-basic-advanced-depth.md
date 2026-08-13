# Spec 02 — Basic / Advanced content depth

> **Intent.** Let a reader choose depth on the content itself: **Basic** (the current
> explanatory prose) and **Advanced** (a deeper layer that explains *how a thing is
> actually built*, grounded in real open-source code — Codex, Claude Code, OpenClaw,
> Hermes, etc.). Advanced content appears **only on topics that have it**; most slides
> stay Basic-only. Replaces TUF's Brute→Better→Optimal with a two-level model that fits
> reading, not coding problems.

## Prior art / where it plugs in
- No per-content depth switch exists today. Adjacent concepts in redesign-2026: content
  difficulty tiers (`foundations/core/advanced/frontier`) and learner levels (l1/l2/l3)
  in `docs/redesign-2026/research/07-assessment-system.md`.
- **Caution:** difficulty *tabs* were explicitly **rejected for `/practice`**
  (`07` §5, `09-ia-and-flows.md` §8). This is different — a depth toggle on **reading**
  content — but keep the UX quiet and non-fragmenting so it doesn't repeat what they disliked.
- Parser: [src/lib/content.ts](../../src/lib/content.ts) (exclusive-access); renderer:
  [src/components/Markdown.tsx](../../src/components/Markdown.tsx); toggle host:
  [src/components/reader/ReaderChrome.tsx](../../src/components/reader/ReaderChrome.tsx).

## Requirements
- **R-1 Authoring format.** A way to mark a block/section as `advanced` in markdown
  (e.g. `:::advanced` directive, aligned with [01](01-reading-scaffold-blocks.md)'s
  choice). Basic content is the default; advanced is additive.
- **R-2 Reader toggle.** A Basic⇄Advanced control in the reader. When a slide has **no**
  advanced content, the toggle is hidden or clearly inert on that slide (no empty state).
- **R-3 Persistence.** Chosen depth persists per-reader (localStorage) and applies as
  they move between slides.
- **R-4 OSS-explainer snippet presentation.** Advanced blocks that quote/explain OSS code
  get a **distinct, engaging presentation** (this is the "show it in an intriguing way"
  ask). See Design notes — this is the design-heavy part.
- **R-5 Provenance.** Every OSS snippet cites its **source repo + file/permalink** and
  respects licensing (short, transformative excerpts + attribution; link out, don't
  wholesale copy).
- **R-6 Authoring skill.** Deliver a **cowork skill** (under `.claude/skills/`) that
  drafts an Advanced section for a given topic from a named OSS reference, in our format,
  for **you to review and run manually** — not auto-published.

## Design notes (for Claude design)
- The advanced OSS-code presentation is the centerpiece. Explore (pick 1–2, don't overbuild):
  - **Annotated code walk**: the snippet on one side, stepped callouts ("① this is the
    guardrail check") that highlight the referenced lines as you scroll.
  - **Progressive build-up**: reveal the snippet in stages (skeleton → real impl), each
    stage captioned — mirrors how the feature was actually built.
  - **"From the source" card**: framed snippet with repo/file chip, collapse/expand,
    copy, and a one-line "why this matters."
- Must reuse code-block styling from `.prose-yap`/highlight.js; no new raw colors.
- Depth switching must not cause layout jank or lose scroll position unreasonably.

## Acceptance
- [ ] A topic authored with Basic + Advanced renders both; toggle switches cleanly and persists.
- [ ] A Basic-only topic shows no broken/empty Advanced affordance.
- [ ] OSS snippets show source + link; presentation matches the chosen design pattern.
- [ ] Cowork authoring skill exists, is documented, and produced at least one reviewed
      Advanced section end-to-end.
- [ ] `npm run build` + `npm run lint` green.

## Out of scope
- More than two levels. Auto-generating advanced content without review. Runnable/executable
  snippets (deferred with sandboxing). Retro-fitting every existing chapter (author over time).

## Blast radius
- **May modify:** `src/components/Markdown.tsx`, `ReaderChrome.tsx` (toggle),
  new depth-state helper in `src/lib/**`, `globals.css`, `.claude/skills/**` (new skill),
  demo `content/**`, `FEATURE-STATUS.md`.
- **Exclusive-access:** any `src/lib/content.ts` parsing change → **parser-v2 PR only**.
- **Must not break:** slides without advanced content, SSG, existing rendering.

## Open questions
- **Q1 (product):** Is depth a **per-slide** toggle or a **global** reader preference that
  simply reveals advanced blocks where present? Lean: global preference, per-slide reveal.
- **Q2 (legal/eng):** Confirm the OSS excerpt policy (length, attribution, which repos'
  licenses allow quoting) before authoring at scale.
- **Q3 (content):** Which first 3–5 topics get Advanced sections? You'll pick.
