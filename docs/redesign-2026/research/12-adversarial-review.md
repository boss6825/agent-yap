# 12 — Adversarial Review

> The job of this document is to find where the rest of this plan is wrong.
> Default to skepticism. Reports 01–11 are the case for; this is the case against.

---

## 1. Contradictions between reports, and the ruling

### C1 — How many onboarding questions?

- **Report 04 §Part 5:** four questions plus a 6-item calibration placed *between*
  the visitor and their first reading.
- **Report 08 §0.2:** two questions, calibration offered *after* the plan.

**Ruling: 08 wins**, and it wins using 04's own evidence. 04 established that
Duolingo's 38 screens survive only because each answer visibly changes the next
screen, and that Brilliant deliberately shows value before any wall. 04's own Q4
("how long do you have?") changes nothing on the next screen, and its Q3 puts a
90-second test in front of the reward. Two questions × five goals × three levels
already yields 15 distinct paths. **Adopt two.**

### C2 — Does per-template visual identity exist?

- **Report 06 §3-R2:** one duotone colourway per flow template, so each learner
  feels "this variant is mine".
- **Report 08 §0.2:** duotone appears on exactly one screen, never as ongoing
  chrome.

**Ruling: 08 wins**, again on 06's own rule. 06 §4 bans imagery on assessment
surfaces; two of the five templates (`interview`, `debug`) are assessment-first, so
their primary surface cannot legally carry the duotone. Identity carried by chrome
would work for three templates and break for two. **Identity comes from structure —
which surface you land on. Colour confirms; it never informs.**

### C3 — Is cross-book navigation a scaling wall or an argument for personalization?

- **Report 02 §3.5:** the nav manifest is 105 KB today and ~820 KB at 8 books —
  a hard architectural wall.
- **Report 08 §6.4:** a path is bounded (≤340 slides) while a corpus is not, so
  path mode is *cheaper* than today.

**Ruling: both are right and they are not in conflict.** 02 measures the current
architecture; 08 proposes a different one. But note the ordering consequence: the
manifest is *already* embedded twice in all 199 pages (`content.ts:357` and `:363`).
**That duplication must be fixed before the first wiring PR**, or wiring books
looks like the redesign caused a payload regression it merely exposed.

### C4 — Ship `choice` first or `trace` first?

- **Report 04 §Part 4:** M2 trace debugging ranks #1 — "build first".
- **Report 07 §8:** ship `choice` first; `trace` second.

**Ruling: 07 wins on sequencing, 04 wins on importance.** `trace` is the
differentiator; `choice` is 485 items that already exist and a bug fix away from
rendering. Shipping `choice` first proves the entire pipeline for the price of one
renderer. But do not let "second" become "someday" — **twelve traces is the
difference between a quiz site and this product.**

### C5 — Does `/practice` exist in v1?

- **Report 07 §5:** yes, designed in detail.
- **Report 10 §6:** cut it; inline checks only.

**Ruling: 10 wins for v1.** A practice destination is a hypothesis about behaviour
we have no evidence for. Inline checks are the value; the index is a convenience.
`/practice/[checkId]` should still exist, because it is the shareable unit and it
costs almost nothing once checks are data. **The index page is what waits.**

### C6 — Does the plan violate the "no server-side progress" non-goal?

Not for grading — everything grades in the browser. But **report 03 found a
contradiction that exists today, before any of this work**: invariant
P-READER-002 says no progress data is ever transmitted over the network, and
CR-2026-010's analytics plan wants to send chapter-completion events. That fight is
already on the table. **Resolve it before assessment ships**, or the assessment
layer inherits an argument it did not start.

---

## 2. Minimalism audit: KEEP / CUT / DEFER

The founder's bar is "it should feel like nothing." The site today has **two**
surfaces a user can be on: the landing page and the reader. The full plan proposes
**nine**. That is the single most important finding in this document.

| Surface / feature | Verdict | Reasoning |
|---|---|---|
| Fix `rehype-raw` → 490 answers render | **KEEP** | A bug fix. Zero new surface, 490 answers appear. |
| Link resolver → 324 broken links | **KEEP** | Bug fix. Same component. |
| `## Review` → structured `questions[]` | **KEEP** | Deletes the 71-slide long tail of 2,000-word slides. Better reading *and* the assessment unlock, in one change. |
| `book.featured` | **KEEP** | Prevents a silent landing-page swap. Non-optional. |
| Wire the 4 dormant books + harness book | **KEEP** | 298 slides for renames. Best ratio in the repo. |
| Inline `choice` checks in the reader | **KEEP** | The core product change. No new surface. |
| Inline `trace` checks (12) | **KEEP** | The differentiator. Same surface. |
| `/start` two-question onboarding | **KEEP** | 21 static pages, two taps, no client state. Genuinely cheap. |
| `/modules` map | **KEEP** | Replaces the landing card grid, which does not survive 8 books. Net-zero surface. |
| `card` deck from 187 glossary terms | **DEFER** | 337 items for a script — but it is a *fourth* interaction model. Ship after `trace`. |
| `/path` progress page | **DEFER** | Merge into `/modules` as one line at the top until someone asks for it. |
| `/review` as a route | **CUT** | One line — "6 due" — on `/modules`. A route for a queue of six items is a route too many. |
| `/practice` index | **DEFER** | See C5. |
| `budget` widget | **DEFER** | The only bespoke widget. Build it when there is an audience. |
| `order`, `predict`, `spot`, `cloze` | **DEFER** | Four more interaction models. `spot` alone needs a span-click renderer. |
| Five templates | **CUT to three** | `foundations` (the no-profile default), `debug`, `ship`. `interview` and `current` are real audiences but three genuinely different products is already ambitious. |
| `/check` 6-item placement | **DEFER** | The plan is good and the value is real, but self-report already produces 15 paths. Placement is an optimisation on a system that does not exist yet. |
| Seeded procedural marks | **KEEP** | Pure function of module id, zero bytes, zero curation. Solves per-module identity permanently. |
| `--module-h` OKLCH accent | **KEEP** | One variable. Also fixes the existing fracture where the ambient shader is orange behind a blue accent. |
| Reduce to three photographs | **KEEP** | The founder's actual complaint. Costs nothing. |
| Certificates | **CUT** | A certificate for a self-graded localStorage result is worth nothing and cheapens everything near it. |
| Streaks / XP / leaderboards | **CUT permanently** | Evidence in report 04 Part 2 is decisive. |
| MCP server | **KEEP as a separate track** | ~300 lines, off the critical path, highest ceiling in report 10. Do not let it block the assessment layer, and do not let the assessment layer block it. |
| Argument maps | **KEEP** | Content already written in `content/multi-agent/`. Three pages. |
| Trace Gym | **DEFER** | Needs the trace renderer plus 30 authored traces. Right after `trace` lands. |
| Accounts, sync, LLM judge, code sandbox | **CUT** | Each is a different product. |

**The honest minimum — five things, in order:**

1. `Markdown.tsx`: `rehype-raw` + link resolver. *(490 answers, 324 links, one afternoon.)*
2. The one `content.ts` PR: frontmatter · `featured` · `Review → questions[]` ·
   `###` sub-split · de-duplicate the manifest.
3. Wire the five dormant books. *(+298 slides.)*
4. Inline `choice` checks, then 12 `trace` checks.
5. `/start` (two questions, three templates) + `/modules`.

That is a complete, coherent product. Everything else in reports 07–11 is an
enhancement to it, and every enhancement should be earned by evidence.

---

## 3. The hard questions, answered directly

### 3.1 Is "LeetCode for agentic AI" the right analogy at all?

**Partly. The analogy is right about the *need* and wrong about the *shape*, and
following it literally would be a mistake.**

LeetCode is: a huge bank of self-contained problems, an objective oracle,
difficulty tiers, a solved counter, and grinding as the intended behaviour. Of
those five, exactly one transfers — the problem bank. There is no oracle for
judgment questions; difficulty tiers produce difficulty-shopping; the solved
counter is the vanity metric report 04 found most criticised; and grinding is the
behaviour the anti-LeetCode movement (Grind-75, the Ebbinghaus critique) formed
specifically to reject.

**The better analogy is a flight simulator, and specifically the instrument-failure
scenario.** You are handed a situation, you read the instruments, you say what is
wrong, and you find out immediately whether you were right. That is exactly what
report 07's `trace` type is, it is the pedagogy of the most respected paid course
in this space, and it is the actual job.

**What survives from LeetCode:** the bank, the instant verdict, the deep-linkable
single problem. **What must be dropped:** volume-as-progress, difficulty tabs,
solved counts, ranking, and the treadmill framing. If "LeetCode for agentic AI" is
used externally as a positioning line, that is fine — it is legible. Internally it
should be *"a trace-reading gym"*, because that is what will actually get built.

### 3.2 Does agentic AI have enough objectively-gradable material?

**Yes, and the evidence is stronger than expected.** Three independent proofs:

1. **485 questions already exist on disk**, authored by this team, with distractors
   and explanations. The empirical question is answered: someone already wrote
   nearly 500 gradable items about this material.
2. **Anthropic grades agentic-AI competence with multiple choice** — all four
   certification exams, 720/1000 to pass. The ceiling is high enough.
3. **The reframe is sound.** Authoring the artefact (trace, budget, schema, log)
   pins the answer without removing the judgment. Report 04 enumerates eighteen
   distinct deterministic mechanisms; report 07 ships ten.

**Where it is genuinely thin:** open-ended design ("architect an agent for this
requirement") is not gradable without a human, and that is the highest-value skill.
The honest position: this product can verify that you *recognise* good and bad
design. It cannot verify that you can *produce* it. **Say that out loud on the
site.** The credibility cost of overclaiming here is much higher than the marketing
benefit.

### 3.3 Is the bottleneck UX, or content?

**Neither. It is the renderer, and this is the most important finding in the whole
research set.**

The evidence from report 01, all verified rather than assumed:

| Content feature | Count | Renders today? |
|---|---|---|
| `<details>` answer spoilers | **490** | ❌ no `rehype-raw` |
| Relative `.md` links | **324** across 47 files | ❌ 404 |
| Mermaid diagrams | **33** | ❌ renders as code |
| Slides that exist but are unreachable | **431** | ❌ discovery rule |

**Three of six content features in this repo do not come out the other end of the
pipeline.** The founder's stated problem — "excellent reading material and zero
assessment" — is *factually incorrect*. There are 490 assessment items. They are
invisible because of a missing rehype plugin.

This reframes the whole project. It is not "build an assessment product". It is
**"finish shipping the product that is already written"**, and then build an
assessment product on top of the 490 items that appear when you do.

**Is content volume a problem?** No — 196,509 teachable words exist and 75% are
unreachable. **Is content *quality* a problem?** In three specific places, yes:

- **Voice inconsistency.** `chapter-03-tool-design.md` contains
  "(i couldn't find a better word🥲)" and ":-P" in an H2. That reads as sloppy
  against a calm cinematic UI, and it is in the flagship book.
- **Verified gaps that undermine the product's own claim.** `golden set` 0,
  `OpenTelemetry` 0 — a site that cannot teach evals cannot credibly claim to grade
  you. `rerank` **0** inside a 57-slide RAG module. `PII` 0, `DPDP` 0 for an India-based
  team.
- **`debug` template readiness is red** (report 08 §4.3). The most differentiated
  template has the least content behind it.

### 3.4 What will realistically get built?

For a small team with no test runner, no auth, and AI coding agents doing the work:

**Will ship and hold:** the `Markdown.tsx` fixes, the book wiring, the `content.ts`
frontmatter PR, `choice` checks inline, `/start`. All are bounded, mechanical, and
verifiable by `npm run build`.

**Will ship and rot:** `/practice` filters, `/path`, `/review`, the placement
diagnostic. Surfaces whose value depends on data that does not exist yet do not get
maintained.

**Will be half-finished and visible:** the exercise type family. Ten types is
tempting because each is individually easy; the failure mode is four types shipped,
three half-rendered, and an inconsistent interaction model across them. **Cap v1 at
two types and enforce it.**

**Will not get built:** `spot` (needs a span-click renderer), `budget` (bespoke
widget), the credential, anything needing accounts.

**The specific execution risk nobody has named:** `src/lib/content.ts` is
exclusive-access and needs a lane handshake. The plan puts *five* changes in one PR
to spend that handshake once. If that PR is split, or stalls, **everything
downstream stalls with it** — checks, modules, frontmatter, slide-length fixes, the
`featured` flag. That PR is the critical path and the single point of failure.

---

## 4. What kills this in six months

| Failure mode | Leading indicator |
|---|---|
| **Nine surfaces, none finished.** The plan's surface count triples and each is 70% done. The site stops feeling minimal, which was the only differentiator. | More than three new routes shipped before 100 checks are live. |
| **The `content.ts` PR stalls.** Everything blocks behind one exclusive-access change. | That PR open more than two weeks. |
| **Harvested questions turn out to be weak.** 485 items written as end-of-chapter review may not survive as calibrated assessment. Harvest-all becomes harvest-and-rewrite — a different project. | A read of 30 sampled items finds >20% with a giveaway distractor. |
| **Assessment ships on a corpus with verified credibility gaps.** Being graded on evals by a site with zero eval content is the kind of thing a single HN comment ends. | `golden set` still 0 when the assessment layer launches. |
| **Personalization with three templates but content for one.** `debug` is red on content and it is the most differentiated. Shipping it hollow is worse than not shipping it. | The `debug` symptom index has fewer than 10 of its 14 symptoms backed by real content. |
| **Twelve traces never get authored.** `choice` ships, feels like a quiz site, `trace` slips, and the product ends up as "a textbook with a quiz" — which is DeepLearning.AI's position, competing on content quality forever. | Four weeks after `choice` ships with zero traces authored. |
| **The pre-existing a11y and perf debt gets attributed to the redesign.** Zero `focus-visible` in a keyboard-driven assessment product; 14.7 MB of hero JPEGs; contrast failures at 2.36:1. | The focus-ring fix not landing in the same release as the first check. |

---

## 5. Three things I would change about the plan as written

1. **Stop calling it "LeetCode for agentic AI" internally.** It imports the wrong
   mental model and every debate about difficulty tiers and problem counts traces
   back to it. Call it the trace gym.
2. **Make the founder read 30 of the 485 harvested questions before anything is
   built on them.** The entire v1 inventory rests on their quality and nobody has
   checked. That is a one-hour task gating months of work.
3. **Commission the evals chapter before the assessment layer launches, not after.**
   `golden set` 0 and `OpenTelemetry` 0 in a product whose pitch is
   "we'll evaluate you" is the single most quotable weakness in this plan.
