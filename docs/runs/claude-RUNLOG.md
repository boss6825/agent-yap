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

### SOL-12 — `aria-hidden` the scramble animation

- **Status:** complete · commit `09bd073` *fix: keep real heading text in the accessibility tree during scramble (SOL-12)*
- **Files changed:** `src/components/home/fx.ts` **only** (+70/−7). `Home.tsx` not edited at all.
- **Build:** green — exit 0, `✓ Generating static pages (210/210) in 4.2s`
- **Lint:** green — exit 0, zero output
- **Slide count:** 199 → 199

**Line-number / count audit**

| Issue claim | Reality |
|---|---|
| `src/lib/fx.ts` | **WRONG PATH — no such file.** The module is `src/components/home/fx.ts`. Applies to the Files list and all three `fx.ts:NN` citations |
| `fx.ts:36-55` scramble | correct |
| `fx.ts:107` hero applier | correct |
| `fx.ts:144-163` IO applier | correct |
| `Home.tsx:151` `<h1>` | correct |
| six `<h2>` at `214, 256, 278, 324, 381, 409` | five correct; **`256` is off by one — the attribute is at `Home.tsx:255`** |
| "one h1 + six h2s = seven call sites" | **correct, counted independently.** Built HTML: 1 `<h1>`, 7 `<h2>` total, 6 carrying `data-scramble`. The 7th h2 (`Home.tsx:187`) uses `data-lines`/SplitText and is not scrambled |

The audit itself (`02-code-ux-audit.md` §4.5) uses the bare filename `fx.ts`, so the wrong path
was introduced when the issue was written, not in the audit.

**SSR vs client (measured).** Server-rendered HTML is **unchanged** — `.next/server/app/index.html`
still holds `<h1 id="hero-head" …>Understand agents from the inside.</h1>` with no spans, no
`aria-hidden`, no duplicated text. That is the argument for doing this in `fx.ts` rather than in
seven places in `Home.tsx`: a JSX implementation would ship doubled text to every no-JS reader,
every CSS-off reader and every text extractor.

**Hydration: no mismatch, measured.** `initHomeFx` runs from a `useEffect`, after hydration
commits, so React never diffs the restructured DOM. Verified on a **dev** build (React dev
bundle, port 3017) with `console` + `pageerror` listeners attached before navigation: 4 entries
total, all framework noise; filtering `/hydrat|did not match|Warning|mismatch/i` → **0 matches**.
DOM after load: `animSpans: 7, srOnly: 7, h1ChildCount: 2, duplicateNesting: 0` — idempotent
through strict-mode double-mount. React re-render resilience also measured: opening and closing
the Search panel to force `Home` state changes left `survivedOpen: true, survivedClose: true`,
7 anim spans, all still `aria-hidden`, names unchanged.

**Acceptance**

| Criterion | Result | Evidence |
|---|---|---|
| real heading text in the a11y tree at all times | MET | restructuring happens at `initHomeFx` time, before the hero's 350 ms lead-in and before any h2 scrolls into view — no unlabelled window |
| animated node is `aria-hidden` | MET | `<span data-scramble-anim="" aria-hidden="true">`, all 7 checked programmatically (`allAriaHidden: true`) |
| heading levels + outline unchanged | MET | no tags added or changed, only inline `span`s inside existing headings; tree shows `[level=1]` once and `[level=2]` seven times |
| verified on the rendered a11y tree, not source | MET | see below |
| reduced motion → no scramble at all | MET | measured |
| build + lint green | MET | both exit 0 |

**F-021 · `read_page` is NOT an accessibility tree and must not be used as a11y evidence.**
This is the most important finding of the run so far. `read_page` showed every heading name
doubled — `heading "Understand agents from the inside.Understand agents from the inside."` —
which would read as a failure. The agent probed it by injecting
`<h3><span>PROBEVISIBLE</span><span aria-hidden="true">PROBEHIDDENSPAN</span></h3><p aria-hidden="true">PROBEHIDDENPARA</p>`
and got back `heading "PROBEVISIBLEPROBEHIDDENSPAN"` plus `generic "PROBEHIDDENPARA"` — a fully
`aria-hidden` paragraph still appears. **`read_page` is DOM-derived: it does not prune
`aria-hidden` and does not compute accessible names.** Switching to Playwright's ARIA snapshot
(which does real accessible-name computation) on the same probe returned
`heading "PROBEVISIBLE" [level=3]` — correct. Real page, real tool:

```yaml
heading "Understand agents from the inside." [level=1]
heading "Most courses stop at the architecture diagram. …" [level=2]   # not scrambled
heading "Many agents. One system." [level=2]
heading "Rise above surface-level understanding." [level=2]
heading "18 chapters. No hand-waving." [level=2]
heading "Memory is sediment." [level=2]
heading "The climb is the curriculum." [level=2]
heading "Built for reading, not scrolling." [level=2]
```

This retroactively weakens the a11y-tree claims in SOL-5, SOL-6 and SOL-7, which all used
`read_page`. Their *other* evidence (computed styles, DOM attributes, measured contrast, click
behaviour) stands; only the "accessibility tree" framing was overstated.

**During-animation evidence — measured.** `requestAnimationFrame` was gated, then "Memory is
sediment." was scrolled into view so its **real** IntersectionObserver fired the **real**
`scrambleEl`. The gate stopped the loop after three sampled frames, leaving genuine
mid-animation output in the DOM (the gibberish was produced by the app, not written by hand):

```json
{"samples":[{"tMs":1515,"animText":"MDDOHV IE LQLOBIQH."}],
 "frozenAnimAriaHidden":"true","frozenSrOnlyText":"Memory is sediment.",
 "headingTextContent":"Memory is sediment.MDDOHV IE LQLOBIQH."}
```

ARIA snapshot taken in that frozen state:
`heading "Memory is sediment." [level=2]: MDDOHV IE LQLOBIQH.` — accessible name correct while
the rendered glyphs are gibberish. That is the criterion, measured on a real accessibility tree.

**`sr-only` copy off-screen, zero visual duplication — measured.** `position: absolute · 1px ×
1px · clip-path: inset(50%) · overflow: hidden · margin: -1px · white-space: nowrap`,
`getBoundingClientRect → 1 × 1`. Tailwind v4 built-in, not hand-rolled; `globals.css` untouched;
no new colors. **Zero layout delta:** for all seven headings the rect was measured with the fix,
the pre-fix single text node swapped back in, re-measured, and restored — `identical: true` on
width, height and top for **7/7** (h1 `980 × 166.4 @ top 470.5` both ways). Mobile 375×812:
`horizontalOverflow: false`, sr-only still 1×1, name still correct.

**Reduced motion — measured.** Playwright `emulateMedia({ reducedMotion: 'reduce' })`, full load:
`mediaMatches: true`, `h1.restructured: false`, `scrambleTargetsPrepared: 0`, `animSpans: 0`,
`srOnlySpansInHeadings: 0`, name correct. **It was already honoured before this issue**
(`fx.ts:84-86` plus `!reduced` guards at both call sites) — that acceptance criterion was
pre-satisfied, not new work. The new restructure was gated behind the same flag so
reduced-motion users get a DOM identical to the SSR output.

**Console / hydration.** Production build (3016): `Total messages: 0 (Errors: 0, Warnings: 0)`
for the whole session. Dev build (3017): 4 framework-noise entries, 0 errors, **0 hydration
warnings**. Reader slide `01-anatomy/0`: 0 page errors, 0 stray anim/sr-only nodes — SOL-5/6/7
not regressed.

**What the issue got wrong**

- **F-022 · `src/lib/fx.ts` does not exist.** The file is `src/components/home/fx.ts`. The Files
  list and all three citations need correcting. Offsets *inside* the file were accurate.
- **F-023 · `Home.tsx:256` is off by one** — the fifth scrambled heading's `data-scramble` is at
  line 255.
- **F-024 · `prefers-reduced-motion` was already honoured**, so that criterion was pre-satisfied.
  The live gap the audit §4.5 actually describes is different: the check is a one-shot
  `matchMedia(...).matches` at init with **no `change` listener**, so toggling the OS setting
  still needs a reload — while `AmbientBackdrop` uses framer's reactive `useReducedMotion()`.
  Inconsistent. **Not fixed here**: it is a separate defect outside this issue's acceptance, and
  reactive teardown/re-init of the whole fx system is well beyond "aria-hidden the scramble".
- **F-025 · `P-READER-002` is defined but unregistered.** It exists at
  `specs/features/reader/ide-shell/spec.md:77` ("Progress is monotone and local") and is cited in
  that feature's `plan.md:40` and `review.md:13`, but the global registry
  `specs/properties/invariants.md` contains only `P-CONTENT-001` and `P-ASK-001`. So an agent
  told to "check against P-READER-002" and pointed at the registry finds nothing. This is the
  C10 violation already recorded in `03-prior-decisions.md` — three shipped invariants
  (P-READER-002, P-READER-003, P-CHAT-001) are missing from the registry.
- **F-026 · Caveat on the prescribed shape, worth recording.** `sr-only` sibling + `aria-hidden`
  animated node is correct and measured. But implementing it in `fx.ts` means replacing children
  of React-owned elements. That is safe here only because all seven headings render **static**
  text — re-renders were verified not to clobber it. If any of these headings' text later becomes
  dynamic, React loses its text-node handle. The `data-scramble-original` attribute and the
  teardown restore limit the blast radius; a JSX implementation would be immune but would ship
  duplicated text in the SSR HTML.

**F-027 · Playwright MCP writes into the wrong tree.** It created
`C:/Users/arpit/Projects/agent YAP/.playwright-mcp/` (snapshots + console logs) inside **Cursor's
live working tree**, resolving its output dir from the session cwd rather than the worktree.
`.playwright-mcp` is **not** in that repo's `.gitignore`, so it would have been swept into a
`git add -A` there. The agent removed both artifacts; independently re-verified — that tree has
no `.playwright-mcp` directory. Worth gitignoring before another agent uses Playwright here.

**Noted, deliberately not done**

- The scramble effect itself — untouched, same durations, same visuals.
- The reactive-reduced-motion gap (F-024).
- The non-scrambled SplitText `<h2>` at `Home.tsx:187`, which splits into four line `div`s. Its
  accessible name concatenates correctly today, so it has no equivalent bug.

### SOL-13 — cross-book resume: `lastHref` is a single global pointer

- **Status:** complete · commit `6a43b82` *fix: make the resume pointer per-book with a most-recent-overall fallback (SOL-13)*
- **Files changed:** `src/lib/progress.ts`, `src/components/reader/ReaderChrome.tsx`, `src/components/reader/ResumePill.tsx`, `src/components/Home.tsx`, `src/app/read/[book]/layout.tsx`, `specs/features/reader/ide-shell/spec.md` (+307/−68)
- **Build:** green — `✓ Compiled successfully in 31.3s`, `✓ Generating static pages (210/210) in 13.5s`
- **Lint:** green — exit 0, zero output
- **Slide count:** 199 → 199 · `content/` clean, still the original 8 directories

**Citation audit**

| Citation | Verdict |
|---|---|
| `progress.ts:17` = `lastHref` | **off by one** — `lastHref` is line **16**; 17 is `lastReadAt` |
| `progress.ts:19` = `read` map | correct |
| `ResumePill.tsx:~23-28`, "the `resumeTarget` computation" | **wrong file.** `ResumePill.tsx` is 52 lines and purely presentational — no `byHref`, no `resumeTarget`. Lines 23–28 are a framer-motion `transition` and a wrapper `className`. The real logic is `ReaderChrome.tsx:128-131` (`resumeTarget`) and `:90-95` (`byHref`) — which the **Source cites correctly**. The issue drifted from its own source |
| `Home.tsx:55-60`, `:386`, `:120-125` | correct (`:386` opens the `<Link`, `href` at `:387`, label at `:390`) |
| Files list completeness | **incomplete — it omits the file containing the bug.** `ReaderChrome.tsx` is unavoidably in scope |

**Reproduction — all three bugs reproduced on unmodified code**

1. **Global `lastHref`.** Seeded v1 with `lastHref = /read/architecture-and-system-design/05-context-engineering/2`, visited book B slide 1 once → storage became `"lastHref":"/read/zz-temp-second-book/01-alpha/0"`. Book A's position destroyed by a single visit and unrecoverable.
2. **Pill silently vanishes cross-book.** On book B slide 1 with `lastHref` pointing into book A: `pillCount: 0`, `pillHTML: []`. No error, no fallback.
3. **Entry points disagree** (same page state): nav CTA and hero CTA → "Continue reading" → `05-context-engineering/2`; "Start with Chapter 1" → `01-anatomy/0`. Contradiction.

**Storage shape**

```
v1  {"version":1,"lastHref":"…","lastReadAt":…,"read":{"<book>":{"<href>":…}}}
v2  {"version":2,
     "lastByBook":{"<book>":{"href":"…","at":…}},
     "lastBook":"<book>",
     "read":{"<book>":{"<href>":…}}}
```

Exactly two new concepts, both authorised: a per-book pointer and a most-recent-overall
pointer. No learner-profile fields (honouring `03-prior-decisions.md` row 23).

**Migration: v2 lives under a NEW key; the v1 blob is read, never written, never deleted.**
The decisive reason for a new key rather than bumping `version` in place: the currently-deployed
v1 `parseProgress` gates on `data.version !== 1` and **resets to empty**. If v2 lived under the
v1 key, a tab still running the old bundle would read the v2 payload, fail the gate, and persist
an empty v1 blob over it on its next `markSlideRead` — wiping the read-set and violating
P-READER-002 during the deploy window. Separate keys make old and new tabs mutually harmless.

Migration is **pure and derived on read** — nothing persists until the reader actually marks a
slide read. Attribution of the old global `lastHref` to a book uses the already book-keyed
`read` map first, falling back to the strict canonical route `^/read/([^/]+)/[^/]+/\d+$`. **An
unattributable pointer is dropped, never guessed.** `read` entries are never dropped.

Proven in the browser across four cases:

1. **Valid v1 blob** → CTA and pill both resolved to `05-context-engineering/2`; v2 still `null`
   at that point (read-only migration). After the 1.2 s dwell the v2 write carried all three
   original `read` timestamps unchanged; v1 byte-identical.
2. **Unattributable pointer** (`"lastHref":"/not-a-slide-route"`) → all three entry points fell
   back to "Start learning" / `01-anatomy/0`, no pill, and the subsequent v2 write still held
   **both** read entries with original timestamps.
3. **Truncated JSON** → full zero-state, no wrong destination, no console error.
4. **Stale `lastBook`** pointing at a nonexistent book → fell back to the newest `at`, CTA still
   correct.

**Acceptance**

| Criterion | Result | Evidence |
|---|---|---|
| per-book `lastHref` + separate overall pointer | MET | `lastByBook` held both books simultaneously after reading in each; `lastBook` tracked the most recent |
| entering book B with a book-A target renders something sensible | MET | `<a href="/read/architecture-and-system-design/05-context-engineering/2"><span>You were last reading</span><span>Architecture and System Design for AI Agents</span><span aria-hidden="true">→</span></a>`; Playwright ARIA snapshot: `link "You were last reading Architecture and System Design for AI Agents"` (arrow correctly excluded) |
| three entry points agree | MET | quoted below, three states |
| old localStorage never breaks | MET | four cases above |
| verified with two books | MET | temporary book created, exercised, removed |
| build + lint green | MET | both exit 0 |

**Two-book evidence.** Faked `content/zz-temp-second-book/` (`index.md` + two chapters, 5
slides; slug sorts after the real book so `getPrimaryBook()` was unaffected). Build went
199 → 204 slides / 210 → 215 pages. Pointer only in book A → enter book B → cross-book pill
naming book A, **and book A's pointer survived**. Read into book B, return to book A slide 1 →
`Continue where you left off · The context window is a budget` → `05-context-engineering/2`.
**That is precisely what was impossible before.** Then book B slide 1 resumed to
`02-beta/1` — both books resume independently. Removed and rebuilt afterwards:
`git status --short content/` empty, `git diff d55d2da HEAD --stat -- content/` empty,
`curl /read/zz-temp-second-book/01-alpha/0` → **404**, slide count back to 199.

**Three entry points, quoted**

```
State 1 — no progress:      all three → "Start learning" / "Start with Chapter 1"
                            → /read/architecture-and-system-design/01-anatomy/0   allAgree: true
State 2 — mid-book:         all three → "Continue reading"
                            → /read/architecture-and-system-design/09-data-modeling/1   allAgree: true
State 3 — progress in book B: all three → "Continue reading"
                            → /read/zz-temp-second-book/02-beta/1                  allAgree: true
```

The third slot keeps the copy "Start with Chapter 1" only in the fresh-reader state; with a
resume target it becomes "Continue reading" and follows `ctaHref`.

**The `current?.globalIndex === 0` guard was NOT changed** — deliberately. It is the existing
product rule ("shown only when the reader lands at the start of a book"), the issue does not
authorise changing it, and relaxing it would float a pill over every deep link. Verified on a
non-first slide: `03-tool-design/0` with a pointer at ch5/2 → `pillCount: 0`. The "entering
book B" case still works because `/read/<book>` redirects to slide 0, so the guard is satisfied
precisely when it matters.

**P-READER-002 / 003 — two independent checks.** Runtime: `performance.getEntriesByType('resource')`
over 77 requests — every one a Next RSC `?_rsc=` GET or a static chunk, `initiatorTypes`
link/script/img/fetch, **no XHR, no POST**; a regex for `progress|lastByBook|lastBook|lastHref`
across all request URLs returned **zero** hits. Static: `grep -rln "lib/progress" src/` returns
only `Home.tsx` and `ReaderChrome.tsx`, and grepping `fetch(|XMLHttpRequest|sendBeacon|navigator.send`
in `progress.ts` plus both importers returns none. Monotonicity: every migration case shows the
`read` set surviving with original timestamps; `markSlideRead` still only ever adds.

**Measured a11y / visual.** Dark 375×812: lead on `bg-canvas-2` **5.93:1**, destination
**15.63:1**; long book title truncates (`scrollWidth 269 > clientWidth 114`), pill 321.6 px
inside 375 px, no horizontal overflow; dismiss button 32×32 with
`aria-label="Dismiss resume suggestion"`. Light desktop 948 px: lead **4.66:1**, destination
**15.46:1**. Tokens only (`text-ink-2`, `text-ink`, `bg-canvas-2`, `text-blue`); `globals.css`
untouched. Console: no errors, no hydration warnings.

**What the issue got wrong**

- **F-028 · The Files list omits the file containing the bug.** `resumeTarget` is in
  `ReaderChrome.tsx:128-131`, `byHref` at `:90-95` — not in `ResumePill.tsx:23-28`, which is 52
  purely presentational lines. The audit §3.9 cites it correctly; the **issue** drifted from its
  own Source. That is four issues in a row with an incomplete or wrong Files list.
- **F-029 · `progress.ts:17` is off by one** — `lastHref` is line 16.
- **F-030 · The feature spec was already drifted before this issue.**
  `specs/features/reader/ide-shell/spec.md:50-53` documented a `getProgress(): Progress` export
  that does not exist in `progress.ts`. Corrected while updating the Input Contract to v2.
- **F-031 · The landing CTA links a stored href with no validation.** Found by accident while
  seeding `/read/architecture-and-system-design/09-memory/1` (the real slug is
  `09-data-modeling`): the reader pill correctly stayed silent because it validates against the
  manifest, but **the landing CTA happily linked to a 404**. Pre-existing in v1, not a
  regression, out of scope here — worth its own issue.
- **F-032 · A stale v1 blob is now retained indefinitely** (~one extra copy of the read-set).
  Deliberate: deleting it would break tabs still running the v1 bundle during a deploy. A later
  release can drop the key once the deploy window has passed.

**Deviation, disclosed.** Two files outside the issue's Files list were edited:
`src/app/read/[book]/layout.tsx` (3 lines, using the **existing** `getBooks()` export so the
cross-book pill can name the destination book truthfully instead of humanising a slug —
`content.ts` untouched) and `specs/features/reader/ide-shell/spec.md` (Input Contract updated to
the v2 shape, plus the F-030 correction). The spec edit is the C1 "spec written on-touch" rule,
but neither file was authorised by the issue.

**Noted, deliberately not done**

- Cross-book prev/next, book switcher, path model — untouched. `content.ts` and `getAdjacent()`
  not edited.
- Three further landing links still point at `data.startHref`: nav "Reader" (`:93`), "Open the
  reader" (`:420`), footer "Reader" (`:470`), plus the chapter-1 preview card (`:427`). Left
  deliberately — they are navigational labels or an explicit Chapter-1 preview, and none of them
  *claims* where the reader currently is, which is what the criterion is about.
- The layout now serialises every book's slug+title into every reader page (~40 bytes/book).
  Proportionate, but it is the same category the audit flags in §3.5 ("stop embedding cross-book
  data in page HTML") and should be revisited when the shelf lands in M3.
- On 375 px the cross-book pill truncates a long book title to ~114 px
  ("Architecture and Sys…"). Existing `truncate` behaviour, no overflow, but a shorter shelf
  label would read better once M3 defines one.

### SOL-14 — de-duplicate the nav manifest

- **Status:** complete · commit `e53e8f1` *refactor: stop emitting nav slides twice in the manifest (SOL-14)*
- **Sequencing:** option **(a)** — standalone before M2. Confirmed M2 has not started on this branch (`content.ts` has no frontmatter parsing, no `featured`, no `questions[]`, no `###` sub-splitting, no validator). `content.ts` was held exclusively for the whole task and is released.
- **Files changed:** `src/lib/content.ts`, `src/components/reader/Rail.tsx` (+43/−7). `src/app/read/[book]/layout.tsx` needed **no** change.
- **Build:** green before AND after — after: `✓ Generating static pages (210/210) in 3.8s`, TypeScript clean, exit 0
- **Lint:** green before and after — exit 0, zero findings
- **Slide count:** 199 → 199. Per-chapter counts unchanged: `7,10,13,10,13,11,8,12,13,10,11,12,14,15,9,12,12,7` (sum 199), verified both from the built manifest and from the rendered chapter meters

**Citation audit — three of five citations had drifted**

| Citation | Verdict |
|---|---|
| `content.ts:351-366` (`getNavManifest`) | matched exactly |
| `content.ts:363` (nested `toNavSlide`) | matched |
| `content.ts:357` (flat `toNavSlide`) | **drifted by 1** — :357 was `total:`; the flat `.map(toNavSlide)` was on **:358** |
| `layout.tsx:15` (manifest prop) | **drifted** — `getNavManifest(book)` is on **:14**; :15 is the SOL-13 comment |
| `Rail.tsx:113-116` | **partially drifted** — `chapters.length`/`total` are on :115, but `bookTitle` is on **:112**, outside the cited range |

The **103 KB figure is sound**: audit §3.5 measured 105,166 bytes; today it is **105,221**
(55 bytes of content drift). The duplication is exactly as described.

**Shape decision: indices into the flat array — a contiguous `[start, count)` range.**
`NavChapter.slides: NavSlide[]` → `NavChapter.start` + `NavChapter.count`.

Why, and why **not** the issue's alternative:

- It is what audit §3.5 recommends, so the fix matches its own source.
- It keeps the flat `slides` array **authoritative and byte-identical**, preserving the
  `slides[i].globalIndex === i` positional invariant that `ReaderChrome` relies on for
  prev/next.
- **The "derive the flat array from chapters" option is latently unsafe here.** `book.slides`
  is built in **filename** order (`content.ts:202`, `:240`) while `book.chapters` is re-sorted
  by **chapter number** (`content.ts:243`). Those orders agree today only because every
  filename is zero-padded. The moment a book ships `chapter-1-…` alongside `chapter-10-…`,
  `flatMap(chapters)` would silently produce a different reading order than `globalIndex` — a
  prev/next and `01 / 199`-counter reordering bug with no error. The range approach cannot
  express that bug. Verified empirically today: `flatOrderMatchesChapterOrder: true`.

Cost to consumers: **`ReaderChrome.tsx` and `layout.tsx` unchanged** — including the SOL-13
`byHref`/prev-next code, which reads only the flat array. `Rail.tsx` pays: one `useMemo`
resolving each chapter's range into a `Map<slug, NavSlide[]>` plus three call-site swaps
(+11/−3). Resolving in a memo rather than inline also means the 18 slices happen once per
manifest instead of on every navigation re-render. Empty chapters are handled —
`start: c.slides[0]?.globalIndex ?? 0`, `count: 0`, and `done = readCount === c.count`
preserves the previous `0 === 0 → true`.

**Manifest bytes: 105,221 → 53,852 (−51,369, −48.8%).** Three independent measurements, no
estimates:

| Measurement | Before | After | Δ |
|---|---|---|---|
| manifest object in the RSC flight payload | 105,221 | 53,852 | −48.8% |
| serialized `NavSlide` objects per page | 398 | 199 | −50% |
| per-page prerendered HTML (JS-string-escaped) | 154,417 | 98,706 | −36.1% |
| all 199 slide pages, HTML | 32,423,515 | 21,337,026 | −34.2% |
| all 199 slide pages, `.rsc` | 23,956,546 | 13,734,115 | −42.7% |

The three reconcile **to the byte**, which is itself the strongest zero-change proof:

```
escape accounting: rawDelta + netQuotes = 51369 + 4342 = 55711
                   observed per-page HTML delta = 55711   exact: true
uniformity:        perPageDelta × 199 = 11086489
                   observed total delta = 11086489        exact: true
```

`netQuotes` = 199 removed NavSlide copies × 22 quote chars, minus 18 chapters × 4 quotes for
the new `"start"`/`"count"` keys, plus 18 chapters × 2 for the dropped `"slides"` key. **Every
byte that moved is accounted for by the de-duplication, and all 199 pages shrank by exactly
the same amount** — so no other byte in any prerendered page changed.

**Zero-behaviour-change evidence — identical, no differences found.**

| Fingerprint | Before | After |
|---|---|---|
| canonical logical model (whole manifest) | `2853d8758004719f` | `2853d8758004719f` |
| per-chapter counts + hrefs + row labels (18 ch) | `717a7955cdcf3f02` | `717a7955cdcf3f02` |
| prev/next adjacency, all 199 slides | `252fc8c67360ec2b` | `252fc8c67360ec2b` |
| rendered `<header>` + `<nav aria-label="Book contents">`, all 199 pages | `6f747b6e9aa4f1a4` | `6f747b6e9aa4f1a4` |
| total rendered rail DOM bytes | 3,445,632 | 3,445,632 |

```
full-state-identical (excluding page byte sizes): true
adjacency arrays identical (all 199): true
chapterCounts identical (all 18): true
per-page nav+header hashes identical (all 199): true
pages whose html byte size changed: 199 of 199   ← the only difference, fully explained above
```

Both captures normalise the two manifest shapes to one canonical form (post-change chapters
re-expanded from their ranges) so they are directly comparable. Boundary cases, before ==
after: first slide `prev: null`; last slide of ch.1 → `next /02-agent-loop-pattern/0` (crosses);
first slide of ch.2 → `prev /01-anatomy/6` (crosses back); last slide of book (globalIndex 198)
→ `next: null`.

**Consumers audited** (from `grep -rn "NavManifest\|NavSlide\|NavChapter\|getNavManifest\|manifest" src/`):
`layout.tsx:14` producer — unchanged. `ReaderChrome.tsx` — unchanged; reads only preserved
fields (`manifest.slides` → `byHref` at :114-118, `total` :122, `slides[index±1]` :123-124,
`bookSlug` :130/:137/:151), never `chapters[]`. `Rail.tsx` — the only consumer changed.
`src/components/markdown-links.ts` (SOL-6) — **not a manifest consumer**; it reads the
server-side `Book`/`Chapter`/`Slide` types, which were not touched, and its two mirrored slug
rules are confirmed unchanged. `search.ts`, `llms.txt`, `llms-full.txt`, `sitemap.ts` and every
page route import `getBooks`/`getBook`/`getSlide` — none import the manifest. `art.ts` reads a
different manifest entirely (SOL-29). **P-CONTENT-001 untouched** — no change to `loadBooks`,
directory walking, the `index.md` + `chapter-NN-*.md` test, or any slug rule.

**Regression, verified in the browser.** SOL-13: seeded `agent-yap:progress:v2` with a pointer
to `/03-tool-design/2`; the pill rendered `Continue where you left off → "The description is a
prompt"` linking correctly — it resolves its title through `byHref` built from
`manifest.slides`, the exact consumer at risk, and it works. SOL-6: the authored link
`[Chapter 2: The agent loop pattern](chapter-02-agent-loop-pattern.md)` rendered as
`href="/read/architecture-and-system-design/02-agent-loop-pattern/0"`. SOL-5: raw inline HTML
still renders inside the slide body. SOL-12: not touched, and the rendered header/rail DOM is
byte-identical across all 199 pages. **SOL-7 not exercisable** — no live slide contains a
mermaid fence; the diff touches neither `Markdown.tsx` nor the island. Checkmarks: seeded 4 of
ch.1's 7 slides and all of ch.2 — rail showed exactly 4 check glyphs, meters `4/7` and `8/10`,
`aria-current="page"` on the active row, chapter auto-expand on crossing a boundary still
correct (rows 7 → 17 = 7 + 10, matching the ranges).

**Browser verification.** `npx next start -p 3019` (3005 never bound, PID 3672 never touched).
Exercised ‹ / › across the ch.1→ch.2 boundary and back, `ArrowLeft` keyboard nav, prev disabled
on slide 1 and next disabled on slide 199, header counters `01/199`, `07/199`, `08/199`,
`199/199`, `198/199`. Smoke-tested `/` 200, `/read` 307, `/read/[book]` 307, a deep slide 200,
`/llms.txt` 200, `/sitemap.xml` 200, `/api/search?q=agent+loop` 200. **Console: no messages at
all.** Server killed, port free. Playwright not used, so no artifacts in Cursor's tree.

**What the issue got wrong**

- **F-033 · Three of five `file:line` citations had drifted** (table above). None invalidated
  the issue — the described duplication was exactly real.
- **F-034 · `markdown-links.ts` lives at `src/components/`, not `src/lib/`** (my brief had this
  wrong, not the issue).
- **F-035 · The issue's suggested alternative — "drop the flat array and derive it" — is
  latently unsafe and should never be taken.** See the shape decision above. Worth knowing
  before M3 wires six more books in.
- **F-036 · `NavManifest.total` is redundant** (always `slides.length`). Deliberately left:
  removing it is a consumer-visible change with no payload benefit, and this is Tier 3.
- The audit's "~103 KB" is accurate; the precise current figure is 105,221 bytes.

**Noted, deliberately not done**

- **The real ceiling-lift is still ahead.** All 199 pages embed a *byte-identical* copy of the
  same manifest (`distinctManifestsAcrossPages: 1`). Even at 53,852 bytes that is ~10.7 MB of
  identical JSON across the route. Moving it behind a route handler or shared chunk is the
  natural SOL-14 follow-up before 8-book cross-book navigation lands — explicitly ruled out by
  this issue's Out of scope.
- `getPrimaryBook()` returning `books[0]` (`content.ts:277-281`) is still the alphabetical-first
  landmine; `/` and `/read` both depend on it. Left for SOL-16.
- `art.ts` keys chapter art on `chapterSlug` alone — confirmed still true, left for SOL-29.
- The pre-existing Turbopack warning about the dynamic `process.cwd()` join in
  `resolveContentRoot()` (`content.ts:66`) is present identically before and after. Not
  "fixed" — the comment at `content.ts:59-64` says that walk exists to survive a wrong cwd
  under Turbopack, so silencing it needs a decision, not a drive-by.

**No URL or progress migration required, and none made.** Nothing here renumbers slides or
changes a route: `sectionIndex` (which forms the URL) and `globalIndex` are both produced by
unchanged code, the 199 generated paths are identical, and no localStorage key, shape or href
is affected. That question belongs to SOL-18's `###` sub-splitting.

### SOL-9 — unbind `Space` from next-slide

- **Status:** complete · commit `2a4c724` *fix: unbind Space from next-slide so it pages the scroll container (SOL-9)*
- **Files changed:** `src/components/reader/ReaderChrome.tsx` only (+24/−1)
- **Build:** green — `✓ Generating static pages (210/210) in 14.6s`, exit 0
- **Lint:** green — exit 0, zero output
- **Slide count:** 199 → 199

**Citation audit — all three drifted**

| Issue says | Actually (pre-fix) | Drift |
|---|---|---|
| `:187-189` keydown handler | `:252-257` | +65 |
| `:352` scroll container | `:415-419` | +63 |
| `:370-372` shortcut hint | `:431-433` | +61 |

Consistent with SOL-13's +94-line insert into the same file. The *content* of all three
citations was correct once relocated.

**Keyboard instrument — `computer{action:"key"}` is broken for space, confirmed by
measurement.** A capture-phase keydown probe showed `text:"space"` and `text:"Space"` both
deliver `key:""`, `code:""`, `keyCode:0` — matching nothing, `defaultPrevented:false`, no
navigation. `text:" "` is rejected by the tool's own parser. Playwright's
`page.keyboard.press('Space')` delivered `key:" "`, `code:"Space"`, `keyCode:32`,
`isTrusted:true` and **did navigate on the unfixed build** — instrument validated against the
known-bad baseline before being trusted. All keyboard evidence is Playwright. This confirms and
generalises the SOL-5 observation (F-009).

**Reproduction.** `/read/architecture-and-system-design/01-anatomy/6` — "Review — Chapter 1".
Stage container measured at **`scrollHeight: 3247` vs `clientHeight: 876`** (3.7× viewport; 5.1×
at the pane's 634 px). Focus on `BODY`, `scrollTop: 0`. Space → URL `…/01-anatomy/6` →
**`…/02-agent-loop-pattern/0`**, `scrollTop` never left 0, probe showed
`defaultPrevented: true`. Reproduced exactly as described.

**Acceptance**

| Criterion | Result | Evidence |
|---|---|---|
| Space scrolls a tall slide, does not navigate | MET | `scrollTop` 0 → **788.8** (876 × 0.9), URL unchanged. Second Space → 1577.6. `Shift+Space` → back to 789.6. At the bottom (`scrollTop 2371.2`, max 2371) Space is inert — **no navigation**, which is the point |
| `→`, `PageDown`, swipe still advance, guards intact | MET | `→`: `01-anatomy/6` → `02-agent-loop-pattern/0`. `PageDown`: `/0` → `/1`. `←`: `/1` → `/0`. Swipe below |
| reproduce first and name the slide | MET | above |
| build + lint green | MET | both exit 0 |

**Guards.** *Typing* — opened Search with `/`, typed "tool"; `→` moved the caret and did not
navigate, Space typed a literal space (`value` → `"tool "`), did not scroll the stage, did not
navigate. *Modal* — isolated properly by focusing a search-result `<button>` so
`isTypingTarget` was `false` and only `anyModal` could suppress: `→` → URL unchanged, stage
`scrollTop 0`, dialog still open. *Mobile overlay* — 390×844, pressed `t` (`isDesktop: false`,
stage scrollable 4666 vs 770), blurred to `BODY`: Space → no scroll, `→` → no navigation. Both
correctly suppressed by the pre-existing guard, which the new branch sits **below**.

**Swipe** — untouched by the diff, tested with real `TouchEvent`s and constructed `Touch`
objects on `<main>`: left swipe (dx −180) advanced, right swipe (dx +200) went back. Synthetic
(`isTrusted:false`), but React's synthetic handler is the only consumer.

**The SOL-5 disclosure case — this is the user-visible payoff.** Focused the first `<summary>`
("Answer") on the Review slide. *Unfixed:* `open: false` → Space → **navigated away**, the
disclosure never opened. *Fixed:* `open: false` → Space → **`open: true`**, URL unchanged,
stage `scrollTop` stayed 0 (the new handler correctly defers to native activation). **264
disclosures across the book are now keyboard-operable** — F-008 from the SOL-5 log is closed.

**Short-slide case** (the "subtler bug" the brief warned about): `01-anatomy/0`,
`scrollHeight 876 === clientHeight 876`. Space → nothing at all, no navigation. Space never
navigates under any condition.

**SOL-7 mermaid container** — could not exercise the real component; the claim was *verified*
rather than assumed: zero mermaid fences in the live book, zero `language-mermaid` across all
199 built slide HTMLs. Exercised the identical code path by injecting a container mirroring
`MermaidDiagram.tsx:184-190` (`role="group"`, `tabIndex={0}`, overflow), focusing it and
pressing Space — the **box** scrolled 0 → 104.8, the stage stayed at 0, URL unchanged. Caveat:
the real box is `overflow-x-auto` (horizontal only), so a vertical Space there walks up to the
stage — correct native behaviour either way.

**Advertised-keys string: not changed.** It reads `← → arrow keys work too` and never mentioned
Space, so removing Space from navigation does not make it inaccurate. Touching it would stray
into the out-of-scope shortcut sheet.

**Console:** Playwright `browser_console_messages`, all levels, whole session:
`Total messages: 0 (Errors: 0, Warnings: 0)`. Chrome pane: "No console logs."

**What the issue got wrong**

- **F-037 · "Drop Space entirely and let the browser do its job" does NOT work here — measured.**
  Before writing code the agent bypassed the handler (capture-phase `stopImmediatePropagation`
  *without* cancelling the event) to observe pure native behaviour on the tall slide. Result:
  **`scrollTop` stayed 0. Space did nothing.** The stage is an inner `overflow-y-auto` div that
  is not focusable and does not contain focus (focus is on `<body>` after load), and the
  document itself cannot scroll — the `ReaderChrome` root is `h-dvh` and
  `document.scrollingElement.scrollHeight === clientHeight === 720`. Chrome's spacebar default
  action has no scroller to act on. **Pure unbinding would have satisfied "Space does not
  navigate" while failing "Space scrolls the content" — a silent half-fix that passes a casual
  check.** The shipped fix is unbinding **plus** four lines that page the stage only when focus
  is nowhere (`!active || body || documentElement`); anything focused keeps its own native
  Space. This is not the "advance only when scrolled to the bottom" cleverness the issue ruled
  out — Space never navigates, and the branch sits below the existing modal/overlay guard.
- **F-038 · `Shift+Space` changed behaviour on the same key.** The old check ignored `shiftKey`,
  so Shift+Space also advanced the slide. It now pages **up**, matching every browser. Same key,
  so not a rebinding — but a behaviour change the issue did not name.
- **F-039 · The stage fails WCAG 2.1.1, the same hole SOL-7 found for mermaid.** The stage
  scroll container has no `tabIndex`, so a keyboard user cannot reach it: `ArrowUp`/`ArrowDown`/
  `Home`/`End` do nothing on a 3,247 px slide, and Space works only because it is now forwarded
  explicitly. SOL-7's own comment states the principle and applies `tabIndex={0}` +
  `role="group"` + `aria-label` to its box. The same treatment on the stage would make Space,
  both arrows, Home/End and Shift+Space all native and let the four forwarding lines be deleted.
  **Not done here** — it adds a tab stop and changes focus behaviour across the whole reader,
  beyond a Tier-1 fix and beyond what this issue authorises. Worth its own issue.
- **F-040 · `02-code-ux-audit.md` §1.4 is now stale** — its table still lists `Space` in the
  next-slide row and its note still describes the bug. Not edited: a dated research artifact,
  not in the Files list.

**Orchestrator correction to the agent's report.** It attributed the search dialog pulling focus
back to the input to "SOL-10's focus trap". **There is no focus trap on this branch** — SOL-10
has not been implemented here. Verified: `grep` for `focus-visible|focusTrap|trapFocus` across
`globals.css` and `SearchPanel.tsx` returns nothing. What actually refocuses is
**`SearchPanel.tsx:35` — a one-shot `setTimeout(() => inputRef.current?.focus(), 40)`**. The
guard evidence is unaffected (the agent tested the modal guard via a focused result button
instead, which is cleaner anyway), but SOL-10 still has to *build* the trap from scratch.

**Invariants.** P-READER-002 untouched — no progress or localStorage code changed.
P-READER-003 strengthened: a long slide is now keyboard-readable rather than a trap.

