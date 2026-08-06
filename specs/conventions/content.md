# Convention: Content Voice & Structure

> Governs everything under `content/` that renders on the site. Enforces C5.
> The fix for "the agent wrote off-key content" is adding a concrete example here.

## Metadata
- status: active
- owner: @boss6825
- last-verified: 2026-07-18

## Rules
- **No em dashes** (`—`) in generated teaching content. Use commas, colons,
  parentheses, or two sentences.
- **Practitioner-focused.** Explain the mechanism (how/why it works, failure
  modes, trade-offs), not a marketing summary.
- **Slide shape.** One `##` section = one slide; the text before the first `##`
  is the chapter intro slide. Keep each section to one idea.
- **Book-ready layout.** A folder is a live book only with `index.md` (first `#`
  = title, first `>` blockquote = description) **and** `chapter-NN-*.md` files.

## Examples
| Off-key | On-key |
|---|---|
| "Agents are revolutionary — they change everything." | "An agent loop calls a tool, feeds the result back into context, and repeats until a stop condition. The failure mode is unbounded looping; cap iterations." |
| "Our RAG is best-in-class." | "Naive RAG retrieves top-k by embedding similarity. It fails when the answer spans chunks; agentic RAG re-queries based on what the first pass missed." |
