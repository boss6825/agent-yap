---
name: yap-content-wiring
description: >-
  Wires dark content folders into live books by renaming files and writing
  `index.md` — the M3 work that lights up 75% of the corpus with no new code.
  TRIGGER for SOL-20 (delete stale `old docs/`), SOL-21 (flatten the harness book
  out of `explained/`), SOL-22 (rag), SOL-23 (context engineering), SOL-24 (agentic
  memory), SOL-25 (multi-agent), SOL-26 (glossary), SOL-27 (frontmatter backfill
  script). Works only under `content/**` plus a script under `scripts/`. DO NOT
  trigger for app code (use yap-reader-fix), for `src/lib/content.ts` (use
  yap-parser), or for authoring new chapter prose.
---

You wire dark content folders into live books. This is the highest-value work in
the repo per hour spent, and it needs **no new application code** — renames, four
`index.md` files, one deletion, and one script.

## The situation

Live today: **1 of 8** content folders — 199 slides, 49,127 words.
On disk and unreachable: **431 slides, 147,382 words = 75% of the library.**

The discovery rule in `src/lib/content.ts` requires **all three** of:
1. a depth-1 directory under `content/`
2. an `index.md` at its root
3. at least one file matching `/^chapter-\d+.*\.md$/` at its root

Seven folders fail it for three different reasons: one is nested a level too deep
(`explained/`), four use `Chapter N - Title.md` naming with no index, one parses as
a single 3,366-word slide, one has no chapters at its root.

**A useful discovery:** each of the four rename-books already contains
`00 - Overview and Reading Order.md` — the index **already exists**. You are
renaming it and lightly reframing it, not writing one from scratch.

## Read these first

| Order | File | Why |
|---|---|---|
| 1 | `docs/CODING-BRIEF.md` | The map, the rules, the per-issue loop |
| 2 | `AGENTS.md` | **The law.** Lanes and the stack caveat |
| 3 | `docs/redesign-2026/research/01-content-inventory.md` | Per-folder audit + exact wiring steps |
| 4 | `docs/redesign-2026/00-MASTER-PLAN.md` §2, §7 (M3), §9 | Why, in what order, and what NOT to build |
| 5 | `specs/conventions/content.md` | Content conventions |
| 6 | `knowledge/invariants/book-discovery.md` | The discovery rule as documented |
| 7 | `.claude/rules/docs.md` | Mermaid-first, repo-root-relative links |

## The plan and spec files

**Master plan:** `docs/redesign-2026/00-MASTER-PLAN.md`

**Research (13):** `docs/redesign-2026/research/01-content-inventory.md` ·
`02-code-ux-audit.md` · `03-prior-decisions.md` · `04-competitors-practice.md` ·
`05-competitors-reading.md` · `06-visual-identity.md` · `07-assessment-system.md` ·
`08-onboarding-and-templates.md` · `09-ia-and-flows.md` ·
`10-independent-vision.md` · `11-claude-design-prompts.md` ·
`12-adversarial-review.md` · `13-delivery-plan.md`

**TUF+ research:** `docs/research/tuf-plus-inspiration.md`

**Specs:** `docs/specs/README.md` · `01-reading-scaffold-blocks.md` ·
`02-basic-advanced-depth.md` · `03-reader-modes-and-actions.md` ·
`04-streaks-and-progress.md` · `05-study-plan.md` · `06-notes-and-bookmarks.md` ·
`07-quiz-experience.md` · `08-visual-system.md` ·
`99-deferred-later-iterations.md`

**Governance:** `specs/CONSTITUTION.md` · `specs/COMPLIANCE.md` ·
`specs/properties/invariants.md` · `FEATURE-STATUS.md` (rows 13–19, 28)

## Hard rules

1. **`git mv`, always** — so history follows the file. Never delete-and-recreate.
2. **The step everyone forgets: fix the links you just broke.** Renaming a file
   breaks every relative `.md` link that pointed at it, from inside this book and
   from other books. **Grep all of `content/` and `docs/` for the old filenames
   before you finish.** The corpus has 324 relative cross-links.
3. **Never touch `src/lib/content.ts`** — exclusive-access, and it belongs to
   yap-parser. If a folder cannot be wired without a parser change, that is a
   finding: report it, do not edit the parser.
4. **`sources/` and `dump/` are not books.** Leave them alone; never let one become
   a chapter.
5. **Slugs become URLs.** Pick short readable ones and list every choice in your
   report. Two of the folders have spaces in their names — decide the slug
   deliberately and check it renders.
6. **`chapterDisplayTitle`** in `src/lib/display.ts` strips an embedded
   "Chapter N:" prefix. Check your renamed chapters don't end up double-prefixed
   or wrongly stripped.
7. **Do not author new chapter prose.** Wiring only. Content gaps (the evals
   chapter, the India-first pass) are M8 and are somebody's deliberate decision.
8. **`FEATURE-STATUS.md` flips to ✅ only after a code audit** — never just because
   a rename landed. 〰️ Partial is honest.
9. **Before deleting anything** (SOL-20), diff each file against its live
   counterpart and report what was unique. Deleting a human's writing needs "here
   is what I checked" in the report, not just the removal.
10. Git author is always `boss6825 <arpitsolanki6825@gmail.com>`. Do not push
    unless told to.

## The landmine you must not step on

`getPrimaryBook()` returns `books[0]` — **alphabetically first**. Both `/` and
`/read` call it. The moment `agentic memory/` is wired it sorts ahead of
`architecture-and-system-design/` and **the landing page silently becomes a
different book.** No error, no 404, just the wrong front door.

So: **SOL-16 (`featured: true`) must already be merged before you wire any book**,
and after wiring you **explicitly verify `/` and `/read` still land on Architecture
& System Design.** State that check in your report.

## Verify

- `npm run build` + `npm run lint` green (the build statically generates every
  slide, so a malformed book fails loudly — that is the point)
- `preview_start` with `{name: "dev"}` (port 3005; **never** run the dev server via
  Bash), then open the newly wired book and page through it. Confirm chapter count,
  chapter titles, and that the rail renders.
- Quote the actual slide count. Do not repeat the estimate from the issue.
- Check the landing page still features the right book.

## Report back with

- Every rename, old → new, and every slug you chose
- The actual slide count and chapter count for the book you wired
- Every link you found pointing at an old filename, and that you fixed it
- `npm run build` / `npm run lint` status (paste any failure)
- Confirmation that `/` and `/read` still land on the featured book
- Any chapter-slug collision with an existing book (`getChapterArt` keys on
  `chapterSlug` alone, so a collision shows the **wrong painting** — SOL-29)
- Anything that could not be wired without a parser change
