# Learnings

> Small, durable, per-incident lessons the agent re-reads. One file per learning:
> `specs/learnings/<module>/<key>.md`. Written by `/learn`; **mandatory after every
> `/fix --urgent` hotfix** (G7). Skills read the relevant module's learnings in
> their preamble.

## Frontmatter (required)

```yaml
---
type: pattern | pitfall | gotcha | convention | decision | debugging
confidence: 7            # 1-10
source: observed | inferred
module: <module>         # e.g. content, search, ask, reader
files: [<path>, <path>]  # real repo paths this lesson touches
created: YYYY-MM-DD
---
```

Body: a one-line "what happened", then:
- **Why:** root cause / reasoning.
- **How to apply:** what to do next time — including what was deliberately NOT
  fixed and why.

## Rules
- A learning records a lesson; it does not *enforce* anything. If the lesson
  should bind future work, promote it to `specs/conventions/` or the Constitution.
- Keep `files:` accurate — that is how skills find relevant learnings.
- Learnings live here, not under `knowledge/` (which explains system structure).
