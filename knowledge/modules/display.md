---
id: module/display
type: module
links:
  - flow/slide-rendering
  - module/reader
  - module/landing
---

# Module: Display helpers (`src/lib/display.ts`)

## Responsibility
Frontend display formatting. Currently a single export, `chapterDisplayTitle`,
which strips an embedded "Chapter N:" / "Chapter N —" prefix from a chapter H1
so the UI can render the chapter number separately from the title. Pure string
helper; owns no data or state.

## Key Boundaries
Used by module/reader (`SlidePage`, `ReaderChrome`, the TOC) and module/landing.
Purely presentational — it does not alter the underlying `Chapter.title` in
module/content, only its rendered form.

## Note (accuracy)
This stub replaces the `modules/chapter-color.md` originally requested. **There
is no `src/lib/chapter-color.ts` in the repo at HEAD** (never existed in git
history); `FEATURE-STATUS.md` row 4 references it but is stale. No per-chapter
accent-color module exists in code today. `display.ts` is the real small
frontend helper module, so it is documented here instead. See the report /
`validate.sh` staleness notes.

Status: Stub — auto-generated; expand when this module gains complexity.
