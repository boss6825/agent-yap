# 02 — Codebase + UX Audit of the Shipped Site

Branch audited: `feature/learning-platform-v2`. Read-only audit. No repo files were modified.
Every `file:line` below was verified against the working tree at audit time.

**Headline numbers**

| Fact | Value | Source |
|---|---|---|
| Books wired into the site | **1 of 9** content folders | `src/lib/content.ts:182,196` |
| Chapters | 18 | `content/architecture-and-system-design/chapter-*.md` |
| Slides (static pages) | **199** | computed from `splitIntoSections` (`content.ts:121`) |
| Nav manifest JSON per reader page | **~103 KB uncompressed** (2× duplicated) | `content.ts:351-366` |
| Landing hero images on disk | **14.7 MB** (6.82 MB + 7.88 MB) | `public/assets/` |
| Chapter art | 18 JPGs, 2.6 MB, 63 KB–378 KB each | `public/art/` |
| Webfonts loaded | **zero** | no `next/font` anywhere in `src/` |
| `:focus-visible` rules in codebase | **zero** | grep over `src/` |
| Code-split / `dynamic()` imports | **zero** | grep over `src/` |
| `.next` build output | 477 MB | on-disk |

---

## 1. The current user journey — complete map

### 1.1 Route table (every route that exists)

| Route | File | Kind | Behaviour |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Server → client `<Home>` | Landing. Calls `getPrimaryBook()` (`page.tsx:6`) — hardwired to **one** book. |
| `/read` | `src/app/read/page.tsx` | Server redirect | `redirect(getPrimaryBook().slides[0].href)` (`read/page.tsx:5`). Always lands on `/read/architecture-and-system-design/01-anatomy/0`. |
| `/read/[book]` | `src/app/read/[book]/page.tsx` | Server redirect | `redirect(b.slides[0].href)` (`[book]/page.tsx:12`). **There is no book table-of-contents page anywhere in the product.** |
| `/read/[book]/[chapter]/[slide]` | `.../[slide]/page.tsx` | **SSG**, 199 params | `generateStaticParams()` at `[slide]/page.tsx:10-24` iterates all books × chapters × slides. |
| `/api/search?q=&limit=` | `src/app/api/search/route.ts` | Node runtime GET | Returns `{query, results[]}`. Response omits `bookSlug` (`route.ts:16-25`). |
| `/api/ask` | `src/app/api/ask/route.ts` | Node runtime POST | Body is exactly `{question}`. Returns `{answer, citations, configured}`. |
| `/llms.txt` | `src/app/llms.txt/route.ts` | `force-static` | llms.txt index of every book/chapter. |
| `/llms-full.txt` | `src/app/llms-full.txt/route.ts` | `force-static` | Full markdown of every chapter concatenated. |
| `/sitemap.xml` | `src/app/sitemap.ts` | Metadata route | Landing + all 199 slide URLs. |
| `/robots.txt` | `src/app/robots.ts` | Metadata route | Allow `/`, disallow `/api/`. |
| 404 | `src/app/not-found.tsx` | — | Links to `/` and `/read`. |

**Structural gap:** the URL space has no shelf (`/read` is a redirect), no book landing (`/read/[book]` is a redirect), and no chapter landing (`/read/[book]/[chapter]` does not exist — only `.../[chapter]/[slide]`). The product's only "browse" surface is section 5 of the landing page.

### 1.2 Entry points into the reader (11 distinct affordances, all pointing at the same book)

| # | Affordance | File:line | Target |
|---|---|---|---|
| 1 | Nav link "Reader" | `Home.tsx:92` | `data.startHref` |
| 2 | Nav pill CTA ("Start learning" / "Continue reading") | `Home.tsx:120-125` | `ctaHref` = resume-or-start |
| 3 | Hero CTA | `Home.tsx:164-170` | `ctaHref` |
| 4 | 18 curriculum cards | `Home.tsx:290` | `c.href` (chapter slide 0) |
| 5 | "Start with Chapter 1" | `Home.tsx:386` | `data.startHref` (ignores resume — inconsistent with #2/#3) |
| 6 | "Open the reader" text link | `Home.tsx:419` | `data.startHref` |
| 7 | Reader-preview card (whole card is a link) | `Home.tsx:427` | `firstChapter.href` |
| 8 | Footer "Reader" | `Home.tsx:470` | `data.startHref` |
| 9 | 404 "Start reading →" | `not-found.tsx:31` | `/read` |
| 10 | Search results | `SearchPanel.tsx:153-175` | `r.href` |
| 11 | Ask/Chat citations | `AskPanel.tsx:164`, `ChatPanel.tsx:540` | `c.href` |

Eleven doors, one room. This is the single biggest structural liability for a multi-book product.

### 1.3 Navigation affordances inside the reader (`ReaderChrome.tsx`)

Top chrome (`ReaderChrome.tsx:236-308`), 52px tall:
- Rail toggle button, `title="Contents (t)"`, `aria-expanded` (`:239-268`)
- "Agent YAP" wordmark → `/` (`:269-274`) — **the only exit from the reader**
- Centred chapter label, `hidden md:block` (`:277-280`)
- "Search" button (`:283-290`), "Chat" button (`:291-301`)
- Counter `NN / MM` with `tabular-nums` (`:302-304`)
- `ThemeToggle` (`:305`)

Body:
- `AmbientBackdrop` WebGL layer (`:312`)
- Rail `<aside>` (`:323-341`) — 300px docked ≥1024px, off-canvas overlay below
- Slide stage: glass card, `rounded-[24px]`, own scroll container (`:349-353`)
- `ResumePill` (`:357-366`), floating prev/next buttons (`:369-393`)
- `ChatPanel` `<aside>` right side (`:397`)
- Fixed 2px progress bar, `z-[60]` (`:228-233`)

Rail (`Rail.tsx`):
- Header with book title + "N chapters · M slides" (`Rail.tsx:109-127`)
- Chapter disclosure buttons with a completion ring (`:143-180`, `ChapterMeter` at `:249`)
- Slide rows with read checkmarks (`:184-207`, `ReadMark` at `:219`)
- Current chapter auto-expands via the previous-render pattern (`:47-55`); active row auto-`scrollIntoView` (`:58-61`)
- Full-bleed chapter artwork background behind a `bg-canvas/70` scrim (`:95-107`)
- **No book switcher.**

### 1.4 Keyboard shortcuts (complete)

| Key | Action | Guard | File:line |
|---|---|---|---|
| `→` / `PageDown` / `Space` | Next slide | not typing, no modal, not mobile-overlay | `ReaderChrome.tsx:187-189` |
| `←` / `PageUp` | Previous slide | same | `ReaderChrome.tsx:190-192` |
| `/` | Open search | not typing, no modal | `ReaderChrome.tsx:174-178` |
| `t` / `T` | Toggle contents rail | not typing, no modal | `ReaderChrome.tsx:179-183` |
| `Escape` | Close rail | always bound while rail mounted | `Rail.tsx:63-69` |
| `Escape` | Close chat | via `onKeyDown` on the `<aside>` | `ChatPanel.tsx:262-264` |
| `Escape` | Close modal | while modal open | `Modal.tsx:20-23` |
| `↑` / `↓` / `Enter` | Move / open search result | inside SearchPanel input | `SearchPanel.tsx:92-103` |
| `Enter` (no shift) | Send chat message | inside composer | `ChatPanel.tsx:237-242` |
| Swipe L/R > 60px | Next / prev slide | `Math.abs(dx) > Math.abs(dy)*1.5` | `ReaderChrome.tsx:205-220` |

Notes:
- **`Space` is bound to "next slide" (`:187`) while the stage is a scroll container (`:352`).** On any slide taller than the viewport, spacebar — the universal "page down" — jumps to the next slide instead of scrolling. This is a real, reproducible bug on the long slides (several chapters have 3–4k-word sections).
- **The landing page has no keyboard shortcuts at all.** `/` does not open search on `/` even though the button exists (`Home.tsx:99-106`). Inconsistent with the reader.
- Discoverability is one string: `"← → arrow keys work too"`, `hidden sm:block` (`ReaderChrome.tsx:370-372`). It never mentions `/`, `t`, `Space`, or swipe. There is no shortcut sheet.

### 1.5 localStorage — every key

| Key | Shape | Written by | Read by | Notes |
|---|---|---|---|---|
| `theme` | `"light"` \| `"dark"` | `ThemeToggle.tsx:16` | boot script `layout.tsx:40` | **Un-namespaced** — inconsistent with the other three. |
| `agent-yap:progress:v1` | `{version:1, lastHref, lastReadAt, read: Record<bookSlug, Record<href, epochMs>>}` | `progress.ts:94-109` | `progress.ts:63-67`, `useProgress()` | Version-gated defensive parse (`:36-57`); cross-tab sync via `storage` event (`:83-91`). |
| `agent-yap:rail-open` | `"0"` \| `"1"` | `ReaderChrome.tsx:140` | `ReaderChrome.tsx:39-47` | **Desktop only** — `readStoredRailPref` returns `null` below 1024px (`:41`). |
| `agent-yap:gemini-api-key` | raw API key, plaintext | `gemini.ts:116-131` | `gemini.ts:102-111` | User-supplied BYOK key. See §4.6. |

There is **no** stored: user level, learner type, goal, completed-quiz state, streak, bookmark, note, or last-book-per-book pointer. Everything onboarding needs is greenfield.

---

## 2. The design system as it actually exists

Enough detail to build a new page that looks native without seeing the site.

### 2.1 Color tokens — `globals.css:6-30` (`@theme`) and `:36-48` (dark)

```
                        light            dark ([data-theme="dark"])
--color-canvas          #ffffff          #000000
--color-canvas-2        #f5f5f7          #1c1c1e
--color-canvas-3        #efeff1          #2c2c2e
--color-ink             #1d1d1f          #f5f5f7
--color-ink-2           #6e6e73          #98989d
--color-hairline        rgba(0,0,0,.08)  rgba(255,255,255,.1)
--color-blue            #0071e3          #2997ff
--color-blue-deep       #0066cc          #0a84ff
--color-blue-bright     #2997ff          #409cff
--color-night           #000000          (not re-pointed — absolute)
--color-snow            #f5f5f7          (not re-pointed — absolute)
--color-snow-dim        rgba(245,245,247,.65)   (absolute)
--color-hairline-snow   rgba(255,255,255,.1)    (absolute)
```

Dark mode also sets `color-scheme: dark` (`globals.css:47`).
Tailwind v4 `@theme` means every token is available as `bg-canvas`, `text-ink-2`, `border-hairline`, etc.

The `night`/`snow` family is deliberately theme-independent: it is the palette of the landing page's cinematic sections, which stay black in both themes (`Home.tsx:134, 206, 238, 316, 365`).

**Untokenized colors in use (one-offs you must not invent more of):**
- `#0a0a0c` at 0.72 alpha — dark `.glass-card` (`globals.css:105`)
- `rgba(28,28,30,.72)` — dark `.glass-light` (`globals.css:94`)
- Memory-strata band greys `#3A3A3E / #2E2E32 / #242428 / #1C1C1E` (`Home.tsx:29-32`)
- Canvas node fill `#2997FF` and `rgba(41,151,255,…)` glows (`fx.ts:285, 298-299, 306`)
- 16 highlight.js syntax colors, light + dark (`globals.css:295-381`)
- **Three shader palettes that share nothing with the token palette** (see §2.6)

### 2.2 Font stack — `globals.css:21-26`

```
--font-display : "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif
--font-sans    : "SF Pro Text",    -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif
--font-mono    : "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
```

**No webfont is loaded. There is no `next/font` import anywhere in `src/`.** On Windows the site renders in Segoe UI; on Android, Roboto. The "Apple typography" is only real on Apple hardware — which is roughly a third of the target audience. This is worth fixing in the redesign (self-host one variable font; keeps zero-network-round-trip discipline via `next/font/local`).

Also note `-webkit-font-smoothing: antialiased` + `text-rendering: optimizeLegibility` on `body` (`globals.css:60-61`) and `antialiased` again on `<html>` (`layout.tsx:50`).

### 2.3 Type scale (as used — none of it is tokenized)

| Role | Size / line-height / tracking | Example |
|---|---|---|
| Hero H1 | `clamp(40px,7.4vw,80px)` / 1.04 / -0.015em / 600 | `Home.tsx:153` |
| Section H2 (light) | `clamp(32px,4.6vw,52px)` / 1.12 / -0.01em | `Home.tsx:189` |
| Section H2 (dark scene) | `clamp(32px,5vw,56px)` / 1.07 / -0.015em | `Home.tsx:215, 325` |
| Interstitial H2 | `clamp(28px,4.2vw,48px)` / 1.14 | `Home.tsx:256` |
| Final CTA H2 | `clamp(36px,5.5vw,64px)` / 1.07 | `Home.tsx:382` |
| Reader chapter H1 | `clamp(34px,5.6vw,48px)` / 1.08 / -0.01em | `[slide]/page.tsx:79` |
| Reader section H1 | `clamp(30px,5vw,40px)` / 1.12 / -0.01em | `[slide]/page.tsx:86` |
| Card title | 24px / 1.2 / -0.01em / 600 | `Home.tsx:299` |
| Lead paragraph | 21px / 1.4–1.5 | `Home.tsx:159, 197, 283` |
| Body / card blurb | 17px / 1.47 | `Home.tsx:302, 414` |
| Prose body | 17px / 1.6 / -0.2px | `.prose-yap`, `globals.css:161-167` |
| Small | 15px, 14px (`text-sm`), 13.5px (`pre`), 13px (rail rows, chat) | — |
| **Eyebrow / kicker** | 12px / 600 / `uppercase` / `tracking-[0.10em]` | `Home.tsx:183`, `[slide]/page.tsx:67` |
| Micro | 11px (chip), 10px (rail meter) | `Rail.tsx:167, 260` |

Weights: **600 and 400 only** (`font-semibold` / default). `font-medium` (500) appears in exactly 4 places (citation rows, resume pill). 700 only inside `.hljs-strong`.
`[text-wrap:pretty]` on prose and slide H1s; `[text-wrap:balance]` on the 404 H1.
The eyebrow pattern — `text-xs font-semibold uppercase tracking-[0.10em] text-ink-2` — is the single most-repeated composite in the codebase (9 occurrences). It is the site's signature.

### 2.4 Radii, shadows, borders

Tokens (`globals.css:28-29`): `--radius-card: 18px`, `--radius-pill: 980px`.
Actually-used ladder: **6px** (inline `code`, `kbd`) · **8px** (`rounded-lg`, rail slide rows) · **12px** (`rounded-xl`, buttons/inputs) · **16px** (`rounded-2xl`, composer) · **18px** (`rounded-card`) · **24px** (`rounded-[24px]`, reader glass card, `ReaderChrome.tsx:349`) · **980px** (`rounded-pill`).

Shadows — **no tokens**, three literal values:
- `shadow-sm` (Tailwind default) — nav buttons `ReaderChrome.tsx:379,388`, `ResumePill.tsx:28`
- `shadow-[0_4px_24px_rgba(0,0,0,0.06)]` — reader-preview card `Home.tsx:428`
- `shadow-[0_24px_48px_rgba(0,0,0,0.18)]` — modal `Modal.tsx:50`

Borders: always `1px solid var(--color-hairline)` via `border-hairline`. Never a heavier rule. `hr` in prose is the same hairline (`globals.css:287-291`).

### 2.5 Glass surfaces — `globals.css:85-106`

```css
.glass-light { background: rgba(255,255,255,.80); backdrop-filter: saturate(180%) blur(20px); }
.glass-dark  { background: rgba(0,0,0,.55);       backdrop-filter: saturate(180%) blur(20px); }
[data-theme="dark"] .glass-light { background: rgba(28,28,30,.72); }

.glass-card  { background: rgba(255,255,255,.82); backdrop-filter: saturate(160%) blur(26px); }
[data-theme="dark"] .glass-card  { background: rgba(10,10,12,.72); }
```
`glass-light` = fixed chrome (headers, rail, chat panel). `glass-dark` = landing nav over dark sections. `glass-card` = the reader's reading surface floating over the WebGL layer. Comment at `:82-84` explains why `-webkit-backdrop-filter` is deliberately absent (LightningCSS drops the standard property if the prefixed one is hand-written).

### 2.6 Spacing rhythm

- Header height: **52px**, both landing (`Home.tsx:67`) and reader (`ReaderChrome.tsx:236`).
- Section vertical padding: `py-[clamp(120px,18vh,200px)]` (manifesto) / `py-[clamp(120px,16vh,180px)]` (curriculum, reader-preview).
- Horizontal gutter: **`px-6` (24px)** everywhere on the landing; `px-3 sm:px-5` in reader chrome; `px-6 sm:px-10` in the slide stage (`template.tsx:22`).
- Max widths: **1200px** (nav, curriculum, reader-preview) · **980px** (manifesto, strata copy, footer) · **720px** (reader prose measure, `[slide]/page.tsx:57`) · then 920/900/820/640/620/560/480/420 for individual measures.
- Panel widths: rail `300px` desktop / `min(320px,85vw)` mobile (`Rail.tsx:92`); chat `380px` / `min(400px,92vw)` (`ChatPanel.tsx:273`).
- Grid gap: `gap-5` (20px) for the curriculum grid; `gap-[clamp(40px,6vw,96px)]` for the reader-preview split.
- Touch targets: **`h-11` (44px) is used consistently** for every interactive element in nav and reader chrome. Real discipline, keep it.

### 2.7 Animation inventory (complete)

**CSS** (`globals.css`)
- `@keyframes kenburns` — `scale(1) → scale(1.09)`, `26s ease-in-out infinite alternate` (`:126-136`). Applied only to the hero photo (`Home.tsx:143`). Disabled under reduced motion (`:150-156`).
- `@keyframes yapSlideIn` (`:139-148`) — **defined and never referenced. Dead code.**
- `html { scroll-behavior: smooth }` (`:53`), overridden to `auto` under reduced motion and by Lenis (`:75-77`).
- `body { transition: background-color .3s, color .3s }` (`:63`) — the theme cross-fade.

**GSAP + Lenis** (`src/components/home/fx.ts`, landing only, all inside a `gsap.context` reverted on unmount `:93,485`)
- Lenis smooth scroll, `lerp: 0.09`, driven off `gsap.ticker`, `lagSmoothing(0)` (`:96-101`).
- Hero: scramble H1 after 350ms for 1100ms (`:107`); `#hero-sub, #hero-cta` fade+18y with 0.9s delay, 0.12 stagger, `power3.out` (`:110-117`); `#hero-media` `yPercent:16, scale:1.06` scrubbed across the hero (`:118-128`); `#hero-copy` fades and lifts -40y between 30% and 75% scroll (`:129-139`).
- `[data-scramble]` — IntersectionObserver `threshold: 0.4`, fires once, duration from the attribute (1000/1100ms). 6 headings (`Home.tsx:214,256,278,324,381,409`).
- `[data-lines]` — SplitText masked line reveal, `yPercent:110`, `stagger:0.08`, `power3.out`, `start:"top 80%"`, once. One element (`Home.tsx:188`).
- `[data-rise]` — opacity 0→1 + `y:26→0`, 1s `power3.out`, `start:"top 85%"`, once, delay read from the attribute (`0`, `0.1`, `0.15`, `0.2`).
- `[data-parallax]` — inner `<img>` `yPercent -10 → +10`, scrubbed (`:196-213`). Two sections.
- **Pinned scene A — multi-agent canvas** (`:217-377`): `#agent-pin` pinned for `+=2200px`, `scrub: 0.4`. A 2D canvas draws 11 nodes (1 hub, 4 agents, 6 tools, `NODES` at `:69-81`) that migrate from a hashed pseudo-random scatter to fixed positions, then grow hub edges (p 0.42–0.64), tool edges (0.62–0.84), labels (0.55–0.73), and travelling pulse dots (0.78+). Caption crossfades at p<0.36 / <0.68 / else (`:355-360`). DPR capped at 2 (`:223`).
- **Pinned scene B — memory strata** (`:380-420`): `#strata-pin` pinned for `+=1900px`, `scrub: 0.4`. Four bands rise bottom-up (`y:60→0, autoAlpha:0→1`, offset 0.85s each), then a `retrieval` beam scales `scaleY 0→1` from `top center` over 1.3s `power2.inOut`.
- Cloud text rise-in once + scrubbed exit `y:-70, opacity:0` (`:423-448`).
- Nav theme swap: a ScrollTrigger per `[data-navtheme]` section, `start:"top 52px"`, toggling `.glass-dark`/`.glass-light` and setting link colors imperatively to `#F5F5F7` / `#1D1D1F` (`:451-475`).
- Reduced motion: checked **once** at init (`:84-86`); every block above is skipped. Not reactive to a live OS change.

**Framer Motion**
- Slide transition: `opacity 0→1, y 16→0, x ±24→0`, 0.5s, `cubic-bezier(0.25,0.1,0.25,1)` — direction from the `nav-direction` singleton (`template.tsx:19-21`).
- Modal: backdrop fade + panel spring `stiffness:360, damping:30`, enter `y:-16 scale:.98` (`Modal.tsx:35-51`).
- ResumePill: `y:12→0`, 0.4s, `delay: 0.5` (`ResumePill.tsx:23-25`).

**WebGL** (`@paper-design/shaders-react` 0.0.77)
- `MeshGradient` in light mode: `colors ["#e0eaff","#241d9a","#f75092","#9f50d3"]`, `distortion .8`, `swirl .1`, `speed .6` (`AmbientBackdrop.tsx:16, 102-111`).
- `DotOrbit` in dark mode: `colors ["#ffc96b","#ff6200","#ff2f00","#421100","#1a0000"]`, `colorBack #000`, `speed 1` (`:17, 90-100`).
- `PulsingBorder` around the chat composer when a BYOK key exists: `colors ["#0dc1fd","#d915ef","#ff3f2e"]` (`ChatPanel.tsx:33, 369-389`).
- All three respect `useReducedMotion()` by setting `speed: 0` — reactive, unlike the GSAP check.

**Palette contradiction worth naming:** the token palette is Apple blue + neutral grey. The shader palettes are indigo/magenta/violet, orange/rust, and cyan/magenta/red. Nothing in `globals.css` knows about them. Under a `0.82`-alpha card at 26px blur it reads as an inoffensive pastel wash — but it is an unlabelled second and third palette, and it is the reason the reader can look slightly "off-brand" from the landing page.

**Tailwind transition vocabulary in use:** `duration-500` (nav color swap), `duration-[400ms]` (card hover, progress bar width), `duration-300` (rail/chat slide, theme toggle, nav buttons), `duration-200` (rail chevron). Easing: `ease-out` in CSS; `power3.out` / `power2.out` / `power2.inOut` in GSAP; `cubic-bezier(0.25,0.1,0.25,1)` in Framer.

---

## 3. UX failure modes at 8–20 books

Ordered by how badly each one breaks.

### 3.1 Seven of nine content folders cannot load at all — and each fails for a *different* reason

`loadBooks()` (`content.ts:161-251`) applies three filters. Every unwired folder trips at least one:

| Folder | Trips | Exact cause |
|---|---|---|
| `agentic memory` | `content.ts:182` + `:191` | No `index.md`; files are `Chapter 1 - Why Memory Matters….md` — the regex is `/^chapter-\d+.*\.md$/` (case-sensitive, requires `chapter-` immediately followed by digits). `Chapter 1 - …` matches neither. |
| `context engineering` | same | same (`Chapter 1 - What Context Engineering Is.md`) |
| `multi-agent` | same | same |
| `rag` | same | same |
| `building coding agents and harnesses` | `content.ts:182` | **Nesting depth.** The 17 correctly-named `chapter-NN-*.md` files *and* an `index.md` live in `explained/`. `loadBooks` only reads one level under `content/` (`:173-177`) and requires `content/<book>/index.md`. This book is fully authored and one directory level away from shipping. |
| `research papers` | `content.ts:196` | Has `index.md` but zero top-level `chapter-*.md`, so `if (chapterFiles.length === 0) continue`. Its per-topic `explanations/` folders use `01-the-transformer.md` naming — also unmatched. |
| `glossary` | `content.ts:182, 196` | Single `Glossary.md`. Not a chapter-shaped book at all. |
| `dump` | `:182` | Empty. |

Authored-but-invisible word counts: agentic memory 9,857 · context engineering 12,570 · multi-agent 15,447 · rag 11,812 · glossary 3,371. Roughly **53,000 words** of finished content behind a filename regex, plus the entire coding-agents book behind a directory level.

This is not a content problem. It is a 10-line loader problem.

### 3.2 `getPrimaryBook()` is load-bearing and arbitrary

`content.ts:277-281` returns `books[0]`, and `books` is sorted by **directory name** (`content.ts:173-177`). Today that resolves to `architecture-and-system-design` only because `agentic memory` and `building coding agents…` are filtered out first. **The moment you wire `agentic memory`, the landing page and `/read` silently switch to a different book** — `page.tsx:6`, `read/page.tsx:5`, `sitemap` priority, hero copy, curriculum grid, all of it.

### 3.3 The landing curriculum grid does not survive 2 books, let alone 20

`Home.tsx:288-311`: `grid-cols-[repeat(auto-fit,minmax(300px,1fr))]`, `gap-5`, cards `min-h-[280px]`, container `max-w-[1200px]`.
- At 1200px: 3 columns. 18 cards → 6 rows → **~5,000px** of vertical scroll for one book.
- At 8 books × ~18 chapters = 144 cards → 48 rows → **~38,000px**. At 20 books it is a scroll well over 100,000px.
- The heading is `{data.chapters.length} chapters. No hand-waving.` (`Home.tsx:281`) — becomes "144 chapters", which is not a promise, it is a threat.
- Copy at `Home.tsx:283-286` says "{data.title}: a sequence of slide-based chapters" — singular-book copy hardwired into the layout.

There is no hierarchy level between "site" and "chapter". The redesign needs a book/track tier and the grid needs to become a two-level browse.

### 3.4 `/read/[book]` has no TOC, so there is no place to *land* on a book

`read/[book]/page.tsx:12` redirects to slide 0. With one book that is a shortcut. With 20 books it means a reader who clicks a book from anywhere is dropped into the middle of prose with no overview, no estimated time, no prerequisite, no "what you'll be able to do after this". Every learning product needs this page; this one deletes it.

### 3.5 Nav manifest: 103 KB of duplicated JSON on every reader page

`getNavManifest()` (`content.ts:351-366`) builds `slides: NavSlide[]` **and** `chapters[].slides: NavSlide[]` by calling `toNavSlide` twice (`:357` and `:363`). JSON has no structural sharing, so the payload is **exactly 2× the necessary size**.

Measured on the real book: **105,166 bytes** for 199 slides (~51 KB of unique data).

The manifest is a prop to the client component `ReaderChrome` (`[book]/layout.tsx:15`), so all 199 entries are serialized into the RSC flight payload embedded in the HTML of **every one of the 199 statically-generated slide pages**. At ~200 slides/book that's ~103 KB per page today (maybe 15–20 KB gzipped, but on the critical path of the very first paint).

Scale:
- Per-book scoping saves you: a 200-slide book stays ~103 KB regardless of how many books exist.
- **But the moment you add cross-book navigation** (a book switcher in the rail, a global "next lesson", a personalized path that spans books), the manifest becomes ~8 × 103 KB = **~820 KB** at 8 books, ~2 MB at 20. That is a hard architectural wall, and the "recombine 10-20 modules per learner" plan walks straight into it.
- Fix direction: drop the duplication (`chapters[].slides` should be index ranges into `slides`), and fetch anything cross-book from a route handler instead of embedding it.

### 3.6 The Rail is a single-book file tree with no switcher and no virtualization

- `Rail.tsx:113-116` header hardcodes one book: `{manifest.bookTitle}` + `{manifest.chapters.length} chapters · {manifest.total} slides`.
- `Rail.tsx:133` renders **every** chapter header eagerly; every expanded chapter renders every slide row (`:184`). With 20 books' worth of chapters in one rail (if you ever merge them) that is 300+ rows, un-virtualized, inside a 300px column.
- `Rail.tsx:47-55` auto-expands the current chapter and never collapses the previous one. Read across 18 chapters and you end up with all 18 expanded — 199 rows in a 300px column with a `scrollIntoView` fighting the user's scroll on every navigation (`:58-61`).
- **There is no way to reach another book from inside the reader** except the wordmark → `/` → scroll to the curriculum grid.
- Chapter art: `getChapterArt(currentChapter)` (`Rail.tsx:89`) is keyed on `chapterSlug` alone (`art.ts:35`), not `bookSlug/chapterSlug`. Two books both having a chapter slug `01-anatomy` would collide and show the wrong painting. The manifest has 18 hardcoded entries (`src/lib/art-manifest.json`); books 2–20 get no art and the rail silently loses its most distinctive visual.

### 3.7 Search: quadratic scoring, full re-index per keystroke, no book attribution

`searchSlides()` (`search.ts:86-151`) **rebuilds the entire index on every call** (`:93-106`): for all N slides, tokenize title + body and build two `Map`s and a `Set`. Today N=199 with ~1,000 tokens/slide ≈ 200k tokenize+insert operations per request.

Worse, inside the per-term loop:
```ts
const matchingDocuments = documents.filter((candidate) =>
  candidate.uniqueTerms.has(term),
).length;                                    // search.ts:124-126
```
This scans **all documents, for every term, for every document**. Complexity is **O(docs² × terms)**.
- 199 docs × 3 terms → ~119k set lookups. Fine.
- 1,600 docs (8 books) → **7.7M** lookups, plus 8× the tokenization.
- 4,000 docs (20 books) → **48M** lookups per request.

`SearchPanel.tsx:79` debounces at 180 ms and fires a request per pause. At 8 books this becomes a visibly janky search; at 20 it will time out. It must become a build-time index (the IDF term can be precomputed once) — this is a one-afternoon fix that buys 100×.

Ranking/UX at scale:
- The API response omits `bookSlug` and book title entirely (`api/search/route.ts:16-25`), and `SearchPanel.tsx:161-171` renders only `NN · Title · ChapterTitle`. **Chapter numbers collide across books** — "03 · Tool Design" and "03 · The Taxonomy of Agentic RAG" both render as "03". Results become unattributable.
- `DEFAULT_LIMIT = 8`, `MAX_LIMIT = 20` (`search.ts:15-16`). Eight results across 4,000 slides with no book facet, no grouping, no filter.
- `TITLE_WEIGHT = 3` (`:18`) with no field-length normalization on titles means short-title slides dominate. Across 20 books, generic slides titled "Overview" or "Summary" will outrank substantive ones.

### 3.8 Ask/RAG degrades quietly

`ask.ts:19` `RETRIEVAL_LIMIT = 6`, pulling from `searchSlides` over **all** books (`search.ts:93` → `getAllSlides()`). Six BM25 hits across 199 slides is decent recall; across 4,000 slides in 20 topically-overlapping books it is not. Nothing in the pipeline scopes to the book the reader is in, and `buildContext` (`ask.ts:43-57`) inlines six full slide markdowns (~1–3 KB each) — at 20 books you will retrieve six near-duplicates on "what is context engineering" from six different books.

### 3.9 "Continue reading" / ResumePill breaks in two specific ways

- `progress.ts:17` — `lastHref` is a **single global pointer**, not per book. `progress.read` *is* keyed by `bookSlug` (`:19`) and is multi-book-ready; `lastHref` is not. With 8 books you can only ever resume one, and the landing CTA (`Home.tsx:55-60`) will label itself "Continue reading" while pointing into a book the user may have abandoned three books ago.
- **The pill silently never renders cross-book.** `ReaderChrome.tsx:128-131`:
  ```ts
  const resumeTarget = resumeHref && current?.globalIndex === 0 && resumeHref !== pathname
      ? byHref.get(resumeHref) : undefined;
  ```
  `byHref` is built from `manifest.slides` — **book-scoped** (`:90-95`). Enter book B while `lastHref` points into book A and `byHref.get()` returns `undefined`; the pill just doesn't appear. No error, no fallback. Also, the guard `current?.globalIndex === 0` means it only ever shows on slide 1 of a book.

### 3.10 Prev/next stop dead at book boundaries

`ReaderChrome.tsx:99-100` reads `manifest.slides[index ± 1]`. At the last slide of a book the "next" button is `disabled` with `opacity-35` (`:388`) and no explanation — no "next book", no "you finished this track", no completion state. `getAdjacent()` in `content.ts:296-303` is likewise book-scoped. For a curriculum that recombines modules across books, the whole adjacency model has to move from "position in a book" to "position in a path".

### 3.11 Sitemap and static generation

`sitemap.ts:8-14` emits one entry per slide with no chunking. Sitemap limits are 50,000 URLs / 50 MB uncompressed — 20 books × 200 slides = 4,000 URLs, well inside the limit, so this is **not** an urgent break. What does break: `priority` is hardcoded `0.8` for intros / `0.6` otherwise with **no `lastModified`**, so search engines get no recrawl signal as content grows. Add `lastModified` from file mtime before the corpus 20×'s.

Static generation (`[slide]/page.tsx:10-24`): 199 pages today. Every page server-renders `react-markdown` + `remark-gfm` + `rehype-highlight` with **`detect: true`** (`Markdown.tsx:15`), which loads and runs highlight.js language auto-detection (8.3 MB installed) on every fenced block. `.next` is already **477 MB** for 199 pages. Linear extrapolation: ~1,600 pages / ~3.8 GB at 8 books, ~4,000 pages / ~9.5 GB at 20 — past Vercel's build-output ceilings and well past a tolerable build time. Two mitigations exist and neither is applied: pin the language set instead of `detect: true`, and switch cold books to ISR/on-demand rather than full SSG.

### 3.12 `llms-full.txt` becomes a multi-megabyte single response

`llms-full.txt/route.ts:9-26` concatenates the markdown of every slide of every book into one `force-static` response. Today ≈ 320 KB. At 20 books ≈ 3–6 MB in one file, generated at build and held in memory during generation. Needs per-book files with an index.

### 3.13 Content cache never invalidates

`content.ts:157-159, 247-249` caches the parsed book list on `globalThis` forever, with a deliberate "don't cache a miss" carve-out. Correct for SSG. But it also means the dev server never picks up a new/edited chapter without a restart — with 20 books and frequent authoring, that is a daily friction tax.

---

## 4. Accessibility and performance liabilities (static analysis)

### 4.1 Zero focus-visible styling in the entire codebase

A grep for `focus-visible` across `src/` returns **nothing**. Everything relies on the UA default ring — which is acceptable — **except** three inputs that kill it with `outline-none`:

| Element | File:line | Mitigated? |
|---|---|---|
| Search input | `SearchPanel.tsx:130` | **No.** The wrapper (`:107`) has only `border-b`; no `focus-within` ring. **WCAG 2.4.7 fail.** |
| Chat composer textarea | `ChatPanel.tsx:413` | **No.** The form (`:396`) has no `focus-within` ring. **WCAG 2.4.7 fail.** |
| Ask input | `AskPanel.tsx:98` | Yes — wrapper has `focus-within:outline-blue` (`:91`). |

The BYOK key input (`ChatPanel.tsx:479`) does it right: `outline-2 -outline-offset-1 outline-transparent focus:outline-blue`. That pattern should become a token/utility and be applied everywhere.

### 4.2 The modal has no focus trap and no focus restore

`Modal.tsx` sets `role="dialog" aria-modal="true"` (`:43-45`) and locks body scroll (`:24`), but:
- No focus trap — `Tab` walks straight out of the dialog into the page behind it.
- No focus restore on close.
- Initial focus only happens because `SearchPanel`/`AskPanel` autofocus their own input after 40 ms (`SearchPanel.tsx:35`, `AskPanel.tsx:42`).

This is inconsistent with the reader, which *does* handle it correctly: the mobile rail focuses its close button (`Rail.tsx:73-78`) and `ReaderChrome.tsx:151` restores focus to the toggle. Copy that behaviour into `Modal`.

### 4.3 Three off-screen focus sinks

Collapsed panels are hidden by width/transform, never by `hidden` or `inert`, so their interactive children remain in the tab order while invisible:

| Panel | File:line | Hidden by |
|---|---|---|
| Rail, desktop collapsed | `ReaderChrome.tsx:328-330` | `lg:w-0` + `overflow-hidden` |
| Rail, mobile closed | `ReaderChrome.tsx:326` | `-translate-x-full` |
| Chat panel, closed | `ChatPanel.tsx:265-271` | `translate-x-full` / `lg:w-0` |

A keyboard user on a reader page tabs through the rail's 18 chapter buttons and the chat panel's textarea, send button, "Get a free key" link and "Skip" button, all of which are off-screen. Fix is one attribute: `inert` when closed.

### 4.4 Contrast failures (computed against the actual tokens)

`--color-ink-2` `#6e6e73` on white is **5.07:1** — passes AA. But the alpha variants do not:

| Class | Effective color on white | Ratio | Where |
|---|---|---|---|
| `placeholder:text-ink-2/60` | ≈ `#a8a8ab` | **2.36:1** — fail | `SearchPanel.tsx:130`, `AskPanel.tsx:98`, `ChatPanel.tsx:413` |
| `text-ink-2/70` | ≈ `#999a9d` | **2.85:1** — fail | `SearchPanel.tsx:145`, `Rail.tsx:261` |
| `text-snow/45` on `#000` | ≈ `#6e6e6f` | **4.12:1** — fail at 12px | `Home.tsx:210, 320` (both section eyebrows on the dark scenes) |

`text-snow/60` on black is 6.8:1 and fine; `/65` and `/70` are fine. So the fix is narrow: raise the three cases above.

### 4.5 The scramble effect mutates live heading text

`scrambleEl` (`fx.ts:36-55`) writes random A–Z into `el.textContent` frame by frame. It is applied to the page's `<h1>` (`fx.ts:107`, `Home.tsx:151`) and six `<h2>`s via IntersectionObserver (`fx.ts:144-163`). There is no `aria-hidden` swap and no static visually-hidden copy of the real text. A screen reader or a heading-navigation pass that hits the element during the 900–1100 ms animation announces gibberish. Fix: keep the real text in an `sr-only` sibling and `aria-hidden` the animated node.

Also: the reduced-motion check is a one-shot `matchMedia(...).matches` at init (`fx.ts:84-86`) with no `change` listener, so toggling the OS setting requires a reload. `AmbientBackdrop` uses framer's reactive `useReducedMotion()` (`:80`) — inconsistent.

### 4.6 Other a11y gaps

- **No skip-to-content link** on any page.
- **Progress bar is decorative markup only** — `ReaderChrome.tsx:228-233` has no `role="progressbar"` / `aria-valuenow` / `aria-valuetext`. Screen-reader users get no sense of position beyond the `NN / MM` text.
- Disabled prev/next at book boundaries (`ReaderChrome.tsx:379, 388`) leave the tab order with no announcement of *why*.
- Streaming chat output has no `aria-live` region (`ChatPanel.tsx:343-354`); text appears silently.
- Search results list is not an ARIA combobox/listbox — arrow-key selection (`SearchPanel.tsx:92-103`) moves a visual highlight with no `aria-activedescendant`, so AT users hear nothing while arrowing.
- Positives: `h-11` (44px) targets everywhere; `aria-label` on every icon-only button; `aria-current="page"` on the active rail row (`Rail.tsx:193`); `aria-expanded` on both disclosure buttons; `alt=""` on decorative art (`Rail.tsx:100`); real `alt` on the landing photos (`Home.tsx:139, 246, 373`).

### 4.7 Performance — landing page

- **14.7 MB of source imagery.** `snow-mountain.jpg` 6.82 MB (used twice: hero `Home.tsx:138`, CTA `:371`), `cloud-sea.jpg` 7.88 MB (`:243`). `next/image` optimizes at request time — no `images` config in `next.config.ts`, so defaults apply. The hero at `sizes="100vw"` on a 2560px display forces a 2560w transform of a 6.8 MB source. `priority` is correctly set on the hero only (`:140`). On Vercel every unique width is a billable image transform; the source files should be pre-resized to ≤2560w before they are ever touched.
- **No code splitting anywhere.** `Home.tsx` is `"use client"` and statically imports `gsap` + `ScrollTrigger` + `SplitText` + `lenis` (`fx.ts:10-13`), plus `SearchPanel` and `AskPanel` — which pull in `framer-motion` (via `Modal`) and `react-markdown` + `remark-gfm`. Rough gzipped first-load JS: GSAP core+ScrollTrigger+SplitText ~70–80 KB, Lenis ~8 KB, framer-motion ~35–50 KB, react-markdown+remark-gfm ~45 KB → **~170–200 KB of JS to render a page whose content is 100% static text**. Both panels are modals that are closed on load; `dynamic()` would remove ~90 KB immediately.
- Two ScrollTrigger `pin`s totalling **4,100 px of scroll-jacked height** (`fx.ts:365` `+=2200`, `:392` `+=1900`) plus Lenis. On a trackpad this is a long, non-skippable middle section of the landing page.
- `resize` on the agent canvas is unthrottled (`fx.ts:341-343`) and each call reallocates the backing store and redraws.

### 4.8 Performance — reader

- **Every reader page eagerly loads a WebGL runtime.** `ReaderChrome.tsx:16` imports `AmbientBackdrop` → `@paper-design/shaders-react` (~1.6 MB installed across the two packages). `ChatPanel.tsx:14` imports the same package **plus** `react-markdown` + `remark-gfm`, even though the panel is closed by default and `PulsingBorder` only renders when a BYOK key exists (`:368`).
- **The worst frame-cost path on the site**: a full-viewport, continuously animating WebGL canvas (`AmbientBackdrop`) sitting *behind* a `backdrop-filter: saturate(160%) blur(26px)` glass card that covers nearly the entire viewport (`globals.css:100-103` + `ReaderChrome.tsx:349`). The blur must re-sample a changing source every frame. On mid/low-end Android this is where the reader will drop frames — and it is pure decoration.
- Two simultaneous WebGL contexts are possible (ambient + pulsing border) when the chat panel is open with a key.
- `readStoredRailPref` is the `getSnapshot` of a `useSyncExternalStore` with a no-op subscriber (`ReaderChrome.tsx:34-47, 82-86`), so a `localStorage.getItem` **and** a `matchMedia` call run on every render of `ReaderChrome` — i.e. on every slide navigation. Same pattern for `getStoredGeminiKey` in `ChatPanel.tsx:93-97`, which sits in a component whose `draft` state changes on **every keystroke** — a synchronous `localStorage` read per character typed.
- `Markdown.tsx` is a **server component** — prose ships zero JS. This is the single best performance decision in the codebase and must survive the redesign.

### 4.9 Hydration

Genuinely clean. Five separate client-only state sources all use `useSyncExternalStore` with a `null` **server snapshot**, so server HTML and the first client render agree on "nothing" and the real value applies one tick later — no mismatch, no flash of wrong state:
`progress.ts:130-142` · `ReaderChrome.tsx:49, 82-86` (rail pref) · `AmbientBackdrop.tsx:36-42` (theme) · `ChatPanel.tsx:42, 93-97` (key) · `slide-context.ts:30-39`.
Plus the theme boot script (`layout.tsx:40-60`) with the `type="text/plain"`-on-client trick so it never re-executes during hydration, and `suppressHydrationWarning` scoped to `<html>` and the script tag only.

One rough edge: `AmbientBackdrop` returns `null` until the theme is known (`:84`), so the reader's background is briefly blank/canvas-colored on first paint, then the shader pops in. Under the glass card it is barely visible, but it is a visible seam on a slow device.

### 4.10 Security note (low severity, worth naming)

`agent-yap:gemini-api-key` holds a raw, user-supplied API key in `localStorage` (`gemini.ts:116-131`). The onboarding copy is honest about it (`ChatPanel.tsx:461-465`) and the key never touches the server. But localStorage is readable by any script on the origin, so any future third-party script (analytics, embed, widget) becomes a key-exfiltration vector. Mitigating factors: content is first-party authored, and LLM output is rendered through `ReactMarkdown` **without** `rehype-raw`, so no HTML injection path exists today. Keep it that way — do not add `rehype-raw`, and keep third-party scripts off the reader origin.

---

## 5. What is genuinely good and must be preserved

Ranked by how expensive it would be to lose.

1. **`src/lib/content.ts` as the one and only parser.** Slide pages, `generateStaticParams`, search, RAG, `llms.txt`, `llms-full.txt` and the sitemap all derive from one `loadBooks()`. Adding assessments/modules means *extending* this module, never forking it. (`content.ts:268-366`)

2. **The hydration discipline (§4.9).** Five external stores, all with a `null` server snapshot. The redesign will want to store level, learner type, goal, template assignment, quiz results — every one of those is a hydration-flash landmine, and this codebase already has the correct, working pattern. Reuse it verbatim; do not reach for `useEffect` + `useState`.

3. **The token architecture.** One `@theme` block (`globals.css:6-30`); dark mode re-points the *same* token names (`:36-48`). Every component consumes `bg-canvas` / `text-ink` / `border-hairline`. **A brand-new page gets dark mode for free with zero extra work.** Do not introduce a second token system or hardcode hexes.

4. **Server-rendered markdown.** `Markdown.tsx` is a server component; prose costs 0 KB of JS. At 4,000 slides this is the difference between a fast site and a dead one.

5. **The reader's information architecture.** 720px measure, one idea per screen, 17px/1.6 prose, 44px targets, `tabular-nums` counters, quiet hairlines, a single accent. *This* is the calm the founder is protecting, and none of it depends on the scenic photos or the shaders.

6. **The progress data model.** `read: Record<bookSlug, Record<href, epochMs>>` (`progress.ts:19`) is already multi-book, monotonic, idempotent (`:94-109`), version-gated (`:36-57`), and cross-tab synced (`:83-91`). Quiz/assessment state should live in the same file under the same version discipline. Only `lastHref` needs to become per-book (§3.9).

7. **`chapterDisplayTitle`** (`display.ts:6-8`). Authors embed "Chapter 3:" in H1s; the UI strips it and renders the number itself. Tiny, but it is the reason chapter numbering stays consistent as content grows and multiple authors contribute.

8. **BYOK chat with an honest fallback.** `ChatPanel` offers page-aware chat via the user's own key, or the site's grounded `/api/ask` with citations, and the fallback path sends `{question}` **only** — never slide content, never the key (`ChatPanel.tsx:210-218`). Correct trust posture for a no-auth product, and it costs the founder nothing per user.

9. **Graceful degradation of the decorative layer.** `ShaderBoundary` + `CssFallback` (`AmbientBackdrop.tsx:45-76`) means a WebGL failure renders a CSS gradient, not a white box. Whatever replaces the shaders should keep this shape.

10. **`llms.txt` / `llms-full.txt`.** Free AI-discoverability, `force-static`, already conformant. Keep, but split per book (§3.12).

11. **The `gsap.context` teardown** (`fx.ts:93, 480-486`) — observers, window listeners, ticker callbacks and Lenis are all explicitly unwound, so React StrictMode double-mounting is clean. Any new motion code must follow this.

12. **The eyebrow/kicker composite** — `text-xs font-semibold uppercase tracking-[0.10em] text-ink-2`. It appears 9 times and is the most recognizable typographic gesture on the site. Promote it to a component/utility rather than re-typing it.

---

## 6. Ten-line summary of what the redesign must fix first

1. Rewrite `loadBooks()` to walk nested directories and accept the real filenames (§3.1) — unlocks ~53k authored words + a whole 17-chapter book, today.
2. Kill `getPrimaryBook()` as a load-bearing default (§3.2); add an explicit book/track registry.
3. Add the missing IA tier: a shelf page and a real `/read/[book]` overview (§3.4).
4. De-duplicate the nav manifest and stop embedding cross-book data in page HTML (§3.5).
5. Precompute the search index at build time; the `documents.filter` at `search.ts:124` is the quadratic (§3.7).
6. Make `lastHref` per-book and make `ResumePill` handle a cross-book target instead of silently vanishing (§3.9).
7. Move adjacency from "position in a book" to "position in a path" before building personalized templates (§3.10).
8. `inert` the three collapsed panels; add a focus trap to `Modal`; add focus-visible rings to the two bare inputs (§4.1–4.3).
9. Pre-resize the two 7 MB photos and `dynamic()`-import `SearchPanel`/`AskPanel`/`ChatPanel` (§4.7–4.8).
10. Load one self-hosted variable font — the current "Apple typography" only exists on Apple hardware (§2.2).
