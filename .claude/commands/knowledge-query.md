# Knowledge-query — 4-layer retrieval + flow trace (Maintenance, read-only)
**Arguments:** $ARGUMENTS  <!-- the question; add --flow <name> for a flow trace -->

## When to use
To answer "why/how does X work here" before changing code — retrieve grounded
context from the knowledge layer and specs instead of guessing. Read-only.

## When NOT to use
- Updating knowledge after a change → `/knowledge-sync`.
- Library/framework API docs → `find-docs` / Context7 (C7).

## Preamble
Read-only across `knowledge/`, `specs/`, `.claude/rules/docs.md`. Never edit here.

## Phase 1: 4-layer retrieval
> **Normative:** Search in this order, stopping when the question is answered:
> 1. **Flows** — `knowledge/flows/` (the value paths / sequences).
> 2. **Modules** — `knowledge/modules/` (Responsibility, Boundaries, Relationships, Design Decisions).
> 3. **Concepts & Invariants** — `knowledge/concepts/`, `knowledge/invariants/`, `specs/properties/invariants.md`.
> 4. **Specs & learnings** — `specs/features/**`, `specs/learnings/**`, ADRs.
> If `knowledge/` is not yet bootstrapped, fall back to specs + code and say so.
Gate: answer sourced to specific files, or gap explicitly reported.

## Phase 2: --flow trace (optional)
> **Normative:** With `--flow <name>`, load `knowledge/flows/<name>.md` and walk
> its mermaid sequence, resolving each participant to its module node and each
> arrow to the real method/event. Report the end-to-end path with file anchors.
Gate: trace names real modules/methods, verified against code, none invented.

## Phase 3: Answer
> **Normative:** Answer with citations (repo-root-relative paths). Flag anything
> marked TBD or not verifiable in code as of HEAD — do not fill gaps with guesses.
Gate: cited answer delivered; no writes performed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "I'll answer from memory" | The point is grounded retrieval. Cite the layer or report the gap. |
| "The flow diagram looks close" | Verify participants/arrows against code before trusting a trace. |
| "I'll fix the stale node while here" | That's `/knowledge-sync`. This skill is read-only. |

## Red Flags
- An answer with no file citations.
- A flow trace naming modules/methods that don't exist in code.
- Editing any file.

## Exit Criteria
- [ ] Retrieval walked flows → modules → concepts/invariants → specs/learnings
- [ ] `--flow` trace (if used) verified against code
- [ ] Cited answer; gaps/TBD flagged; nothing written
