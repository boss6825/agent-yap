---
paths: ["**/*.md"]
---

# Markdown / docs rules

- **Diagrams are Mermaid-first.** Express architecture, flows, and sequences as
  fenced ```mermaid blocks in the doc itself — not screenshots or external image
  links. Only fall back to an embedded asset when Mermaid genuinely cannot model
  the diagram.
- **Commit prefix.** Changes under `knowledge/` use the `knowledge:` commit-message
  prefix so the knowledge layer is separable in history.
- **Links are repo-root-relative.** Link to other docs by their path from the repo
  root (e.g. `specs/CONSTITUTION.md`), not machine-absolute paths or bare
  filenames. Keep links resolvable from a clean checkout.
