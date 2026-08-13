# Spec 05 — Study plan (our "Planly")

> **Intent.** Turn a book into a **scheduled, trackable plan**: spread its chapters across
> real dates, adjust the pace, see a **calendar** of what's done / on-track / missed /
> upcoming, and **Pause** when life happens. For the disciplined reader who wants a framework;
> invisible for the reader who just wants to read (Free mode hides it).

## Prior art / where it plugs in
- Study-plan *templates* + an ordered "spine" and a `/modules` DAG already exist in
  redesign-2026 (`research/08-onboarding-and-templates.md` §1.5, `09-ia-and-flows.md` §1),
  and a roadmap mode is in `plan.md` (R-D1). **Build the scheduling + calendar layer on
  top of those** — don't invent a parallel roadmap.
- **New vs existing:** a date-scheduled **calendar view** with done/missed/upcoming and a
  **Pause** is NOT in the existing docs — that's this spec's core.
- State: localStorage, alongside [progress.ts](../../src/lib/progress.ts).

## Requirements
- **R-1 Create a plan.** "Finish <book> by <date>" (or "N chapters/week"). Generate a
  schedule mapping chapters → date ranges from the book's chapter list + reading estimates.
- **R-2 Adjust pace.** Per-topic +/- steppers (add/remove days) that reflow later items;
  an overall pace control.
- **R-3 Calendar view.** Month grid mapping scheduled chapters to days, color/status-coded:
  **Completed / On-track / Paused / Missed / Upcoming** (statuses derived from reading progress).
- **R-4 List/module view.** Rows: chapter + progress (read/total) + assigned dates + expand,
  reusing existing progress data.
- **R-5 Pause / Resume.** Pause freezes the schedule (no "missed" accrues while paused);
  resuming shifts remaining dates forward. Also a Reset.
- **R-6 Local + optional.** All local; no plan = today's experience unchanged. Hidden in Free mode.

## Design notes (for Claude design)
- Two views (list + calendar) behind a small switch, matching TUF's Module/Calendar toggle
  but in our tokens. Status colors come from the [08](08-visual-system.md) status-token set.
- "Missed" must read as gentle/recoverable, not shaming — pair with a one-tap "reflow from today."
- Calendar must degrade gracefully on mobile (list first, calendar as a secondary view).

## Acceptance
- [ ] Creating a plan schedules all chapters across dates; changing the end date reflows them.
- [ ] Pace steppers add/remove days and reflow later items without corrupting the plan.
- [ ] Calendar shows correct per-day status derived from real reading progress.
- [ ] Pause stops "missed" accrual; resume shifts remaining dates; reset clears the plan.
- [ ] Fully local; SSR neutral; hidden in Free mode; `npm run build`/`lint` green.

## Out of scope
- Server-side plans / cross-device (needs accounts → 99). Reminders/notifications (Decision 2 → 99).
- Auto-estimating reading time via ML (use a simple slides/words heuristic).

## Blast radius
- **May modify:** new `src/lib/plan.ts` + components under `src/components/**`, a plan
  route/panel, `globals.css`, `FEATURE-STATUS.md`. Reuse `content.ts` **read-only**
  (getNavManifest/chapters) — no parser change needed.
- **Must not break:** reader, progress, Free mode.

## Open questions
- **Q1 (product):** reading-time estimate basis — per-slide fixed, or words/220wpm? Lean: words.
- **Q2 (product):** is there one active plan per book, or can a reader plan multiple books at once?
