# Spec 04 — Streaks, emoji calendar & progress dashboard

> **Intent.** Add a lightweight, **local-only, opt-in** habit layer: a reading **streak**,
> an **emoji streak calendar** whose face reflects how long you've been away, and a
> **progress dashboard** (rings/donut per book + per-chapter counts). Motivating, never
> punishing.

## ⚠️ Prerequisite decision (see [README, Decision 1](README.md#decision-1--gamification-reversal-streaks--emoji-calendar--leaderboard))
Redesign-2026 **refused** streaks (`docs/redesign-2026/research/07-assessment-system.md`
§1.10; `09-ia-and-flows.md` §8). The growth track revives a softened one
(`docs/growth/03-gamification-design.md`, CR-2026-013). **Before this ships:** land a
`plan.md` non-goals amendment + a short ADR referencing CR-2026-013. This spec is written
to the softened framing so it honors the original "no guilt / no dark patterns" intent.

## Prior art / where it plugs in
- Progress store today: [src/lib/progress.ts](../../src/lib/progress.ts) — localStorage,
  monotonic, `{ read: { [book]: { [href]: epochMs } } }`, `useProgress()` hook, neutral SSR.
- Completion **rings + resume already exist** (`FEATURE-STATUS.md` row 23). Extend, don't
  duplicate.

## Requirements
- **R-1 Streak model (local).** Derive a daily streak from read-events (a day counts if
  ≥1 slide read). Store `currentStreak`, `maxStreak`, `lastActiveDay`. Extend the existing
  store or add a sibling `src/lib/streak.ts`; keep it monotonic and SSR-neutral.
- **R-2 Opt-in + dismissible.** Gamification is **off by default or one-tap dismissible**;
  a reader who ignores it sees a calm, non-nagging UI. Respects Focus mode ([03](03-reader-modes-and-actions.md)).
- **R-3 Emoji streak calendar.** A month grid marking active days, plus a single
  status face driven by **days since last active** (the ladder below). Custom emoji set,
  not TUF's. Include month nav.
- **R-4 Progress dashboard.** Per-book donut/ring (read/total), and per-chapter counts —
  reusing existing ring logic. Optional difficulty/section breakdown if cheap.
- **R-5 No network, no accounts.** All local. Cross-device sync + leaderboard are deferred
  (see 99). No notifications (Decision 2).
- **R-6 A11y.** Every emoji has a text label ("2 days away"); calendar is keyboard-navigable;
  color is never the only signal.

## <a id="emoji-ladder"></a>Emoji ladder (tuned)
Gentle → intense, playful not cruel. Drives the single status face:

| Days since active | Emoji | aria-label |
|---|---|---|
| studied today (streak alive) | 🔥 | "On a streak" |
| 1 | 🙂 | "1 day away — all good" |
| 2 | 😕 | "2 days away" |
| 3 | 😟 | "3 days away" |
| 4 | 😣 | "4 days away" |
| 5 | 😢 | "5 days away" |
| 6 | 😭 | "6 days away" |
| 7 | 😤 | "a week away" |
| 8 | 😠 | "8 days away" |
| 9 | 😡 | "9 days away" |
| 10+ | 🤬 | "double digits — come back!" |
| ≥14 (lapsed) | 🪦 *(optional)* | "streak went dormant" |

- The 🪦 "dead streak" terminal is **recommended over eternal 🤬** — it's softer, funnier,
  and stops the UI from screaming forever. Ship it as the ≥14-day state (design's call on
  exact day). Keep the whole thing tongue-in-cheek; a reader must be able to turn the face off.

## Design notes (for Claude design)
- The face + calendar is a small right-rail / dashboard widget, in our cool token system
  (no warm gradients). Difficulty/status colors, if used, come from a **defined status-token
  set** in [08](08-visual-system.md), not raw values.
- Make "off" genuinely calm — this is the feature most at risk of feeling like a dark pattern.

## Acceptance
- [ ] Reading on separate days grows `currentStreak`; a gap resets it; `maxStreak` retained.
- [ ] Status face matches the ladder for N days away; every emoji has an aria-label.
- [ ] Dashboard donut matches actual read/total per book; hidden in Focus mode.
- [ ] Fully local (no network calls); SSR renders neutral; survives reload; opt-out works.
- [ ] `plan.md` non-goals amendment + ADR merged first. `npm run build`/`lint` green.

## Out of scope
- Leaderboard, cross-device sync, notifications/reminders (all → 99). Timed anything (→ 07/99).

## Blast radius
- **May modify:** `src/lib/streak.ts` (new) / `src/lib/progress.ts` (careful — extend,
  preserve P-READER-002 monotonic+local invariant), new dashboard components under
  `src/components/**`, `globals.css`, `plan.md` (non-goals), `specs/decisions/ADR-*` (new),
  `FEATURE-STATUS.md`.
- **Must not break:** existing progress/rings/resume, hydration neutrality, no-network invariant.

## Open questions
- **Q1 (product):** default **on** (opt-out) or **off** (opt-in)? Given the refusal history,
  lean opt-out-with-easy-off, or a one-time onboarding choice.
- **Q2 (product):** does the streak count *reading* only, or reading + completing a check?
