# Progress

> Task-level / pipeline progress within features (distinct from `FEATURE-STATUS.md`,
> which is product-level truth). Tracks where each in-flight feature sits in the
> Tier-4 pipeline.

## Metadata
- status: active
- owner: @boss6825
- last-verified: 2026-07-18

## In-flight features
| Slug | Pipeline stage | Next action | Notes |
|---|---|---|---|
| reader/ide-shell | ship (pre-PR) | owner: verify BYOK with a real key, then push + open PR | RIGOR; S1–S5 committed on feature/reader-ide-shell; build+lint green; compliance.md entry written 2026-07-19 |

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
