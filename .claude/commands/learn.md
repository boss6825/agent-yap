# Learn — capture a durable learning (Maintenance)
**Arguments:** $ARGUMENTS

## When to use
After a non-obvious fix, a surprising gotcha, a repeated mistake, or a decision
worth remembering. **Mandatory after every `/fix --urgent` hotfix** (G7).

## When NOT to use
- A rule that should bind future work → promote to `specs/conventions/` or the
  Constitution, not a learning.
- A pipeline/status update → `specs/PROGRESS.md` / `FEATURE-STATUS.md`.

## Preamble
Read: the fix/change context, `specs/learnings/README.md` (Learning frontmatter),
existing `specs/learnings/<module>/` (avoid duplicates).

## Phase 1: Write the learning
> **Normative:** Create `specs/learnings/<module>/<key>.md` with the YAML
> frontmatter defined in `specs/learnings/README.md`:
> ```yaml
> ---
> type: pattern | pitfall | gotcha | convention | decision | debugging
> confidence: <1-10>
> source: observed | inferred
> module: <module>
> files: [<path>, <path>]
> created: <YYYY-MM-DD>
> ---
> ```
> Body: one-line "what happened", then **Why** (root cause) and **How to apply**
> (what to do next time — include what was deliberately NOT fixed and why).
Gate: file exists with valid frontmatter + Why + How-to-apply.

## Phase 2: Link back
> **Advisory:** Reference the originating PR/issue and the module's knowledge node
> if one exists. Keep `files:` accurate — skills read learnings by module in their
> preamble.
Gate: module + files fields are real paths.

## Phase 3: Close out
> **Normative:** Do not commit/push (C9). If the file is under `knowledge/` it uses
> the `knowledge:` commit prefix (docs rule) — but learnings live in `specs/learnings/`.
Gate: drafted, staged, not pushed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "I'll remember this" | Future-you and teammate #2 won't. Write it down (G7). |
| "Hotfix worked, skip the learning" | `--urgent` makes the learning MANDATORY. No skip. |
| "It's really a rule" | Then promote it to a convention/Constitution rule — a learning won't be enforced. |

## Red Flags
- Frontmatter missing `type`/`confidence`/`module`.
- A learning that's actually an enforceable rule (route it instead).
- `--urgent` hotfix with no learning.

## Exit Criteria
- [ ] `specs/learnings/<module>/<key>.md` with valid frontmatter
- [ ] Why + How-to-apply (incl. what was deliberately not fixed)
- [ ] Real module/files links; nothing pushed
