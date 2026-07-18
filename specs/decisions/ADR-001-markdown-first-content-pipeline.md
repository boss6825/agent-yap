# ADR-001: Markdown-first content pipeline; content.ts is the single source of truth

## Status
Accepted

## Date
2026-07-18 (backfilled; decision predates the retrofit)

## Context
Agent YAP serves an educational knowledge base. Content is authored as markdown
in `content/<book>/`, generated with Claude from source articles/papers. The
site needs full-text search, an "Ask the docs" RAG endpoint, and a static slide
reader — all reading the same content. A recurring temptation for agents is to
introduce a CMS, a database, or to re-parse markdown ad hoc in a component or an
API route.

## Decision
We will keep content as markdown on disk and parse it in exactly one module,
`src/lib/content.ts`, which exposes books → chapters → slides. Every other part
of the system (reader, search, ask) imports from `content.ts`; nothing else
touches the `content/` filesystem layout or re-parses markdown.

## Rationale
One parser means one place where the "what is a book / chapter / slide"
definition lives. Search indexing, RAG retrieval, and SSG route generation stay
consistent for free. No database means no migration burden and trivially
reproducible static builds.

## Alternatives Considered
| Option | Rejected because |
|---|---|
| Headless CMS / database | Operational weight, migrations, and drift for content that is already git-versioned markdown |
| Parse markdown where needed | Guarantees divergent definitions of a "slide" across reader/search/ask |

## Consequences
- Positive: single definition of content shape; reproducible SSG; git is the CMS.
- Negative: `content.ts` is load-bearing — a bug there breaks everything.
- Risk: it becomes a bottleneck/exclusive-access file (mitigated by C2/C3 lanes).

## Constraints for Agents
- Import book/chapter/slide data from `src/lib/content.ts`; never re-parse markdown (C3).
- Do not add a CMS or database for content.
- A folder is a book only with `index.md` + `chapter-NN-*.md`; respect that convention.
- `src/lib/content.ts` is exclusive-access — coordinate before editing.
