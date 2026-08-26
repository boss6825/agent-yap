# Claude run log — Agent YAP M0–M3 build

Branch: `claude/yaps` (off `d55d2da`)
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

### SOL-6 — `Markdown.tsx`: resolve relative `.md` links to reader routes

- **Status:** complete · commit `a380684` *fix: resolve relative .md cross-links to reader routes (SOL-6)*
- **Files changed:** `src/components/markdown-links.ts` (new, 248 lines), `src/components/Markdown.tsx`, `src/app/read/[book]/[chapter]/[slide]/page.tsx` (+310/−7)
- **Build:** green — exit 0, 210 pages, TypeScript clean
- **Lint:** green — exit 0, zero output
- **Slide count:** 199 → 199
- **`content/` untouched:** confirmed — `git diff d55d2da HEAD -- content/` is empty

**Recon — the issue's numbers are wrong**

| Measured | Value |
|---|---|
| `.md` link occurrences corpus-wide | **417** in **85** files |
| of which relative | **411** in **82** files |
| shapes | 182 `../path` · 142 `sub/path` · 87 bare filename |
| anchored (`.md#…`) | **264** (almost all `../glossary/Glossary.md#…`) |
| in the only live book | **36** relative, **0** anchored |
| …of those actually **rendered** today | **17** (the `Next:` link at the foot of ch. 01–17) |

By directory: research papers 163 · architecture 72 (36 inside `old docs/`) · context
engineering 46 · agentic memory 42 · rag 39 · multi-agent 32 · harness 17.

**Decision on unresolvable targets: inert *and* visibly marked — both, not either.**
Rendered as a non-link `<span class="text-ink-2 underline decoration-dotted …"
data-unresolved-link="…">glossary term<span class="sr-only"> (not published yet)</span></span>`.
Nothing to click, nothing focusable (`tabIndex === -1`), muted `--color-ink-2` (existing
token, no new color), and assistive tech reads "glossary term (not published yet)". A
`title` tooltip was written first and then **removed**: on a non-interactive element it is
keyboard-unreachable and it hijacked the accessible name — the tree read
`generic "Not published yet: ../glossary/Glossary.md#embedding"` instead of the link text.

**Acceptance**

| Criterion | Result | Evidence |
|---|---|---|
| build + lint green | MET | both exit 0 |
| relative link resolves to `/read/<book>/<chapter>/<slide>` | MET | all 17 real corpus links resolve in the shipping build; `grep 'href="[^"]*\.md[^"]*"' .next/server/app/read` returns **nothing**. Clicked ch.06 slide 10 → `/read/architecture-and-system-design/07-retrieval-strategies/0` |
| anchored links land on the right **slide** | MET | `#a-decision-guide` (an `##`) → slide **4**; `#2-retrieval-augmented-generation-rag` (an `###` nested inside "The three strategies") → slide **1**, not slide 0 |
| unresolvable target not silently broken | MET | decision above |
| external + in-page anchors unchanged | MET | external keeps `target="_blank" rel="noopener noreferrer"`; `#the-six-parts` verbatim; `../img/diagram.png` passes through untouched |

The anchor map is built from `##` slide titles plus every ATX heading inside each slide's
markdown, fenced code excluded, with a GitHub-slugger-compatible slugifier and two fallback
passes.

**Browser verification.** `npm run build` → `npx next start -p 3014` → `preview_start {url}`.
Port 3005 / PID 3672 never touched. Because the live book has **zero** anchored links and its
only unresolvable link lives in the never-rendered `index.md`, those two criteria are
untestable against shipped content — the agent temporarily inserted a 10-case probe into
`chapter-01-anatomy.md`, verified, restored the file, and rebuilt. Verified afterwards:
`git diff d55d2da HEAD -- content/` empty, `grep -rn "SOL6TESTBLOCK" content/ src/` → none.

Accessibility tree on the probe page showed `link` for resolved targets and `generic` (not
`link`) for the unresolved one. Measured contrast, computed in-page with the WCAG formula:
dark theme unresolved span `rgb(152,152,157)` on `rgba(10,10,12,.72)` → **6.89:1**, resolved
link **6.56:1**; light theme unresolved **5.07:1**, resolved **4.70:1**. Mobile 375×812 →
`scrollWidth 375`, no horizontal overflow. `read_console_messages` after every navigation:
"No console logs."

**Screenshots: NOT captured.** `computer{action:"screenshot"}` failed on every attempt with
"the Browser pane is not displayed, so the page is not compositing frames", including after
`tabs_select`. Substituted DOM attribute dumps, computed styles and the full accessibility
tree rather than describe an image nobody saw.

**What the issue got wrong**

- **F-011 · The 324-links-across-47-files figure is wrong.** Measured **411 relative links
  across 82 files** (417/85 counting the 6 external ones). The master plan §1 table carries
  the 324 number, and `research/02-code-ux-audit.md` carries **no `file:line` evidence for
  links at all** — the issue's Source promised evidence that is not there.
- **F-012 · "324 dead links fixed" books an M3 payoff to Week 1.** Only **17** relative `.md`
  links currently render anywhere on the site. 375 are in dark folders and 19 more are in
  `index.md` files the reader never renders. The resolver handles all 411, but 394 stay
  invisible until M3.
- **F-013 · The Files list is incomplete.** `Markdown.tsx` took only `{ children }` and has no
  ambient way to learn the current book/chapter, so the call site
  `src/app/read/[book]/[chapter]/[slide]/page.tsx` had to change too (2 call sites, 1 file).
- **F-014 · Pre-existing bug fixed in passing.** The old `a({ href, children, ...props })`
  spread react-markdown's `node` (the hast AST) onto the DOM element, emitting
  `node="[object Object]"` on **every anchor in the corpus**. Confirmed with
  `renderToStaticMarkup` on the installed React 19; now stripped, 0 in the built HTML.
- **F-015 · Anchors route but do not scroll.** There is no `rehype-slug` in the pipeline, so
  no heading carries an `id`. The link lands on the correct *slide* (which is what the
  criterion asks) and the fragment is preserved for forward-compatibility, but nothing
  scrolls. The corpus's own in-page `#anchor` links are equally inert today.
- **F-016 · Screenshots are not obtainable from this headless session** — see above. Applies
  to every issue in this run, not just this one.

**Needs to fold into M2 (`content.ts`): nothing required.** The mapping is fully derivable
from existing exports (`getBook`, `getChapter`, `Chapter.slides[].{title,markdown,sectionIndex,href}`).
One coupling to know about: `markdown-links.ts` **mirrors** two rules that live in
`content.ts` — "book slug = directory name under `content/`" and "chapter slug = filename
minus leading `chapter-` and trailing `.md`". If M2 changes either (frontmatter-driven slugs,
`###` sub-splitting shifting slide indices), the resolver must change with it. A
`resolveContentPath(fromBook, relativePath)` export would remove the duplication —
nice-to-have, not a blocker.

**Noted, deliberately not done**

- The moment M3 gives `content/glossary/` an `index.md` and a `chapter-NN-*.md` filename, all
  264 glossary anchors resolve with **no further code change**. Worth re-verifying then.
- `content/architecture-and-system-design/index.md` and its 19 chapter links are never
  rendered by the reader. If that is meant to be a book landing page, it is a missing
  surface, not a link bug.

