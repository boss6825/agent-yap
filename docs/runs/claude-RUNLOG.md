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

### SOL-7 — `Markdown.tsx`: render the 33 mermaid diagrams

- **Status:** complete · commit `a2cf702` *feat: render mermaid fences as themed diagrams (SOL-7)*
- **Files changed:** `src/components/Markdown.tsx`, `src/components/MermaidDiagram.tsx` (new, 193 lines), `package.json`, `package-lock.json` (+1359/−1)
- **Build:** green — `✓ Compiled successfully in 10.6s`, `✓ Generating static pages (210/210) in 3.6s`. Baseline was 11.7s / 3.9s — **build time unchanged within noise**, because mermaid never executes at build time. The one Turbopack warning (`next.config.ts → content.ts → llms-full.txt` dynamic `path.join`) is present on the baseline build too.
- **Lint:** green — exit 0, zero output
- **Slide count:** 199 → 199
- **`content/` untouched:** confirmed — `git diff d55d2da HEAD -- content/` empty

**Recon — the issue's number is exactly right**

- Corpus-wide: **33** ```mermaid fences. Issue said 33. Correct.
- Concentration: **33 of 33 (100%)** in `content/research papers/` across 17 files —
  `01-Foundational-Modelling/explanations` 16 · `02-Planning-and-Reasoning/explanations` 13 ·
  `04-Benchmarks/explanations` 4.
- Live book `content/architecture-and-system-design/`: **0**. So "renders in both themes"
  could not be verified against shipped content — verified with a temporary probe slide that
  was removed and rebuilt afterwards.
- All 33 are `flowchart` (LR/TD), all using `<br/>` in labels.

**Rendering decision: client island, lazy-loaded, mounted only for a `<pre>` that holds a
mermaid fence.** Build-time was *tested*, not assumed, and does not work in this stack:

- `await import('mermaid')` in Node succeeds; `mermaid.render()` then throws
  `ReferenceError: document is not defined` (measured, mermaid 11.17.2).
- A jsdom shim does not rescue it: **135 files** under `node_modules/mermaid/dist/chunks/`
  call `getBBox()`, the SVG text-metrics API jsdom does not implement — labels would be
  mis-measured rather than fail loudly.
- The project's own answer, `@mermaid-js/mermaid-cli`, drives headless Chromium via
  Puppeteer. A ~300MB browser download inside `npm run build` costs far more than it saves,
  and the issue does not authorise it.

**Measured cost** (from the chunks a slide's prerendered HTML actually references):

| | bytes | chunks |
|---|---|---|
| slide **without** a diagram, baseline | 1,031,719 | 14 |
| slide **without** a diagram, after | **1,034,123** | 14 |
| delta | **+2,404 (+0.23%)** — the wrapper only | — |
| slide **with** diagrams | — | 33 requests vs 18 |
| the 15 mermaid-only chunks | **809,353 uncompressed** | — |

That 809 KB is what a static import would have added to all 199 slides; it now lands only
where a diagram exists.

**Acceptance**

| Criterion | Result | Evidence |
|---|---|---|
| build + lint green | MET | both exit 0; 210 pages with the change, 211 with the probe slide |
| mermaid fence renders as a diagram in **both** themes | MET | all 33 corpus fences on one probe slide: **33 SVGs, 0 left as code blocks**, 187 `g.node`, 159 `path.flowchart-link`. Flipping the real theme toggle redrew all 33 — one distinct value each, so nothing went stale. `<br/>` survives as real `<br>` inside labels |
| malformed fence degrades to a code block, no crash | MET | stayed `PRE>CODE` with `class="language-mermaid"` and its original text; nothing thrown, no mermaid error SVG (`suppressErrorRendering: true`), and the two valid diagrams on the same slide rendered normally |
| wide diagrams scroll in their own container; body never scrolls horizontally | MET | at 610px: containers `clientWidth 524 / scrollWidth 1453` and `524 / 2093`, both scrolling, `documentElement.scrollWidth === innerWidth` (610 === 610). At **375×812**: `304 / 1453` and `304 / 2093`, `375 === 375`, label font stays 15px. Also 610 === 610 with all 33 on one page |
| reduced-motion + no-JS behaviour stated | MET | below |

**Theme evidence** — computed on the rendered page, every value traceable to `globals.css`:

| | dark | light |
|---|---|---|
| container bg | `rgb(28,28,30)` = `--color-canvas-2` | `rgb(245,245,247)` = `--color-canvas-2` |
| container border | `rgba(255,255,255,0.1)` = `--color-hairline` | `rgba(0,0,0,0.08)` = `--color-hairline` |
| node fill | `rgb(0,0,0)` = `--color-canvas` | `rgb(255,255,255)` = `--color-canvas` |
| node stroke / edge | `rgb(152,152,157)` = `--color-ink-2` | `rgb(110,110,115)` = `--color-ink-2` |
| label text | `rgb(245,245,247)` = `--color-ink` | `rgb(29,29,31)` = `--color-ink` |
| **contrast, label on node** | **19.29:1** | **16.83:1** |
| **contrast, stroke/edge on container** | **5.93:1** | **4.66:1** (1.4.11 needs 3:1) |

No white diagram box in dark mode. No raw colors: mermaid cannot be handed
`var(--color-ink)` because it does khroma colour maths on its theme variables, so the values
are read off the live document with `getComputedStyle` — and if a token comes back empty the
component **refuses to draw** rather than inventing a fallback palette.

**Reduced motion — nothing animates (measured).** Across the rendered SVGs: 0
`<animate>`/`<animateTransform>`/`<animateMotion>` elements and **0 elements with a computed
`animationName !== 'none'` or a transition**. Mermaid declares `.edge-animation-slow/fast`
inside each SVG's own `<style>`, but those apply only to edges an author opts in
(`e1@{ animate: true }`), which no corpus diagram does. The `<pre>` → SVG swap is an instant
React state change with no transition.

**No-JS — the fence renders as the code block it is today (measured).** On the prerendered
HTML: 3 `class="language-mermaid"` code blocks, **0** `<svg aria-roledescription>`. By
construction — the untouched `<pre>` is passed as `children` into the island and is what the
server emits; the diagram only ever replaces it after a successful client render.

**Regression (SOL-5, SOL-6).** Both intact on `/read/architecture-and-system-design/01-anatomy/6`:
15 `<details>` disclosures with `<summary>Answer</summary>`, one opened to reveal its answer;
the relative cross-link resolved to `/read/architecture-and-system-design/02-agent-loop-pattern/0`
with **0** `data-unresolved-link` spans. A plain ```python block still gets
`class="hljs language-python"`, so `plainText: ["mermaid"]` scoped correctly.

**Browser verification.** `npx next start -p 3015` → `preview_start {url}`. 3005 / PID 3672
untouched, port free after teardown. Accessibility tree: each diagram is `group "Diagram"` →
`graphics-document document` → one text node per label, so node text is exposed rather than
the raw fence. The scroll container is keyboard-reachable — a real `shift+Tab` landed on it
with `:focus-visible` matching and a ring painted, and `scrollLeft` moves. `role="group"`
rather than `region` deliberately, so 33 diagrams do not become 33 landmarks.
`read_console_messages`: **no console logs at all**, including on the 33-diagram slide. No
leftover mermaid temp containers in `<body>`. Probe removed afterwards —
`git diff --stat HEAD -- content/` empty, post-removal build back to 210 pages / 199 slides.

**What the issue got wrong**

- **F-017 · The Files list is incomplete.** A client island cannot live in `Markdown.tsx` —
  it is a server component, and `"use client"` there would ship react-markdown, rehype-raw
  and rehype-highlight to the browser on all 199 slides. A second file
  (`src/components/MermaidDiagram.tsx`) is structurally required, exactly as SOL-6 needed
  `markdown-links.ts`. Two issues in a row with an under-specified Files list.
- **F-018 · The issue's stated preference for build-time rendering is not achievable in this
  stack**, per the three measurements above. Recorded rather than routed around silently.
- **F-019 · Pre-existing WCAG 2.1.1 gap.** `.prose-yap pre` — every code block on the site —
  is `overflow-x: auto` with no `tabindex`, so those scroll regions are not keyboard-reachable.
  Predates this issue. The new diagram container does it correctly.
- **F-020 · Latent.** Mermaid's `.edge-animation-*` keyframes do not honour
  `prefers-reduced-motion`. Harmless today (no corpus diagram opts in), but it would bite the
  moment someone authors an animated edge.
- Everything else in the issue checks out: 33 is exact, the concentration in
  `research papers/` is 100%, and the fences really do render today as syntax-guessed code.

**One judgement call, recorded.** The container carries a hairline border that the adjacent
`.prose-yap pre` does not. Kept deliberately — a flowchart is mostly empty space, so without
an edge the box dissolves into the glass reading surface and the scroll region reads as
ambiguous. One token hairline doing one job.

**Noted, deliberately not done**

- `content/research papers/` stays dark — SOL-28's attribution decision, untouched.
- `AskPanel.tsx` and `reader/ChatPanel.tsx` render LLM output through `ReactMarkdown`
  directly and were left alone, so a model cannot get an arbitrary mermaid payload rendered.
- This branch predates SOL-10, so `globals.css` here has **no** `:focus-visible` rule — the
  diagram container falls back to Chrome's default ring and picks up the token ring for free
  once SOL-10 lands.

