# Progress

> Task-level / pipeline progress within features (distinct from `FEATURE-STATUS.md`,
> which is product-level truth). Tracks where each in-flight feature sits in the
> Tier-4 pipeline.

## Metadata
- status: active
- owner: @vivek.d
- last-verified: 2026-07-18

## In-flight features
| Slug | Pipeline stage | Next action | Notes |
|---|---|---|---|
| reader/ide-shell | implement | build slices S1–S5, then /check | RIGOR; spec+plan written 2026-07-19; adversarial G3 review by Codex session recorded in review.md |

## Retrofit progress (this operating-system adoption)
| Phase | State |
|---|---|
| 0 Audit | done |
| 1 Map (CLAUDE.md, FEATURE-STATUS.md) | done |
| 2 Contract plane (specs/) | done |
| 3 Enforcement | done (staged; hooks not yet activated — run scripts/setup-git-hooks.sh) |
| 4 Knowledge layer | done (staged; commit with `knowledge:` prefix) |
| 5 PM plane | done (staged) |
| 6 Skills | done (staged) |
