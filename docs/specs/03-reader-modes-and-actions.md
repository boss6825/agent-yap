# Spec 03 — Reader modes & per-unit actions

> **Intent.** Give readers control over the reading environment and a way to react to
> each unit. Ship **two reading modes as one toggle** — *Organised* (default; rail,
> progress, streak, plan visible) and *Free / Focus* (content + minimal nav only) — plus
> a **Study view** clean-reading toggle, and small per-slide actions: **like/dislike** and
> **report-a-bug**. This is our version of TUF's Focus Mode + Study view + unit feedback.

## Prior art / where it plugs in
- Host: [src/components/reader/ReaderChrome.tsx](../../src/components/reader/ReaderChrome.tsx).
  Already present: rail toggle (`t`), search (`/`), chat, arrow/swipe nav, top progress bar,
  `NN/NN` counter, theme toggle, resume pill, per-slide mark-read (dwell).
- Redesign-2026 treats a minimal reading surface as a **principle**, not a toggle
  (`06-visual-identity.md` §4) and mentions "modes as lenses" (`plan.md` §Future) — this
  spec makes Focus/Study concrete without contradicting that.
- **Do not** re-implement prev/next or mark-complete — they exist; only *surface* a
  mark-complete affirmation if design wants it.

## Requirements
- **R-1 Free / Focus mode.** A single toggle (button + shortcut, e.g. `f`) that hides all
  chrome and gamification — rail, top bar extras, streak, plan — leaving the reading card,
  minimal prev/next, and an exit affordance. This **is** the "Free mode" (no separate skin).
- **R-2 Organised mode.** The default; everything visible. Mode choice persists (localStorage).
- **R-3 Study view.** A lighter, distraction-reduced reading style *within* a slide
  (wider measure / muted secondary elements) — orthogonal to Focus mode; can combine.
- **R-4 Like / dislike.** Per-slide 👍/👎 (local now; wire to a real signal endpoint later).
  Purely optional, unobtrusive.
- **R-5 Report a bug.** Per-slide "report an issue with this page" that captures slide id +
  a short note. Now: opens a prefilled GitHub issue / mailto (no backend). Later: an endpoint.
- **R-6 Preserve everything.** All existing shortcuts (`/`, `t`, arrows, Escape, swipe),
  hydration neutrality, and SSG behavior stay intact.

## Design notes (for Claude design)
- Focus mode should feel like the room lights dimming, not a different app: same tokens,
  fewer elements, a calm transition. Exit must be obvious (Escape + a visible control).
- Keep the new controls out of the way in Organised mode — a small cluster, not a toolbar.
- Decide where like/report live (footer of the reading card is natural, near existing nav).

## Acceptance
- [ ] Focus mode hides rail + gamification + extras; reading + minimal nav remain; Escape exits.
- [ ] Mode + study-view choices persist across reloads; server HTML renders neutral (no flash).
- [ ] Like/dislike records locally; report-a-bug opens a prefilled issue/mail with slide id.
- [ ] All existing keyboard/swipe nav and shortcuts still work.
- [ ] `npm run build` + `npm run lint` green; a11y (focus, labels, contrast) verified.

## Out of scope
- A second visual theme/skin. Server-side storage of likes/reports (later). Changing the
  content itself. Command-palette work (deferred — see 99).

## Blast radius
- **May modify:** `src/components/reader/ReaderChrome.tsx` (+ new small components),
  `src/lib/**` (mode/like local state), `src/app/globals.css`, `FEATURE-STATUS.md`.
- **Must not break:** existing rail/search/chat/nav, resume pill, progress marking, SSG.

## Open questions
- **Q1 (product):** Does Free mode also suppress the AI chat button, or keep it? Lean: keep chat.
- **Q2 (eng):** report-a-bug target now — GitHub issue template vs mailto? Pick one.
