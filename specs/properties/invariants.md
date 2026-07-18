# Property Registry

> Global roll-up of every `P-<MODULE>-NNN` invariant. IDs are **append-only,
> never reused**. Each spec that introduces a P-ID registers it here.
> Verification note: this repo has no test runner (ADR-005) — the "Verified by"
> column records the real mechanism (type system, build, manual reproduction).

## Metadata
- status: active
- owner: @vivek.d
- last-verified: 2026-07-18

<!-- GENERATED-SECTION -->
<!-- Filled by /spec as features are written. The entries below were derived from
     the knowledge layer (knowledge/invariants/) during the Phase-4 bootstrap:
     they document behavior that already holds in code. A full feature spec is
     written on-touch (C1) when the owning code is next modified. -->

### CONTENT
- **P-CONTENT-001: Book discovery** — For any folder under `content/`, it is
  exposed as a book **iff** it contains both an `index.md` and at least one
  `chapter-NN-*.md` file. Source: existing behavior of `src/lib/content.ts`.
  Verified by: build (SSG route generation) + `knowledge/invariants/book-discovery.md`.

### ASK
- **P-ASK-001: Grounded answers** — For any question, the Ask endpoint's answer
  cites only slides returned by retrieval; it never fabricates citations. Source:
  existing behavior of `src/lib/ask.ts`. Verified by: manual reproduction +
  `knowledge/invariants/grounded-answers.md`. (Post-hoc grounding verification
  beyond the prompt is a documented TBD.)

<!-- /GENERATED-SECTION -->

<!-- HUMAN-EDITED -->
## Module ID conventions
`P-CONTENT-NNN` (content parser) · `P-SEARCH-NNN` (search) · `P-ASK-NNN` (RAG)
· `P-READER-NNN` (reader UI). Add new module prefixes here as modules gain specs.
<!-- /HUMAN-EDITED -->
