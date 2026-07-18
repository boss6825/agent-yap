---
prd_id: PRD-interactive-lessons
status: draft
author: "@vivek"
date: 2026-07-18
# after conversion add:  spec: specs/features/reader/interactive-lessons/spec.md
---

# PRD: Interactive Lessons

## Intent
Agent YAP renders its markdown knowledge base as a slide reader where every
slide is the same passive thing — a wall of markdown — and readers drift away
from the monotony rather than from the paging format. This direction evolves the
reader from passive slides into **heterogeneous, interactive lessons**: keep the
markdown-first content pipeline and the H2-per-slide skeleton, but insert an
interaction (a quiz, a recap, a manipulable widget) every few minutes of reading
so attention never coasts. For the self-directed learner reading through a
technical knowledge base.

## Background & prior art
- The reader is a good skeleton: paging beats infinite scroll for pacing and
  progress feel. The weakness is monotony, not structure — so no repo
  restructuring.
- Content flows through `src/lib/content.ts` (books → chapters → slides), the
  single source of truth. `Markdown.tsx` renders plain markdown only today.
- Comparable sites (Josh Comeau, Subroute.dev, Atlases, Brilliant/Educative) all
  keep readable prose and punctuate it with interaction every 2-4 minutes;
  none chop prose into slides for its own sake, and none rely on gamification.
- **Must not modify**: the content pipeline and `src/lib/content.ts` — quizzes
  and widgets are new *block types* inside the existing pipeline, and modes are
  *an index + renderer* over the same slide list, never new content. Backend
  lanes (`src/app/api/**`, `search.ts`, `ask.ts`) are out of this PRD's blast
  radius.

## Personas
| Persona | Situation | Need |
|---|---|---|
| Read-through learner | Working front-to-back through a module | Pacing and retrieval so attention doesn't coast; a sense of progress |
| Returning learner | Comes back across multiple sessions | To resume where they left off and see what's done |
| Casual visitor | "Sharpen one mental model over coffee" | Browse by concept, not chapter order |

## Requirements                    <!-- stable IDs; these thread into the spec -->

### A. Heterogeneous slide types (Phase 1 — break the monotony)
- **R-A1**: Quiz / MCQ slide block — a fenced markdown convention rendered as an
  MCQ with explanations on answer. *(→ CR-2026-001, slug `quiz-slides`)*
- **R-A2**: Per-chapter recap slide — a closing "3 things to remember" slide.
  *(→ CR-2026-002, slug `recap-slide`)*
- **R-A3**: Typography / callout / rhythm pass — insight/warning/example
  callouts, code styling, pull quotes. *(→ CR-2026-003, slug
  `typography-rhythm-pass`)*

### B. Progress mechanics (Phase 2 — moderated, confirmed)
- **R-B1**: LocalStorage progress + completion rings on the TOC, a
  continue-where-you-left-off entry point, and a quiet per-chapter checkmark. No
  accounts. *(→ CR-2026-004, slug `localstorage-progress`)*

### C. Interactive widgets (Phase 3 — differentiator)
- **R-C1**: One memorable interactive widget per book (e.g. context window
  filling, RAG pipeline step-through, agent loop simulator), embedded as a
  custom fenced block. *(→ CR-2026-005, slug `interactive-widget`)*

### D. Modes as lenses (future — index + renderer over one content model)
- **R-D1**: Roadmap mode + deterministic placement quiz over a hand-authored
  prerequisite graph; no AI, no tokens; recommendations never locks. *(→
  CR-2026-006, slug `roadmap-mode`)*
- **R-D2**: Explore mode — concept card grid over existing slides, requires
  deterministic frontmatter tags. *(→ CR-2026-007, slug `explore-mode`)*
- **R-D3**: Podcast mode — build-time TTS audio per chapter with a standard
  player. *(→ CR-2026-008, slug `podcast-mode`)*

## Lifecycle / states
Each requirement group ships independently and in order (A → B → C → D). A slide
is one of: plain markdown, quiz, recap, or widget — all read from the same
`content.ts` slide list. Modes are alternate indexes/renderers over that same
list; a slide's identity does not change with the mode viewing it.

## Success criteria
Observable outcomes, not features:
1. Reduced drift-away while reading — readers reach the end of a chapter more
   often than with all-passive slides (measured by per-chapter completion
   telemetry from R-B1's localStorage progress).
2. Readers attempt the inline quizzes rather than paging past them (quiz
   attempt rate per chapter that has a quiz).
3. Returning readers use the continue-where-you-left-off entry point (resume
   events / share of sessions that resume mid-chapter).
4. Each Phase 1 change ships without restructuring the reader or the content
   pipeline (no changes to `src/lib/content.ts`'s book/chapter/slide model).

## Out of scope
- No auth, no server-side progress, no points/leaderboards.
- No infinite-scroll rewrite of the reader.
- No video content.

## Open questions
- **Q1**: What is the fenced-block syntax and YAML schema for quiz blocks, and
  can the same convention carry widgets (R-C1) without a second parser? —
  deferred to spec.
- **Q2**: How is "reduced drift-away" instrumented without server-side
  analytics or accounts — is localStorage-derived completion enough of a signal,
  or is a privacy-safe client beacon needed? — deferred.
- **Q3**: Recap slides (R-A2) — auto-generated at build time or hand-authored
  per chapter? Auto-generation risks drift from chapter edits. — deferred.
- **Q4**: Where do the prerequisite graph (R-D1) and concept tags (R-D2) live —
  chapter frontmatter, a sidecar JSON, or both — given `content.ts` must not be
  restructured? — deferred.
- **Q5**: Which chapters qualify as "concept-heavy" for podcast TTS (R-D3), and
  how are code blocks/tables narrated or stripped? — deferred.

## Constraints & compliance notes
Client-only progress (localStorage) — no PII, no accounts, no server-side user
state. Build-time TTS (R-D3) must keep cost one-time and cached. Modes and new
slide types must not modify `src/lib/content.ts` or the backend lanes.
