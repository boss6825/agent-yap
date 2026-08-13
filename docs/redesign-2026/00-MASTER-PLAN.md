# Agent YAP 2026 — Master Plan

> **From "a well-written book about agents" to "the place you find out whether you
> actually understand agents."**
>
> Branch: `feature/learning-platform-v2`. Nothing on `main` is touched. Research
> artifacts: `docs/redesign-2026/research/01`–`13`.
> Written 2026-08-03.

---

## 1. The finding that changes the whole project

The premise we started from was: *"we have the content, the teaching level, and
what people need to learn — but we have nothing that lets a user evaluate
themselves."*

**The first half is right. The second half is factually wrong, and that is good
news.**

| What is on disk | Count | Renders on the live site? |
|---|---|---|
| Multiple-choice questions with distractors + written answers | **490** | ❌ — `Markdown.tsx` has no `rehype-raw`, so every `<details><summary>Answer</summary>` node is silently dropped |
| Coding challenges with solutions | 3 | ❌ same |
| `Code MVP` build exercises | 15 | rendered as plain code, no exercise framing |
| Glossary term definitions | 187 | 2 of 5 files render as one giant slide |
| Relative `.md` cross-links | **324** across 47 files | ❌ 404 |
| Mermaid diagrams | **33** | ❌ render as syntax-guessed code |
| Slides that exist but are unreachable | **431** of 630 | ❌ discovery rule |

**Three of six content features in this repo do not come out the other end of the
pipeline.** There are already 490 assessment items — more than Anthropic's own
Architect certification exam has (60). They are invisible because of a missing
rehype plugin.

So this is not "build an assessment product from scratch." It is:

1. **Finish shipping the product that is already written** (a renderer fix and 40
   file renames), then
2. **Build the assessment layer on the 490 items that appear when you do.**

That reordering is worth roughly three months.

---

## 2. Where the project actually stands

**Live:** 1 of 8 content folders. 199 slides. 49,127 words.
**On disk and unreachable:** 431 slides, 147,382 words — **75% of the library.**

The discovery rule in `src/lib/content.ts` requires all three of: a depth-1
directory under `content/`, an `index.md` at its root, and at least one file
matching `/^chapter-\d+.*\.md$/` at its root. Seven folders fail it, for three
different reasons:

| Folder | Slides waiting | Why it is dark |
|---|---|---|
| `building coding agents and harnesses/` | **123** | Perfectly formed — one directory too deep, inside `explained/` |
| `multi-agent/` | 50 | Files named `Chapter 1 - X.md`; no `index.md` |
| `agentic memory/` | 49 | same |
| `rag/` | 39 | same |
| `context engineering/` | 37 | same |
| `research papers/` (3 sub-books) | 132 | `index.md` exists, no chapters at root; 33 mermaid diagrams would ship broken |
| `glossary/` | 1 → 187 cards | 49 `###` and zero `##` — would parse as one 3,366-word slide |

**And a landmine:** `getPrimaryBook()` returns `books[0]` — alphabetically first.
Both `/` and `/read` call it. The moment `agentic-memory/` is wired it sorts before
`architecture-and-system-design/` and **the landing page silently becomes a
different book.** Fix with `featured: true` in `index.md` frontmatter, in the same
PR as the first wiring.

**Structurally, the site is single-book wearing a multi-book URL scheme.** `/read`
and `/read/[book]` are both bare redirects; `/read/[book]/[chapter]` 404s. Three
levels of hierarchy exist and none of them render anything. The landing page's
18-chapter card grid is ~5,000px of scroll today and ~38,000px at full corpus.

---

## 3. The product thesis

**What is defensible, ranked:**

1. **A verdict.** *"You think you understand context engineering. Here are eleven
   traces. You got four."* No LLM will tell you that you are wrong about yourself.
2. **A corpus that is complete and opinionated** — not "articles about agents" but
   "the twenty things, in order, with the arguments on both sides."
3. **Being the source other agents cite.** Nobody is doing this and this project is
   unusually well-placed for it.

**What is not defensible:** well-written text about agents. Not because the writing
is weak — 196,509 teachable words at this quality is a real asset — but because
DeepLearning.AI already occupies that exact position (excellent content, zero
assessment), and holding it means competing on content quality forever, against
Andrew Ng.

### 3.1 Why "LeetCode for agentic AI" is the right instinct and the wrong blueprint

LeetCode works because of **one** property: a total, cheap, instant oracle.
`f(input) == expected` decides in under a second and cannot be argued with.
Everything else — ratings, streaks, contests — is downstream of that oracle.

Agentic AI has no such oracle for its central questions. "Should this go in the
window?" "One agent or three?" are judgment calls. Three escape routes, all closed:
running the agent is non-deterministic and costs money per attempt; an LLM judge
agrees with humans at κ≈0.64 on borderline answers, which is a learner-quitting
rate; peer review needs auth and a community.

**The reframe that unlocks everything: move the non-determinism from the answer
into the question.**

Do not ask *"what would you do?"* — unbounded, ungradeable. **Author the artefact**
— the trace, the token budget, the tool schema, the log, the config — and ask a
question whose answer is pinned by the artefact you wrote. The learner still
exercises judgment; they exercise it inside a stated frame where exactly one answer
survives the constraints.

This is also, not coincidentally, **the actual job.** AI engineering is mostly
reading traces and deciding what to change.

**So the internal name for this product is not "LeetCode for agentic AI." It is a
trace-reading gym.** Of LeetCode's five defining features, exactly one transfers
(the problem bank). Difficulty tabs produce difficulty-shopping; solved counts are
the vanity metric its own community now rejects; grinding is the behaviour Grind-75
formed to reject.

Use the LeetCode line externally if it is legible to people. Never let it drive a
design decision.

### 3.2 Three facts that de-risk this

- **Anthropic grades agentic-AI competence with multiple choice.** All four Claude
  certification exams: MCQ and multiple-response, 120 minutes, 720/1000 to pass.
  Only the Architect exam is scenario-based. The organisation with the deepest
  knowledge of this subject chose MCQ. The ceiling is high enough.
- **Their gate leaves the market wide open.** Those exams require a company email
  tied to a Claude Partner Network org. **There is no free, open, self-serve way to
  find out whether you actually know this.**
- **The only direct competitor took the expensive path.** AgenticPrep.io: 43
  Python problems, 8 tracks, a test runner. Their own scoring language — "respects
  MAX_STEPS", "validate tool schema" — admits the interesting assertions are
  *behavioural properties of a trace*, not return values. **We can assert those on
  an authored trace with zero execution**, which is 80% of the field they cannot
  reach without a sandbox.

---

## 4. The assessment system, in one page

Ten exercise types, three renderers, no server, no accounts, no sandbox.
Full design: [research/07-assessment-system.md](research/07-assessment-system.md).

| Type | Interaction | Graded by | v1? |
|---|---|---|---|
| `choice` | pick 1 of 4, distractors mined from real production failures | index equality | ✅ **485 exist** |
| `trace` | **click the first step where the run went wrong**, then say why | step index, then taxonomy label | ✅ 12 authored |
| `classify` | label a failure from a 16-label taxonomy | label equality | ✅ |
| `number` | cost/latency arithmetic | `\|a−e\| ≤ tolerance` | ✅ |
| `cloze` | blank the load-bearing token out of a real artefact | normalised set match | ✅ |
| `card` | reveal → knew it / didn't / skip | **not graded — self-report** | ✅ |
| `budget` | toggle items against a token budget, live counter | required ∧ ≤budget ∧ relevance≥θ | later |
| `order` · `predict` · `spot` | sequence · simulate the loop · click the defect | permutation · integers · precision/recall | later |

**`trace` is the flagship.** It is impossible on LeetCode, it is literally the
pedagogy of the most respected paid course in this space (Maven's *AI Evals for
Engineers* — "here is a broken agent, find the break"), and it renders as a
scrollable list with a click target. No new UI vocabulary.

**`choice` ships first anyway** — because 485 of them already exist and the blocking
work is a bug fix, so it proves the whole pipeline (parse → generate → render →
grade → persist → mastery) for the price of one renderer.

**Progress model — three surfaces, no more:** a mastery map (0–3 dots per module,
from graded checks only), a review queue (a 6-rung ladder now, FSRS when there is
data to fit it), and resume (already shipped).

**Permanently refused:** streaks, XP, gems, leagues, leaderboards, certificates for
attendance, LLM-judged free text, a code sandbox, and any global
percentage-of-corpus — with 431 slides about to be wired, that is a number that
*goes down when we ship*.

**Anti-frustration, because this is where learning products die:** a wrong answer
shows the full explanation including why each distractor was tempting; retry is
unlimited; Hint and Reveal exist but mark the attempt `assisted` (scaffolding that
is always free is always used — Codecademy's tutorial-hell failure); and **a wrong
answer never blocks progress.** Free-course completion runs 5–15% and 50% of
dropout happens in the first two weeks. A gate at slide 6 of module 1 is a wall.

---

## 5. The user journey

Full flows and diagrams: [research/09-ia-and-flows.md](research/09-ia-and-flows.md).
Onboarding detail: [research/08-onboarding-and-templates.md](research/08-onboarding-and-templates.md).

### 5.1 Onboarding: two questions, nine seconds, twenty-one static pages

**Not a wizard.** Ordinary pages linked by ordinary links. No modal, no step
machine, no progress dots, no Back button of ours — the browser's Back button is the
Back button and **the URL is the state**. `/start/ship/shipped` is shareable,
cacheable, crawlable, and debuggable by pasting a URL. Zero client JS until the
final tap.

```
/start                    "What brings you here?"          5 one-line links
/start/[goal]             "Which sounds most like you?"    3 self-descriptions
/start/[goal]/[level]     THE PLAN + one button            5 × 3 = 15 paths
```

Never the words *beginner / intermediate / advanced*. Concrete self-descriptions
instead: *"I've called an LLM API"* · *"I've shipped something with tool calls and it
broke in ways I didn't expect"* · *"I run agents in production and argue about eval
harnesses."*

The third screen is the reward, and it must state the consequence concretely:

> **Skipping 9 chapters you already know. Starting you at Context Engineering →
> Compaction.**

Duolingo's 38-screen onboarding survives only because each answer visibly changes
the next screen. That is the whole trick, and it is why the fourth question ("how
long do you have?") was cut — it changes nothing on the next screen.

### 5.2 The templates: three, not five, for v1

Report 08 designed five. Report 12 cuts to three, because three genuinely different
products is already ambitious and two of the five have thin content behind them.

| Template | Who | Read : practice | Shape | Done means |
|---|---|---|---|---|
| **`foundations`** | curious, no deadline — **and every visitor who never onboards** | 4 : 1 | 14 modules in DAG order, ~340 slides, one chapter per sitting | the capstone |
| **`debug`** | *"something I built is broken"* — the modal visitor | 1 : 2 | **no path at all.** A 14-line symptom index in the learner's own words → one card → the fix | *they don't come back today* |
| **`ship`** | building against a deadline | 3 : 1 | modules in **build order**, not pedagogical order | can defend the design in review |

`debug` is the most differentiated of the five and the one with the least content
behind it — which makes it the one to *commission content for*, not the one to skip.

**Deferred:** `interview` (1:4, a question product with reading as remediation) and
`current` (one card, five minutes, once — for the staff engineer who will never read
340 slides).

**The templates are invisible machinery.** The learner never sees the word
"template", never sees a persona name. They see their own answer echoed back and a
plan.

### 5.3 The two flows that matter most, because they are the majority

**Deep link from Google.** The prose appears immediately. No interstitial, no modal,
no banner. The *only* new element versus today is one dismissable line of 14px text
below the prose, shown **once, ever**: *"Reading about memory? There's a path through
this."* Dismissing is permanent. Onboarding must never be a gate — Google traffic is
most of the arrivals.

**"I just want to look something up."** `⌘K` → the thing → they leave. No path
offer, no nudge, no related-modules block. **Success is a successful departure.**
That is a returning user next month.

**And a rule with teeth: nothing in the UI ever says "you haven't onboarded."** No
banner, no empty state, no dashed placeholder box. A visitor with no profile is a
first-class user on the `foundations` default.

### 5.4 Navigation at 20 modules: path first, tree on demand

Rejected: **one deep tree** (a 59-chapter accordion treats all 630 slides as equally
relevant — a maze with a scrollbar) and **search-only** (a palette is a precision
instrument; it cannot answer "what should I learn next", which is the whole product).

Chosen: the rail shows **your path**, flat, ~14 rows, with `Browse all →` as the
last row. The tree still exists, one click away. Plus `⌘K` for precision, a
plain-text three-level breadcrumb for orientation, and arrow keys (already shipped)
documented by a `?` overlay.

**A counter-intuitive consequence: personalization makes the site cheaper.** The nav
manifest is 105 KB today and would be ~820 KB per page at 8 books. A *path* is
bounded (≤340 slides ≈ 45 KB); a *corpus* is not.

---

## 6. The visual answer: keep the vibe, retire the repetition

Full recipes: [research/06-visual-identity.md](research/06-visual-identity.md).

The photographs are not the problem. **Their density and their role are.** One
mountain photo appears **twice** on the landing page; the site's imagery vocabulary
is two files, so every visit reuses the same two impressions and by the fourth visit
they read as furniture. That is a structural defect, not a taste failure.

### The three-photograph rule

1. At most **three** photographs exist on the entire site, and **each appears once**.
2. Permitted only on: the landing hero, one mid-page interstitial, the closing CTA.
3. **No photography on any reading, exercise, or progress surface.** Not faint, not
   blurred, not at 8% opacity.
4. Where a surface needs differentiation: surface lift (`canvas` → `canvas-2`),
   hairline weight, type scale. Nothing else.

### Twenty modules, zero image assets

Per-module identity comes from a **seeded procedural mark** — a small monochrome
figure (contour lines, concentric arcs, a sparse grid) generated as a **pure
function of the module id**. GitHub identicons with a higher aesthetic ceiling.
Adding module 21 touches no manifest, no script, no `public/` directory, and cannot
return an ugly or licence-risky result.

Rejected alternatives, with reasons: extending the Met CC0 pipeline (18 chapters ×
148 KB of committed binaries, a network dependency in the content pipeline, and
nobody has judged whether a returned tapestry fragment reads well at 320×200);
duotone variants of the founder's photos at 20 (past ~6 the viewer stops seeing
twenty places and starts seeing *one photo with a filter wheel* — worse repetition,
because now the mechanism is the repetition).

**The founder's photographs still get used** — as texture and as an extreme crop with
a changed role, and duotone survives in exactly one place: the onboarding plan
screen, five colourways for five templates, which is under the threshold where the
trick becomes visible.

### One variable for twenty identities

`--module-h`, an OKLCH hue rotated in a constrained arc around the brand blue. Same
lightness, same chroma, hue only. Twenty points in a 140° band means ~4° gaps, below
the just-noticeable difference — **and that is fine**, because you never choose
between twenty modules on colour. Geometry carries recognition; hue carries family.

Linear proves the principle: one accent (lavender `#5e6ad2`), gradients explicitly
forbidden, hierarchy carried by a four-step charcoal surface ladder. **Density of the
accent is the design, not the accent.** Cap it at ~2% of pixels.

This also fixes an existing fracture: `AmbientBackdrop.tsx:17`'s dark palette is
warm orange (`#ffc96b`, `#ff6200`, `#ff2f00`) sitting behind a blue accent. Derive
it from `--module-h` and the ambient layer starts reinforcing identity instead of
contradicting the brand.

**19 of 22 minimal technical reading sites surveyed use zero decorative
photography.** The restraint is the differentiator.

---

## 7. What to build, in order

Full plan with gates and kill criteria: [research/13-delivery-plan.md](research/13-delivery-plan.md).

### Week 1 — one file, enormous payoff

`src/components/Markdown.tsx`: add `rehype-raw` (**490 answers appear**), a link
resolver in the existing `a()` override (**324 links fixed**), and mermaid (**33
diagrams**). A bug fix, not a feature. It de-risks the largest assumption in the plan
by making it observable in a browser before any assessment code exists.

**In parallel, one human task: read 30 of the 485 harvested questions.** They were
written as end-of-chapter review, not as calibrated assessment items, and the entire
v1 inventory rests on their quality. Nobody has checked. One hour, gating months.

### Then

| M | What | Why it is here |
|---|---|---|
| **M1** | Defuse landmines: de-duplicate the nav manifest (embedded **twice** in all 199 pages), unbind `Space` (it fights the scroll container), fix cross-book resume, add a global `:focus-visible` ring (there is **zero** in the codebase), fix 2.36:1 contrast, `aria-hidden` the scramble animation (screen readers currently read gibberish) | An assessment product is keyboard-driven. This debt would be blamed on the redesign. |
| **M2** | **The one `content.ts` PR** — frontmatter · `featured` · `## Review` → `questions[]` · `###` sub-splitting · build-time validation | ⚠ **Exclusive-access, needs a lane handshake, and it is the single point of failure for everything downstream.** Five changes, one handshake. Also deletes the 71-slide tail of 2,000-word Review slides. |
| **M3** | Wire five books: delete `old docs/` (32,829 stale duplicate words), flatten the harness book (+123), rename four books + write 4 `index.md` (+175), script-backfill frontmatter on 87 files | **+298 slides, no new code.** Largest single improvement available. |
| **M4** | `choice` checks inline: `checks.ts` + `grade.ts` + `mastery.ts` + one options renderer + the harvest script | 485 questions live, graded instantly. The site becomes an assessment product. |
| **M5** | `trace` checks: the trace renderer, the two-stage answer, the 16-label taxonomy, **12 hand-authored traces** | The differentiator. Do not ship a bad trace — it teaches a wrong lesson. |
| **M6** | `modules.json` + `/start` (3 templates) + `/modules` + seeded marks + `--module-h` + three photographs | Personalized entry, and a curriculum surface that survives 20 modules. |
| **M7** | **Parallel track:** `npx agent-yap-mcp` — three tools over the existing BM25 index | ~300 lines. Zero coupling. Do not let it block M2–M6 or be blocked by them. |

**Any week, zero dependencies:** the **argument maps**. `content/multi-agent/`
already contains chapters titled "the case for", "the case against", "why they
fail", "reconciling the debate", plus both original source posts. Three pages
presenting a real disagreement with both sides steelmanned is the cheapest move from
"tutorial site" to "where this field's arguments are documented" — and status is what
makes people link to you.

---

## 8. If thinking independently: the five things I would add

Full reasoning: [research/10-independent-vision.md](research/10-independent-vision.md).

1. **An MCP server over the corpus** (`npx agent-yap-mcp`). **My top pick, not
   close.** It inverts distribution: instead of a human finding the site, the site
   arrives *inside the editor* at the moment the question is live, attributed. A
   developer asks their coding agent "RAG or long context here?" and gets weights —
   confident, plausible, uncited — while the nuanced answer sits in
   `chapter-07-retrieval-strategies.md`. ~300 lines over an index that already
   exists. `llms.txt` already ships. **This is SEO for the post-search era.**
2. **Trace Gym.** One authored broken trace per day, free, no signup, shareable as
   text: *"Trace Gym #14 — step 6/12 · reason ✓"*. Gandalf (Lakera's
   prompt-injection game) is the precedent: free, no signup, ~8% beat level 7, and
   the most-shared educational artefact in AI security. Ours needs **no model calls**,
   because the trace is authored.
3. **Bring your own agent.** Paste a real trace from *your* project; a client-side
   linter annotates it against the failure taxonomy — retry without jitter, same
   tool called twice with identical args, observation silently truncated, no error
   contract — each finding citing the chapter that explains it. **No model call, no
   upload.** The strongest available bridge between the reading and the reader's job.
4. **India-first, explicitly.** Verified gap: `DPDP` 0, `PII` 0, `GDPR` 0 across the
   entire corpus, in a chapter written domain-generically. Rupee cost examples,
   Indian-region latency reality, DPDP alongside the EU AI Act. One of the largest
   and fastest-growing populations of AI engineers has almost no content written for
   its regulatory and cost reality — and this team is native to it. **The most
   under-valued idea on the list.**
5. **Argument maps** (see §7 — the content is already written).

**Money, bluntly:** free forever for the corpus and every check — a paywall now
caps the only thing that compounds. Later, in order: one sponsor line per module
(eval and observability vendors; this audience is exactly their ICP), one hard paid
credential once the item bank is calibrated, and **team licences** — companies
onboarding engineers onto agent work will pay per seat for "does my team actually
know this", and that is the one thing that would justify building auth. Reject ads
and paid content tiers.

---

## 9. What we are deliberately not building

The site today has **two** surfaces a user can be on. The full research set proposes
**nine**. That is the biggest risk in this plan, so these are named to stay unbuilt:

`/practice` index · `/path` · `/review` as routes · the `budget` widget ·
`order`/`predict`/`spot`/`cloze` types · the 187-card glossary deck · the 6-item
placement diagnostic · the `interview` and `current` templates · `research papers/`
promotion · certificates · streaks/XP/leaderboards · accounts · LLM-judged free
text · a code sandbox · a settings page · a dashboard of any kind.

Each has a design in reports 07–11 and each waits for evidence.

**One content item does not wait: the evals chapter.** `golden set` 0,
`regression test` 0, `OpenTelemetry` 0, `Langfuse` 0, `LangSmith` 0 — verified by
grep, not assumed. **A product whose pitch is "we will evaluate you" cannot launch
with zero content on how to evaluate anything.** That is the single most quotable
weakness in this plan and it is one chapter of work.

---

## 10. Honest limits

- **This product can verify that you recognise good and bad agent design. It cannot
  verify that you can produce it.** Open-ended design is the highest-value skill and
  it is not gradable without a human. **Say this on the site.** The credibility cost
  of overclaiming is much higher than the marketing benefit.
- **The 485 harvested questions are unvalidated.** Read 30 before building on them.
- **`localStorage` only means one device.** Mitigation is an export/import code
  (~2 KB of base64, no personal data), not accounts. The trigger that would force
  accounts is a team licence or a verifiable credential — nothing else.
- **Item calibration ("68% get this wrong") is the one feature that wants a
  server** — and it needs *anonymous per-item aggregates*, not user accounts. The
  non-goal should be reworded from "no server-side progress" to "no server-side
  **user** state". Also note: shipped invariant P-READER-002 ("no progress data is
  ever transmitted") already conflicts with CR-2026-010's analytics plan, **today**,
  before any of this work. Resolve that fight before assessment inherits it.
- **The `content.ts` PR is the critical path and the single point of failure.** If it
  splits or stalls, checks, modules, frontmatter, slide lengths and the `featured`
  flag all stall with it.
- **The site declares "SF Pro Display"/"SF Pro Text" and loads no webfont**, so on
  Windows and Android it renders as Segoe UI / Roboto. Do not review mockups on a Mac
  and assume they represent what ships.

---

## 11. Read next

| Doc | For |
|---|---|
| [research/01-content-inventory.md](research/01-content-inventory.md) | Per-folder audit, exact wiring steps, the 20-module taxonomy + `modules.json`, 13 verified content gaps |
| [research/02-code-ux-audit.md](research/02-code-ux-audit.md) | Every route, every token, every scale failure with file:line, a11y + perf debt |
| [research/03-prior-decisions.md](research/03-prior-decisions.md) | Decision ledger; which non-goals survive an assessment product and how to amend the two that need it |
| [research/04-competitors-practice.md](research/04-competitors-practice.md) | 20 platform teardowns; 18 deterministic grading mechanisms; load-bearing vs cosmetic mechanics |
| [research/05-competitors-reading.md](research/05-competitors-reading.md) | 22 reading sites; 10 patterns to adopt, 5 to reject; three navigation architectures |
| [research/06-visual-identity.md](research/06-visual-identity.md) | The photo problem, treatment recipes, `--module-h`, the three-photograph rule |
| [research/07-assessment-system.md](research/07-assessment-system.md) | **The core design.** 10 types with worked examples, data model, grading, mastery, authoring pipeline |
| [research/08-onboarding-and-templates.md](research/08-onboarding-and-templates.md) | Onboarding screen by screen with verbatim copy; all five templates in full |
| [research/09-ia-and-flows.md](research/09-ia-and-flows.md) | Site map, URL contract, seven user flows as diagrams, state architecture |
| [research/10-independent-vision.md](research/10-independent-vision.md) | 15 unconstrained ideas, impact×effort, differentiation thesis, business model |
| [research/11-claude-design-prompts.md](research/11-claude-design-prompts.md) | **The design brief + six copy-paste prompts** for claude.ai/design |
| [research/12-adversarial-review.md](research/12-adversarial-review.md) | Contradictions ruled on, KEEP/CUT/DEFER on every feature, what kills this in 6 months |
| [research/13-delivery-plan.md](research/13-delivery-plan.md) | Week 1, M1–M7 with gates and kill criteria, FEATURE-STATUS rows, specs, lanes, rollback |

---

## 12. Decisions needed from a human

1. **Read 30 of the 485 questions.** Gates M4's scope. One hour.
2. **Three templates or five?** This plan says three for v1 (`foundations`, `debug`,
   `ship`); report 08 designed five.
3. **Does `/practice` exist in v1, or are checks inline-only?** Inline-only halves
   the v1 surface area.
4. **Item statistics: yes or never?** The only thing here that touches the
   "no server" guardrail. Decide deliberately rather than drifting into it.
5. **`research papers/` promotion** needs an attribution decision — the existing
   index credits an external curator, and promoting those folders to first-class
   books changes the framing from "reading list" to "our course".
6. **Commission the evals chapter now or launch without it?** §9 argues now.
