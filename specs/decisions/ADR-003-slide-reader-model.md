# ADR-003: Slide reader — one `##` = one slide, SSG-prerendered, paged

## Status
Accepted

## Date
2026-07-18 (backfilled; decision predates the retrofit)

## Context
The knowledge base is long-form markdown. The product hypothesis (see `plan.md`)
is that paging beats infinite scroll for pacing, progress feel, and retention.
Agents periodically propose rewriting the reader as an infinite-scroll page or
chopping content by length rather than by structure.

## Decision
We will render each chapter as an intro slide (text before the first `##`) plus
one slide per `##` section, prerendered statically (SSG) at the route
`/read/{book}/{chapter}/{slide}`. Navigation is paged (arrows / keys / swipe /
TOC drawer).

## Rationale
Sectioning by `##` ties slide boundaries to authored structure, not arbitrary
length, so one slide is one idea. SSG makes all slides prerendered and fast, and
keeps the build a real correctness gate (a broken route fails `npm run build`).

## Alternatives Considered
| Option | Rejected because |
|---|---|
| Infinite scroll | Loses pacing/progress feel; the product bet is on paging |
| Split by length/word-count | Breaks mid-idea; boundaries stop being meaningful |
| Client-rendered slides | Loses SSG speed and build-time validation |

## Consequences
- Positive: meaningful slide boundaries; fast, prerendered, build-validated reader.
- Negative: authors must structure chapters with `##` deliberately.
- Enhancements (quizzes, widgets) are new block types inside this model, not a rewrite.

## Constraints for Agents
- Do not rewrite the reader as infinite scroll.
- Slide boundaries come from `##` sections via `content.ts` (C3); do not re-chunk elsewhere.
- Interactive elements are new markdown block types or components wired into the
  existing reader — keep the SSG model intact.
- Changes to `generateStaticParams` / the slide route are RIGOR (danger list).
