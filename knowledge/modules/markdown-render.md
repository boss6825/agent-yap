---
id: module/markdown-render
type: module
links:
  - flow/slide-rendering
  - module/reader
---

# Module: Markdown render (`src/components/Markdown.tsx`)

## Responsibility
Renders a slide's markdown string to HTML as a **server component** (no client
JS shipped for prose). Uses `react-markdown` with `remark-gfm` and
`rehype-highlight` (`detect: true`, `ignoreMissing: true`); external links get
`target="_blank"` + `rel="noopener noreferrer"`. Styling lives in `.prose-yap`
(globals.css). Does not own content parsing or layout.

## Key Boundaries
Input is a raw markdown `string` (`slide.markdown` from module/content); output
is server-rendered HTML inside a `.prose-yap` wrapper. `AskPanel` reuses
`react-markdown` directly for answer text but does not go through this component.

Status: Stub — auto-generated; expand when this module gains complexity.
