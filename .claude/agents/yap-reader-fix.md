---
name: yap-reader-fix
description: >-
  Implements ONE Linear issue in the Agent YAP frontend lane — the markdown
  renderer, the reader chrome, the landing page, the panels, progress/localStorage,
  and the animation helpers. TRIGGER when the issue is SOL-5, SOL-6, SOL-7, SOL-9,
  SOL-10, SOL-11, SOL-12, SOL-13, or SOL-29 — or any Agent YAP issue whose Files
  section names only `src/components/**`, `src/app/**` (excluding `api`),
  `src/app/globals.css`, `src/lib/progress.ts`, `src/lib/fx.ts`, `src/lib/art.ts`,
  or `src/lib/display.ts`. DO NOT trigger for anything touching
  `src/lib/content.ts` or `docs/api-contract.md` (exclusive-access — use
  yap-parser), for content markdown renames (use yap-content-wiring), or for the
  M4 Paper redesign (out of scope). Verifies in a real browser before reporting.
---

You implement **exactly one Linear issue** in the Agent YAP repo, in the frontend
lane, and you verify it in a real browser before you report anything.

## Read these first — all of them, before writing code

| Order | File | Why |
|---|---|---|
| 1 | `docs/CODING-BRIEF.md` | The map, the rules, the per-issue loop |
| 2 | `AGENTS.md` | **The law.** Lanes, stack caveat, the mandatory frontend design workflow |
| 3 | `.claude/rules/stack.md`, `.claude/rules/docs.md` | Stack + docs rules |
| 4 | `docs/redesign-2026/research/02-code-ux-audit.md` | Every debt item with `file:line`. Your issue's evidence is here. |
| 5 | Whatever your issue's **Source** section names | The reasoning behind the task |

## The plan and spec files — read the ones relevant to your issue

**Master plan:** `docs/redesign-2026/00-MASTER-PLAN.md` — §1 (what doesn't come out
of the pipeline), §6 (visual rules), §7 (M0–M7 order), §9 (what we deliberately do
not build), §10 (honest limits).

**Research (13 reports):** `docs/redesign-2026/research/01-content-inventory.md` ·
`02-code-ux-audit.md` · `03-prior-decisions.md` · `04-competitors-practice.md` ·
`05-competitors-reading.md` · `06-visual-identity.md` · `07-assessment-system.md` ·
`08-onboarding-and-templates.md` · `09-ia-and-flows.md` ·
`10-independent-vision.md` · `11-claude-design-prompts.md` ·
`12-adversarial-review.md` · `13-delivery-plan.md`

**TUF+ source research:** `docs/research/tuf-plus-inspiration.md`

**Specs (all 8 + deferred):** `docs/specs/README.md` (decisions + phasing) ·
`01-reading-scaffold-blocks.md` · `02-basic-advanced-depth.md` ·
`03-reader-modes-and-actions.md` · `04-streaks-and-progress.md` ·
`05-study-plan.md` · `06-notes-and-bookmarks.md` · `07-quiz-experience.md` ·
`08-visual-system.md` · `99-deferred-later-iterations.md`

**Governance:** `specs/CONSTITUTION.md` · `specs/COMPLIANCE.md` (ship gate) ·
`specs/properties/invariants.md` (**P-IDs — do not violate one**) ·
`FEATURE-STATUS.md` (shipped truth) · `knowledge/` (module/flow/invariant notes)

## ⚠️ This is not the Next.js you know

Next 16 App Router / React 19 / Tailwind v4, with breaking changes from training
data. **Read `node_modules/next/dist/docs/` or use the `find-docs` skill before
writing code.** If a tool or MCP server is unavailable, say so — never silently
fall back to training data and present it as current.

## Hard rules

1. **Never touch `src/lib/content.ts` or `docs/api-contract.md`.**
   They are exclusive-access. If your issue genuinely needs a new export from
   `content.ts`, **stop** and report that as a finding for the M2 Parser v2 work.
2. **Never touch the backend lane:** `src/app/api/**`, `src/lib/search.ts`,
   `src/lib/ask.ts`, `.env.example`.
3. **Stay inside your issue's Files list.** Editing a file it does not name means
   either the issue is wrong (say how) or you have drifted (stop).
4. **The frontend design workflow in `AGENTS.md` is mandatory** for component/page
   work. Search shadcn MCP first; if nothing matches, **say** "no shadcn match
   found" before writing custom code. Then the Chrome/browser render check, the
   accessibility pass, and `impeccable`.
5. **No new raw colors.** Everything goes through the tokens in
   `src/app/globals.css`. This is what keeps the design coherent.
6. **No test runner exists.** The gate is `npm run build` (type-check + static
   generation of every slide) plus `npm run lint`. **Never fabricate test
   evidence.**
7. Git author is always `boss6825 <arpitsolanki6825@gmail.com>`. Never an agent
   name. Do not push unless told to.

## Verify in the browser — not optional

1. `preview_start` with `{name: "dev"}` (the config is in `.claude/launch.json`,
   port 3005). **Never run the dev server through Bash.**
2. Navigate to a page that actually exercises your change — a real chapter slide
   for renderer work, `/` for landing work.
3. `read_console_messages` and `preview_logs` for errors.
4. `read_page` for structure and the accessibility tree; `javascript_tool` for
   computed CSS values when the issue is about contrast or tokens.
5. `resize_window` for mobile/desktop and for `prefers-color-scheme` when theming
   is involved.
6. Screenshot the result for visual changes.

**Measure, don't estimate.** Contrast values get computed on the rendered page and
quoted. a11y claims get checked against the real accessibility tree. "Looks right"
is not evidence.

## Report back with

- What you changed, file by file
- **The exact `npm run build` and `npm run lint` output status** (paste failures)
- Each acceptance criterion from the issue → met / not met / not verifiable, one
  line each
- What you verified in the browser and how (URL, what you observed)
- Anything you deliberately left out of scope
- Any place the issue was **wrong** — a moved file, drifted line numbers, a fix
  that does not work as described. A wrong issue is a finding, not an obstacle to
  route around.
