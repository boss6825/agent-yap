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

### SOL-5 — `Markdown.tsx`: add `rehype-raw` so the 490 authored answers render

- **Status:** complete · commit `70c1043` *fix: render authored HTML in slides via rehype-raw (SOL-5)*
- **Files changed:** `src/components/Markdown.tsx`, `package.json`, `package-lock.json` (+190/−1)
- **Build:** green — exit 0, 210 static pages, `✓ Generating static pages using 11 workers (210/210) in 9.1s`
- **Lint:** green — exit 0, zero findings
- **Slide count:** 199 → 199 (unchanged; this issue reveals content inside existing slides)

**Acceptance**

| Criterion | Result | Evidence |
|---|---|---|
| build + lint green | MET | both exit 0 |
| `<details><summary>Answer</summary>` renders as a working native disclosure, collapsed by default | MET | `/read/architecture-and-system-design/01-anatomy/6` on clean load: 15 `<details>`, `openCount: 0`, `hasAttribute('open') === false`, `details.offsetHeight === 27 === summary.offsetHeight` (body contributes zero height). Click → `open: true`, height 27 → 82 |
| verified in the browser on a real chapter | MET | see below |
| code highlighting unchanged | MET | 973 `hljs-*` spans across 20 prerendered slides; live computed token color `rgb(155,35,147)`; a Python fence **nested inside a `<details>`** carries 54 `hljs-*` spans — direct proof the plugin order is right |
| GFM tables unchanged | MET (by computation, **not** in the browser) | the live book contains **zero** GFM tables, so there was nothing to look at. Verified instead by running the exact plugin array from `Markdown.tsx` through `react-dom/server`: `<table>/<thead>/<th>/<td>`, `<del>`, task-list checkboxes, `hljs`, and a collapsed `<details>` — 11/11 assertions pass |
| headings unchanged | MET | `<h3>` present in prerendered output |

**Browser verification.** Production build served on free port 3013, opened via
`preview_start {url}`. Routes: `01-anatomy/6` (15 disclosures), `02-agent-loop-pattern/1`
and `/2` (regression), `/` (landing). Accessibility tree lists every disclosure and
summary as interactive; `Tab` reaches the summary (focus outline `0.8px auto`).
Measured contrast on the rendered page — dark `rgb(245,245,247)` on
`rgba(10,10,12,0.72)` = **18.17:1**; light `rgb(29,29,31)` on `rgba(255,255,255,0.82)`
= **16.83:1**. Mobile 375×812: `scrollWidth === innerWidth === 375`, no horizontal
overflow. `read_console_messages`: no logs at all on any route. 3 screenshots.

**What the issue got wrong**

- **F-005 · "490 assessment items … become visible" overstates this fix.** It reveals
  **264** — every `<details>` in the one wired book (`content/architecture-and-system-design/`,
  264 by grep, 264 in the prerendered HTML, 100% coverage). The other ~226 live in the
  seven dark folders and in `old docs/` and stay invisible until M3. The issue's framing
  implies all 490 appear from this one file change; they do not.
- **F-006 · The "GFM tables still work" criterion is unverifiable in the browser on this
  branch.** `grep -c '^|' content/architecture-and-system-design/chapter-*.md` returns
  nothing and the prerendered HTML has 0 `<table>`. Substituted a server-render assertion
  and disclosed it rather than claiming a browser check.
- **F-007 · `preview_start {name: "dev"}` cannot reach a worktree, and `autoPort: true` is
  inert for this repo.** Two defects: (a) the harness resolves `.claude/launch.json` from the
  *session* cwd, not the worktree, so it kept reporting "Configured port 3005" and
  `EnterWorktree` refused; (b) `autoPort` sets `PORT` in the environment but
  `package.json`'s `"dev": "next dev -p 3005"` hardcodes the port and ignores it — the harness
  assigned 53174, `next dev` still tried 3005, found it occupied, and died. **Standing
  workaround for the rest of this run:** build, then `npx next start -p <free port>` in a
  background shell and open it with `preview_start {url}`. That verifies the production
  output — which is what ships — and never touches port 3005.
- **F-008 · Space will page the slide instead of opening the answer.**
  `src/components/reader/ReaderChrome.tsx:187` preventDefaults `" "` on a `window` keydown
  listener. Space is a standard activation key for `<summary>`, so as of this commit the 264
  newly visible disclosures have a keyboard affordance that navigates away instead of
  expanding. Already queued as SOL-9 — but SOL-5 is what makes it user-facing.
- **F-009 · Keyboard *activation* of `<summary>` is not verifiable through this harness.**
  Synthetic events reach the `SUMMARY` with `defaultPrevented: false` and, for space,
  `key: ""` — a value Chromium's native activation path never matches. Tab reachability and
  focus *are* verified; no app handler intercepts Enter. Recorded as **not verifiable**, not
  as pass or fail.
- **F-010 · `AGENTS.md`'s skills inventory is stale and its "Done means" clause is
  unsatisfiable.** Of the skills AGENTS.md names, this session has `find-docs` only.
  `impeccable`, `design-an-interface`, `web-design-guidelines`,
  `vercel-react-best-practices`, `design-taste-frontend`, `high-end-visual-design`,
  `premium-frontend-ui`, `shadcn`, `tailwind-v4-shadcn`, `accessibility`, `emil-design-eng`
  are absent, and the **shadcn MCP server is not connected**. So "Done means: impeccable
  found no blocking issues" cannot be met by any agent in this repo today.

**Disclosed deviation.** To get a real HTTP origin the agent ran `npx next start -p 3013`
via a background shell (production server, not `next dev`, free port, own worktree). Port
3005 and Cursor's tree were never touched — confirmed before and after that only PID 3672
held 3005. It also temporarily edited the worktree's `.claude/launch.json` while probing and
reverted it with `git checkout` before committing; it is not in the commit.

**Noted, deliberately not done**

- `AskPanel.tsx:151` and `reader/ChatPanel.tsx:532` also render with `ReactMarkdown`, over
  **LLM output**. Adding `rehype-raw` there would be a straight XSS vector. Left alone on
  purpose — if anyone later "makes the renderers consistent", that is the trap.
- `.prose-yap` has no `details`/`summary` rules, so 264 disclosures render with pure browser
  defaults (`cursor: auto`, no indent, bare marker). Correct per "do not restyle", but it is
  now the most-repeated element in the corpus. M6 territory; `globals.css` was not in Files.
- The `<details>` sits inside the `<li>` of option "D)" as a lazy continuation, so the answer
  renders flush under the last distractor. A parser concern (M2 `## Review` → `questions[]`).

