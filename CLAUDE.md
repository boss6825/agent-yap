@AGENTS.md

This project's agent workflow rules live in `AGENTS.md` at the repo root.
Read and follow it before any frontend work — required workflow (skills → MCP →
skills), not optional context.

## Claude Code specifics

- Skills in `AGENTS.md` are under `~/.claude/skills/` (global) or
  `.claude/skills/` (project). If a named skill is missing, say so — do not
  pretend you read it.
- Prefer `find-docs` for Context7 CLI lookups when the Context7 MCP is not
  available; same docs source as Context7 MCP.
- MCP servers (shadcn, Context7, Chrome DevTools, Playwright, Figma) should be
  configured in this project's MCP settings. If a call fails or a server is
  disconnected, report that at the end.
- The checklist in `AGENTS.md` is mandatory for every component/page task.
  Trigger is the type of work, not special phrasing from the user.
- Skip the frontend workflow only when the prompt explicitly says to.
