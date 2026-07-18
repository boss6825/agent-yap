---
id: module/landing
type: module
links:
  - module/content
  - module/display
  - concept/single-source-of-truth
---

# Module: Landing (`src/app/page.tsx`, `src/components/Home.tsx`)

## Responsibility
Renders the public landing page. The server component (`page.tsx`) reads
`getPrimaryBook()` from module/content, maps it to a `HomeData` shape
(title, description, total slides, start href, chapter cards with number,
display title, blurb, slide count) via `chapterDisplayTitle` (module/display),
and renders the `Home` client component. Does not own content parsing or the
reader.

## Key Boundaries
Landing currently surfaces only `getPrimaryBook()` (the alphabetically-first
valid book) — there is no multi-book picker (a documented gap; OVERVIEW). Chapter
cards deep-link into the reader (`chapter.href` → flow/slide-rendering). All data
derives from module/content, keeping it consistent with the reader
(concept/single-source-of-truth).

Status: Stub — auto-generated; expand when this module gains complexity.
