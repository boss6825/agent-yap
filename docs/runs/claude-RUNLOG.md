# Claude run log — Agent YAP M0–M3 build

Branch: `claude/yap-build-m0-m3` (off `d55d2da`)
Worktree: `C:/Users/arpit/Projects/agent-YAP-claude` — **isolated**. The primary
tree `C:/Users/arpit/Projects/agent YAP` was left on `karsaa/yaps-build` with
Cursor's in-flight changes untouched (see Finding F-000).

## Baseline (before any issue)

| Metric | Value |
|---|---|
| `npm run build` | green — 210 static pages, compiled in 36.7s |
| `npm run lint` | green — zero output |
| Live books | 1 (`architecture-and-system-design`) |
| **Slide pages generated** | **199** (`.next/server/app/read/**/*.html`) |
| Dark content folders | 7 (`agentic memory`, `building coding agents and harnesses`, `context engineering`, `glossary`, `multi-agent`, `rag`, `research papers`) |

## Findings

### F-000 — Cursor was live in the primary working tree
At 10:12 IST on 2026-08-26 `src/components/Markdown.tsx`, `package.json` and
`package-lock.json` in `C:/Users/arpit/Projects/agent YAP` carried uncommitted
edits (a `rehype-raw` addition — SOL-5 work) with mtimes two minutes old, and a
dev server was already LISTENING on port 3005 (PID 3672). Two agents sharing one
working tree would have corrupted each other's edits.

Action taken: the primary tree was restored to `karsaa/yaps-build` with its dirty
files intact, and this run moved to a dedicated `git worktree` at
`C:/Users/arpit/Projects/agent-YAP-claude`. `node_modules` there is a real
install (`npm ci`), not a junction — Turbopack rejects a junctioned
`node_modules` with `Symlink [project]/node_modules is invalid, it points out of
the filesystem root`. Dev servers in this worktree use `autoPort`, not 3005.

---

## Issues

