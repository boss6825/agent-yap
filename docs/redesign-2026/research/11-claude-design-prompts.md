# 11 — Claude Design Prompts

> Six copy-pasteable prompts for **claude.ai/design**, plus the shared design-system
> brief they all reference.
>
> **The whole point of this file is that the vibe must not change.** Every token
> below is extracted verbatim from [src/app/globals.css](src/app/globals.css) and
> the shipped components. A prompt that invents new tokens is a failed prompt —
> the output will look like a different product and be unusable in this codebase.
>
> How to use: paste **BRIEF** first, then one **P#** prompt in the same
> conversation. Or paste BRIEF + P# together as one message. Never paste a P#
> alone.

---

## BRIEF — the shared preamble

Paste this once at the top of the conversation, or prepend it to each prompt.

````text
You are designing screens for Agent YAP, an existing production website that
teaches AI-agent engineering. This is a REDESIGN OF SURFACES WITHIN AN ESTABLISHED
DESIGN SYSTEM, not a new brand. Your job is to produce screens that look like they
were always part of this site.

## THE PRODUCT IN ONE PARAGRAPH

Agent YAP is a text-first knowledge base of ~630 screen-sized "slides" across 20
modules, covering how AI agents actually work: the agent loop, tool design,
context engineering, memory, retrieval, multi-agent systems, evals, security. It
is being extended with a self-assessment layer — authored exercises where a
learner finds the bug in an agent trace, classifies a failure mode, or picks the
right intervention. Audience: working software engineers, mostly senior. They
arrive from Google or from an AI assistant's citation, usually when something they
built has broken.

## THE ONE PRINCIPLE

Minimalism, taken literally: "it should feel like nothing for the user." The site
should be unique BECAUSE of restraint, not decoration. Every screen has exactly
ONE primary action. If a screen has two equally-weighted calls to action, the
design is wrong. Whitespace is the design element. If you are unsure whether to
add something, do not add it.

## EXACT DESIGN TOKENS — use these values, invent none

Light theme (default):
  --color-canvas:        #FFFFFF      page background
  --color-canvas-2:      #F5F5F7      raised surface, cards, code blocks
  --color-canvas-3:      #EFEFF1      hover state on a raised surface
  --color-ink:           #1D1D1F      primary text
  --color-ink-2:         #6E6E73      secondary text, labels, metadata
  --color-hairline:      rgba(0,0,0,0.08)     borders, table rules, dividers
  --color-blue:          #0071E3      the ONLY accent. Links, primary buttons.
  --color-blue-deep:     #0066CC      pressed
  --color-blue-bright:   #2997FF      accent on dark backgrounds
  --color-night:         #000000      full-bleed dark sections
  --color-snow:          #F5F5F7      text on dark
  --color-snow-dim:      rgba(245,245,247,0.65)

Dark theme (same token names, re-pointed — design BOTH):
  --color-canvas:  #000000   --color-canvas-2: #1C1C1E   --color-canvas-3: #2C2C2E
  --color-ink:     #F5F5F7   --color-ink-2:    #98989D
  --color-hairline: rgba(255,255,255,0.10)
  --color-blue:    #2997FF   --color-blue-deep: #0A84FF  --color-blue-bright: #409CFF

Radii:   --radius-card: 18px   --radius-pill: 980px   (code inline: 6px)
Fonts:   display → "SF Pro Display", -apple-system, "Segoe UI", Helvetica Neue, Arial
         sans    → "SF Pro Text",    -apple-system, "Segoe UI", Helvetica Neue, Arial
         mono    → "SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas

## TYPE SCALE — exact, as shipped

  Hero h1        clamp(40px, 7.4vw, 80px) · display · 600 · lh 1.04 · ls -0.015em
  Section h2     clamp(32px, 4.6vw, 52px) · display · 600 · lh 1.12 · ls -0.01em
  Card title     24px · display · 600 · lh 1.20
  Lead paragraph 21px · sans · 400 · lh 1.40–1.50
  Body / prose   17px · sans · 400 · lh 1.60 · ls -0.2px   ← the reading size
  Small / meta   13–14px · sans
  Eyebrow label  12px · 600 · UPPERCASE · letter-spacing 0.10em · colour ink-2
  Code block     13.5px mono · lh 1.65 · bg canvas-2 · radius 18px · padding 1.4em 1.6em

The eyebrow label is the site's single most recognisable typographic signature.
It appears above almost every section heading. Use it.

## LAYOUT

  Prose measure:        720px maximum. Never wider. This is non-negotiable.
  Content container:    980px (text sections) / 1200px (grids)
  Fixed header height:  52px, frosted glass
  Minimum tap target:   44px
  Card grid:            repeat(auto-fit, minmax(300px, 1fr)), gap 20px
  Section rhythm:       vertical padding clamp(120px, 16vh, 200px) on landing sections

  Frosted glass recipes (used for fixed chrome and the reading card):
    glass-dark:  background rgba(0,0,0,0.55);   backdrop-filter saturate(180%) blur(20px)
    glass-light: background rgba(255,255,255,0.80); backdrop-filter saturate(180%) blur(20px)
    glass-card:  background rgba(255,255,255,0.82); backdrop-filter saturate(160%) blur(26px)
      (dark: rgba(10,10,12,0.72))

## MOTION

  Slide entrance:  opacity 0→1, translateY 16px→0
  Colour/theme:    0.3s ease
  Nav theme swap:  0.5s
  Card hover:      translateY(-4px), 400ms ease-out
  Press:           scale(0.95–0.98)
  Everything must have a prefers-reduced-motion: reduce path.

Do not add: parallax, scroll-jacking, spring physics, staggered letter reveals,
or anything that delays reading.

## IMAGERY RULE — read this twice

The site currently uses two scenic photographs (a snowy mountain range and a sea
of clouds) and reuses one of them TWICE on the landing page. They are beautiful
and they have gone stale from repetition. The rule going forward:

  1. AT MOST THREE photographs exist on the entire site, and each appears ONCE.
  2. Photographs are permitted ONLY on: the landing hero, one mid-page
     interstitial, and the final call-to-action. Nowhere else. Ever.
  3. NO photography on any reading surface, any exercise surface, any progress
     surface, or any module card. Not even faint, not even blurred, not even at
     8% opacity.
  4. Where a surface needs visual differentiation, use — in this order —
     surface lift (canvas → canvas-2), hairline weight, and type scale. Nothing
     else. No illustration, no icon sets, no gradients-as-decoration.
  5. Modules are identified by a SEEDED PROCEDURAL MARK: a small monochrome
     SVG/canvas figure (contour lines, concentric arcs, a sparse grid) generated
     deterministically from the module id, drawn in the module's accent hue at low
     density. Think GitHub identicons with a higher aesthetic ceiling. Never a
     photograph, never an emoji, never a stock icon.
  6. Per-module identity comes from ONE CSS variable, --module-h, an OKLCH hue
     rotated within a constrained arc around the brand blue. Same lightness, same
     chroma, hue only. The accent may occupy at most ~2% of the pixels on screen.
     Density of the accent IS the design.

## ACCESSIBILITY FLOOR — treat as hard requirements

  - Every interactive element has a visible :focus-visible ring. The current site
    has ZERO focus styles; this is a defect you are fixing, not a nicety.
  - Text contrast ≥ 4.5:1 (large text ≥ 3:1). Do not use ink-2 below 70% opacity
    for text, and do not use white below 55% on a photograph.
  - Never encode meaning in colour alone. A wrong answer is marked by an icon and
    a word, not by red. In fact: DO NOT USE RED ANYWHERE. A wrong answer is
    rendered in ink, calmly.
  - Full keyboard operability. Modals trap and restore focus. Collapsed panels
    are inert.
  - Do not rely on hover to reveal anything necessary.

## DO NOT

  - Do not introduce a second accent colour, a gradient, a shadow beyond the one
    shipped (0 4px 24px rgba(0,0,0,0.06)), or a new radius.
  - Do not use emoji, stock illustration, 3D renders, or AI-generated art.
  - Do not build a dashboard. No sparklines, no donut charts, no stat tiles, no
    KPI row. Progress is text and dots.
  - Do not add streaks, XP, points, badges, levels, leaderboards, or confetti.
  - Do not show a percentage-of-everything-complete anywhere.
  - Do not add a settings page.
  - Do not put a progress bar at the top of the reading surface.
  - Do not centre body text. Prose is left-aligned, always.

## DELIVERABLE FORMAT

For each screen: desktop (1280px) and mobile (390px), in BOTH light and dark
theme. Include every state named in the prompt — empty, loading, error, and the
interaction states. Annotate each screen with the exact tokens used. Output
self-contained HTML + inline CSS using CSS custom properties with the exact names
above, so it can be lifted into a Tailwind v4 @theme block directly.
````

---

## P1 — Landing page, redesigned for a multi-module product

````text
[PASTE BRIEF ABOVE]

Design the Agent YAP landing page.

## WHAT CHANGED AND WHY

The current landing page sells ONE book of 18 chapters. It renders every chapter
as a card in one grid — which is ~5,000px of scroll today and would be ~38,000px
at full corpus size. It also uses the same mountain photograph twice, and it has
two competing calls to action ("Start learning" in the nav and "Start with Chapter
1" near the bottom).

The product is now 20 modules, ~630 slides, and ~560 self-assessment checks. The
landing page's job has changed from "here is the table of contents" to "answer one
question and I will tell you where to start."

## STRUCTURE — in this order, nothing added

1. HEADER — 52px, frosted, glass-dark over the hero and glass-light after it.
   Left: wordmark "Agent YAP". Right: Search (icon only, opens a ⌘K palette),
   theme toggle, and ONE pill button. No other nav links. (The current header has
   six items; that is five too many.)

2. HERO — full viewport height, ONE photograph, ken-burns at 26s. Headline at hero
   h1 scale, one sentence. Sub at 21px, max 560px wide, two lines maximum. ONE pill
   CTA. A corpus counter as a single quiet line beneath the CTA:
   "20 modules · 630 slides · 560 checks". Nothing else in the hero.

3. THE QUESTION — this is the most important section on the page and it replaces
   the current "manifesto" section. Eyebrow label. One line of question copy:
   "What brings you here?" Then FIVE options as a vertical list of plain text
   links, each one line, each with a one-clause subtitle in ink-2:
     · I'm building something with agents right now
     · Something I built is broken
     · I'm interviewing for AI engineering roles
     · I want to understand how this actually works
     · I need to keep up without going deep
   No cards, no icons, no images, no boxes. Just five lines that look like the
   most obvious thing to click on the page. Each is a link to a static URL.
   Below them, one smaller line: "Or just start reading →".

4. WHAT THIS IS — the premise, one h2 of at most three lines plus one 21px
   paragraph at 640px max width. No image. Keep the existing voice: direct,
   practitioner-to-practitioner, no marketing adjectives.

5. THE 20 MODULES — NOT a card grid. A single-column list of 20 rows, grouped
   under four tier headings (Foundations / Core / Advanced / Frontier). Each row:
   the module's seeded procedural mark at 20×20, the title, a one-line promise in
   ink-2, and right-aligned metadata "24 min · 15 slides". Rows separated by
   hairlines. Hover lifts the row's background to canvas-2 — no translate, no
   shadow. This must read as a syllabus, not a storefront.

6. ONE INTERSTITIAL — the second photograph, ~90vh, one centred line of text over
   it at h2 scale. This is the only decorative moment on the page and it earns its
   place by being the only one.

7. THE READER, SHOWN — a two-column section: left, three short lines about how
   reading works (screen-sized slides, arrow keys, checks between them); right, a
   realistic static mock of the reading surface. Reuse the shipped 16:10 card mock
   with the 3px blue rule at top-left.

8. CLOSING CTA — the third photograph, full height, one h2, one pill button.

9. FOOTER — one line of text, three text links. Nothing else.

## STATES

- Cold visitor, no stored profile: section 3 is the five questions (default).
- Returning visitor with a stored profile: section 3 is REPLACED by a single card
  — the module they are in, the slide they stopped on, one line of commitment
  ("You're 6 of 14 through Context Engineering"), and one button "Continue". The
  five questions move to a single text link below it.
- Returning visitor who finished their path: section 3 shows the review queue
  ("6 ideas are due for review") and the next tier.
- Mobile: the five questions stay a vertical list. The 20-module list stays one
  column. The hero photograph loses ken-burns.

## WHAT GOOD LOOKS LIKE / REJECT IF

✓ You can name the single primary action within one second of looking at it.
✓ The five questions are the visual centre of gravity, above the module list.
✓ Exactly three photographs, each used once.
✓ The 20 modules read as one scannable list, not 20 boxes.
✓ Total scroll depth is under ~7 viewport heights.
✗ Reject if: any chapter/module is rendered as a card in a grid.
✗ Reject if: a fourth image appears, or one appears twice.
✗ Reject if: the module rows have icons other than the generated marks.
✗ Reject if: there are two same-weight CTAs visible at once.
✗ Reject if: the counter line became a stat-tile row.
````

---

## P2 — Onboarding flow

````text
[PASTE BRIEF ABOVE]

Design the Agent YAP onboarding flow.

## THE HARD CONSTRAINT

This is NOT a wizard. It is a set of ordinary static pages linked by ordinary
links. No modal, no step machine, no progress dots, no "Step 2 of 3", no Back
button of ours — the browser's Back button is the Back button, and the URL is the
state. Total cost to the learner must be TWO TAPS and about nine seconds. If your
design implies a third question, you have failed the brief.

## SCREENS

S1 — /start · "What brings you here?"
  Eyebrow, one question at h2 scale, five one-line text links with one-clause
  subtitles (copy is in P1 section 3). Skip affordance at the bottom as ordinary
  text: "Skip — just start reading". Nothing else on the page. No image, no
  header nav beyond the wordmark.

S2 — /start/[goal] · "Which sounds most like you?"
  The chosen goal echoed back as a single quiet line at the top ("Building
  something with agents"), then three self-descriptions as one-line links. Never
  the words beginner / intermediate / advanced — use concrete self-descriptions:
    · "I've called an LLM API"
    · "I've shipped something with tool calls and it broke in ways I didn't expect"
    · "I run agents in production and argue about eval harnesses"

S3 — /start/[goal]/[level] · THE PLAN — this is the reward screen, design it best
  Three parts, in this order:
    a) One line of consequence, stated concretely, at 21px:
       "Skipping 9 chapters you already know. Starting you at
        Context Engineering → Compaction."
    b) The path itself: a vertical list of 8–14 module rows with the seeded mark,
       the title, minutes, and hairline separators. Numbered. This is the only
       place in the product where the whole path is visible at once.
    c) ONE primary pill button: "Begin". Beneath it, two ordinary text links:
       "Take a 90-second check first" and "Change my answers".
  This screen is allowed ONE decorative element and one only: a very restrained
  duotone treatment of one of the site's photographs as a narrow band behind the
  consequence line — same photo, hue-mapped to this template's accent. It appears
  here and on no other screen in the product.

S4 — /check · the optional 6-item diagnostic
  One question per screen. A quiet counter "2 / 6" in ink-2, top right, no bar.
  Four options as full-width rows, 44px minimum, hairline-separated. No timer, no
  countdown, no score shown mid-test. Exit affordance always present as text:
  "Stop and use my answers so far".

S5 — /check result
  One line: what changed. "You placed above where you said. Starting you two
  modules further on." Then the revised path. Then "Begin". If the measurement
  disagrees downward, the level is NOT lowered — instead ADD a shorter warm-up
  module to the front of the path, and say so plainly.

S6 — the deep-link bypass — DESIGN THIS CAREFULLY, IT IS THE MAJORITY CASE
  A visitor arrives from Google directly onto a reading slide. They must see the
  prose immediately with NO interstitial, NO modal, NO banner. The ONLY new
  element compared to a normal slide is a single line of text below the prose,
  above the next/prev controls, in ink-2 at 14px:
    "Reading about memory? There's a path through this. →   [dismiss ×]"
  Show it once per visitor, ever. Dismissing is permanent. Design both the
  present and the dismissed state. There must be no visual difference in the rest
  of the page between a visitor who has onboarded and one who has not.

## WHAT GOOD LOOKS LIKE / REJECT IF

✓ S1 and S2 each fit above the fold on a 390px phone with no scrolling.
✓ Every screen is obviously an ordinary web page, not an app flow.
✓ S3 makes the learner feel the site already understands them.
✓ The skip path is visible on every screen and never apologised for.
✗ Reject if: there is a progress indicator, step counter, or wizard chrome.
✗ Reject if: any screen asks for an email, a name, or any typed input.
✗ Reject if: the duotone band appears anywhere other than S3.
✗ Reject if: S6 uses a modal, a toast, a slide-up, or a banner above the prose.
✗ Reject if: a visitor who skipped sees an empty state, a nag, or a dashed box.
````

---

## P3 — The module map

````text
[PASTE BRIEF ABOVE]

Design /modules — the curriculum surface — and /modules/[id].

## THE PROBLEM TO SOLVE

20 modules with a real prerequisite graph (longest path is 5 deep, three
independent entry points). Learners need to see structure and their position in
it. Every instinct says "draw the graph"; a node-and-edge diagram of 20 nodes with
28 edges is unreadable at 390px and unmaintainable. Solve this with typography and
order, not with a graph visualisation.

## /modules

A single column, max 980px. Four tier sections (Foundations / Core / Advanced /
Frontier), each with an eyebrow label. Within a tier, modules in dependency order.

Each row contains, on one line at desktop:
  · the seeded procedural mark, 24×24, in the module's accent hue
  · the module title, card-title scale
  · the one-line promise, ink-2, truncating with ellipsis
  · mastery as 0–3 filled dots (●●○) — NOT a bar, NOT a percentage
  · "15 slides · 24 min"
Hairline between rows. Hover: background → canvas-2, no motion.

Prerequisites are shown as PLAIN TEXT on the row, only when unmet, in ink-2:
  "after The Loop". Never a lock icon, never a disabled state, never a greyed row.
Every module is clickable at all times. The graph recommends; it never locks.

At the top: one line of corpus context ("20 modules · 630 slides · ~15 hours")
and, if the visitor has a path, one line "9 of these are on your path — show only
those" as a text toggle.

## /modules/[id]

Max 720px. In order:
  1. Eyebrow: the tier. Title at h2 scale. The promise at 21px.
  2. One line of metadata: slides · minutes · checks · "after: The Loop".
  3. Mastery, as one sentence: "You've verified 7 of 14 ideas here." Then, if any
     are due: "3 will come back for review." No chart.
  4. ONE primary pill: "Start" / "Continue" / "Review".
  5. The slide list — a numbered list of chapter/slide titles, hairline-separated,
     with a small filled dot on the ones already read.
  6. The checks in this module, as a collapsed one-line summary that expands.
  7. "What comes after this" — two or three module links as plain text.

The seeded mark appears ONCE per page, large (roughly 120×120), at low opacity,
in the top-right of the header block, bleeding off the container edge. This is the
module's entire visual identity. No photograph anywhere on either screen.

## STATES

- No mastery at all (first visit): dots all hollow, mastery line reads
  "Nothing verified here yet." — no empty-state illustration, no dashed box.
- Fully held module: three filled dots, and one line "Held. Next review in 21 days."
- A module with no checks authored yet: the checks section is simply absent. Do
  not render an empty section with a placeholder.

## WHAT GOOD LOOKS LIKE / REJECT IF

✓ /modules is scannable in one screen-and-a-half at desktop.
✓ You can tell your position from the dots without reading a number.
✓ The seeded marks are visually distinct from one another without colour.
✗ Reject if: a node graph, tree diagram, or roadmap-with-connecting-lines appears.
✗ Reject if: any module is locked, greyed, or shows a padlock.
✗ Reject if: mastery is shown as a percentage or a progress bar.
✗ Reject if: a stat-tile row or chart appears on /modules/[id].
````

---

## P4 — The reader with an inline exercise

````text
[PASTE BRIEF ABOVE]

Design the reading surface with an inline check embedded in it.

## THE EXISTING READER — preserve this exactly

A fixed 52px frosted header with the wordmark, a "Chapter 1 · Anatomy of an AI
Agent" label, search, chat, a slide counter, and a theme toggle. A left contents
rail (~280px, dockable, becomes an overlay on mobile). The reading surface is a
frosted glass card floating over a very subtle ambient background, prose at 17px
on a 720px measure, with ‹ › controls bottom-right and the hint "← → arrow keys
work too".

Two changes to the shipped reader, and only two:
  a) The rail shows the learner's PATH flat (8–14 rows) instead of a 20-book,
     59-chapter accordion. "Browse all →" is always the last row.
  b) A plain-text breadcrumb, three levels, above the slide title:
     "Context Engineering › The Four Moves › Compaction".

## THE CHECK BLOCK — the new work

A check appears BETWEEN slides as a full slide of its own, and sometimes inline
after a paragraph as a "predict before you read on" prompt. Design both placements.

Anatomy of the check block:
  · An eyebrow label — "CHECK" — nothing louder than that.
  · The question, at 21px, on the 720px measure.
  · Where the question includes an artefact (an agent trace, a JSON tool schema,
    a code block), render it in mono 13.5px on canvas-2 at radius 18px, with the
    trace's step numbers in a left gutter in ink-2. Steps are ROWS and each row is
    a 44px click target when the question requires clicking one.
  · Options as full-width rows, hairline-separated, 44px minimum, radius 18px on
    hover. Selected state: 1.5px blue border and canvas-2 fill. NOT a radio button.
  · One primary pill "Check". Two ordinary text links: "Hint" and "Reveal".
  · A skip link: "Skip this →". Always present.

## THE FIVE STATES — design all five

1. UNATTEMPTED — as above. Nothing highlighted.
2. CORRECT — the chosen row gains a blue left rule (3px) and a small check glyph.
   The explanation block appears below, on canvas-2, at 17px. One pill: "Continue".
   NO confetti, NO animation beyond a 200ms fade, NO sound, NO badge.
3. WRONG — the chosen row gains a 3px ink-2 left rule and a small ✕ glyph — NOT
   RED. The correct row gains the blue rule. The explanation appears in full,
   including why each wrong option was tempting. Two ordinary links: "Try again"
   and "Continue anyway". A wrong answer NEVER blocks progress.
4. ASSISTED — the learner used Hint or Reveal before answering. Same as correct or
   wrong, plus one quiet line in ink-2: "Marked as assisted — this one won't count
   toward mastery." Honest, not punitive.
5. TRACE VARIANT — the same block, but the artefact is a 12-step agent trace with
   roles (thought / tool_call / observation / response) in a left gutter, and the
   answer is a clicked step. After answering, the correct step gains a blue rule
   and a SECOND question appears in place of the options: "and why?" with the
   taxonomy labels as chips. Design the two-stage sequence.

## STATES BEYOND THE CHECK

- Reduced motion: no slide transition, no ambient background animation.
- Mobile 390px: rail is an overlay; the trace artefact scrolls horizontally inside
  its own container and the page body NEVER scrolls sideways; step rows stay 44px.
- Long artefact: the artefact container scrolls internally, capped at ~60vh.

## WHAT GOOD LOOKS LIKE / REJECT IF

✓ The check looks like it belongs to the same product as the prose. Same measure,
  same type, same surfaces.
✓ A wrong answer feels like information, not like failure.
✓ The trace is genuinely readable — you can follow the agent's reasoning by eye.
✗ Reject if: red appears anywhere.
✗ Reject if: there is celebration on a correct answer.
✗ Reject if: the check is visually "gamified" — cards, badges, timers, score pops.
✗ Reject if: the reading measure changes between prose and check.
✗ Reject if: progress is blocked by a wrong answer.
✗ Reject if: a photograph or ambient image appears behind the check.
````

---

## P5 — The Problems index and one problem page

````text
[PASTE BRIEF ABOVE]

Design /practice (the exercise index) and /practice/[id] (one exercise).

## THE TRAP TO AVOID

This is the "LeetCode for agentic AI" surface, and LeetCode's index is a dense
sortable table with difficulty tabs, acceptance rates, solved counts, premium
locks, and a topic tag cloud. Copying it would destroy this product. The whole
differentiator is that ours is calm. Design the index as a READING PAGE that
happens to list exercises.

## /practice

Max 980px, single column.
  · Title "Practice". One line of context: "312 checks across 20 modules."
  · If anything is due, ONE row above everything else, visually distinct only by
    a blue left rule: "6 due for review → Review". Otherwise this row is absent.
  · Then 20 MODULE rows — not 312 exercise rows. Each: seeded mark, module title,
    0–3 dots, "14 checks", and a chevron. Expanding a row reveals its checks as an
    indented list: check title, a small type glyph (choice / trace / number), and
    a status mark (unattempted / verified / wrong last time / assisted).
  · Filters as FOUR PLAIN TEXT LINKS in a single line, current one in ink:
    "all · unattempted · wrong last time · due". One optional <select> for type.
    That is the entire filter UI.

Explicitly absent, and the design must not reintroduce them: difficulty tabs, a
solved counter, an acceptance rate, a global percentage, a leaderboard, a
"premium" state, a tag cloud, a search box (⌘K covers it).

## /practice/[id]

One check on an otherwise empty page — this is the shareable, deep-linkable unit.
  · Breadcrumb: "Practice › Context Engineering".
  · The check block exactly as designed in P4, all five states.
  · Below it, after answering, ONE link: "Read the slide this came from →".
  · At the very bottom, one line: "Next in Context Engineering →".
  No rail. No related-exercises grid. No comments. No difficulty badge.

## STATES

- Empty (a module with no authored checks): the module row is simply not listed.
  No "coming soon", no placeholder.
- Nothing attempted at all: no due row, all dots hollow, and one line under the
  title: "Nothing verified yet. Start anywhere." No onboarding nag.
- All modules held: the due row shows the earliest future review date instead.
- Loading: the module list is statically rendered; only the dots are client-side.
  Design the pre-hydration state — dots absent, layout identical, no skeleton
  shimmer and no layout shift when they appear.

## WHAT GOOD LOOKS LIKE / REJECT IF

✓ It reads as a page, not a control panel.
✓ 20 rows, not 312, at rest.
✓ A shared /practice/[id] link is a complete, self-explanatory artefact.
✗ Reject if: it looks like a table with sortable column headers.
✗ Reject if: difficulty is a filter or a tab.
✗ Reject if: any count of other people's activity appears.
✗ Reject if: there is a skeleton shimmer or a layout shift on hydration.
````

---

## P6 — Progress / self-evaluation

````text
[PASTE BRIEF ABOVE]

Design /path — the learner's self-evaluation surface.

## THE BRIEF IN ONE SENTENCE

This must be the QUIETEST page in the product. It is where a learner finds out
what they know and what has decayed. It is explicitly NOT a dashboard, and the
main risk in this prompt is that you build one anyway.

Forbidden outright: charts of any kind, sparklines, donuts, heatmap calendars,
stat tiles, KPI rows, percentages of total, streak counters, XP, levels, badges,
trophies, and any number that describes time spent.

## STRUCTURE — max 720px, single column, generous vertical rhythm

1. One sentence of state, at 21px, no eyebrow, no title:
   "You're on the building path. 6 of 14 modules on it, 41 ideas verified."

2. REVIEW — the only thing with any urgency on the page.
   "6 ideas are due." One pill: "Review". Then the six as a plain list of one-line
   titles with their module in ink-2. If nothing is due:
   "Nothing due. The next 4 come back on 14 August." — and no button.

3. WHAT YOU'VE VERIFIED — the mastery map. The modules on the path, in path order,
   each one row: title, 0–3 dots, one short clause. Framed ADDITIVELY and
   specifically:
     Context Engineering   ●●●  "11 ideas verified · held"
     Memory                ●●○  "7 verified · 3 due"
     Multi-Agent Systems   ○○○  "not started"
   Below the path modules, collapsed by default: "Other modules (14) →".

4. WHAT'S NEXT — one row. The next module on the path, with its promise. One link.

5. YOUR PATH — three ordinary text links, no section chrome, no headings:
   "Change my path" · "Copy my progress code" · "Reset everything".
   Design the "Copy my progress code" state: a monospace string in a canvas-2
   block at radius 18px with a copy affordance, and one line explaining it —
   "Paste this on another device to bring your progress with you. It contains no
   personal information." Design the paste/import counterpart too.
   Design the reset confirmation as an inline two-step (the link becomes "Reset
   everything — this cannot be undone. [Confirm] [Cancel]"), not a modal.

## STATES — all of them

- No profile, no progress (someone who typed the URL): the whole page collapses to
  two sentences and one link. "Nothing recorded yet. Progress is stored in this
  browser only." → "Pick a path →". Nothing else. This must not look broken.
- Progress but no profile (read a lot, never onboarded): show verified counts and
  the review queue, and replace "You're on the building path" with "You've been
  reading across 4 modules." One text link offers a path. No nag.
- Storage unavailable (private browsing): one honest line at the top in ink-2:
  "This browser isn't storing progress, so this page is empty by design."
- A module that dropped from three dots to two because reviews went overdue: show
  it, and say why in the clause — "held → 3 overdue". This is the only pressure in
  the product and it must read as information, not as reproach.
- Pre-hydration: everything derived from localStorage is absent, layout identical,
  no skeleton, no shift.

## WHAT GOOD LOOKS LIKE / REJECT IF

✓ It looks like a well-set page of text with dots in it.
✓ A learner can answer "what don't I know?" in under five seconds.
✓ The empty state is dignified and does not look like an error.
✗ Reject if: any chart, graph, tile, ring, or calendar appears.
✗ Reject if: a percentage of total corpus appears.
✗ Reject if: a streak, XP figure, level, or badge appears.
✗ Reject if: the reset action opens a modal.
✗ Reject if: an empty state contains an illustration or a dashed placeholder box.
````

---

## How to iterate when the output is 80% right

**Do not re-prompt from scratch.** Ask for one delta at a time; wholesale
regeneration loses the parts that were right.

The five corrections you will need most, ready to paste:

1. *"Too much chrome. Remove every border, box, and background fill that is not
   load-bearing. Keep hairlines only where they separate list rows."*
2. *"You used a card grid. Replace it with a single column of hairline-separated
   rows."*
3. *"You built a dashboard. Delete every chart and tile; express the same
   information as one sentence plus 0–3 dots."*
4. *"An image appeared on a reading/exercise/progress surface. Remove it. Use
   surface lift (canvas → canvas-2) instead."*
5. *"Two CTAs have equal weight. Keep one pill button; demote the other to a plain
   text link."*

**Getting the output back into this codebase.** Tailwind v4 here is CSS-first:
tokens live in the `@theme` block at the top of
[src/app/globals.css](src/app/globals.css), and dark mode re-points the same token
names under `[data-theme="dark"]`. So:

1. If the design used the exact token names from the BRIEF, no new CSS variables
   are needed — the classes (`bg-canvas-2`, `text-ink-2`, `rounded-card`) already
   exist and dark mode works for free.
2. `--module-h` is the one genuinely new variable. Add it to `@theme` with the
   brand blue's hue as the default, and set it per-module on a wrapper element.
3. Convert inline CSS to Tailwind utilities *only where a utility already exists*.
   Anything bespoke (the frosted glass recipes, `.prose-yap`) already has a named
   class in `globals.css` — extend those rather than adding inline styles.
4. Keep the generated markup semantic. The reading surface is server-rendered with
   zero prose JavaScript today, and that is worth protecting: check renderers are
   client islands, everything around them stays server-rendered.

**One thing to verify before implementing any of it:** the site declares "SF Pro
Display"/"SF Pro Text" but loads no webfont, so on Windows and Android it renders
as Segoe UI / Roboto. Every screen the design tool produces will be shown in a
font most visitors will not see. Either ship a webfont or design against the
actual fallback stack — do not review the mockups on a Mac and assume they
represent what ships.
