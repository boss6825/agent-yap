# Coding brief — standing instructions for a coding agent

> **Read this file once at the start of every session.** It tells you where the
> plan lives, what order the work happens in, and where you must stop. It does
> **not** replace `AGENTS.md` — that is still the law. This is the map plus the
> queue.
>
> Work is tracked in Linear: workspace `Solanki`, team `SOL`, project **Agent YAP**
> → https://linear.app/solanki/project/agent-yap-00f602c9da5b

---

## 0. The one rule that matters most

**You work ONE Linear issue per session.** Not a milestone. Not "M0". One issue.

Each issue body already contains its own Goal / Files / Source / Acceptance /
Agent brief / Out of scope. That body is your spec. If you find yourself editing
files that the issue's **Files** section does not name, stop and say so — either
the issue is wrong (say how) or you have drifted (stop drifting).

Reason: this repo has no test runner. The only gate is `npm run build` (which
type-checks *and* statically generates every slide) plus `npm run lint`. A session
that changes forty files across six concerns cannot be verified by that gate, and
cannot be reviewed.

---

## 1. Read before writing any code

Mandatory, in this order. Do not skip and do not skim:

| Order | File | Why |
|---|---|---|
| 1 | `AGENTS.md` | Lanes, the stack caveat, the frontend design workflow. **This is the law.** |
| 2 | `CLAUDE.md` | Change-tier router + navigation |
| 3 | `.claude/rules/stack.md`, `.claude/rules/docs.md` | Stack + docs rules |
| 4 | the Linear issue you are working | Your actual spec |
| 5 | whatever the issue's **Source** section names | The evidence behind the issue |

⚠️ **This is not the Next.js you know.** Next 16 / React 19 / Tailwind v4, with
breaking changes from training data. Read `node_modules/next/dist/docs/` or use
the `find-docs` skill **before** writing code. If a tool or MCP server is
unavailable, say so — never silently fall back to training data and present it as
current.

---

## 2. Where everything lives

### The plan (why the work exists)

| What | Path |
|---|---|
| **Master plan** — the whole thesis, §1–§12 | `docs/redesign-2026/00-MASTER-PLAN.md` |
| Content inventory · per-folder audit · 20-module taxonomy | `docs/redesign-2026/research/01-content-inventory.md` |
| **Code + UX audit** — every route, token, and debt item with `file:line` | `docs/redesign-2026/research/02-code-ux-audit.md` |
| Prior decisions ledger | `docs/redesign-2026/research/03-prior-decisions.md` |
| Competitor teardowns — practice (20) · reading (22) | `research/04-competitors-practice.md` · `05-competitors-reading.md` |
| Visual identity — the photo problem, `--module-h`, three-photograph rule | `docs/redesign-2026/research/06-visual-identity.md` |
| **Assessment system** — 10 types, data model, grading, mastery | `docs/redesign-2026/research/07-assessment-system.md` |
| Onboarding + templates, verbatim copy | `docs/redesign-2026/research/08-onboarding-and-templates.md` |
| IA · URL contract · seven user flows | `docs/redesign-2026/research/09-ia-and-flows.md` |
| Independent vision — 15 ideas, business model | `docs/redesign-2026/research/10-independent-vision.md` |
| Design brief + six copy-paste design prompts | `docs/redesign-2026/research/11-claude-design-prompts.md` |
| Adversarial review — KEEP/CUT/DEFER on every feature | `docs/redesign-2026/research/12-adversarial-review.md` |
| Delivery plan — M1–M7 with gates and kill criteria | `docs/redesign-2026/research/13-delivery-plan.md` |
| TUF+ research (the pedagogy source) | `docs/research/tuf-plus-inspiration.md` |

### The specs (what to build)

| # | Path | Milestone |
|---|---|---|
| — | `docs/specs/README.md` — decisions, phasing, the "won't this be a hotch-potch?" answer | — |
| 01 | `docs/specs/01-reading-scaffold-blocks.md` | M5 |
| 02 | `docs/specs/02-basic-advanced-depth.md` | M5 |
| 03 | `docs/specs/03-reader-modes-and-actions.md` | M5 |
| 04 | `docs/specs/04-streaks-and-progress.md` | M7 |
| 05 | `docs/specs/05-study-plan.md` | M7 |
| 06 | `docs/specs/06-notes-and-bookmarks.md` | M7 |
| 07 | `docs/specs/07-quiz-experience.md` | M6 |
| 08 | `docs/specs/08-visual-system.md` | M4 (Paper — **not in scope now**) |
| 99 | `docs/specs/99-deferred-later-iterations.md` — parked, with reasons | — |

### Governance (the gates)

| What | Path |
|---|---|
| Constitution — rules C1–C10 | `specs/CONSTITUTION.md` |
| Workflow / rigor dial | `specs/WORKFLOW.md` |
| **Ship gate G1–G7** | `specs/COMPLIANCE.md` |
| Recorded gate bypasses | `specs/compliance/BYPASSES.md` |
| Feature-spec template | `specs/TEMPLATE.md` |
| ADRs (5 existing) | `specs/decisions/` |
| **Invariant registry (P-IDs)** | `specs/properties/invariants.md` |
| Content conventions | `specs/conventions/content.md` |
| Spec index · progress | `specs/INDEX.md` · `specs/PROGRESS.md` |
| **Shipped truth** | `FEATURE-STATUS.md` |
| Product direction | `plan.md` |
| Architecture explanation | `OVERVIEW.md` |
| ⚠️ API contract (**exclusive-access**, Codex lane) | `docs/api-contract.md` |
| Knowledge layer — modules, flows, concepts, invariants | `knowledge/` |
| Change requests CR-2026-001…014 | `docs/pm/feedback/` |
| PRDs | `docs/pm/prd/` |
| Growth / GTM / SEO / gamification | `docs/growth/` |

### The code

```
content/<book>/          markdown: index.md + chapter-NN-*.md
src/lib/content.ts       parses markdown → books → chapters → slides   ⚠️ EXCLUSIVE-ACCESS
src/lib/search.ts        BM25 full-text search                          (Codex lane)
src/lib/ask.ts           RAG glue → Claude                              (Codex lane)
src/lib/progress.ts      localStorage reading progress
src/lib/art.ts           chapter art lookup  (+ art-manifest.json)
src/lib/display.ts       chapterDisplayTitle etc.
src/lib/fx.ts            scramble + scroll animations
src/lib/site.ts          site metadata
src/lib/chat/            BYOK chat
src/app/                 landing · /read/[book]/[chapter]/[slide] · /api/*
src/components/          Markdown.tsx · Home.tsx · SearchPanel · AskPanel
src/components/reader/   Rail · ReaderChrome · AmbientBackdrop · ChatPanel · ResumePill
src/app/globals.css      ALL design tokens — no raw colors anywhere else
scripts/                 fetch-art.mjs · setup-git-hooks.sh
```

---

## 3. Rules that get broken most often — do not break these

1. **`src/lib/content.ts` and `docs/api-contract.md` are exclusive-access.**
   One agent at a time. Announce before your first edit. If your issue does not
   name them in **Files**, do not touch them — say what you need instead.
2. **Backend lane is off-limits** unless your issue says otherwise:
   `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`, `.env.example`.
3. **The frontend design workflow in `AGENTS.md` is mandatory** for any component
   or page work — triggered by the *type of work*, not by anyone asking for "good
   design". Search shadcn MCP first; if nothing matches, **say** "no shadcn match
   found" before writing custom code. Finish with the Chrome DevTools render
   check, the accessibility pass, and `impeccable`.
4. **No new raw colors.** Everything goes through the tokens in
   `src/app/globals.css`. This is the single rule that keeps the design coherent.
5. **Never fabricate test evidence.** There is no test runner. `/red`, `/prove`,
   and the test sub-step of `/check` run in LITE / N-A mode. Say so; do not invent
   passing tests.
6. **Never fabricate a ship-gate signature** in `specs/features/**/compliance.md`.
7. **`FEATURE-STATUS.md` flips to ✅ only after a code audit** — never because an
   issue closed. 〰️ Partial is an honest state; say what is missing.
8. **Git author is always `boss6825 <arpitsolanki6825@gmail.com>`.** Never an
   agent name. Commit each logical unit as you go (`feat/fix/refactor/docs/chore`).
   Do not push unless asked.
9. **Verify, don't assert.** "Reproduce it first" on Tier-1 fixes. Contrast values
   get measured on the rendered page and quoted. a11y gets checked against the
   real accessibility tree. Slide counts get quoted before and after.

---

## 4. The work order

Paper redesign (**M4** — SOL-30 … SOL-36) is **out of scope**. Skip it entirely.

### Wave 1 — M0, unblocked, start here
| Issue | What | Note |
|---|---|---|
| **SOL-5** | `rehype-raw` → 490 answers appear | **the highest-leverage change in the repo** |
| SOL-6 | relative `.md` link resolver → 324 dead links | same file as SOL-5 — do **after**, not beside |
| SOL-7 | mermaid → 33 diagrams | same file again — serialise |
| *SOL-8* | *you read 30 questions* | **human only. Do not attempt.** |

### Wave 2 — M1, all unblocked, mostly independent
`SOL-9` unbind Space · `SOL-10` global `:focus-visible` · `SOL-11` 2.36:1 contrast ·
`SOL-12` scramble a11y · `SOL-13` cross-book resume · `SOL-14` nav manifest de-dup

⚠️ SOL-10 and SOL-11 both edit the three panel files — serialise them.
⚠️ **SOL-14 touches `content.ts` and must land before SOL-15 starts.**

### Wave 3 — M2, exclusive-access, one branch, one merge
`SOL-15` (parent) → `SOL-16` frontmatter + `featured` · `SOL-17` `## Review` →
`questions[]` · `SOL-18` `###` sub-split · `SOL-19` build-time validation

**All four are commits on ONE branch, merged once.** `npm run build` green at every
commit. This is the single point of failure for everything after it.

### Wave 4 — M3, the payoff: +298 slides
`SOL-20` delete `old docs/` (unblocked, do any time) · `SOL-21` flatten the harness
book (+123) · `SOL-22` rag · `SOL-23` context engineering · `SOL-24` agentic memory
· `SOL-25` multi-agent · `SOL-26` glossary · `SOL-29` art collision · `SOL-27`
frontmatter backfill (last)

Each of SOL-22…25 is: rename `00 - Overview and Reading Order.md` → `index.md`,
rename `Chapter N - X.md` → `chapter-0N-slug.md`, then **grep all of `content/`
and `docs/` for the old filenames and fix every link you just broke.**

### Wave 5 — the epics. Split before you build.
`SOL-37` (M5 pedagogy) · `SOL-38` (M6 assessment) · `SOL-39` (M7 habit) ·
`SOL-40` (M8 distribution + content gaps — **no dependencies, can run any time**)

Each epic body lists the issues it becomes. **Split it into real Linear issues
first, then work them one at a time.** Do not try to implement an epic directly.

---

## 5. Hard stops — stop and ask, do not decide these yourself

| Stop | Why |
|---|---|
| **SOL-8** | Human reading task. Gates M6's entire size. |
| **SOL-28** | `research papers/` attribution — a rights question, not an engineering one. |
| **SOL-38 / M6** | Blocked on SOL-8 *and* two open product decisions (`/practice` in v1? item statistics?). |
| **SOL-39 / M7** | Blocked on Decision 1 — streaks reverse a recorded non-goal and need a `plan.md` amendment + an ADR **first**. |
| **M4 / SOL-30–36** | Paper redesign. Out of scope. |
| **Any invariant in `specs/properties/invariants.md`** | If your change would violate one — in particular **P-READER-002**, "no progress data is ever transmitted" — stop. |
| **A decision the issue does not authorise** | Adding a route, a dependency, a data model, or a stored field the issue does not name. |

---

## 6. The per-issue loop

```
1. Read the Linear issue. Read what its Source section names.
2. Set it to In Progress in Linear.
3. git checkout -b <the issue's gitBranchName from Linear>
4. Build it. Follow the Agent brief. Stay inside the Files list.
5. npm run build && npm run lint      ← both green, no exceptions
6. Verify the acceptance criteria for real (browser / a11y tree / measured values).
7. Commit (feat|fix|refactor|docs|chore: …), author boss6825.
8. Open a PR titled "<type>: <what> (SOL-N)".
      The branch name links it to Linear automatically — do NOT write "Closes #N".
9. Comment on the Linear issue: what you did, what you verified, what you skipped
   and why, plus any acceptance criterion you could NOT meet.
10. Leave the issue In Review. A human moves it to Done after a code audit.
11. STOP. Do not start the next issue.
```

**If you do not have the Linear MCP available:** do steps 1 and 9 by asking the
user to paste the issue body in, and by printing your status comment at the end
for them to paste back. Everything else is unchanged.

**If the build fails:** paste the output. Do not claim success. Do not work around
a type error by loosening a type unless the issue says to.

**If the issue is wrong** — the file moved, the line number drifted, the fix does
not work as described — say so plainly in your Linear comment and stop. A wrong
issue is a finding, not an obstacle to route around.
