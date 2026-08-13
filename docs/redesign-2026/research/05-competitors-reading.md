# 05 — Competitor teardown: minimal technical reading sites

**Scope:** reading UX, navigation at scale, visual restraint.
**Method:** live `WebFetch` on each site August 2026, plus raw `curl` of production
CSS bundles where hard numbers mattered (Rust Book, Ciechanowski, Lil'Log,
joshwcomeau.com). Numbers marked **[measured]** come from the shipped CSS, not
from eyeballing. Numbers marked *[reported]* come from the page's own copy.

**Baseline for comparison — what Agent YAP ships today** (measured from the repo):

| Token | Current value | File |
|---|---|---|
| Prose column | `max-w-[720px]` | `src/app/read/[book]/[chapter]/[slide]/page.tsx:57` |
| Body size / leading | `17px` / `1.6` / `-0.2px` tracking | `src/app/globals.css:161-166` |
| Rail width | `w-[min(320px,85vw)]`, `lg:w-[300px]` | `src/components/reader/Rail.tsx:92` |
| Rail container | `lg:w-[300px] lg:border-r` | `src/components/reader/ReaderChrome.tsx:330` |
| Radius / pill | `--radius-card: 18px`, `--radius-pill: 980px` | `src/app/globals.css:28-29` |
| Content volume | 137 markdown files across 8 folders (1 wired) | `content/` |

Preview of the headline finding: **Agent YAP's reading typography is already
world-class-adjacent** — 720px/17px/1.6 sits exactly on the Lil'Log (720px) and
Rust Book (750px) numbers. The gap is *not* the reading page. The gap is
**arrival, wayfinding across 137+ files, and the total absence of assessment.**

---

## Part 1 — Site-by-site teardown

### 1. joshwcomeau.com (blog)

- **Above the fold:** no hero sentence at all. Masthead is the words "Josh W
  Comeau" plus nav (`Categories`, `Courses`, `Goodies`, `About`). The first
  content block is "Articles and Tutorials" — you are looking at article titles
  within ~200px of page top. **Hero copy word count: 0.**
- **First decision:** *which article*, not *whether to sign up*. Discovery-first,
  conversion-second. The newsletter capture is mid-page, not above the fold.
- **Navigation model:** horizontal top nav + category filters + "Show more"
  progressive disclosure on the article list. **No search box in the header. No
  sidebar. No command palette.** He gets away with it because the corpus is
  ~100 posts and each one is a destination, not a step in a sequence.
- **Reading page** (`/animation/keyframe-animations/`): an inline TOC of 11
  anchor sections near the top of the article — not a sticky rail. "Last updated
  on May 5th, 2026" + a hit counter as trust signals. Copy-to-clipboard on code
  blocks. Embedded Sandpack playgrounds ("refresh the Result pane") sit inline in
  the prose flow. **No reading-progress bar. No sticky sidebar TOC. No
  prev/next.**
- **[measured] breakpoints** from the shipped CSS bundles: `35.1875rem` (563px),
  `48rem` (768px), `51.6875rem` (827px), `66.5rem` (1064px). Type scale in the
  static CSS clusters on `0.875rem / 0.9375rem / 1rem / 1.125rem / 1.25rem /
  1.3125rem / 1.5rem` — a ~1.125 ratio, very tight. Base leading `1.5`.
  `--bump-width: 3px`, `--aside-border-width: 3px` — asides are marked with a
  3px left border, nothing heavier.
- **Imagery:** an illustrated avatar (light + dark variants). No photography.
  Everything else is diagrammatic or interactive.
- **Lesson:** the most-loved technical blog on the web has *zero* hero copy and
  *zero* header search. It buys navigability with categories and short titles.

### 2. joyofreact.com and css-for-js.dev (the sales pages)

Deliberately included as the **counter-example** — same author, opposite mode.

- Joy of React hero, verbatim: **"The Joy of React"** / *"The interactive
  learning experience that teaches you how to build rich, dynamic web apps with
  React."* Two CTAs above the fold: `Login`, `Enroll Now`.
- CSS for JS hero, verbatim: **"Stop wrestling with CSS."** Same two CTAs.
- 15 sections on the Joy of React page: problem statement → logos → testimonials
  → 6-module curriculum → 3 capstone projects → bonuses → bundle → team licences
  → author bio → FAQ → more testimonials → footer.
- CSS for JS: *[reported]* **10 modules (0–9), 200 lessons, 40 hours.**
  Curriculum shown as expandable/collapsible module cards with 2–4 bullets each
  and no per-lesson counts — the collapse is what stops 200 lessons reading as a
  wall.
- **Imagery here is heavy and deliberate:** lego blocks, shoes, cupcakes, buses,
  a layered animated toaster machine, company logos (Meta, Google, Apple),
  testimonial headshots. The blog is austere; the sales page is loud.
- **Lesson for Agent YAP:** Comeau proves the two modes must be *separated*.
  Agent YAP is currently in blog mode everywhere. It needs one loud surface (the
  landing/onboarding) and 500 quiet surfaces (the slides). Do **not** average
  them into one medium-loud aesthetic.

### 3. subroute.dev

The closest structural analogue to what Agent YAP wants to become.

- Hero, verbatim: *"Learn by playing, not just reading."* ~50–75 words above the
  fold. Two CTAs: `Browse topics`, `Try a live demo`.
- **The header displays a live corpus counter: "Topics 16 · Concepts 112 ·
  References 583."** This is the single most transferable idea on this list — it
  converts "this site is big and I'm lost" into "this site is big and I can see
  its shape."
- Topics index (`/topics`): **16 topic cards**, each showing topic number,
  title, difficulty (Beginner/Intermediate/Advanced), **"10 concepts · 75 min"**,
  a 2–3 sentence description, and tag chips. Filterable by ~20 tags
  (`algorithms`, `caching`, `distributed`, `resilience`, `scaling`…). Sort
  control defaults to **"curated"** — a human-ordered default, not alphabetical
  and not recency.
- Landing structure: hero → topic grid (6 featured) → "How it works" (3 steps) →
  "Why visual learning" → secondary CTA → footer.
- **Imagery: none.** Text plus interactive prototypes.
- **Lesson:** 16 topics × ~7 concepts = 112 units. That is almost exactly Agent
  YAP's target (10–20 modules). Subroute navigates it with **three** devices
  only: a counter, difficulty labels, and tag filters. No sidebar tree.

### 4. atlases.vercel.app

**Could not be read.** The page is a client-rendered SPA — `curl` returns 9,562
bytes whose only visible text is the `<title>`: *"Atlases — Master Software
Engineering Through Interactive Guides."* `/atlases` returns 404. Browser tools
are off-limits for this task, so I am not going to invent an anatomy for it.
Secondary evidence only: a DEV Community listing describes it as **"16
Interactive Learning Guides That Run Code in Your Browser."** Same 16-unit
magnitude as Subroute. **Flag for the main agent** — worth 3 minutes in the
browser pane it owns.

### 5. nan.fyi (Nanda Syahrasyad, "Not a Number")

- Masthead: site title + one-line tagline *"Interactive blog posts on computer
  science and web development by Nanda Syahrasyad."* Subscribe + GitHub +
  Twitter. That's the whole header.
- Index: vertically stacked cards, thumbnail on the **left**, title/date/
  description on the right. Thumbnails are custom SVG illustrations, not photos.
  Posts span 2021–2025 — roughly 5 posts/year, so recency ordering works.
- Reading page (`/svg-paths`): single column. **Demos sit inline immediately
  *after* the prose that introduces the concept — never before it.** The demo is
  the payoff, not the hook. Coordinate grids are labelled (`0 5 10 15 20 25`)
  and live values are surfaced as text (`(5.0, 5.0)` → `(15.0, 15.0)`).
- Navigation within a long piece: **dual section menus** listing `overview ·
  cursors · lines · bezier curves · cubic curves · arcs · challenge`, and the
  section titles double as prev/next. So a single article behaves like a
  7-slide mini-course. **This is the closest existing analogue to Agent YAP's
  slide model.**
- Note the last item in that list: **`challenge`**. The best interactive
  explainer on the web ends with an assessment. Agent YAP ends with nothing.

### 6. ciechanow.ski (Bartosz Ciechanowski)

The high-water mark for "explanation as software."

- **[measured]** from `https://ciechanow.ski/css/base.css`: text column
  `max-width: 44rem` (**704px**), body `font-size: 1.0em`, `line-height: 1.5em`,
  font stack `"Inter", "Helvetica Neue", Arial, sans-serif`. Figure/demo
  containers are `max-width: 100%` — i.e. **the demos break out wider than the
  prose column**. H1 `2.8em`, H2 `1.8em`, H3 `1.5em`, captions `0.6em`.
- **[measured]** the "Moon" article (Dec 2024) is **~16,700 words** with 13
  `<img>` in the static HTML and *zero* `<canvas>` in the served markup — every
  WebGL surface is injected at runtime. Section headings carry anchor links (⚓);
  there is **no scroll-progress bar** and **no sidebar**.
- Homepage is his name, then `Blog / Archives / Patreon / X / Instagram / email /
  RSS`. Articles listed chronologically with dates. That is the entire IA.
- **Imagery:** custom WebGL and diagrams dominate. Photography appears **only
  when the photograph is the evidence** — Apollo mission frames for Aldrin's
  footprint and the opposition effect. Decorative photography: zero.
- **Demos pause when scrolled out of the viewport.** Cheap, invisible, and the
  reason a 16,700-word page with a dozen live simulations doesn't melt a laptop.
- **Lesson:** 704px prose / full-width figures is the canonical two-tier measure.
  Agent YAP's 720px is right; what's missing is the *second* tier — an escape
  hatch that lets a diagram or an exercise widget exceed the prose column.

### 7. Every Layout

- Hero, verbatim: **"Learn to write better, resilient CSS"** / *"If you find
  yourself wrestling with CSS layout, it's likely you're making decisions for
  browsers they should be making themselves."* Two CTAs: `Buy Every Layout For
  $69` and `Read the free rudiments and axioms`.
- **The paid/free split is the navigation.** 12–13 layouts (`Stack`, `Box`,
  `Center`, `Cluster`, `Sidebar`, `Switcher`, `Cover`, `Grid`, `Frame`, `Reel`,
  `Imposter`, `Icon`, `Container`) in a visual grid, each with an SVG icon.
  Three (`Stack`, `Sidebar`, `Switcher`) are badged **"read for free."** A
  separate `/rudiments/` track holds the foundations.
- Reading page (`/layouts/stack/`): collapsible left sidebar (Rudiments /
  Layouts / Blog), inline TOC at top (`#the-problem`, `#the-solution`, …), the
  interactive **generator custom element** embedded mid-flow (inputs: class name,
  space value, split-after index, recursive checkbox → `Generate` → CSS + HTML
  output), and a downloadable `Stack.zip`. Asides appear as inline callouts
  ("Line height and modular scale", "Custom property placement") **mid-section,
  not in a margin.**
- **No prev/next between layouts, no progress bar.** Each layout is a reference
  page you return to, not a step you complete.
- **Imagery:** 13 SVG concept icons, a product cover, client logos (BBC, W3C),
  7 testimonial headshots. Icons carry the whole visual identity.
- **Lesson:** an icon per module is enough visual identity for a 13-module
  product. You do not need photography and you do not need per-module artwork.

### 8. refactoring.guru

- **~22 patterns are made navigable by exactly one move: a 3-way taxonomy** —
  Creational / Structural / Behavioural — stated explicitly on the catalog page
  ("they can be categorized by their intent and divided into three groups").
- Hierarchical collapsible left sidebar covering Refactoring (smells,
  techniques) and Design Patterns (by group), plus a **language switcher** across
  10 languages (C#, C++, Go, Java, PHP, Python, Ruby, Rust, Swift, TypeScript).
  Each pattern page carries the same skeleton: intent → problem → solution →
  structure → pseudocode → applicability → pros/cons → relations.
- **Imagery:** a bespoke illustrated cast of characters by Dmitry Zhart, one
  illustration per pattern. Warm, cartoonish, unmistakable, and *consistent* —
  it is a system, not a stock library.
- **Lesson:** the payload is the **rigidly repeated page skeleton**. Once you've
  read two patterns you can skim the other twenty because you know where
  everything is. Agent YAP's slides currently have no enforced skeleton.

### 9. jalammar.github.io — "The Illustrated Transformer"

- Single column, minimal navbar (`Blog`, `About`, RSS). **No TOC, no sidebar, no
  prev/next, no progress bar.**
- **~30+ full-width PNG diagrams** placed immediately after the prose that
  introduces each concept. The diagrams *are* the article; the prose is caption
  glue. Progress is felt only through section titles ("The Beast With Many
  Heads", "The Decoder Side", "The Loss Function", "Go Forth And Transform").
- Header carries a translation list (a dozen languages) and an update banner.
- **Lesson:** the single most-read explainer of the transformer has **no
  navigation whatsoever**. It works because it is one self-contained artefact.
  This is exactly the model Agent YAP *cannot* copy at 137 files — and the reason
  the site currently feels like a maze despite excellent prose.

### 10. lilianweng.github.io (Lil'Log) — Hugo PaperMod

- **[measured]** from the shipped stylesheet: `--main-width: 720px`,
  `--nav-width: 1024px`, `--gap: 24px` (14px under 768px), `--content-gap: 20px`,
  `--radius: 8px`, `--header-height: 60px`, `--footer-height: 60px`, body
  `line-height: 1.6`. Light/dark via CSS custom properties
  (`--theme`, `--entry`, `--primary`, `--secondary`, `--tertiary`, `--content`,
  `--border`, `--code-bg`, `--hljs-bg`).
- Post header carries **"June 23, 2023 | Estimated Reading Time: 31 min |
  Author: Lilian Weng."** A sticky TOC sidebar lists the major sections
  (Agent System Overview / Planning / Memory / Tool Use / Case Studies /
  Challenges). Figures have captions. Citations are bracketed `[1] [2]` with a
  references block. Tag chips at the bottom (`nlp`, `language-model`, `agent`,
  `steerability`, `prompting`). Prev/next post links (`« Adversarial Attacks on
  LLMs`, `» Prompt Engineering`). "Back to Top".
- **Imagery:** figures only — `agent-overview.png`, `react.png`,
  `generative-agents.png`. No decorative photography.
- **Lesson:** the **"31 min"** estimate is the cheapest trust device in this
  whole teardown, and Agent YAP has the word counts to compute it for free.
  Also: `--main-width: 720px` is literally Agent YAP's current `max-w-[720px]`.
  Independent confirmation the measure is right.

### 11. karpathy.github.io

- Single column, navbar of three things (blog title, `About`, RSS). No TOC, no
  prev/next.
- Sections separated by `---` rules; diagrams as PNG/JPEG/animated GIF; LaTeX
  for equations; syntax-highlighted code from 100-line toys to production
  snippets. Disqus at the bottom.
- **Lesson:** same as Jalammar. Confirms the "famous single-artefact essay"
  pattern is a *genre*, not a design system, and does not scale to a curriculum.

### 12. Stripe docs (docs.stripe.com)

- Top level is a **product taxonomy, not tabs**: Payments / Revenue / Platforms
  and marketplaces / Money management / Prebuilt components.
- The home offers **three parallel routes into the same corpus**: (a) use-case
  ("Accept payments online", "Sell subscriptions", "Accept in-person payments",
  "Collect invoices"), (b) product browsing via the sidebar tree, (c) tooling
  (`stripe docs` CLI, agent skills/plugins). Multiple doors, one building.
- Reading page (`/payments/quickstart`): two columns — hierarchical collapsible
  sidebar (2–3 levels) + wide prose with **inline** code, not a fixed sticky code
  rail. Language switcher spanning JavaScript, Ruby, Python, PHP, Go, C#, Java,
  React, Next.js, HTML. Roughly 60–70% prose / 30–40% code when both are
  visible; collapses to one column on narrow viewports. Callout blockquotes for
  side-conditions. **No imagery on the quickstart at all.**
- **Lesson:** at true scale, one navigation model is never enough. Stripe ships
  three and lets the reader self-select. That is the honest answer to "how do
  you navigate 500 slides."

### 13. Linear docs + changelog

- Docs sidebar is a flat-ish list of **8+ top-level categories** (`Getting
  started`, `Account`, `AI`, `Your sidebar`, `Teams`, `Issues`, …) plus curated
  clusters on the landing page — **"Popular"** and **"Linear basics."** A curated
  "Popular" shelf is a nav device disguised as content.
- Breadcrumb `Docs > [page]` at top; active sidebar item highlighted. (Note: my
  attempt to fetch `/docs/linear-basics` directly returned **404**, so the
  per-page anatomy above is from the docs index only — treat the breadcrumb
  detail as lower-confidence.)
- Changelog: **no left rail of dates.** Reverse-chronological, date as heading,
  entries clustered under `Fixes` / `Improvements`, **pagination** at the bottom
  (`/changelog/page/2`) rather than infinite scroll. Measure reads ~65–75
  characters. Heavy embedded **video** plus product screenshots per entry.
- **Lesson:** two lessons, opposite directions. (1) A curated "Popular" shelf
  beats a complete index for first-time arrival. (2) Linear's changelog is the
  one place on this list where heavy imagery earns its keep — because the
  imagery *is* the product. Agent YAP's product is prose; the scenic photos are
  not evidence of anything.

### 14. Vercel docs

- Landing is a **pure link hub organised by intent**: "Build with AI", "Build
  your applications", "Use Vercel's AI infrastructure", "Secure your
  applications", "Collaborate with your team", "Deploy and scale", "Guides and
  tutorials". Each entry is `**Name**: one sentence. [Learn more →]`.
- Notable and directly relevant: the fetched page served **front-matter for
  machines** — `title`, `product`, `canonical_url`, `last_updated`, `type:
  conceptual`, `prerequisites: []`, `related: [...]`, `summary`,
  `install_vercel_plugin` — and ends with `[View full sitemap](/docs/sitemap)`.
- **Lesson:** two things to steal. (1) The **`related:` + `prerequisites:`
  front-matter** is a graph, and a graph is what lets you recombine content into
  per-learner paths without hand-authoring every path. (2) A **full sitemap page**
  is the escape valve that makes it safe to keep the sidebar short.

### 15. Anthropic docs (platform.claude.com/docs)

- Landing page is almost entirely **`<CardGroup cols={3}>` / `cols={2}` grids**:
  "Develop with Claude" (Developer Console / API Reference / Cookbook), "Key
  capabilities" (Text and code generation / Vision), "Support" (Help Center /
  Service Status).
- Above the cards sits a **`<Steps>` component — "Recommended path for new
  developers"** — four numbered steps, each a title + one sentence + one link:
  make your first API call → understand the Messages API → choose the right
  model → explore features. **This is a linear path superimposed on a
  non-linear corpus**, and it is the exact device Agent YAP's onboarding
  templates should produce.
- A comparison **table** (Messages API vs Claude Managed Agents: "What it is" /
  "Best for" / "Learn more") resolves the biggest fork in the road in ~40 words.
- Callouts (`<Tip>`, `<Note>`) carry version churn so the body prose stays
  stable. No photography.

### 16. Anthropic Academy (anthropic.skilljar.com)

- **20+ courses** plus learning paths. Course cards are minimal: **title + 1–2
  sentence description. No duration, no level badge, no format icon.**
- Paths appear as tiles at the bottom, labelled `Part of:` with a course count
  ("2 Courses").
- Filters: `Plans / Paths / Courses / Lessons` + `Reset`, plus a search box.
- **The gap:** "no prominent 'start here' recommendation exists, leaving
  discovery relatively open-ended for first-time visitors."
- **Lesson — this is the anti-pattern Agent YAP is currently one step away
  from.** A big catalog + filters + search, with no opinionated first move, is
  *worse* for a beginner than five hard-coded paths. Compare Subroute, which
  ships the same volume but with `difficulty`, `10 concepts · 75 min`, and a
  **`curated` default sort**.

### 17. Svelte tutorial (svelte.dev/tutorial)

- Two-pane: left = lesson prose + hierarchical menu; right = embedded live
  editor with file tabs (`App.svelte`), a **`Solve` button** in the top-right
  (disabled on non-exercise pages), and a Vim-mode toggle.
- **4 parts** (Basic Svelte / Advanced Svelte / Basic SvelteKit / Advanced
  SvelteKit) subdividing into **~80+ lessons**. Prev/Next at the bottom.
- The "you are here" indicator is literally rendered as text in the menu:
  **`Basic Svelte › Introduction › Welcome to Svelte (you are here)`**.
- **Lesson:** 80 lessons stay navigable because of a 3-level breadcrumb that is
  always visible plus a strictly linear next button. The learner never has to
  choose; they only have to continue. *Every* exercise page has a `Solve`
  escape hatch, which removes the fear of getting stuck.

### 18. Rust Book (mdBook)

Best-documented numbers of the whole set, straight from the CSS.

- **[measured]** `--content-max-width: 750px`, `--sidebar-target-width: 300px`,
  `--sidebar-width: min(300px, …)`, `--page-padding: 15px`,
  `--menu-bar-height: 50px`, `--code-font-size: 0.875em`,
  `--sidebar-resize-indicator-width: 8px`. Root `font-size: 62.5%` so `1.6rem` =
  16px body; body `line-height: 1.45em`. Breakpoints at **620px, 1080px,
  1380px**. Five themes (`Auto / Light / Rust / Coal / Navy / Ayu`).
- **Keyboard-first navigation:** `←`/`→` = previous/next chapter, `S` or `/` =
  search, `?` = help, `Esc` = dismiss. Also large left/right chevrons pinned to
  the page edges, and prev/next links at the bottom.
- Persistent collapsible sidebar TOC; **the sidebar is user-resizable** (that's
  what the resize-indicator variable is for).
- **Zero imagery** on the installation chapter. Content is prose, code blocks,
  and `$`/`>` shell prompts.
- **Lesson:** Agent YAP's `lg:w-[300px]` rail is exactly mdBook's 300px, and its
  720px prose is 30px under mdBook's 750px. The gap versus mdBook is **keyboard
  navigation and search**, not layout.

### 19. Bun docs

- Four top-level pillars — **Runtime, Package Manager, Test Runner, Bundler** —
  each with its own docs root (`/docs/runtime`, `/docs/pm/cli/install`, …).
  Card-based hub with icons.
- Every section follows the same declared shape: **"overview, quick examples,
  reference, and best practices for fast scanning and deep dives."**
- Ships an **`llms.txt`** index for machine discovery. *(Agent YAP already has
  `src/app/llms.txt` and `src/app/llms-full.txt` — good, keep them and regenerate
  them per module.)*
- **Lesson:** 4 pillars × identical internal shape = scale without a maze. Same
  move as refactoring.guru, different domain.

### 20. Tailwind docs

- Sidebar: **4 groups** — `Getting started` (4 items), `Core concepts` (9
  items), `Base styles` (1 item), then a long utility reference (`Layout`,
  `Flexbox & Grid`, `Spacing`, `Sizing`, `Typography`, `Backgrounds`, `Borders`,
  `Effects`, `Filters`, `Tables`, `Transitions & Animation`, `Transforms`,
  `Interactivity`, `SVG`, `Accessibility` — 50+ links).
- **`⌘K` / `Ctrl K` search modal** advertised in the top bar. Breadcrumb
  `Getting Started > Using Vite`.
- Code blocks are **labelled with the file they belong to** (`vite.config.ts`,
  `CSS`, `HTML`, `Terminal`) — a one-word affordance that removes most "where do
  I paste this" confusion.
- No prev/next pagination on the install page; instead a contextual CTA ("Check
  our framework guides"). **No imagery.**
- **Lesson:** the asymmetric sidebar — 14 conceptual items on top, 50+ reference
  items below — is the right shape for Agent YAP: *learn* items and *look up*
  items are different species and should not be interleaved.

### 21. OpenAI Cookbook (developers.openai.com/cookbook)

- Above the fold: **under 50 words**, essentially "Recipes and examples from the
  OpenAI developer cookbook" plus a pointer to `/llms.txt`.
- Recipes are **plain hyperlinks grouped into three buckets** (Documentation
  sets / Articles / Examples) with a bracketed one-line description. **No cards,
  no facets, no pagination, no imagery, no sidebar.**
- **Lesson — negative.** This is what happens when a large corpus gets no
  navigation investment: a long linear list that is fine for grep and useless
  for browsing. Agent YAP at 137 files is on this trajectory today.

### 22. The Odin Project

- `/paths`: **3 options** — `Foundations` (prerequisite), `Full Stack
  JavaScript` (8 courses), `Full Stack Ruby on Rails` (7 courses). Each card:
  badge icon, title, course count, short description, `Explore` button.
- **The first decision is pre-made for you**: Foundations is mandatory before
  either specialisation. Three choices, and two of them are locked until later.
- Foundations curriculum page: **9 thematic sections** (Introduction,
  Prerequisites, Git Basics, HTML Foundations, CSS Foundations, Flexbox,
  JavaScript Basics, Conclusion), each row tagged **`[Lesson]`** or
  **`[Project]`**. In the logged-out view I fetched, no progress %, no
  checkboxes, no "continue where you left off" — those are behind auth.
- **Lesson:** the strongest onboarding on this list is *three cards and a
  prerequisite*. Not a quiz, not a wizard. And the `[Lesson]` / `[Project]`
  binary tag is the minimum viable "this one is assessment" marker — Agent YAP
  can ship the same thing as `[Read]` / `[Check]`.

---

## Cross-cutting findings

### On imagery — the clearest signal in the whole teardown

| Site | Decorative photography? | What it uses instead |
|---|---|---|
| ciechanow.ski | No (only Apollo photos as *evidence*) | WebGL simulations, diagrams |
| jalammar | No | 30+ hand-drawn PNG diagrams |
| lilianweng | No | Captioned figures |
| karpathy | No | Diagrams, GIFs, LaTeX |
| Rust Book | No | Nothing — prose + code |
| Tailwind docs | No | Labelled code blocks |
| Stripe quickstart | No | Code + callouts |
| Anthropic docs | No | Card grids, Steps, tables |
| Bun docs | No | Icon cards |
| OpenAI cookbook | No | Nothing |
| joshwcomeau (blog) | No | One illustrated avatar |
| nan.fyi | No | Custom SVG thumbnails |
| Every Layout | No | 13 SVG concept icons |
| refactoring.guru | No | Bespoke character illustrations |
| Linear changelog | **Yes** — product video + screenshots | (imagery *is* the product) |
| joshwcomeau (sales) | **Yes** — headshots, logos, 3D renders | (imagery *is* the pitch) |

**19 of 22 sites use zero decorative photography.** The two that use imagery
heavily are both *selling* something, and their imagery is evidence (a product
recording, a testimonial face), not mood. The founder's instinct that
`public/assets/snow-mountain.jpg` and `cloud-sea.jpg` feel repetitive is
correct, and the correct replacement is **not a better photo** — it is a
generated, per-module, deterministic visual identity (icon or procedural mark)
in the refactoring.guru / Every Layout mould.

### On measure — the converged number

| Site | Prose column | Source |
|---|---|---|
| Ciechanowski | **704px** (`44rem`) | [measured] `base.css` |
| Lil'Log / PaperMod | **720px** (`--main-width`) | [measured] stylesheet |
| **Agent YAP (today)** | **720px** | `max-w-[720px]` |
| Rust Book | **750px** (`--content-max-width`) | [measured] `variables.css` |
| Linear changelog | ~65–75ch | *[reported]* |

704–750px is the band. Agent YAP is dead centre. **Do not touch it.**

### On sidebar width

Rust Book `--sidebar-target-width: 300px`; Agent YAP `lg:w-[300px]`. Also
converged. Do not touch.

### On leading

Comeau `1.5`, Ciechanowski `1.5`, Lil'Log `1.6`, Rust Book `1.45`, Agent YAP
`1.6`. Fine.

---

## A. Ten patterns Agent YAP should adopt

Ordered by ratio of impact to effort.

**A1. A corpus counter in the masthead — "8 tracks · 137 chapters · N checks."**
Turns invisible scale into legible scale; it is the cheapest antidote to "this
site is a maze." *Proved by:* subroute.dev's `Topics 16 · Concepts 112 ·
References 583`. *Tradeoff:* it exposes thin areas — a track with 1 chapter looks
sad. Rejected alternative: a sitemap page, which only helps people who already
know they're lost.

**A2. Reading-time + difficulty on every module and chapter card.**
`"31 min"` and `Beginner / Intermediate / Advanced` are computed from data
Agent YAP already has (word counts in `src/lib/content.ts`) and are the single
strongest predictor of whether someone starts. *Proved by:* Lil'Log ("Estimated
Reading Time: 31 min"), subroute.dev ("10 concepts · 75 min", difficulty badge).
*Tradeoff:* estimates are wrong for skimmers; accept it — a wrong number beats no
number because the value is *commitment framing*, not accuracy.

**A3. A `⌘K` command palette that searches chapters, slides, and glossary terms
— and is the *only* search affordance.**
One keystroke replaces a header search box, a sidebar filter, and an index page,
which is a net *reduction* in visible chrome. *Proved by:* Tailwind docs
(`⌘K`/`Ctrl K` in the top bar), Rust Book (`S` or `/`). *Tradeoff:* discoverable
only to people who know the convention — mitigate with a single ghosted `⌘K`
pill in the rail, not a full search input. Rejected alternative: an always-visible
search field, which costs permanent header real estate and violates the
minimalism constraint.

**A4. Arrow-key chapter/slide navigation, documented by a `?` help overlay.**
Zero pixels of chrome, and it converts the slide reader from a website into an
instrument. *Proved by:* Rust Book (`←`/`→`, `?`, `Esc`). *Tradeoff:* invisible;
the `?` overlay and a one-time toast are the whole discovery budget.
Agent YAP already has `nav-direction.ts` — the plumbing exists.

**A5. A "you are here" breadcrumb rendered as plain text, three levels deep.**
`Track › Module › Chapter` at the top of every slide, with the current node in
full-weight ink and ancestors in `--color-ink-2`. *Proved by:* Svelte tutorial's
literal `Basic Svelte › Introduction › Welcome to Svelte (you are here)`; also
Tailwind and Linear. *Tradeoff:* one more line of text on a minimal page — but it
is the line that stops 500 slides feeling identical. Rejected alternative: a
scroll-progress bar, which tells you about *this page* when the anxiety is about
*the corpus*.

**A6. A rigidly repeated per-chapter skeleton, enforced in `src/lib/content.ts`.**
Something like: **Hook → Mental model → Mechanics → Failure modes → Check
yourself.** Once a reader has done two chapters they can skim the other 135
because they know where everything lives. *Proved by:* refactoring.guru (intent →
problem → solution → structure → pseudocode → applicability → relations), Bun
("overview, quick examples, reference, best practices"). *Tradeoff:* it
constrains authoring, and some chapters will have a thin section. Accept the
thin section; the predictability is worth more than the variety.

**A7. Two-tier measure: 720px prose, with a full-bleed escape hatch for
diagrams, exercise widgets, and code.**
Interactive assessment widgets will not fit in a 720px column, and squeezing them
there is how "calm" becomes "cramped." *Proved by:* Ciechanowski (`44rem` text,
`max-width: 100%` figures). *Tradeoff:* requires a `.bleed` utility and
discipline about when to use it. Rejected alternative: widening the prose column
to fit widgets — that would break the measure that is currently the site's best
asset.

**A8. Prerequisite + related front-matter on every chapter, making the corpus a
graph.**
`prerequisites: []` and `related: [...]` are what let 5 onboarding templates
recombine 20 modules without hand-authoring 5 × 20 orderings. *Proved by:* Vercel
docs, which serves exactly those fields in page front-matter alongside `type:
conceptual`. *Tradeoff:* 137 files need back-filling — do it per-module as each
of the 7 unwired folders comes online, not as a big-bang migration.

**A9. An opinionated "Start here" path rendered as numbered steps, superimposed
on the free-browse corpus.**
4–6 steps, each a title + one sentence + one link. The reader who wants a path
gets one; the reader who wants to browse ignores it. *Proved by:* Anthropic docs'
`<Steps>` "Recommended path for new developers"; The Odin Project's mandatory
Foundations. *Anti-proved by:* Anthropic Academy, which has 20+ courses, filters,
and search but "no prominent 'start here' recommendation" — the exact failure
mode. *Tradeoff:* picking a canonical order is an editorial commitment you will
have to defend. Make it.

**A10. Interaction placed *after* the prose that motivates it, and paused when
off-screen.**
Demos-after-explanation preserves the calm reading rhythm; a widget above the
fold of a section hijacks it. Pausing off-screen keeps a 20-widget module from
melting a laptop. *Proved by:* nan.fyi (demo immediately after the concept),
Ciechanowski (demos pause outside the viewport). *Tradeoff:* an
`IntersectionObserver` per widget — trivial. Rejected alternative:
demo-as-hook-first, which reads as gamified and clashes with the site's voice.

---

## B. Five patterns Agent YAP should deliberately reject

**B1. Reject: a reading-progress bar pinned to the top of the slide.**
Every ambient-progress site on this list is a *blog*. None of the reference-grade
readers (Rust Book, Tailwind, Stripe, Every Layout) has one. On a slide reader
where a slide is one screen, a progress bar measures nothing and adds a
permanently-animating element to a page whose whole thesis is stillness. What the
reader actually wants is *corpus* progress — put that in the rail as a count
(A1/A5), not as a moving bar.

**B2. Reject: an always-visible search input in the header.**
Josh Comeau — arguably the best-loved technical writer on the web — ships **no
header search at all**. Tailwind and mdBook hide theirs behind `⌘K` / `S`.
A permanent input is 44px of chrome on every one of 500 slides to serve a
minority action. Use A3 instead.

**B3. Reject: a big filterable catalog as the primary entry point.**
Anthropic Academy proves the failure directly: 20+ courses, a search box, four
filter facets, and — per the page itself — no "start here", leaving discovery
"relatively open-ended." OpenAI Cookbook proves the degenerate version: hundreds
of recipes as a flat link list with no faceting at all. Agent YAP's founder is
explicitly building onboarding that *assigns* a template; a catalog-first landing
would compete with it.

**B4. Reject: decorative photography, including replacing the two scenic
photos with better scenic photos.**
19 of 22 sites use none. The two that use imagery heavily (Linear changelog, the
Comeau sales pages) use it as *evidence*, not mood. Replace
`public/assets/snow-mountain.jpg` and `cloud-sea.jpg` with a deterministic
per-module generated mark (seeded from the module slug) in the Every Layout /
refactoring.guru tradition — same calm, zero repetition, and it scales to 20
modules for free instead of requiring 20 stock licences.

**B5. Reject: the fully-expanded sidebar tree as the only wayfinding device.**
Refactoring.guru, Bun, Stripe and Tailwind all pre-group before they list —
3 pattern families, 4 pillars, 5 products, 4 sidebar groups. Agent YAP's
`Rail.tsx` already collapses by chapter, but at 8 tracks × ~17 chapters × N
slides a single tree becomes the maze it was meant to prevent. Pair it with a
short curated shelf (Linear's "Popular") and the `⌘K` palette. Also reject its
opposite — Stripe's three parallel navigation systems — as too much machinery
for a solo team.

---

## C. How do you navigate 20 modules / 500 slides while staying minimal?

Three candidate architectures. All three assume `src/lib/content.ts` grows a
module layer above chapters and gains `prerequisites` / `related` front-matter.

### Candidate 1 — "One deep tree" (extend today's `Rail.tsx`)

Add a Track level above Chapter in the existing rail: Track → Module → Chapter →
Slide, collapsible at every level, active path auto-expanded and scrolled into
view (`Rail.tsx:57` already does this for slides).

- **Pro:** smallest diff; nothing new to learn; already accessible
  (`aria-current="page"` at `Rail.tsx:193`).
- **Pro:** matches the Rust Book, the most navigable long-form technical book on
  the web, at the same 300px width.
- **Con:** four levels of nesting in 300px produces ~24px of indent by the leaf
  and a rail that scrolls for pages. mdBook survives this with **one** book;
  Agent YAP would have eight.
- **Con:** does nothing for the founder's onboarding-assigns-a-path requirement.
  A tree presents *all* content equally, which is the opposite of personalisation.
- **Verdict:** necessary, insufficient.

### Candidate 2 — "Path first, tree on demand" (Odin / Svelte model)

The rail defaults to showing **only the learner's assigned path** — the ordered
sequence of modules their onboarding template produced, ~15–40 chapters, flat,
with a persistent `Track › Module › Chapter` breadcrumb and prev/next. A single
`Browse all` toggle at the top of the rail swaps to the full Candidate-1 tree.
`⌘K` searches everything at all times, path or no path.

- **Pro:** directly implements the founder's stated model (4–5 templates × 10–20
  modules recombined). The rail *is* the personalisation, so personalisation
  costs zero extra UI.
- **Pro:** the linear-next affordance is what makes 80 Svelte lessons feel
  effortless — the learner never chooses, they only continue.
- **Pro:** the rail stays short by construction, so 500 slides never appear at
  once.
- **Con:** requires the module layer, the template definitions, and localStorage
  path state before it can ship at all. Bigger first increment.
- **Con:** a returning visitor who wants a chapter *outside* their path needs two
  actions (`Browse all`, then find it) — mitigated entirely by `⌘K`.
- **Con:** no auth today means the path lives in localStorage and evaporates on a
  new device. Acceptable: `ResumePill.tsx` already establishes that precedent.

### Candidate 3 — "Search-first / palette-only" (Cookbook + Stripe CLI model)

Delete the persistent rail. The landing is a curated shelf of ~8 modules; every
other navigation action is `⌘K`. Each slide gets a breadcrumb and prev/next; a
`/sitemap` page is the complete index.

- **Pro:** maximum visual restraint — literally the least chrome of the three.
- **Pro:** scales to 5,000 slides as easily as 500.
- **Con:** search-only navigation requires the reader to already know the
  vocabulary. Agent YAP's audience includes people who do not yet know what
  "context engineering" or "compaction" means — they cannot search for it.
- **Con:** OpenAI Cookbook is the live demonstration of this failing for
  browsing. No sense of place, no sense of progress, no sense of completion —
  fatal for a site whose thesis is self-evaluation.
- **Verdict:** correct for reference, wrong for curriculum.

### Pick: **Candidate 2 — "Path first, tree on demand."**

**Why it beats Candidate 1:** the tree treats all 500 slides as equally relevant
to every visitor, which is exactly the state the founder is trying to escape. A
tree also gets *worse* as content grows ("content will grow drastically"), while
a path stays a constant 15–40 items regardless of corpus size. That asymptotic
behaviour is the whole argument.

**Why it beats Candidate 3:** the palette is a *precision* instrument and
requires vocabulary the target learner does not have yet. Candidate 2 keeps
`⌘K` as the power-user escape hatch (so it loses nothing) while giving the
beginner a default that requires zero decisions.

**Why it satisfies "it should feel like nothing":** in the steady state the
learner sees a short list, a breadcrumb, and a next button. The 500-slide corpus
is *present but not rendered*. The minimalism is structural, not cosmetic —
which is exactly the founder's stated source of uniqueness.

**Concrete shape:**

```
┌─ Rail (300px, existing) ───────┬─ Slide (720px prose, existing) ──────┐
│ Your path · 12 / 34            │ Track › Module › Chapter             │
│ ● Module 1  Agent loops   ✓    │                                      │
│ ● Module 2  Tool design   ✓    │ H1                                   │
│ ○ Module 3  Context eng   ←    │ prose @ 17px/1.6                     │
│     ├ ch 05  Context …    ✓    │                                      │
│     ├ ch 06  Prompt arch  ←    │ ┌─ full-bleed ────────────────────┐  │
│     └ ch 07  Retrieval         │ │  diagram / exercise widget      │  │
│ ○ Module 4  Evaluation         │ └─────────────────────────────────┘  │
│ …                              │                                      │
│                                │ prose                                │
│ ─────────────                  │                                      │
│ Browse all tracks              │ ┌─ Check yourself ────────────────┐  │
│ ⌘K  Search                     │ └─────────────────────────────────┘  │
│                                │                    ← prev   next →   │
└────────────────────────────────┴──────────────────────────────────────┘
```

**Build order (each increment independently shippable):**

1. Breadcrumb + `←`/`→` keys + `?` overlay on the existing reader. No data model
   change. (A4, A5)
2. Reading-time and difficulty computed in `src/lib/content.ts`, surfaced on
   chapter cards. (A2)
3. `⌘K` palette over the existing search index. (A3)
4. Module layer + `prerequisites` / `related` front-matter; wire the 7 dark
   content folders. (A8)
5. Onboarding → template → path; rail switches to path mode with `Browse all`
   fallback. (Candidate 2, A9)
6. Full-bleed slot + first `Check yourself` widget. (A7, A10)

---

## Confidence notes and gaps

- **atlases.vercel.app could not be read** — client-rendered SPA, `curl` yields
  only the `<title>`; `/atlases` is a 404. Browser tools were out of scope for
  this task. Recommend the main agent spend 3 minutes on it in the browser pane.
- **linear.app/docs/linear-basics returned 404**; Linear per-page anatomy is
  inferred from the docs index only.
- **Odin Project progress UI is behind auth** — the logged-out curriculum page
  shows no checkboxes or percentages, so I could not verify their completion
  affordance.
- Prose-column width for **joshwcomeau.com** could not be extracted: it is set by
  runtime styled-components, not the static CSS bundles. Its breakpoints and type
  scale above **are** measured.
- Everything marked **[measured]** was pulled from production CSS on 2026-08-02
  and is reproducible with `curl`.
