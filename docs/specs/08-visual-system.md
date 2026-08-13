# Spec 08 — Visual system evolution & component inventory

> **Intent.** Two jobs. (1) Define the **safe way to evolve our look** so adding all these
> features never becomes a "hotch-potch" — everything through tokens, within our already-
> decided cool identity. (2) Produce the **component inventory** every other spec needs, so
> we build shared primitives once instead of ad-hoc per feature.

## Prior art / where it plugs in
- Tokens live in [src/app/globals.css](../../src/app/globals.css): Tailwind v4 `@theme`
  with semantic tokens (`--color-canvas/-2/-3`, `--color-ink/-2`, `--color-blue*`,
  `--color-hairline`, `--radius-card/-pill`, fonts). Dark theme **re-points the same tokens**
  — proof the system is centralized.
- Identity is **decided** in `docs/redesign-2026/research/06-visual-identity.md`: single
  accent via one OKLCH hue on a **184°–324° cool arc**, **no gradients**, accent **≤2% of
  pixels**, 4-step neutral surface ladder carries hierarchy, per-module **seeded procedural
  marks** (no image assets), **≤3 photographs total**. **New UI must not contradict this.**
- Standard primitives may come from **shadcn** (per `AGENTS.md` trust order) restyled to our tokens.

## Requirements
- **R-1 Token discipline (the anti-hotch-potch rule).** No new **raw** colors in components.
  Any new need becomes a **named token** in `globals.css` first, then used. Reviewers reject
  hardcoded hex/rgb in feature PRs.
- **R-2 Status-token set.** Add a small semantic status palette (e.g. `--color-status-done`,
  `-ontrack`, `-paused`, `-missed`, `-upcoming`) derived within our cool arc + neutrals, used
  by the plan calendar (05), quiz palette (07), and progress (04). One source of truth.
- **R-3 Component inventory.** Build/adopt these shared primitives (restyled shadcn where it
  fits), each themed + dark-mode correct + a11y-clean:
  - **Card** (+ optional inset-stroke variant as our one "signature detail")
  - **Segmented toggle / tabs** (Basic⇄Advanced 02, Organised⇄Free 03, list⇄calendar 05)
  - **Progress ring / donut** (04) — extend existing ring
  - **Calendar grid** (04 streak, 05 plan)
  - **Collapsible / disclosure** (01 doubts/faqs/reveal)
  - **Callout blocks** (01: doubt/faq/funfact)
  - **Badge / pill / status dot** (difficulty, plan status, palette states)
  - **Stepper** (05 pace)
  - **Note editor field**, **empty-state** block (06)
  - **Question-palette grid** (07)
  - **Line icon set** (calm, single-weight — no filled/branded icons)
- **R-4 Typography.** Keep 17px/1.6 reading; note the site declares SF Pro but ships **no
  webfont** (Segoe/Roboto on Win/Android) — either accept the system-font fallback or add a
  webfont deliberately (flag, don't silently change).
- **R-5 One retokenization, atomic.** If we adjust the accent/surfaces, do it in a **single
  PR** that changes token values only — never a per-component drift.

## Design notes (for Claude design)
- We are **not** importing TUF's warm palette or gradient cards. Borrow their *structure*
  (clear cards, consistent status colors, calm icons, one signature detail) rendered in our
  cool, gradient-free system.
- Deliverable: a short **component gallery** page/story showing each primitive in light+dark,
  so specs 01–07 consume a known kit.

## Acceptance
- [ ] Status tokens exist in `globals.css` and are the only source for plan/quiz/progress colors.
- [ ] Each inventory primitive exists, themed, dark-correct, keyboard+contrast a11y-clean.
- [ ] No feature PR introduces a raw color (grep clean for stray hex/rgb in new components).
- [ ] A gallery view renders every primitive in both themes. `build`/`lint` green.

## Out of scope
- A brand-new identity or a second skin (Free mode reuses these — see 03). Warm/gradient look.

## Blast radius
- **May modify:** `src/app/globals.css` (tokens), new shared UI under `src/components/ui/**`,
  a gallery route, `package.json` (shadcn primitives if added), `FEATURE-STATUS.md`.
- **Must not break:** existing reader/landing styling, dark-mode no-flash boot, `.prose-yap`.

## Open questions
- **Q1 (design):** adopt a real webfont (SF Pro alt like Inter) or commit to system fonts?
- **Q2 (design):** how literal is the "inset-stroke" signature detail — cards only, or hero cards only?
