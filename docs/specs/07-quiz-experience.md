# Spec 07 — Chapter quiz experience (exam-style UX)

> **Intent.** Give the existing quiz **a real experience**: an intro screen, a **question
> palette** navigator, **save & next**, an answer summary, a results screen, and an
> **optional timer** — TUF's exam-grade feel, tuned to be encouraging (no negative marking).
> We already have ~5–10 questions per chapter with no framing; this is the framing.

## Prior art / where it plugs in
- **The assessment ENGINE is already designed** — 10 check types, grading, mastery,
  progressive hints (`assisted` excludes from mastery), 485 harvested MCQs, `/practice`
  (`docs/redesign-2026/research/07-assessment-system.md`; `docs/pm/prd/interactive-lessons.md`;
  `FEATURE-STATUS.md` row 20). **Do NOT re-spec grading/types/mastery.** This spec is the
  **UX shell** around that engine for the chapter-end quiz.
- "Problem before explanation" / "Now your turn" inline MCQ is already spec'd — this is the
  *end-of-chapter* aggregate quiz, not the inline check.

## Requirements
- **R-1 Intro screen.** Title, short instructions (few questions, one correct answer,
  **no negative marking**, hints don't fail you), Start.
- **R-2 Question view.** One question + options + **Save & Next**; supports the engine's
  MCQ/choice type now; leaves room for richer types later.
- **R-3 Question palette.** A numbered grid navigator to jump to any question, showing
  per-question state (answered / seen / unseen). Mirrors TUF's palette.
- **R-4 Answer summary.** Live counts: attempted / unattempted / unvisited.
- **R-5 Results screen.** Score, per-question correctness, and (reusing the engine) the
  `because`/distractor explanations so wrong answers teach. Encouraging tone; retry allowed.
- **R-6 Optional timer.** A per-quiz timer that can be **on or off** (default off for
  chapter quizzes; on is for a future `interview`/mock template — keep it a prop, not a rewrite).
- **R-7 Progress + streak hook.** Completing a quiz can feed the streak ([04](04-streaks-and-progress.md))
  if that's enabled — via a clean event, not a hard dependency.

## Design notes (for Claude design)
- Two-pane on desktop (question | palette+summary), single-column stacked on mobile —
  matches TUF but in our tokens.
- Non-punishing throughout: no red-heavy shaming; "no negative marking" stated up front;
  results emphasize what you learned. Palette states use the [08](08-visual-system.md) status tokens.
- Reuse the engine's rendering for question/answer/explanation — this spec owns layout + flow only.

## Acceptance
- [ ] Intro → questions → results flow works for a chapter's question set.
- [ ] Palette jumps to any question and reflects answered/seen/unseen; summary counts correct.
- [ ] Results show score + per-question explanations; retry works.
- [ ] Timer prop toggles a working countdown without changing default (off) behavior.
- [ ] Uses the existing engine for grading (no new grading logic). `build`/`lint` green.

## Out of scope
- Grading/mastery/new question types (engine owns these). Coding questions + auto-run
  against test cases (needs sandboxing → 99). Global leaderboards (→ 99).

## Blast radius
- **May modify:** new quiz-experience components under `src/components/**`, a quiz
  route/panel, `globals.css`, `FEATURE-STATUS.md`. Consumes the assessment engine's public API.
- **Exclusive-access:** if the engine lands under a spec'd `specs/features/assessment/**`,
  coordinate — consume its interface, don't fork it.
- **Must not break:** existing check rendering, reader, SSG.

## Open questions
- **Q1 (eng):** what's the engine's public interface for "give me chapter X's questions +
  grade this answer"? Align with the check-primitive spec before building the shell.
- **Q2 (product):** is the chapter quiz a full-screen route or an in-reader panel? Lean: route
  reachable from chapter end + rail.
