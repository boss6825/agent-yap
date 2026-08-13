# 07 — The Assessment System

> The core deliverable. Agent YAP has ~196,000 words of teaching material and no
> way for a learner to find out whether they understood any of it. This document
> designs the layer that fixes that, under the constraints that actually apply:
> statically generated, no auth, no server-side user state, no test runner, no
> code sandbox, and a minimalism bar that says the product should "feel like
> nothing".
>
> Written after reports 01–06. Where it disagrees with them, it says so.

---

## 0. The four facts this design is built on

1. **You already own 490 questions.** Report 01 §6.3 found 490 authored
   multiple-choice questions with distractors and written answers, inside
   `## Review` sections across 55 chapters, plus 3 coding challenges with
   solutions and 15 `Code MVP` exercises. They do not render — `Markdown.tsx`
   has no `rehype-raw`, so every `<details><summary>Answer</summary>` node is
   silently dropped. **The assessment cold start is a parsing problem, not an
   authoring problem.**
2. **Anthropic grades agentic-AI competence with multiple choice.** Report 04
   §1.20: all four Claude certification exams are MCQ and multiple-response,
   120 minutes, 720/1000 to pass; only the Architect exam is scenario-based.
   The organisation with the deepest possible knowledge of this subject chose
   MCQ. That sets the ceiling high enough that MCQ is not a compromise.
3. **LeetCode's power comes from one property, and we cannot have it.** A total,
   cheap, instant oracle: `f(input) == expected`. Agentic AI's central questions
   ("should this go in the window?", "one agent or three?") are judgment calls.
   Running the agent is non-deterministic and costs money; an LLM judge agrees
   with humans at κ≈0.64 on borderline answers, which is a learner-quitting
   rate; peer review needs auth and a community.
4. **The reframe that unlocks everything: move the non-determinism from the
   answer into the question.** Do not ask "what would you do?". Author the
   artefact — the trace, the budget, the schema, the log, the config — and ask a
   question whose answer is pinned by the artefact you wrote. The learner still
   exercises judgment; they exercise it inside a stated frame where exactly one
   answer survives the constraints. This is also the actual job: AI engineering
   is mostly reading traces and deciding what to change.

**The positioning that follows.** AgenticPrep.io (report 04 §1.18) already owns
"LeetCode for AI engineering interviews" with Python plus a test runner — 43
problems, 8 tracks. Do not follow them into a sandbox. Their own scoring
language ("respects MAX_STEPS", "validate tool schema") is an admission that the
interesting assertions are *behavioural properties of a trace*, not return
values. **We can assert those properties on an authored trace with zero
execution.** Own the unclaimed 80%: *can you read a trace and say what is wrong?*

---

## 1. The exercise taxonomy — ten types, one family

Ten types, deliberately. Report 04 ranked eighteen candidate mechanics; ten is
the set that (a) shares at most three renderers, (b) grades with a pure function
in the browser, and (c) can be authored in markdown next to the prose. Each maps
to a report-04 mechanic id so the research trail stays intact.

| # | Type id | Renderer | Grading | Cost | Ship |
|---|---|---|---|---|---|
| 1 | `choice` (M1) | Options list | index set equality | S | v1 |
| 2 | `classify` (M3) | Options list + taxonomy chips | label equality | S | v1 |
| 3 | `trace` (M2) | **Trace renderer** | step index, then label | M | v1 |
| 4 | `number` (M6, M15) | Number input | `\|a−e\| ≤ tol` or band | S | v1 |
| 5 | `cloze` (M10) | Inline blanks | normalised set match | S | v1 |
| 6 | `order` (M4) | Sortable list | permutation / Kendall-τ | M | v2 |
| 7 | `budget` (M5, M12) | **Selection widget + counter** | required ∧ ≤budget ∧ score≥θ | M | v2 |
| 8 | `predict` (M11) | Text + number inputs | integer equality | S | v2 |
| 9 | `spot` (M8, M13, M16) | **Span/line click renderer** | precision + recall on a set | L | v3 |
| 10 | `card` (M18) | Reveal + 3 buttons | **not graded** — self-report | S | v1 |

Three renderers total: an options list (types 1, 2, and the reveal half of 10),
a monospace artefact viewer with clickable rows (types 3 and 9), and a selection
list with a live counter (type 7). Types 4, 5, 8 are inputs inside the options
renderer's chrome. That is the whole UI budget for the entire assessment
product.

> **Type 10 is not assessment and must never be presented as such.** roadmap.sh's
> "Already Know that / Didn't Know that / Skip" (report 04 §1.12) measures
> confidence, and confidence is the thing learners are worst at. It is the
> *review scheduler's input*, never the mastery signal. Enforced in the data
> model: `card` items cannot write to `mastery`.

### 1.1 `choice` — MCQ with distractors mined from real failure modes

**Teaches:** discrimination between interventions that all sound plausible.
**Rule:** every distractor must be something that actually happens in
production. "Which of these is a vector database" is a vocabulary question
pretending to be an engineering one.

````markdown
```yap-check
type: choice
id: ce-position-decay
module: context-engineering
difficulty: core
prompt: |
  An agent's answers get noticeably worse after turn 15 of a long
  conversation, and the degradation is worst for the constraint you gave it
  at turn 2. Nothing about the tools or the model changed.

  Which single change most directly addresses the cause?
options:
  - Raise temperature so the model explores more of the instruction
  - Add a reranker in front of the retrieval step
  - Summarise the history and re-pin the turn-2 constraint near the end of the window
  - Increase max_tokens on the response
answer: 2
because: |
  All four are real interventions. The symptom — position-dependent decay,
  worst for the oldest instruction — is attention dilution over a growing
  window, not a retrieval problem and not a sampling problem. Re-pinning
  moves the constraint back into a high-attention position. Temperature and
  max_tokens change the output, not what the model can attend to; a reranker
  fixes a retrieval pipeline this scenario doesn't have.
```
````

Note `because` is written to be read *after answering, whether right or wrong* —
it explains why the three distractors are wrong, not just why the answer is
right. That is the difference between an explanation and a scorecard.

### 1.2 `classify` — failure-mode classification against a fixed taxonomy

**Teaches:** naming. Engineers who can name a failure can search for it, discuss
it in review, and write an eval for it.

The taxonomy is **authored once and used three ways**: as the answer set here,
as the site glossary (`content/glossary/` already exists with 49 terms), and as
the tag vocabulary for the module DAG. Sixteen labels:

`context-rot` · `lost-in-the-middle` · `tool-schema-ambiguity` ·
`hallucinated-tool-arg` · `prompt-injection` · `indirect-injection` ·
`retrieval-miss` · `retrieval-distractor` · `unbounded-loop` ·
`non-idempotent-retry` · `stale-memory-write` · `over-eager-delegation` ·
`budget-exhaustion` · `silent-truncation` · `cache-invalidation` ·
`missing-error-contract`

````markdown
```yap-check
type: classify
id: ma-delegation-01
module: multi-agent-systems
difficulty: advanced
artefact: |
  orchestrator → spawn(researcher, "find pricing for competitors")
  researcher   → web_search("competitor pricing")           [12 results]
  researcher   → returns 400-word summary
  orchestrator → spawn(researcher_2, "verify the pricing numbers")
  researcher_2 → web_search("competitor pricing")           [12 results]
  researcher_2 → returns 380-word summary, differs on 2 of 5 numbers
  orchestrator → spawn(researcher_3, "resolve the discrepancy")
prompt: The orchestrator has made one structural mistake three times. Name it.
taxonomy: [over-eager-delegation, retrieval-distractor, unbounded-loop, context-rot]
answer: over-eager-delegation
because: |
  Each subagent starts with a fresh window and re-does the same search, so the
  orchestrator is paying three times for one retrieval and then arbitrating
  between three lossy summaries it cannot audit. The fix is not a fourth
  agent: it is one retrieval whose raw results the orchestrator keeps, with
  subagents reading from that shared artefact. This is the failure Cognition's
  "Don't Build Multi-Agents" argues is structural, and it is in
  content/multi-agent/ already.
```
````

### 1.3 `trace` — the flagship: click the first step that went wrong

**Teaches:** the actual job. **Impossible on LeetCode.** It is the pedagogy of
the most respected paid course in this space (Maven, *AI Evals for Engineers* —
"here is a broken agent, find the break", report 04 §1.17).

Two clicks: *where* (step index), then *why* (a `classify` taxonomy label).
Partial credit falls out naturally — right step, wrong reason is a real and
useful distinction.

````markdown
```yap-check
type: trace
id: tool-enum-drift
module: tool-design-and-execution
difficulty: core
setup: |
  A support agent has two tools. `search_orders(query: string)` and
  `refund_order(order_id: string, amount: number, reason: string)`.
  The user says: "cancel my last order, the blue lamp".
steps:
  - { role: thought,     text: "I need the order id. I'll search." }
  - { role: tool_call,   text: "search_orders(query='blue lamp')" }
  - { role: observation, text: "[{id: 'ORD-8812', item: 'Blue Lamp', total: 4499, status: 'shipped'}]" }
  - { role: thought,     text: "Found it. The user wants to cancel, so I'll refund." }
  - { role: tool_call,   text: "refund_order(order_id='ORD-8812', amount=4499, reason='cancel')" }
  - { role: observation, text: "{ok: true, refund_id: 'RF-2231'}" }
  - { role: thought,     text: "Done." }
  - { role: response,    text: "I've cancelled your order and refunded ₹4,499." }
prompt: The run "succeeded" and is wrong. Click the first step where it went off the rails.
answer: 3
why: missing-error-contract
alsoAccept: [tool-schema-ambiguity]
because: |
  Step 3 is the fault: the model reads status 'shipped' and silently decides
  cancel == refund. Nothing in either tool description says what to do with a
  shipped order, so the model invents a policy. Step 4 is where the damage
  happens, but by then the wrong decision is already made — grading the
  *decision* step rather than the *damage* step is the entire skill.

  Both labels are accepted: the schema is ambiguous (no enum on `reason`, no
  statement of when refund_order must not be used) and there is no error
  contract for the shipped case. The fix is in the tool description, not the
  prompt.
```
````

`alsoAccept` matters. A grading system that accepts exactly one defensible
answer to a judgment question is training learners to guess the author's mind.

### 1.4 `number` — cost and latency arithmetic with a tolerance band

**Teaches:** the arithmetic real engineers get wrong in real design reviews.
Report 01 §6.2 gap #12: `pricing` appears 3 times in the whole corpus and there
is not one worked cost example anywhere. This type is the cheapest possible fix
for a verified content gap.

**Never exact-match a number.** HackerRank's exact-stdout grading is the most
cited complaint about it (report 04 §1.3); a tolerance band costs one field.

````markdown
```yap-check
type: number
id: cost-cache-01
module: model-routing-and-economics
difficulty: advanced
prompt: |
  Your agent averages 6 model calls per task. Each call sends 12,000 input
  tokens and returns 800 output tokens. The model is $3.00 / MTok input and
  $15.00 / MTok output. Prompt caching gives you a 65% cache-hit rate on
  input, and cache reads cost 0.1× the input price. You run 20,000 tasks a
  month.

  What is the monthly spend, in USD?
unit: USD
answer: 6552
tolerance: 60
because: |
  Input per task: 6 × 12,000 = 72,000 tok. 65% cached → 46,800 cached at
  $0.30/MTok = $0.01404; 25,200 uncached at $3.00/MTok = $0.07560.
  Output: 6 × 800 = 4,800 tok at $15.00/MTok = $0.07200.
  Per task ≈ $0.16164 → × 20,000 = $3,232.80.

  If you got roughly double that, you priced all input at full rate — which
  is exactly the mistake that makes caching look like a rounding error in a
  design review. Caching removes 58% of the input bill here.
answerNote: |
  Accepted band is wide on purpose; the skill is the structure of the
  calculation, not arithmetic precision.
```
````

> Authoring caution found while writing this example: the `answer` above must be
> `3233`, not `6552`. Keep a rule that every `number` item's `because` block
> shows the full working, because the working is what catches the author's own
> arithmetic errors before a learner does. This is the single highest-risk
> authoring type and it needs a review pass that recomputes each answer.

### 1.5 `cloze` — blank the load-bearing token out of a real artefact

**Teaches:** precision about the one line that does the work.
**Cost: near zero** — ~120 fenced code blocks already exist in `content/`.

````markdown
```yap-check
type: cloze
id: retry-jitter-01
module: state-and-reliability
difficulty: advanced
artefact: |
  delay = min(cap, base * 2 ** attempt)
  delay = delay * (0.5 + random() * 0.5)     # ← ___1___
  sleep(delay)
blanks:
  1:
    accept: ["jitter", "full jitter", "equal jitter", "randomised jitter"]
    hint: "One word. It is what stops the retries from synchronising."
because: |
  Without jitter, every client that failed at the same instant retries at the
  same instant, and the retry storm is worse than the original failure. The
  exponential part limits the rate; the random part decorrelates the clients.
```
````

### 1.6–1.9 `order`, `budget`, `predict`, `spot`

Specified more briefly — they are v2/v3 and the v1 decision does not depend on
their detail.

**`order`** (v2). ≤7 items, click-to-place rather than drag (touch-safe, and
drag-and-drop is the single most accessibility-hostile interaction on the list).
Graded by exact permutation, with Kendall-τ for partial credit. Best examples:
context assembly order (system → tool defs → memory → retrieved → user turn);
the reliability escalation ladder (retry → backoff+jitter → circuit-break →
fallback model → fail closed); RAG pipeline stages.

**`budget`** (v2) — **the signature mechanic**. State a token budget; present
10–14 candidate items each with a token cost and a hidden relevance weight; the
learner toggles them while a live counter runs. Graded on three predicates: all
`required` items present, budget not exceeded, total relevance ≥ threshold.
Because there is a computable optimum, it can report *"78 of a possible 92"* —
the only type that yields a score rather than a verdict. It is the purest
expression of context engineering and the one custom widget worth building.
`spot`-free, `sandbox`-free, and nothing else on the internet has it.

**`predict`** (v2). *"`max_steps=3`. The model returns a tool call on steps 1 and
2 and a final answer on step 3. The tool raises on step 2 and your handler
appends the error as an observation. How many model calls happen? How many
messages are in the final list?"* Deterministic **because the model's behaviour
is stated in the problem** — the reframe from §0.4, applied literally.

**`spot`** (v3). Click the offending line/span: a planted defect in a tool
schema, an injection span in a fetched page, the bad hunk in a diff. Graded by
precision/recall over a set — *"you found 2 of 3, and flagged 1 false
positive"*. One renderer serves all three, so build them together or not at all.

### 1.10 What we explicitly refuse to build

| Refused | Why |
|---|---|
| **Free text graded by an LLM** | κ≈0.64 human agreement on borderline answers. One wrong "incorrect" on a subjective question loses the learner permanently. Per-request cost on a no-auth site is also an abuse vector. If free text is wanted: write → reveal a model answer + a 3-point self-check rubric, and be honest that it is self-graded. |
| **A code execution sandbox** | AgenticPrep's entire moat, and it costs a runtime this statically-generated site does not have. If code ever matters, Pyodide in a Web Worker for a handful of pure functions (token trimmer, backoff-with-jitter, MMR reranker) — a v3 experiment, never a pillar. |
| **Anything needing accounts** | Peer review, mentoring, real leaderboards, cohorts. |
| **Streaks, XP, gems, leagues** | Report 04 Part 2. Load-bearing at Duolingo because DAU is the business model; Boot.dev's own reviewers call the RPG layer "part of the aesthetics and theme, not the learning". Our user shows up when work breaks, possibly three weeks apart. A broken streak is an exit, not a hook. |
| **A global completion percentage** | With 431 slides about to be wired and content growing "drastically", a percentage-of-corpus is a number that *goes down when we ship*. The most demotivating metric available. |

---

## 2. Data model

### 2.1 Where it lives

`src/lib/content.ts` is exclusive-access (`AGENTS.md`, constitution C2) and its
discovery rule is a registered invariant. The assessment layer therefore lives in
a **sibling module**, `src/lib/checks.ts`, which imports from `content.ts` and is
imported by the reader and the problems routes. Exactly one thing must change
inside `content.ts`, and it is unavoidable: `## Review` must be lifted out of the
slide stream into structured data. That is item 4 of the single coordinated
parser PR report 01 §7.4 already scopes — it does not need a second handshake.

```
src/lib/
  content.ts     ← exclusive-access. Adds: frontmatter, featured, questions[], ### sub-split
  checks.ts      ← NEW. Parses ```yap-check blocks + Chapter.questions → Check[]
  grade.ts       ← NEW. Pure functions. Zero imports. The whole grading engine.
  mastery.ts     ← NEW. localStorage store, same useSyncExternalStore shape as progress.ts
  modules.ts     ← NEW. Reads content/modules.json (report 01 §5.3), exposes the DAG
```

### 2.2 Types

```ts
export type CheckType =
  | "choice" | "classify" | "trace" | "number"
  | "cloze"  | "order"    | "budget" | "predict" | "spot" | "card";

export type Difficulty = "foundations" | "core" | "advanced" | "frontier";

/** Authored, static, build-time. Never mutated at runtime. */
export interface Check {
  id: string;                 // globally unique, stable, kebab-case
  type: CheckType;
  moduleId: string;           // one of modules.json ids
  difficulty: Difficulty;
  /** Where it was authored — drives "back to the reading" and citation. */
  origin: { bookSlug: string; chapterSlug: string; slideIndex: number | null };
  prompt: string;             // markdown
  because: string;            // markdown, shown after every attempt
  /** Type-specific payload. Discriminated on `type`. */
  body: CheckBody;
  /** Optional: labels for the review scheduler and the problems filter. */
  tags: string[];
}

export type CheckBody =
  | { kind: "choice";   options: string[]; answer: number | number[] }
  | { kind: "classify"; taxonomy: string[]; answer: string; artefact?: string }
  | { kind: "trace";    setup: string; steps: TraceStep[]; answer: number;
                        why: string; alsoAccept?: string[] }
  | { kind: "number";   answer: number; tolerance: number; unit?: string }
  | { kind: "cloze";    artefact: string;
                        blanks: Record<string, { accept: string[]; hint?: string }> }
  | { kind: "order";    items: string[]; answer: number[] }
  | { kind: "budget";   budget: number; items: BudgetItem[]; threshold: number }
  | { kind: "predict";  fields: { label: string; answer: number }[] }
  | { kind: "spot";     artefact: string; defects: Span[]; requireAll?: boolean }
  | { kind: "card";     front: string; back: string };

export interface TraceStep {
  role: "thought" | "tool_call" | "observation" | "response";
  text: string;
}
export interface BudgetItem {
  label: string; tokens: number; relevance: number; required?: boolean;
}
export interface Span { start: number; end: number; label: string }

/** Runtime, client-only, localStorage. */
export interface Attempt {
  checkId: string;
  at: number;                 // epoch ms
  /** 0..1. Partial credit is first-class — see grade.ts. */
  score: number;
  /** true iff score >= 1 with no assistance used. */
  clean: boolean;
  assisted: boolean;          // hint or reveal was used before submitting
  ms: number;                 // time on the item, for authoring telemetry only
}

/** Derived, never stored: recomputed from attempts on read. */
export interface ModuleMastery {
  moduleId: string;
  verified: number;           // count of checks with a clean pass
  attempted: number;
  /** 0–3 dots. Derived from graded checks only. `card` never contributes. */
  dots: 0 | 1 | 2 | 3;
  /** Next review timestamp from the scheduler, or null if nothing is due. */
  dueAt: number | null;
}
```

**Two deliberate choices.**

*Attempts are the store; mastery is derived.* Storing derived mastery means a
scheduler change silently invalidates everyone's saved state. Storing the attempt
log means any future scheduler recomputes from history. The log is small: 500
attempts × ~80 bytes ≈ 40 KB, well inside a 5 MB budget.

*`score` is a float, not a boolean.* Trace items grade "right step, wrong
reason" at 0.5; `spot` grades precision/recall; `budget` grades against a
computable optimum. Binary correctness would throw away the most informative
signal these types produce.

### 2.3 Static generation

`getChecks()` runs at build time, same as `getBooks()`. Checks are embedded in
the page payload for the slide that owns them (one item, ~1 KB) and in a single
`checks-index.json` for the problems surface (id, type, module, difficulty, tags,
prompt first line — **never the answer**). Answers ship in the per-slide payload
only. This is not real security — it is a static site and anyone can read the
bundle — but it stops the answer key being one `curl` away, which is the honest
bar for a free learning site.

> **Payload warning, from report 02.** The nav manifest is already 105,166 bytes
> and is embedded **twice** in all 199 pages (`content.ts:357` and `:363`). Do
> not add `checks-index.json` to the shared layout. It belongs on
> `/problems` only, and the double-embed bug should be fixed in the same PR that
> adds it, or the assessment layer will be blamed for a pre-existing regression.

---

## 3. The grading engine

`src/lib/grade.ts`. **Zero imports. Pure functions. One entry point.**

```ts
export interface Verdict {
  score: number;              // 0..1
  correct: boolean;           // score >= 1
  /** Type-specific, renderable detail. Never a bare "incorrect". */
  detail: VerdictDetail;
}

export function grade(check: Check, response: Response): Verdict;
```

Everything runs client-side. Nothing is sent anywhere. Consequences:

- **No server means no per-attempt cost and no abuse surface.** A free no-auth
  site that calls a model per submission is a bill waiting to happen.
- **Answers are in the bundle.** Accepted, per §2.3.
- **A response is never transmitted.** This preserves the shipped invariant
  P-READER-002 ("no progress data is ever transmitted over the network")
  unchanged — which matters, because report 03 found that CR-2026-010's
  analytics plan already contradicts that invariant *today*, before any
  assessment work. Do not let the assessment layer inherit that fight.

**One thing genuinely wants a server, and it is not grading.** Item calibration
("68% of readers get this wrong") needs aggregate response counts. That is
**anonymous per-item aggregate data, not per-user state.** Report 03's
recommendation is the right one: reword the non-goal from "no server-side
progress" to "no server-side **user** state", and if item statistics are ever
wanted, ship a single write-only counter endpoint that receives
`{checkId, correct}` and nothing else — no session, no id, no fingerprint. Not
in v1. It is the only feature in this document that would justify a backend, and
it is worth naming precisely so nobody smuggles a user table in behind it.

---

## 4. Mastery model

### 4.1 What a "self-evaluation" actually is here

Three surfaces, no more:

1. **Mastery map** — per module, 0–3 dots, derived from *cleanly passed graded
   checks only*. Framed additively and specifically: **"7 ideas verified in
   Context Engineering"**, never "8% complete".
2. **Review queue** — what has decayed. One number: how many items are due.
3. **Resume** — already shipped (`ResumePill.tsx`). Keep it exactly as is.

Dots thresholds, per module, out of that module's graded check count *n*:

| Dots | Condition | Reads as |
|---|---|---|
| 0 | no clean pass | untouched |
| 1 | ≥1 clean pass | started |
| 2 | ≥ ⌈n/2⌉ clean, including ≥1 `trace` or `budget` | working knowledge |
| 3 | ≥ ⌈0.8n⌉ clean **and** nothing overdue | held |

Dot 3 is revocable — that is the point. If review items go overdue, a module
drops from 3 to 2 and the review queue says why. This is the only pressure
mechanic in the product, it is honest (it reflects real decay), and it is
recoverable in one session.

### 4.2 Scheduling: FSRS, but do not ship FSRS in v1

The strongest criticism of LeetCode is the Ebbinghaus one: patterns learned in a
grind evaporate within a week (report 04 §1.1). Spaced review is the answer, and
FSRS is the right algorithm — it needs 20–30% fewer reviews than SM-2 for equal
retention, benchmarked on >500M Anki reviews, with TypeScript ports available.

**But v1 should ship a 12-line scheduler, not FSRS.** FSRS's advantage comes from
optimising parameters against a large review history. With zero response data,
FSRS-with-default-parameters is a much more complicated way to get the same
answer as this:

```ts
const LADDER_DAYS = [1, 3, 7, 21, 60, 180];

/** Interval for the next review of `checkId`, given its attempt history. */
export function nextDue(attempts: Attempt[]): number | null {
  const graded = attempts.filter(a => !a.assisted);
  if (graded.length === 0) return null;
  let rung = 0;
  for (const a of graded) {
    // A clean pass climbs one rung; anything else drops two (floored at 0).
    rung = a.score >= 1 ? Math.min(rung + 1, LADDER_DAYS.length - 1)
                        : Math.max(rung - 2, 0);
  }
  const last = graded[graded.length - 1];
  return last.at + LADDER_DAYS[rung] * 86_400_000;
}
```

Because attempts are the source of truth (§2.2), swapping this for FSRS later is
a pure-function replacement with no migration. **Ship the ladder; earn the right
to FSRS with data.** Anything else is building the sophisticated version of a
system whose inputs do not exist yet.

### 4.3 Difficulty-relative credit

Codewars' cheapest and best mechanic (report 04 §1.2): a kata far below your rank
yields near-zero progress. Applied here, one rule: **a check whose `difficulty`
is more than one tier below the learner's current level in that module does not
increment `verified`.** It still records an attempt, it still feeds the
scheduler, it just does not count as progress. This kills the "grind the easy
ones" failure mode for free, with no XP system to carry it.

---

## 5. The Problems surface

The LeetCode-analogue index — and the place where minimalism is most at risk,
because every instinct says "add filters".

**Route:** `/practice`. **What it is:** one column of rows. Nothing else.

```
Practice                                    312 checks · 20 modules

  ▸ 6 due for review                                        Review →

  Context Engineering                              ●●● · 14 checks
  Tool Design and Execution                        ●●○ · 11 checks
  Memory                                           ●○○ ·  9 checks
  Multi-Agent Systems                              ○○○ · 12 checks
  …

  Filter: all · unattempted · wrong last time · due          [type ▾]
```

Rules that keep it calm:

1. **Modules are the rows, not checks.** 312 individual rows is a firehose;
   20 rows with dots is a map. Expand a row to see its checks.
2. **Four filters, as plain text links, not a control panel.** `all` /
   `unattempted` / `wrong last time` / `due`. The type dropdown is the only
   `<select>` and it is optional.
3. **No difficulty tabs.** LeetCode's Easy/Medium/Hard is what produces
   difficulty-shopping. Difficulty is shown per check, never used to partition
   the index.
4. **No count of how many people solved it, no acceptance rate, no ranking.**
   Report 04's clearest negative finding: solved-count is vanity and drives the
   grinding everybody now criticises.
5. **`/practice/[checkId]`** is one check on an otherwise empty page, with a
   single link back to the slide it came from. This is the shareable unit and the
   deep-link target.

### 5.1 The two-tier credential

Report 04 §1.14: Hugging Face's agents course grades knowledge with an 80%-pass
MCQ and capability with "score ≥30% on GAIA". Two tiers, cheap then expensive.
Ours:

- **Tier 1 — module check.** ~12 items from one module, one sitting, ~15 min.
  Produces a result, privately. This is HackerRank's best idea (§1.3): a
  one-sitting artefact beats a 40-hour course.
- **Tier 2 — the capstone.** A single long `trace` + `budget` + `spot` sequence
  over the reference architecture, at `reference-architectures-capstone`. This is
  the only thing the site should ever call a credential, and it should stay hard
  enough that passing it means something.

**No certificates in v1.** A certificate for a self-graded localStorage result is
worth nothing and cheapens everything around it. Report 04's damning example:
DeepLearning.AI's short-course certificates certify attendance.

---

## 6. Anti-frustration: what happens when you are wrong

This is where learning products are won and lost.

| Moment | Design | Source |
|---|---|---|
| **Wrong answer** | Show `because` in full — including why each distractor was wrong. Never a bare "Incorrect". | Universal: specificity is what teaches ("failed on input `[]`" vs "wrong"). |
| **Retry** | Immediate, unlimited, and the *first* attempt is the one that counts for `clean`. Retrying is for learning, not for score-washing. | — |
| **Hint** | Exists, costs something: using it sets `assisted: true`, which excludes the attempt from mastery *and* from the scheduler. Shown as "assisted" in the module row. | Codecademy's tutorial-hell failure: always-available scaffolding is always-used scaffolding. |
| **Reveal** | A separate, more committal button than hint. Three explicit actions — *check / hint / reveal* — with escalating commitment. | Kaggle's `q1.check()` / `q1.hint()` / `q1.solution()` triad. |
| **After you commit** | Show the reasoning *and*, where authored, the strongest wrong answer people give and why it is tempting. | Codewars' post-solve reveal of top solutions — the peak-attention moment in the whole product. |
| **Never** | No streak break, no lost points, no "you're falling behind", no red. Wrong answers are rendered in ink, not in red. | Gamification-harm literature; the calm-brand guardrail in `docs/growth/00-master-plan.md`. |

**Problem before explanation.** The single highest-leverage, lowest-cost change
available: Brilliant's entire architecture is a prediction question *before* the
reveal. Our chapters are already excellent prose. Putting one `choice` item in
front of a key reveal converts passive reading into retrieval practice with zero
new content type and zero new UI. Do this in the flagship book before building
anything else on this list.

---

## 7. Authoring pipeline: 490 → ~1,200 checks without hand-writing them

### Stage 0 — harvest what exists (no authoring at all)

The 490 existing questions follow a parseable shape (report 01 §6.3):

```
## Review
**Quick Check**                 (or  ### Quick Check )

1. <question>
   - A) <distractor>
   - B) <correct>
   - C) <distractor>
   - D) <distractor>
   <details><summary>Answer</summary>B) <text> - <explanation></details>
```

Two variants: `arch` and `harness` use bold `**Quick Check**`; `agentic memory`
uses `### Quick Check` and follows with `### Coding Challenge`. Five `agentic
memory` items have answers but no A–D options — those are the only ones needing
an author.

A one-time script converts these into `Check` records with
`type: choice`, `origin` pointing at the chapter, and `because` taken from the
existing explanation text. **Yield: ~485 `choice` checks for one script.**

This single step takes the product from zero assessment to more questions than
Anthropic's Architect exam has (60), and it deletes the 71-slide long tail of
2,000-word Review slides at the same time.

### Stage 1 — mechanical derivation (script, no model)

| From | To | Yield |
|---|---|---|
| 187 glossary terms (5 files) | `card` items | 187 |
| ~85 chapters × 5 `Key takeaways` bullets | `card` items, front = the claim with a term blanked | ~425 → curate to ~150 |
| ~120 fenced code blocks | `cloze` candidates (one blank each, author picks the token) | ~120 → ~60 shipped |

### Stage 2 — LLM-drafted, human-gated (the only part with a model in it)

For the types that cannot be harvested — `trace`, `classify`, `number`, `budget`
— generate drafts from the chapter text with a fixed prompt per type, then gate
them. **The gate is the product.** A bad `trace` item teaches the wrong lesson
and is worse than no item.

Gate, in order, all cheap:

1. **Schema validation** at build time. Malformed block fails `npm run build`.
   With no test runner this is the only enforcement available, and it costs
   nothing (report 01 §7.6 makes the same argument for frontmatter).
2. **Answer-recomputation pass** for every `number` item. Non-negotiable — see
   the arithmetic slip flagged in §1.4, which happened while writing this
   document.
3. **Distractor rule check:** every distractor must name a real intervention. A
   distractor that is obviously silly makes the item free.
4. **Human read of every `trace` item.** ~20 traces, 5 minutes each. This is the
   flagship type; it does not get automated.

### Stage 3 — commission for the gaps

Report 01 §6.2 verified content gaps by grep, not assumption. Three of them are
directly assessable and directly credibility-relevant:

- **Practitioner evals** (`golden set` 0, `OpenTelemetry` 0). A site that
  cannot teach evals cannot credibly claim to grade you. **Highest priority
  content commission in the repo.**
- **Agent security** (`OWASP` 0, `jailbreak` 0, `prompt injection` 5 in passing).
  Feeds `spot` items directly.
- **Reranking** (`rerank` **0** inside a 57-slide RAG module). Feeds `budget`
  and `order`.

### Target inventory

| Type | v1 | v2 | Source |
|---|---|---|---|
| `choice` | 485 | 485 | harvested |
| `card` | 337 | 337 | glossary + takeaways |
| `classify` | 20 | 60 | LLM-drafted, gated |
| `trace` | **12** | 40 | hand-gated |
| `number` | 15 | 35 | authored, recomputed |
| `cloze` | 30 | 60 | harvested + authored |
| `order` / `budget` / `predict` | 0 | 45 | v2 |
| **Total graded** | **562** | **725** | |

562 graded checks in v1, of which 550 come from a script.

---

## 8. Ship first: `choice`, and only `choice`

**The one type to ship first is `choice`, delivered by fixing the parser.**

Not `trace`, even though `trace` is the flagship and the differentiator. The
reasoning:

1. **It is already written.** 485 items exist. Every other type starts at zero.
2. **The blocking work is a bug fix, not a feature.** Add `rehype-raw` to
   `Markdown.tsx` and 490 answers become visible — that alone is a real
   improvement shipped in an afternoon, and it also fixes 324 broken relative
   links via the same component's existing `a()` override.
3. **It proves the whole pipeline** — parse → static-generate → render → grade →
   persist → mastery → surface — on the type with the lowest authoring risk. If
   the pipeline is wrong, you find out for the price of one renderer.
4. **It fixes a UX defect at the same time.** The `## Review` slide is currently
   the fattest slide in nearly every chapter (1,961–2,832 words against a
   116-word median). Lifting it out of the slide stream makes the reading
   experience better *and* creates the assessment layer, in one change.
5. **`trace` is the second thing, deliberately, not the fifth.** Twelve
   hand-authored traces is a week of careful work and it is what makes the site
   unlike anything else. Ship `choice` to prove the machine; ship `trace` to have
   a product.

**The v1 line, precisely:** `choice` + `classify` + `card` + `trace`(12) +
`number`(15) + `cloze`(30), one options renderer, one trace renderer, one pure
grading module, one localStorage store, `/practice` as a single-column index.
No new infrastructure. No server. No accounts. No streak.

---

## 9. Open questions for a human

1. **Do 485 harvested questions meet the quality bar?** They were written as
   end-of-chapter review, not as calibrated assessment items. A sample of 30
   should be read before committing to harvest-all. If the distractor quality is
   weak, the harvest becomes "harvest and rewrite", which is a different project.
2. **Does `/practice` exist as a destination, or only inline in the reader?**
   This document assumes both. A defensible minimalist position is inline-only in
   v1, with `/practice` deferred until there is evidence people want a practice
   destination. That halves the v1 surface area.
3. **Item statistics: yes or never?** §3 scopes the smallest possible endpoint.
   It is the only thing here that touches the "no server" guardrail, and it
   should be decided deliberately rather than drifted into.
