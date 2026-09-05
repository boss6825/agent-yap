# Content Delivery Plan

Direction for how Agent YAP should present its markdown knowledge base. Short version: keep the content pipeline and `content.ts`, evolve the reader from "slides" to "interactive lessons".

> Reach, distribution, and GTM direction lives in `docs/growth/` (cited research + master plan). This file stays about content delivery.

## What similar sites do

- **Josh Comeau (Joy of React, CSS for JS Devs):** long-form prose with interactive widgets, short exercises, and quizzes embedded inline via MDX. Multi-modality is the engagement engine, not gamification. This is the closest model to what we want.
- **Subroute.dev:** bite-sized system design concepts where each page has a live simulation you can poke. "Small inputs, big intuition."
- **Atlases (atlases.vercel.app):** long chapters with a quiz at the end of every chapter and in-browser sandboxes. Reading stays primary; interaction punctuates it.
- **Brilliant / Educative:** short reading blocks interrupted every few screens by a check-your-understanding question. The question is the pacing device.

The common pattern: nobody chops prose into slides for its own sake. They keep readable prose and insert an interaction every 2-4 minutes of reading so attention never coasts for long.

## Verdict on our current approach

The H2-per-slide reader is a good skeleton and does not need restructuring. Paging beats infinite scroll for pacing and progress feel. The weakness is that every slide is the same passive thing: a wall of markdown. Engagement problems come from monotony, not from the slide format.

So: no repo restructuring. The fix is to make slides heterogeneous.

## Plan

### Phase 1: Break the monotony (highest value, lowest effort)

1. **Quiz slides.** Add a fenced block convention in markdown (e.g. ` ```quiz ` with YAML inside) that `Markdown.tsx` renders as an MCQ with explanations on answer. Drop 1-2 into each chapter of the live book. This alone converts passive reading into retrieval practice, which is the single best-evidenced learning technique.
2. **Recap slide per chapter.** Auto-generate or hand-write a final "3 things to remember" slide. Cheap, and gives closure per chapter.
3. **Typography and rhythm pass.** Callout boxes (insight, warning, example), better code block styling, pull quotes. Visually different slides feel like progress even when they are all markdown.

### Phase 2: Light progress mechanics (moderated gamification) — CONFIRMED

4. **LocalStorage progress.** Track slides read and quizzes passed per chapter. Show completion rings on the TOC and a "continue where you left off" entry point. No accounts needed.
5. **Chapter completion state.** A quiet checkmark when all slides plus the quiz are done. This is the LeetCode-streak energy at its mildest: visible progress, no pressure.

### Phase 3: One interactive widget per book (differentiator)

6. Build 2-3 small interactive diagrams for the concepts that most benefit from manipulation: a context window filling up as you add tools/history, a RAG retrieval pipeline you can step through, an agent loop simulator. Embed them as custom fenced blocks the same way as quizzes. Do not try to widget-ify everything; one memorable interaction per book is enough.

## Future direction: modes as lenses over one content model

Longer-term shape of the site: multiple modes, all reading from the same `content.ts` slide list. No mode gets its own content; a mode is an index plus a renderer. Rough priority order:

1. **Roadmap mode + deterministic placement.** A hand-authored prerequisite graph (small JSON: chapter/module -> prerequisites) across all seven modules, rendered as a roadmap with the Phase 2 completion rings on each node. Onboarding is a skippable 10-15 question placement quiz reusing the Phase 1 MCQ infrastructure; a simple score-per-module rubric maps to a recommended entry node. Pure lookup table, no AI, no tokens. Results live in localStorage. Recommendations only, never locks.
2. **Explore mode (subroute-style cards).** A card-grid view over existing slides, browsable by concept instead of chapter order. Requires deterministic tagging: frontmatter tags added during chapter generation. Serves the casual "sharpen one mental model over coffee" visitor.
3. **Podcast mode.** Pre-generate TTS audio per chapter at build time (content is static, so cost is one-time and cached), standard audio player with speed/pause/next. Needs a preprocessing pass to strip or narrate around code blocks and tables. Concept-heavy chapters only; ranked last because it improves consumption for existing readers rather than expanding who can use the site.

Design north star (from Brilliant): one idea per screen, generous whitespace, interactive element front-and-center, soft warm palette. A styling discipline, not a redesign.

## Why this direction

- It preserves the markdown-first pipeline (Claude generates chapters, reader renders them). Quizzes and widgets are just new block types inside that pipeline.
- Retrieval practice (quizzes) and self-paced interaction are what the research and the best competitor sites actually bet on. Streaks and points are retention mechanics for daily-habit products; we are a read-through knowledge base, so completion tracking fits better than streaks.
- Each phase ships independently and Phase 1 alone should noticeably reduce drift-away while reading.

## Non-goals

- No auth, and no server-side **per-user** state. Anonymous aggregates
  (per-item answer counts, cookieless page analytics) are permitted — see
  ADR-006. Amended 2026-09-04; the original read "no auth, no server-side
  progress, no points/leaderboards".
- Streaks and a leaderboard are **in scope** as of 2026-09-04 (ADR-006),
  reversing the redesign-2026 non-goal. Notifications and certificates remain
  refused.
- No infinite-scroll rewrite of the reader.
- No video content.
