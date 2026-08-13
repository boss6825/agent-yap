# Spec 01 — Reading scaffold blocks

> **Intent.** Wrap our reading content with the lightweight learning scaffolds that make
> TUF sticky — **Common Doubts**, **FAQs**, **Fun Facts**, and a progressive
> **reveal/"show more"** for dense ideas — authored as simple markdown blocks so any
> chapter can drop them in. This turns flat prose into "prose + guardrails" without
> touching the assessment engine.

## Prior art / where it plugs in
- Renderer: [src/components/Markdown.tsx](../../src/components/Markdown.tsx)
  (react-markdown + remark-gfm + rehype-highlight). This is the single place block
  types are mapped to components.
- A callout/typography pass is already planned (`docs/pm/prd/interactive-lessons.md`
  R-A3; `plan.md` Phase 1) — **this spec is the concrete authoring format for it.**
  Coordinate so we ship one callout system, not two.
- Progressive **hints inside a check/quiz** are already spec'd
  (`docs/redesign-2026/research/07-assessment-system.md` §6). This spec's `reveal` is the
  *reading-time* cousin (no scoring, no `assisted` flag) — keep them visually distinct.
- The parser lives in the exclusive-access [src/lib/content.ts](../../src/lib/content.ts);
  see Blast radius.

## Requirements
- **R-1 Authoring syntax.** A container-directive style authors can write in `.md`,
  e.g. `:::doubt`, `:::faq`, `:::funfact`, `:::reveal`. Prefer the
  `remark-directive` convention over raw HTML so it stays portable and lint-able.
  (Confirm against the parser-v2 direction before finalizing — see Open questions.)
- **R-2 Common Doubts.** A titled block listing anticipated confusions as Q→A pairs.
  Renders collapsed by default with a clear "common doubts" affordance.
- **R-3 FAQs.** Q→A list, visually lighter than Common Doubts (FAQs = lookup;
  Doubts = misconceptions we pre-empt).
- **R-4 Fun Facts.** Short, single-line-ish aside with a distinct playful token (still
  within our accent system — no new raw color).
- **R-5 Progressive reveal.** A `reveal` block hidden behind a "Show more / Reveal"
  control for dense derivations or optional depth; expands in place, remembers nothing
  (stateless).
- **R-6 Graceful fallback.** If a directive is unknown or malformed, render its inner
  markdown as plain content — **never** blank or throw (reading is never blocked).
- **R-7 A11y.** Collapsible blocks are real `<button>`+`aria-expanded`/`<details>`;
  keyboard-operable; visible focus; screen-reader labels ("Common doubt", etc.).

## Design notes (for Claude design)
- Four block styles that are instantly distinguishable **by shape + label + icon**, not
  by loud color (accent ≤2% rule from [08](08-visual-system.md)). Suggest: doubt = left
  border + "?" mark; faq = plain disclosure list; funfact = inline pill/aside; reveal =
  ghost "Show more" affordance.
- Must look right inside the existing `.prose-yap` reading card and in dark theme.
- These are decoration on top of content — keep them calm; the prose is the star.

## Acceptance
- [ ] A chapter markdown file using all four directives renders correctly in the reader.
- [ ] Unknown/broken directive degrades to plain text, no console error, build stays green.
- [ ] Collapsible blocks keyboard-operable + labeled; contrast ≥ 4.5:1 in both themes.
- [ ] `npm run build` (all slides prerender) + `npm run lint` green.

## Out of scope
- Scored hints (that's the assessment engine). Worked examples (deferred). Any change to
  `/api/*`.

## Blast radius
- **May modify:** `src/components/Markdown.tsx`, `src/app/globals.css` (block styles),
  a small dep for directives if chosen (`remark-directive`), one demo chapter under
  `content/**`, `FEATURE-STATUS.md`.
- **Exclusive-access touch:** if parsing needs `src/lib/content.ts`, that goes through the
  **parser-v2 coordination** (one PR, one owner) — do not edit it in parallel.
- **Must not break:** static generation of all slides, existing markdown rendering.

## Open questions
- **Q1 (eng):** Is `remark-directive` the agreed syntax, or does parser-v2 prefer another
  block convention? Resolve with the content-lane owner before coding.
- **Q2 (design):** Do Fun Facts belong inline mid-slide or only at slide end? Lean: author's choice.
