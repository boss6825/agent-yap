# Spec 06 — Notes hub & bookmarks

> **Intent.** Let readers build a personal layer on top of the content: **notes** on any
> slide, a **bookmark** toggle, and a **consolidated hub** that gathers them in one place.
> This also lays the data foundation for future **revision reminders** (which ship later —
> see Decision 2).

## Prior art / where it plugs in
- Today there's only a "Copy as a note" markdown-export affordance in a redesign template
  (`research/08-onboarding-and-templates.md` §4.6). A real **notes hub is not spec'd** — new.
- Host: [ReaderChrome.tsx](../../src/components/reader/ReaderChrome.tsx); state alongside
  [progress.ts](../../src/lib/progress.ts) (localStorage, SSR-neutral pattern).
- **Reminders/notifications are explicitly excluded now** (`09-ia-and-flows.md` §8) and need
  accounts + a delivery channel → [99](99-deferred-later-iterations.md#reminders--notifications).

## Requirements
- **R-1 Per-slide note.** Add/edit/delete a markdown note tied to a slide id; autosave to
  localStorage; visible affordance in the reader when a note exists.
- **R-2 Bookmark toggle.** Mark/unmark a slide; bookmarked slides are visually flagged in the
  rail/hub.
- **R-3 Notes & bookmarks hub.** A page/panel listing all notes and bookmarks grouped by
  book→chapter, each linking back to its slide. Search/filter within is nice-to-have.
- **R-4 Empty state.** Goal-oriented, encouraging microcopy (à la TUF: "notes help you recall
  this later"), matching our voice — not a blank screen.
- **R-5 Export.** "Copy/export as markdown" for notes (reuses the existing copy-as-note idea).
- **R-6 Local + reminder-ready schema.** Store `{ slideId, body, createdAt, updatedAt }` for
  notes and `{ slideId, createdAt }` for bookmarks — a shape a future reminder scheduler can read.

## Design notes (for Claude design)
- Note editor: a small inline panel in the reading card (not a modal that blocks reading).
- Hub reuses the rail's chapter grouping; bookmarks and notes can share one hub with two tabs.
- Everything in our tokens; respects Focus mode (notes affordance may stay, gamification doesn't).

## Acceptance
- [ ] Create/edit/delete a note on a slide; persists across reloads; shows an indicator.
- [ ] Bookmark/unbookmark reflected in rail + hub.
- [ ] Hub lists all notes+bookmarks grouped, each links back to the exact slide.
- [ ] Export produces clean markdown. Empty state present. SSR neutral; `build`/`lint` green.

## Out of scope
- Reminders/notifications (Decision 2 → 99). Server sync / cross-device (needs accounts → 99).
- Rich-text/whiteboard notes (markdown text only).

## Blast radius
- **May modify:** new `src/lib/notes.ts`, hub route + components under `src/components/**`,
  `ReaderChrome.tsx` (note/bookmark affordances), `globals.css`, `FEATURE-STATUS.md`.
- **Must not break:** reader, progress, Free mode, hydration neutrality.

## Open questions
- **Q1 (product):** hub as a standalone route (`/notes`) or a reader panel/drawer? Lean: route + quick panel.
- **Q2 (product):** confirm reminders are accepted as a *later* milestone (they drive R-6's schema).
