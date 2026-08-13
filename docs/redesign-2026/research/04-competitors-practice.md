# 04 — Competitor teardown: practice & assessment platforms

**Scope:** the mechanics of assessment, not the marketing. What is a "problem", who grades it,
how fast, what the progress model actually does, and what users hate.

**Method:** WebSearch + WebFetch against live sites, vendor docs, Trustpilot/Capterra/Blind/Medium
criticism, and 2025–2026 research on autograding reliability. Where a fetch returned a JS shell
instead of content, that is flagged inline.

**Bottom line up front:**

1. Every platform that works at scale works because **grading is deterministic and instant**.
   Every platform that needs a human in the loop (Exercism mentors, Zoomcamp peer review,
   Maven cohorts) is capacity-bound and cannot be our model — we are a solo team with no auth.
2. **Nobody has built the assessment layer for agentic AI yet.** The only real attempt found is
   **AgenticPrep.io** (43+ problems, 8 tracks, launched into the 2026 interview-prep gap), and it
   is a LeetCode clone: Python + test runner. That leaves the entire non-code 80% of agentic
   AI — trace reading, context budgeting, failure taxonomy, cost arithmetic, tool-schema design —
   completely unclaimed.
3. **Streaks/XP/leagues are load-bearing for Duolingo and cosmetic-to-harmful everywhere else.**
   Do not build them. The load-bearing mechanics for an engineer audience are: instant verdict,
   a visible map of *what you don't know*, one-click resume, and a decay/review signal.
4. Recommended primary mechanic for Agent YAP: **trace debugging + failure-mode classification +
   context-budget selection**. All three are deterministic, all three are impossible on LeetCode,
   all three render as a single question and two buttons — which is the minimalism constraint.

---

## Part 1 — Platform teardowns

### 1.1 LeetCode

| Dimension | Detail |
|---|---|
| Onboarding | Effectively none. Signup wall, then a firehose of ~3,500 problems. "Study Plans" (LeetCode 75, Top Interview 150) are the de-facto onboarding: hand-curated ordered lists you opt into. No level question, no placement test. |
| Unit of practice | One function signature + hidden test cases. You submit code; a sandbox runs it against N cases. |
| Grading | Fully deterministic, <1s, binary Accepted/Wrong Answer + the first failing case + runtime/memory percentile. |
| Progress model | Solved counter by difficulty (Easy/Medium/Hard), a submission heatmap calendar, daily-challenge badge, and an Elo-style **contest rating** from timed contests. The rating is the only thing that maps to real skill; the solved-count is vanity. |
| Non-finishers | It does not care. The product is a grind treadmill; churn is assumed. Study Plans exist purely to reduce the "where do I start" bounce. |
| Criticism | Consistent and loud in 2025: patterns repeat after ~200 problems ("the same 10 tricks in disguise"); Ebbinghaus decay erases most of it within a week; burnout; irrelevance to production work. The Grind-75 movement is an explicit rejection of volume in favour of a 75-problem curated set. |

**Steal:** the curated ordered list as the actual onboarding (a "Study Plan" is worth more than a
level quiz). The instant, specific failure message ("failed on input X").
**Skip:** volume, solved-count vanity, contests.

### 1.2 Codewars

| Dimension | Detail |
|---|---|
| Onboarding | Language choice, then an optional intro kata. No placement. |
| Unit of practice | A "kata" — a function + test suite, community-authored. |
| Grading | Deterministic test suite. After passing, you are shown other users' solutions sorted by "Best Practices" and "Clever" votes. **This post-solve reveal is the actual teaching moment** and is the most transferable idea on the list. |
| Progress model | **Kyu/dan ranks** (start at 8 kyu → 1 kyu → 1 dan → 8 dan). Rank progress is weighted by kata difficulty relative to your rank: an easy kata far below your rank gives near-zero progress; a hard kata above your rank gives a lot. **Honor** is a separate currency for activity/contribution (solving, authoring, translating, voting) and unlocks privileges (e.g. ≥20 honor to create a public collection). |
| Non-finishers | Collections let users build their own training routines; otherwise nothing. |
| Criticism | Community-authored kata means wildly uneven quality and ambiguous specs; rank inflation. |

**Steal two things.** (a) **Difficulty-relative progress**: rewarding only work above your current
level is the single cheapest anti-grind mechanic and it kills the "solve 200 easy ones" failure
mode. (b) **Show the best answers after you commit to yours** — it converts a wrong answer into the
highest-attention learning moment in the whole product.
**Skip:** honor/privileges (needs a community we don't have).

### 1.3 HackerRank

| Dimension | Detail |
|---|---|
| Onboarding | None for practice. Certifications are self-selected. |
| Unit of practice | Coding, SQL, and **multiple-choice** questions — MCQ is a first-class question type in their test engine, not an afterthought. |
| Grading | Deterministic and famously brittle: exact stdout matching, so a missing space fails a correct solution. |
| Progress model | Skills Verification certifications (Problem Solving Basic/Intermediate, Python, SQL, React…), each a timed test producing a shareable badge. Global ranking by score. |
| Non-finishers | Certifications are short and one-shot — the whole point is a 60–90 min artefact, not a course. |
| Criticism | Exact-match brittleness punishes formatting, not skill; diagram/drawing question tooling is unusable; enterprise-side authoring is cumbersome. |

**Steal:** the **one-sitting, shareable credential** shape. A 20-question, 25-minute "Agent Loop
Fundamentals" check that emits a result is a far better artefact than a 40-hour course.
**Skip:** exact-string grading. Any numeric answer we grade must have a tolerance band, any set
answer must have partial credit.

### 1.4 Exercism

| Dimension | Detail |
|---|---|
| Onboarding | Pick a track (83 languages). Then a choice: "Learning Mode" (walk the syllabus) or "Practice Mode" (free-roam). That binary is a two-click onboarding and it is elegant. |
| Unit of practice | **Two distinct types.** *Concept Exercises* teach exactly one concept, have essentially one intended solution, and are unlocked by a **syllabus tree** — a DAG of concepts where a node unlocks only when its prerequisites are done. *Practice Exercises* are open-ended and let you apply concepts you already have. |
| Grading | Layered: (1) test suite runs → pass/fail; (2) an automated **Analyzer/Representer** inspects the *shape* of the solution and comments on idiom; (3) only if no automated feedback exists does it go to a human mentor. ~19,600 volunteer mentors. |
| Progress model | Concept tree completion. No XP, no streaks in the core loop (the #48in24 challenge is a seasonal bolt-on). |
| Non-finishers | Practice Mode exists precisely so the tree isn't a wall. |
| Criticism | Mentor queues; the analyzer only exists for a few tracks, so most solutions get an auto-approve and no feedback. |

**Steal — this is the most important structural lesson in the document.** The
**Concept Exercise / Practice Exercise split** maps perfectly onto the founder's "10–20 modules
recombined per learner": a *concept item* is a one-idea check that a module owns, and a *practice
item* is a scenario that recombines several. And the **syllabus DAG** is exactly the data structure
needed to assign different templates to different learners from the same content — you don't
author five curricula, you author one DAG and five entry points into it.
**Skip:** human mentoring. We have none and cannot get any.

### 1.5 Boot.dev

| Dimension | Detail |
|---|---|
| Onboarding | Demo-first: they reworked onboarding in July 2025 so you hit a real lesson before committing. |
| Unit of practice | Mixed by design — code exercises graded by **unit tests** (tests call your function with arguments and assert return values, not stdout), **multiple-choice quizzes**, HTTP-request exercises, and CLI exercises. Also "Boots" (an AI tutor character) and auto-generated "Training Grounds" challenges. |
| Grading | Deterministic, instant. |
| Progress model | The most gamified on the list: XP, gems, a shop, random **chests** (earned by 15 correct assignments in a row without a mistake), achievements, community **boss battles**, and streaks. In 2025 they shipped **Embers**: over-perform on a day and you charge an ember; miss a day later and the ember is spent before the streak breaks — turning a 7/7 streak into an honest 5/7 habit. |
| Personalization | Training Grounds auto-generates challenges weighted toward lessons you bookmarked. |
| Non-finishers | Embers + streak freezes are literally an anti-churn mechanic. |
| Criticism | Trustpilot reviewers repeatedly note the gamification is **"not part of the learning process, just part of the aesthetics and theme"**; several find XP/quests distracting; some UX friction on exercises. Reviews suggest trying the free demo first specifically because the format is polarising. |

**Steal:** **Embers**, conceptually — forgiveness built into any streak-like mechanic. And the
mixed-modality lesson stream (MCQ next to code next to config) as the norm rather than the
exception.
**Skip:** everything else in the RPG layer. The most damning data point on this whole page is that
the most gamified platform's own users say the gamification is decoration.

### 1.6 Codecademy

| Dimension | Detail |
|---|---|
| Unit of practice | Guided fill-in-the-blank inside a browser IDE, with a checklist of micro-instructions and a "Hint" always one click away. |
| Grading | Deterministic, often on the presence of a token rather than behaviour. |
| Criticism | The canonical **tutorial hell** accusation: the hand-holding produces people who can follow instructions and cannot start from an empty file; too few reinforcement exercises; and the browser IDE means learners never touch a real toolchain. |

**Steal:** nothing structural.
**Lesson:** *scaffolding that is always available is scaffolding that is always used.* If we ship a
hint button, it must cost something — reveal-after-attempt, or mark the item as "assisted" in the
mastery map.

### 1.7 DataCamp — **Signal** (the best onboarding mechanic found)

| Dimension | Detail |
|---|---|
| Unit of practice (assessment) | An **adaptive test**: ~10 minutes, question difficulty adjusts per answer using **Item Response Theory** / computerized adaptive testing. Each test differs because items are selected from your response history. |
| Output | A score, a **percentile**, a named skill level, a strengths/gaps breakdown, and course recommendations targeted at the gaps. |
| Why it matters | This is the only mainstream implementation of "assess me, then personalize" that produces a *number the learner believes*. It is exactly the founder's "let people evaluate themselves". |
| Cost of copying | IRT needs calibrated item parameters, which needs response data we do not have. |

**Steal the shape, not the math.** A fixed 6–8 item calibration set with hand-assigned difficulty
tiers gets ~80% of the placement value at ~2% of the cost. Move to real adaptivity only after we
have a few thousand responses per item.

### 1.8 Brilliant.org

| Dimension | Detail |
|---|---|
| Onboarding | A ~30-second pre-signup flow: a few interest/goal questions, then email. Deliberately shows value before the wall. |
| Unit of practice | Every lesson is problem-first: a manipulable diagram or a prediction question **before** the explanation. Courses are 20–40 lessons; each lesson is one concept with direct instruction plus blocked practice. |
| Grading | Instant, and when you are wrong the explanation is itself interactive. |
| Progress model | Streaks, levels, daily goals. |
| Criticism | Long-tenured users (4+ year streaks) report course quality has declined and standards lowered; heavy complaints about billing/auto-renewal (irrelevant to us but it is what dominates their review pages). |

**Steal:** **problem-before-explanation**. This is the highest-leverage, lowest-cost change
available to Agent YAP: our chapters are already excellent prose; putting a single prediction
question *in front of* the reveal converts passive reading into assessment with zero new content
type. It also fits minimalism perfectly — it is one question and one button.

### 1.9 Educative

- Text-first, no video, in-browser code widgets, quizzes and playgrounds embedded per lesson;
  1200+ courses; separate "Skill Assessments" product.
- Criticism: no video (a plus for us), $59/mo monthly pricing resented, and support is a 24-hour
  author round-trip.
- **Steal:** *embedded* widgets inside prose rather than a separate practice destination. This is
  the model closest to Agent YAP's existing slide reader and the cheapest to retrofit.

### 1.10 Frontend Masters

- Video-first. Learning Paths group courses. Per-course **quizzes and flashcards** in the player,
  searchable transcripts, timestamped notes, in-player Q&A.
- Certificates exist per course, **not** per learning path.
- Public profile shows a learning timeline, streaks achieved, and total hours watched.
- **Lesson:** "hours watched" is the purest example of a cosmetic progress metric. It measures our
  cost, not the learner's capability. Never ship a time-based progress number.

### 1.11 Kaggle Learn

| Dimension | Detail |
|---|---|
| Unit of practice | A notebook exercise. The learner runs `q1.check()`, `q1.hint()`, `q1.solution()` — a `learntools` library imported by the setup cell. |
| Grading | Deterministic, in-notebook, instant, and **self-invoked** — you decide when to be graded. |
| Progress model | Micro-courses of 3–7 hours with a completion certificate. |
| Friction | Notorious: forget "Run All" and nothing works; hints are commented out so beginners can't see them; restarting an exercise requires deleting the notebook from `kaggle.com/me/code`. |
| **Steal** | The **check / hint / solution triad as three separate explicit user actions.** It gives the learner control over scaffolding (unlike Codecademy where the hint is ambient) and it is trivially implementable as three buttons with escalating commitment. |

### 1.12 roadmap.sh (closest analogue to Agent YAP's current shape)

| Dimension | Detail |
|---|---|
| Structure | Interactive roadmap graphs; click a node to read about the topic. A "Personalize" affordance and account registration for persistence. AI Tutor at `/roadmap-chat/<slug>`. |
| Questions | **Flashcards.** Verified on `/questions/javascript`: 49 cards grouped into sections (Core Concepts, Functions, Objects and Prototypes, Arrays, Error Handling, Advanced Concepts). Interaction is literally *"Click to Reveal the Answer"* → **"Already Know that" / "Didn't Know that" / "Skip Question"**. Counters for Knew / Learnt / Skipped, plus **Reset Progress**. 20+ topics have these. |
| Projects | 112+ projects across beginner/intermediate/advanced, each with a "Started" counter. **No grading, no verification, no peer review.** |
| Progress | Node states on the roadmap (done/learning/skipped/pending), persisted to an account. |

**This is the single most directly copyable UI in the report.** Three buttons, self-graded, zero
backend, and it maps onto our existing `localStorage` progress module almost 1:1. It is also
*exactly* the minimalism bar the founder set. Its weakness is that self-rating is not assessment —
it measures confidence, not capability, and confidence is the thing learners are worst at. Use it
as the **review** layer, never as the **placement** layer.

Also note their Projects feature: 112 projects with *no grading at all* still gets used. Ungraded
practice has value; it just cannot be the thing you claim measures skill.

### 1.13 Duolingo (onboarding + progress only)

| Dimension | Detail |
|---|---|
| Onboarding | **~38 screens before the paywall.** Sequence: language → source ("how did you hear") → **motivation ("why are you learning?")** → self-rated level → **daily goal / time commitment** → a short exercise → *then* signup. Every question is answered before any wall. Personalization data collected is deliberately minimal (language, motivation, level); profile/social is deferred until after value. Placement test is offered and skippable. |
| Conversion | ~10% of 60M MAU convert to ~10M paid. |
| Streaks | Duolingo's own framing: the **single most effective retention lever in the product**. Users with 7+ day streaks retain at ~2.4× the rate of users who never form one. DAU is the company North Star and grew >10× since 2019. |
| Streak Freeze | Reduces streak anxiety while preserving loss aversion — and increases long-term retention. Also monetized. |
| Criticism | Substantial 2025 literature on **streak anxiety**: streaks exploit loss aversion (losses hurt ~2× as much as equivalent gains please); leagues + notifications identified as sources of pressure that overshadow learning; the "pain-point monetization" critique — manufacture the anxiety, sell the relief. |

**The honest read for us:** streaks are load-bearing *for a consumer habit product with a 5-minute
daily session and a DAU business model*. Agent YAP's user is an engineer who arrives when they hit
a problem at work, possibly three weeks apart. A broken streak for that user is a reason to leave,
not return. **Do not ship streaks.**

**Do steal the onboarding order:** ask *why* before *what*, ask level as self-description, ask time
budget, and **show the consequence immediately**. The reason Duolingo's onboarding survives 38
screens is that each answer visibly changes the next screen.

### 1.14 Hugging Face Learn — Agents Course

| Dimension | Detail |
|---|---|
| Structure | 5 units/chapters, free, with certification. |
| Assessment | **Unit 1 final quiz — MCQ, pass at 80%** → Fundamentals Certificate. Per-framework quizzes (e.g. smolagents "Exam Time!"). |
| Capstone | Unit 4 = build an agent, run it against the **GAIA** benchmark, **score ≥30%** to earn the Certificate of Completion, and submit to a **student leaderboard**. |
| Why it matters | This is the current state of the art in agentic-AI assessment and it is: **MCQ for knowledge + an external benchmark score for capability.** The benchmark is the grader. No human, no LLM judge. |

**Steal:** the two-tier credential (cheap knowledge check → expensive capability check) and the
idea that a **fixed benchmark with a numeric threshold** is the only defensible "you can build
agents" claim. `30%` is a deliberately low bar and it still filters hard.

### 1.15 DeepLearning.AI short courses

- **No assignments, no grading, no structured curriculum linking courses.** Notebooks you watch
  someone run. Certificates/"Accomplishments" gated behind Pro.
- Widely recommended anyway on teaching quality.
- **Lesson:** this is Agent YAP's current position — excellent content, zero assessment. It is a
  viable position, but it means you are competing on content quality alone, forever, against
  Andrew Ng. The founder's instinct to add assessment is the correct differentiation move.

### 1.16 LLM Zoomcamp (DataTalks.Club)

- 10-week free cohort. Weekly homework auto-scored onto an **anonymous leaderboard** (random
  display names like "Lucid Elbakyan"). Bonus points for sharing work publicly.
- **Homework is not required for the certificate** — only a capstone project passed via **peer
  review** during a live cohort. Certificates issued 2–4 weeks later.
- **Steal:** the anonymous leaderboard. It gives social comparison without identity, which is the
  only form of leaderboard compatible with "no auth" and with not being obnoxious.
- **Skip:** peer review and cohorts. Both require a synchronised community.

### 1.17 Maven — "AI Evals for Engineers & PMs" (Hamel Husain / Shreya Shankar)

- Paid cohort, refreshed for a Sep 2026 run. The pedagogy is: **build a real agent, find where it
  breaks, write evals you trust, run the loop.**
- Relevant because it defines the *actual* skill our audience wants and it is priced as a premium
  cohort — i.e. the market has proven willingness to pay for agentic-AI assessment skill, and
  nobody has productised it asynchronously.
- **Steal the pedagogy shape:** "here is a broken agent, find the break" is the atomic unit of the
  most respected course in this space. That is a *trace-debugging problem* and it is deterministic
  if we author the trace.

### 1.18 AgenticPrep.io — the direct competitor (2026)

| Dimension | Detail |
|---|---|
| Positioning | Interview prep for AI engineering roles. |
| Volume | **43+ problems across 8 agent tracks**: Agent Loop, Tool Creation, Memory, RAG, Evals, and others. |
| Unit of practice | A Python coding problem in a split workspace (prompt / starter code / sample tests / console). Example: *"Implement a Minimal ReAct Loop"* — Easy, 20 min, build Thought → Action → Observation. |
| Grading | **Trace-based scoring across 7 reliability dimensions.** The execution trace is shown as staged checks: Parse task → Validate tool schema → Dispatch calls → Score reliability, each with a score-impact percentage, plus behavioural assertions like *"terminates on Final Answer, respects MAX_STEPS"*. |
| Progress model | None found on the landing page — no leaderboard, no ranking, no streaks. |
| Onboarding | "Try a sample problem" or log in. No placement. |

**This is the thing to differentiate against, precisely.** They have taken the easy, expensive path:
Python + a test runner, i.e. LeetCode with agent-flavoured problems. That path requires a code
execution sandbox we do not have and do not want, and it addresses only the fraction of agentic AI
that is code. Their own scoring framing — "respects MAX_STEPS", "validate tool schema" — is an
admission that the *interesting* assertions are behavioural properties of a trace, not return
values. **We can assert those properties without running any code, by authoring the trace.**

### 1.19 Adversarial games: Gandalf (Lakera), HackAPrompt, Tensor Trust

- **Gandalf**: 7 levels + a bonus level 8 ("Gandalf the White"). Goal: get the model to reveal a
  password. Each level adds a defence (sanitization, instruction wrapping, output filters).
  **Free, no signup**, runs against real GPT-class models. Only **~8% of players beat level 7.**
- Peers: HackAPrompt (offers a credential, partly paid), Tensor Trust, Wiz Prompt Airlines,
  PortSwigger, GPT Prompt Attack, PromptTrace — all run against live models.
- **Why this is the most important entry in the report:** grading is *deterministic* (does the
  output contain the secret string?) while the task is *open-ended and creative*. This is the only
  known construction that gives LeetCode-grade objectivity to a judgment-heavy skill. It is also
  the most shareable/viral educational artefact in the AI space.

### 1.20 Anthropic Claude Certifications (March 2026) — the incumbent credential

- Three role-based certs (Associate, Developer, Architect), four live exams; delivery moved to
  Pearson VUE (OnVUE) in July 2026.
- **All exams: 120 minutes, multiple-choice and multiple-response, scaled score 720/1000 to pass.**
  Architect (Foundations): **60 questions in 120 min**, and it is the **only** scenario-based exam;
  the other three are standalone questions.
- Registration requires a company email tied to a Claude Partner Network org.

**The single most useful fact in this document:** the organisation with the deepest possible
knowledge of agentic AI grades agentic-AI competence with **multiple choice and scenario-based
multiple choice**. Not code. Not essays. Not LLM judges. If MCQ is good enough for Anthropic's
Architect exam, MCQ with well-authored distractors is good enough for us — and it is the cheapest
thing on the build list.

Their gate (partner-network company email) also leaves a wide-open gap: **there is no free,
open, self-serve way to find out whether you actually know this stuff.**

---

## Part 2 — Cross-cutting: load-bearing vs cosmetic

### Load-bearing (these actually change learning or retention)

| Mechanic | Evidence |
|---|---|
| **Instant, specific verdict** | Universal across every platform that works. The specificity matters: "failed on input `[]`" teaches; "incorrect" doesn't. |
| **Problem before explanation** | Brilliant's whole architecture; forces retrieval practice before the answer is available. |
| **Difficulty-relative progress** | Codewars: easy kata below your rank yield ~nothing. Kills grinding. |
| **Post-commit reveal of better answers** | Codewars' sorted solutions. Peak-attention moment. |
| **Prerequisite DAG** | Exercism's syllabus tree — the mechanism that makes "one content base, many paths" possible. |
| **Spaced review** | The Ebbinghaus critique of LeetCode is the strongest argument in the anti-grind literature. FSRS needs **~20–30% fewer reviews than SM-2** for the same retention and beats SM-2 on ~99.6% of collections (benchmarked on >500M Anki reviews); ports exist in TypeScript. |
| **Forgiveness in habit mechanics** | Boot.dev Embers; Duolingo Streak Freeze — freezes *increase* retention by removing anxiety. |
| **Percentile / calibration feedback** | DataCamp Signal. Engineers trust a percentile more than a badge. |
| **A numeric capability threshold** | HF Agents Course: score ≥30% on GAIA. The only honest "you can do this" claim. |

### Cosmetic (or actively harmful)

| Mechanic | Verdict |
|---|---|
| **XP / gems / chests / shops** | Boot.dev's own Trustpilot reviewers: gamification is *"just part of the aesthetics and theme,"* not the learning. Distracting to a meaningful minority. |
| **Streaks (for an engineer audience)** | Load-bearing at Duolingo (2.4× retention at 7+ days, DAU North Star) because it's a daily consumer habit. For episodic professional learning it manufactures anxiety and gives a reason to abandon. 2025 criticism is extensive and the "pain-point monetization" framing is now mainstream. |
| **Leagues / public leaderboards** | Named as a primary source of pressure and frustration in the gamification-harm literature. Anonymous leaderboards (Zoomcamp) are the only tolerable form. |
| **Hours watched / lessons completed** | Frontend Masters. Measures consumption, not capability. |
| **Solved-count totals** | LeetCode. Vanity; drives the exact grinding behaviour everyone now criticises. |
| **Certificates for watching** | DeepLearning.AI short courses have no assignments and no grading; the certificate means attendance. |
| **Always-available hints** | Codecademy → tutorial hell. Scaffolding must cost something. |

### The "nobody finishes" problem — the numbers

- Free MOOCs: **5–15% completion**; median across analysed MOOCs **12.6%** (range 0.7%–52.1%).
- Paid: ~60%. Cohort-based: ~72%.
- **50% of dropouts happen in the first 2 weeks.**
- Top stated reasons: no time (38%), lost motivation (25%), too difficult (14%), irrelevant (10%).
- **Micro-learning under 2 hours: 80%+ completion.**

**Design consequences for Agent YAP, stated as rules:**

1. **No unit may require more than ~10 minutes.** Completion collapses above 2 hours; the founder's
   "10–20 modules" instinct is correct, and each module should be a 5–12 minute session.
2. **Nothing may be sequentially gated in a way that produces a wall.** Exercism's answer is
   Practice Mode; ours should be that every module is independently enterable and the DAG only
   *recommends* order.
3. **Never show a completion percentage of the whole corpus.** With 7 unwired content folders and
   "content will grow drastically", a global percentage is a permanently-shrinking number — the
   most demotivating metric possible. Show *additive* counts: "you've verified 6 ideas in Context
   Engineering", not "8% complete".
4. **The first session must produce a result.** 50% of loss is in the first two weeks; the
   calibration quiz that ends with "here's what you already know, here's the gap" is a result.

---

## Part 3 — Synthesis A: what a LeetCode for agentic AI cannot copy from LeetCode

### The core asymmetry

LeetCode works because of one property: **a total, cheap, instant oracle.** `f(input) == expected`
is decidable in <1s, is not a matter of taste, and cannot be argued with. Everything else about
LeetCode — ratings, streaks, contests, the whole edifice — is downstream of that oracle.

Agentic AI has no such oracle for its central questions. "Should this go in the context window?",
"is this tool schema good?", "should this be one agent or three?" are judgment calls whose correct
answer is *conditional on constraints that the question must therefore state*. Three failed escapes:

- **Run the agent and grade the output.** Non-deterministic, slow (seconds to minutes), costs money
  per attempt, and the same submission can pass then fail. Fatal for a free static site.
- **LLM-as-judge on free-text answers.** 2025–2026 research puts human-agreement at QWK 0.75–0.86
  in the best-tuned essay setups, and CCC 0.81 / weighted κ 0.64 in a curriculum-grounded pipeline —
  with a 191-student classroom pilot finding *no significant correlation* with human scores. κ≈0.64
  means the judge and a human disagree on a large minority of borderline answers. A learner who is
  wrongly marked wrong once, on a subjective question, quits. Also: per-submission API cost on a
  free site with no auth is an abuse vector.
- **Peer review.** Needs auth, a community, and synchronisation (Zoomcamp needs live cohorts).
  Not available to us.

### The reframe that unlocks everything

**Move the non-determinism from the answer into the question.**

Do not ask "what would you do?" — that is unbounded and ungradeable. Author the *artefact* — the
trace, the budget, the schema, the log, the config — and ask a question about it whose answer is
pinned by the artefact you wrote. The judgment is still being exercised by the learner; it is just
being exercised inside a stated frame where exactly one answer survives the constraints.

This is also, not coincidentally, the actual job: **AI engineering is mostly reading traces and
deciding what to change.** AgenticPrep's own scoring ("respects MAX_STEPS", "validate tool schema")
is behavioural-property checking. We can assert those properties on an authored trace with zero
execution.

### The deterministic grading mechanisms available to us

Numbered so they can be referenced elsewhere. Every one of these grades with a pure function in the
browser, no network, no model call, no sandbox — except where noted.

**M1 — MCQ with distractors mined from real failure modes.**
Not "which of these is a vector database". Every distractor must be something that *actually
happens in production*. Example from `content/context engineering/`: *"An agent's answers get worse
after turn 15 of a conversation, and the degradation is worst for instructions given at turn 2.
Which single change most directly addresses the cause?"* — distractors: raise temperature / add a
reranker / summarise-and-pin the turn-2 instructions / increase max_tokens. All four are real
interventions; only one addresses position-dependent attention decay.
*Grading:* index equality. *Cost:* authoring only. *Precedent:* Anthropic's own certifications are
MCQ and multiple-response.

**M2 — Trace debugging: "click the first step that went wrong."**
Render an authored 8–14 step agent trace (thought / tool call / observation / thought / …). The
learner clicks the step index where the run first goes off the rails. Optionally a second click:
*why* (from a fixed taxonomy — see M3).
*Grading:* integer equality on step index, then label equality. Partial credit natural (right step,
wrong reason).
*Why it's the flagship:* it is impossible on LeetCode, it is literally the Maven-evals pedagogy,
it is the job, and it renders as a scrollable list plus a click target — no new UI vocabulary.

**M3 — Failure-mode classification against a fixed taxonomy.**
Given a trace excerpt / log / eval report, choose the label: `context-rot`,
`tool-schema-ambiguity`, `prompt-injection`, `retrieval-miss`, `retrieval-distractor`,
`hallucinated-tool-arg`, `unbounded-loop`, `non-idempotent-retry`, `stale-memory-write`,
`over-eager-delegation`, `budget-exhaustion`, `lost-in-the-middle`.
*Grading:* exact label match. *Bonus:* the taxonomy doubles as the site's glossary
(`content/glossary/` already exists) and as the tag vocabulary for the module DAG. Author once,
use three ways.

**M4 — Ordering / sequencing.**
Drag or click N cards into the correct order. Examples: the stages of a RAG pipeline; the canonical
agent loop; the order of context assembly (system → tool defs → memory → retrieved → user turn);
the escalation ladder retry → backoff+jitter → circuit-break → fallback model → fail closed; the
order in which a coding harness should apply permission checks.
*Grading:* exact permutation, or Kendall-tau for partial credit.

**M5 — Context-window selection under a token budget (knapsack).**
State a budget (e.g. 8,000 tokens) and present 10–14 candidate items — system prompt, 4 tool
schemas, last 6 turns, 3 retrieved chunks, a memory summary, a scratchpad — each with a token cost
and hidden relevance. The learner toggles items in/out; a live counter shows tokens used.
*Grading:* deterministic and multi-part — (a) all `required` items present, (b) budget not
exceeded, (c) total relevance score ≥ threshold. There *is* a computable optimum, so we can report
"you scored 78 of a possible 92".
*Why it's great:* it is the purest expression of context engineering, it is a genuinely hard
judgment task, and it is 100% objective. Maps to `content/context engineering/`.

**M6 — Cost and latency arithmetic (numeric with tolerance).**
*"Your agent averages 6 LLM calls per task. Input 12k tokens/call, output 800. Model is $3/MTok in,
$15/MTok out. Prompt caching gives a 65% hit rate at 0.1× read price. 20,000 tasks/month. Monthly
spend?"* Or: *"Three tools, 400ms each. Serial vs parallel p95 with a 900ms model call between
steps?"*
*Grading:* `|answer − expected| ≤ tolerance`. Tolerance bands, never exact-string (see HackerRank's
mistake).
*Why:* this is the arithmetic real AI engineers get wrong in real design reviews, and it is
perfectly objective. Maps to `chapter-14-cost-latency.md`.

**M7 — Configuration selection with accepted ranges.**
A scenario plus 4–6 knobs (chunk size, overlap, top-k, reranker on/off, max_steps, timeout,
parallelism, temperature). Each knob is graded against an accepted *range*, not a value.
*Grading:* per-knob in-range boolean → partial score. Feedback explains the boundary that was
violated ("top-k of 20 at 1,200-token chunks blows your 8k budget").

**M8 — Tool-schema critique (defect spotting).**
Show a JSON tool definition with 3 planted defects among ~25 lines: a description that doesn't say
when *not* to use it, a free-string param that should be an enum, an overlap with a sibling tool,
an unbounded array, no error contract. Learner clicks the offending lines/fields.
*Grading:* set comparison with precision/recall → "you found 2 of 3, and flagged 1 false positive".
Maps to `chapter-03-tool-design.md` and `content/building coding agents and harnesses/`.

**M9 — Prompt A/B with a required justification click.**
Two system prompts side by side. Pick the one that produces the target behaviour, **then** click
the specific line that makes the difference.
*Grading:* two exact matches. The second click is what stops coin-flipping and is where the
learning is.

**M10 — Cloze on real artefacts.**
Blank the load-bearing token out of a real artefact from our own chapters: a system prompt, an MCP
tool schema, a state-machine edge condition, a retry policy, a compaction trigger.
*Grading:* exact match against a small accepted-answer set (case/whitespace normalised), or a
select-from-6 if free text is too brittle.
*Cost:* near zero — the code blocks already exist in `content/`.

**M11 — Predict-the-output of a stubbed harness.**
*"`max_steps=3`. The model returns a tool call on steps 1 and 2, and a final answer on step 3. The
tool raises on step 2 and your handler appends the error as an observation. How many model calls
happen? How many messages are in the final list?"*
*Grading:* integers. Deterministic **because the model's behaviour is stated in the problem** — the
non-determinism has been moved into the question, per the reframe above.

**M12 — Retrieval selection / distractor identification.**
A query plus 8 candidate chunks with scores. (a) Pick the k to send. (b) Identify which
high-scoring chunk is the distractor that will cause the hallucination.
*Grading:* set match. Maps to `content/rag/`.

**M13 — Prompt-injection span identification.**
Given a tool result or fetched page, click the span that is the injection.
*Grading:* character-offset overlap against the authored span. Maps to
`chapter-11-security-multitenancy.md`.

**M14 — Matching / pairing.**
Bijection between symptoms↔mitigations, MCP primitives↔use cases, papers↔contributions
(`content/research papers/` has 26 files and this is the cheapest way to make them assessable).
*Grading:* permutation match. Low ceiling, near-zero cost.

**M15 — Order-of-magnitude estimation.**
*"Roughly how many tokens is a 50-file TypeScript service?"* Answer accepted within a band.
*Grading:* band membership. Teaches calibration, which is an under-taught agentic skill.

**M16 — Diff / PR review: "which hunk introduces the bug?"**
Show a diff to an agent harness; click the hunk.
*Grading:* hunk index. Reuses the trace-debug UI (M2) with a different renderer.

**M17 — Adversarial live challenge (Gandalf pattern) — the only one needing a model call.**
*"Make this agent call `delete_file` without using the words delete, remove, rm, or unlink."*
*"Extract the guarded system prompt."* *"Get the agent to exceed its declared step budget."*
*Grading is still deterministic* — a predicate over the model's output (string contains, tool
called, step count exceeded). The model call is the *substrate*, not the judge.
*Cost:* an API key, rate limiting, and abuse control on a no-auth site. Defer, but this is the
viral artefact — Gandalf runs free with no signup and only ~8% beat level 7.

**M18 — Self-rated flashcard (roadmap.sh pattern).**
Reveal → "Knew it" / "Didn't know it" / "Skip".
*Grading:* not graded — self-reported. **Never use for placement or mastery claims**; use only to
feed the review scheduler. Its honest role is spaced repetition input, and for that it is ideal.

### What we should explicitly refuse to build

- **Free-text answers graded by an LLM.** κ≈0.64 on borderline answers is a learner-quitting rate,
  not a grading system. If we want free text, use **write → then reveal a model answer and a
  3-point self-check rubric** (self-graded, honest about being self-graded).
- **A code execution sandbox.** It is AgenticPrep's whole moat and it costs us a runtime we don't
  have, on a statically-generated site. If we ever want code, use Pyodide/WASM in a Web Worker for
  a handful of pure-function exercises (a token trimmer, backoff-with-jitter, an MMR reranker) —
  and treat it as a v3 experiment, not a pillar.
- **Anything requiring accounts** — peer review, mentoring, real leaderboards, cohorts.

---

## Part 4 — Synthesis B: ranked assessment mechanics

Scoring: **Learning value** (1–5, how much capability it actually builds/measures),
**Build cost** (1–5, where 5 = most expensive for a solo team with no auth, no test runner,
localStorage-only, static generation), **Minimalism fit** (1–5, where 5 = renders as one question
and one or two buttons with no new UI vocabulary).
Rank = value × fit ÷ cost, then adjusted by judgment where noted.

| # | Mechanic | Value | Cost | Fit | Score | Verdict |
|---|---|---|---|---|---|---|
| 1 | **M2 Trace debugging** (click the first bad step) | 5 | 2 | 4 | 10.0 | **Flagship.** Impossible on LeetCode, is literally the job, one authored JSON per problem. Build first. |
| 2 | **M1 MCQ, failure-mode distractors** | 4 | 1 | 5 | 20.0 | **Backbone.** Cheapest thing on the list, and Anthropic's own certs prove the ceiling is high. Cost is entirely authoring quality. |
| 3 | **M3 Failure-mode classification** | 4 | 1 | 5 | 20.0 | Build with #2 — same renderer, and the taxonomy also becomes the glossary and the DAG tags. |
| 4 | **M5 Context-budget selection** | 5 | 3 | 4 | 6.7 | **Signature mechanic.** The most "only this site has it" item; a live token counter is the one custom widget worth building. |
| 5 | **M6 Cost/latency arithmetic** | 4 | 1 | 5 | 20.0 | A number input with a tolerance band. Trivially cheap, embarrassingly under-taught. |
| 6 | **M4 Ordering / sequencing** | 3 | 2 | 4 | 6.0 | Cheap, satisfying, works on touch. Keep the list ≤7 items. |
| 7 | **M10 Cloze on real artefacts** | 3 | 1 | 5 | 15.0 | Nearly free — harvest existing code blocks from `content/`. Good filler between heavier items. |
| 8 | **M8 Tool-schema defect spotting** | 4 | 3 | 3 | 4.0 | High value, needs a click-a-line renderer. Reuse for M13/M16. |
| 9 | **M13 Injection span spotting** | 4 | 3 | 3 | 4.0 | Same renderer as #8 — build them together or not at all. |
| 10 | **M11 Predict-the-output (stubbed harness)** | 4 | 2 | 4 | 8.0 | Underrated. Pure text + a number box, and it forces real mental simulation of the loop. |
| 11 | **M7 Config selection with ranges** | 3 | 3 | 3 | 3.0 | Good, but a 6-knob form is the first thing that starts to feel heavy. Cap at 4 knobs. |
| 12 | **M9 Prompt A/B + justification click** | 3 | 2 | 4 | 6.0 | Solid; the second click is what saves it from being a coin flip. |
| 13 | **M12 Retrieval selection** | 3 | 2 | 4 | 6.0 | Reuses the M5 selection widget. Near-free once M5 exists. |
| 14 | **M18 Self-rated flashcards** | 2 | 1 | 5 | 10.0 | Ship it — but as the **review** layer only. It measures confidence, not skill. |
| 15 | **M15 Estimation bands** | 2 | 1 | 5 | 10.0 | Cheap, charming, teaches calibration. Low ceiling. |
| 16 | **M14 Matching / pairing** | 2 | 1 | 4 | 8.0 | The cheapest way to make `content/research papers/` (26 files) assessable at all. |
| 17 | **M16 Diff review** | 3 | 3 | 3 | 3.0 | Only worth it after M8's renderer exists. |
| 18 | **M17 Adversarial live challenge** | 5 | 5 | 3 | 3.0 | **Highest ceiling, highest cost.** Needs an API key, rate limiting, abuse control. This is the viral/PR asset — v3, deliberately, and only when there's a reason to draw a crowd. |
| 19 | **Code exercises + WASM test runner** | 4 | 5 | 2 | 1.6 | AgenticPrep's whole product. Expensive, off-strategy, and competes where we're weakest. |
| 20 | **Free text + LLM judge** | 2 | 4 | 2 | 1.0 | **Do not build.** κ≈0.64 on borderline answers; per-request cost on a no-auth site. |
| 21 | **Peer review / mentoring** | 4 | 5 | 1 | 0.8 | **Do not build.** Requires auth + community + synchronisation. |
| 22 | **Projects with submission** (roadmap.sh style) | 2 | 2 | 2 | 2.0 | 112 ungraded projects still get used — but ungraded projects don't let people "evaluate themselves", which is the stated goal. |

### Ship order

- **v1 (the assessment MVP):** M1, M3, M2, M6, M10 — five mechanics, one shared renderer plus one
  trace renderer. Every one of them is a static JSON authored next to the markdown, graded by a
  pure function, persisted to localStorage. **No new infrastructure at all.**
- **v2 (the differentiator):** M5 (+M12 free-riding on it), M4, M11, M9.
- **v3 (the moat / the megaphone):** M8+M13+M16 sharing a span-click renderer, then M17.

---

## Part 5 — What this means for Agent YAP specifically

### Onboarding: 4 questions, all skippable, no wall

Duolingo asks *why* before *what*, asks level as self-description, asks a time budget, and puts
every question before the paywall — but its 38 screens only survive because each answer visibly
changes the next screen. Brilliant does the same thing in ~30 seconds. Our version:

1. **"What brings you here?"** — Building something now / Interviewing / Keeping up / Teaching
   others. → selects one of the 4–5 flow templates.
2. **"Which sounds most like you?"** — three concrete self-descriptions, never the words
   beginner/intermediate/advanced. E.g. *"I've called an LLM API"* / *"I've shipped something with
   tool calls and it broke in ways I didn't expect"* / *"I run agents in production and argue about
   eval harnesses"*. → sets depth and DAG entry node.
3. **Optional 6-item calibration** (DataCamp Signal's shape, none of its IRT). Fixed items spanning
   the four hardest concepts, ~90 seconds. Skip button reads *"Skip — I'll guess and you can
   correct me"*. → adjusts starting mastery and, critically, **produces a result in session one**
   (50% of all dropout is in the first two weeks; a result is the antidote).
4. **"How long do you have?"** — 10 min / 30 min / I'll browse. → sets session length.

Then **immediately show the consequence in one line**: *"Skipping 9 chapters you already know.
Starting you at Context Engineering → Compaction."* One click to redo. Store under
`agent-yap:profile:v1`, sibling to the existing `agent-yap:progress:v1` in
`src/lib/progress.ts` — same `useSyncExternalStore` pattern, same defensive-parse-resets-to-zero
discipline, same SSR-safe neutral zero-state (the existing module already solves the hydration
problem correctly; copy it rather than inventing a second pattern).

### Content model: the Exercism DAG is the answer to "10–20 modules recombined"

The founder wants one content base recombined into 4–5 templates. Do not author five curricula.
Author **one DAG of ~18 concept nodes** over the existing 137 markdown files across 9 folders
(`architecture-and-system-design` 38, `building coding agents and harnesses` 34,
`research papers` 26, `multi-agent` 12, `agentic memory` 11, `context engineering` 8, `rag` 7,
`glossary` 1 — and 7 of 9 folders are currently unwired), then define each template as an
**entry node + a traversal policy**. Exercism's Concept/Practice split gives the item taxonomy:
concept items belong to one node, practice items recombine several.

`src/lib/content.ts` is the single source of truth and is exclusive-access — the DAG belongs
**next to** it (e.g. `src/lib/modules.ts` + a `modules.json` manifest keyed by existing chapter
slugs), not inside it. `getNavManifest()` already produces the per-book nav shape to key against.

### Progress model: no streaks, no XP, no percentage-of-everything

Three surfaces only:

1. **Mastery map** — per node, 0–3 filled dots, derived from graded items only (never from
   self-rating, never from pages viewed). Framed additively: *"7 ideas verified in Context
   Engineering"*, never *"8% complete"* — with content growing drastically, a global percentage is
   a number that goes down when we ship.
2. **Review queue** — FSRS-lite over graded items. FSRS is a well-specified, ported-to-TypeScript
   algorithm needing 20–30% fewer reviews than SM-2 for equal retention; it is the direct answer to
   the strongest criticism of LeetCode (the Ebbinghaus decay argument). Feed it with M18
   self-ratings *and* graded outcomes; weight the graded ones higher.
3. **Resume** — the existing `ResumePill.tsx` already does this. Keep it exactly as is.

And explicitly: **no streak, no XP, no gems, no league.** The evidence is that Duolingo's streak is
load-bearing because of a daily-consumer-habit business model with DAU as North Star; that Boot.dev
users describe the RPG layer as aesthetics rather than learning; and that leagues and streak
notifications are the mechanics named most often in the 2025 gamification-harm literature. For an
engineer who shows up when work breaks, a broken streak is an exit, not a hook.

If some habit signal is wanted later, copy **Embers** (forgiveness built in before the streak
breaks), not the streak.

### Positioning against AgenticPrep.io

They own "LeetCode for AI engineering interviews" via Python + a test runner. Do not follow them
into a sandbox. Own the larger, unclaimed half: **"can you read a trace and tell me what's wrong?"**
That is a claim about the job, not about interviews, it is deterministic without executing
anything, it fits a statically-generated site with no auth, and it is the exact pedagogy of the
most respected paid course in the space.

---

## Sources

Practice platforms: [Codewars docs — gamification](https://docs.codewars.com/gamification/) ·
[Codewars ranks](https://docs.codewars.com/gamification/ranks/) ·
[Codewars honor](https://docs.codewars.com/gamification/honor/) ·
[Exercism — Concept Exercises](https://exercism.org/docs/building/product/concept-exercises) ·
[Exercism — Syllabus](https://exercism.org/docs/building/tracks/syllabus) ·
[Exercism — Practice Exercises](https://exercism.org/docs/building/tracks/practice-exercises) ·
[Exercism — Analyzers, Representers & Syllabuses](https://exercism.org/blog/whats-new-in-v3-with-angelika) ·
[Exercism — Automated Mentoring Support](https://exercism.org/blog/automated-mentoring-support-project) ·
[roadmap.sh — JavaScript questions](https://roadmap.sh/questions/javascript) ·
[roadmap.sh — Projects](https://roadmap.sh/projects) ·
[roadmap.sh — AI Engineer roadmap](https://roadmap.sh/ai-engineer) ·
[HackerRank — question types](https://support.hackerrank.com/articles/2354192461-question-types-in-hackerrank-tests) ·
[HackerRank — certified assessments](https://support.hackerrank.com/hc/en-us/articles/10294879213331-HackerRank-Certified-Assessments) ·
[Kaggle Learn FAQ](https://www.kaggle.com/learn-faq) ·
[Kaggle — Check, Hint, Solution](https://www.kaggle.com/product-feedback/264063) ·
[Frontend Masters — features](https://frontendmasters.com/features/) ·
[Frontend Masters — Learning Paths FAQ](https://frontendmasters.com/faq/learning-paths/) ·
[Brilliant — help/using](https://brilliant.org/help/using-brilliant/) ·
[Brilliant — getting started](https://brilliant.org/help/using-brilliant/how-do-i-get-started-on-brilliant/) ·
[Educative — assessments](https://www.educative.io/assessments)

Adaptive placement & onboarding: [DataCamp Signal](https://www.datacamp.com/signal) ·
[DataCamp — why we use IRT](https://www.datacamp.com/blog/why-we-use-irt-at-data-camp) ·
[DataCamp Signal whitepaper](https://www.datacamp.com/resources/whitepapers/datacamp-signal) ·
[Tasu — Duolingo's 38-screen onboarding](https://tasu.ai/library/duolingo) ·
[Appcues — Duolingo onboarding](https://goodux.appcues.com/blog/duolingo-user-onboarding) ·
[UserGuiding — Duolingo UX breakdown](https://userguiding.com/blog/duolingo-onboarding-ux) ·
[Savvy — Brilliant onboarding](https://trysavvy.com/example/brilliant-onboarding)

Progress mechanics & criticism:
[Deconstructor of Fun — Duolingo streaks](https://duolingo.deconstructoroffun.com/mechanics/streaks) ·
[StriveCloud — Duolingo gamification](https://www.strivecloud.io/duolingo-gamification-explained) ·
[HEAD Foundation — Winning at what cost?](https://digest.headfoundation.org/2025/09/21/winning-at-what-cost-the-psychology-of-gamification-and-the-fight-for-our-focus/) ·
[UX Magazine — hot streak design without shame](https://uxmag.com/articles/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame) ·
[Boot.dev Beat, Jan 2025 (Embers)](https://blog.boot.dev/news/bootdev-beat-2025-01/) ·
[Boot.dev Beat, Jul 2025 (onboarding)](https://www.boot.dev/blog/news/bootdev-beat-2025-07) ·
[Boot.dev Trustpilot](https://www.trustpilot.com/review/www.boot.dev) ·
[Class Central — Boot.dev review](https://www.classcentral.com/report/review-boot-dev/) ·
[Firecode — why the LeetCode grind is broken](https://firecode.io/firelogs/log/why-leetcode-grind-is-broken) ·
[Educative — Grind 75 vs LeetCode patterns](https://www.educative.io/blog/grind-75-vs-leetcode-patterns)

Completion / retention data:
[Skillademia — online course completion statistics](https://www.skillademia.com/statistics/online-course-completion-statistics/) ·
[Skillademia — MOOC statistics](https://www.skillademia.com/statistics/mooc-statistics) ·
[Open Praxis — Uncovering MOOC completion](https://openpraxis.org/articles/10.55982/openpraxis.16.3.606)

Agentic-AI assessment landscape:
[HF Agents Course — introduction](https://huggingface.co/learn/agents-course/unit0/introduction) ·
[HF Agents Course — Unit 1 certificate](https://huggingface.co/learn/agents-course/unit1/get-your-certificate) ·
[HF Agents Course — final unit / GAIA](https://huggingface.co/learn/agents-course/en/unit4/introduction) ·
[AgenticPrep.io](https://www.agenticprep.io/) ·
[Maven — AI Evals for Engineers & PMs](https://maven.com/parlance-labs/evals) ·
[LLM Zoomcamp](https://datatalks.club/blog/llm-zoomcamp.html) ·
[DataTalks.Club — certification](https://datatalks.club/docs/courses/zoomcamp-logistics/certification/) ·
[LangChain Academy](https://academy.langchain.com/) ·
[Claude certifications guide (2026)](https://claudecertificationguide.com/blog/new-claude-certifications-2026) ·
[Spectrum AI Lab — all four Anthropic exams](https://spectrumailab.com/blog/claude-certification-exams-2026)

Adversarial / self-verifying challenges:
[Prompt injection game alternatives](https://prompttrace.airedlab.com/blog/prompt-injection-game-alternatives) ·
[Gandalf writeup](https://github.com/tpai/gandalf-prompt-injection-writeup)

Autograding reliability & spaced repetition:
[LLM-as-Judge in Education: curriculum-grounded marking](https://arxiv.org/html/2606.17507) ·
[Rubric-Conditioned LLM Grading](https://arxiv.org/html/2601.08843) ·
[Autorubric](https://arxiv.org/html/2603.00077v1) ·
[Grading scale impact on LLM-as-a-Judge](https://arxiv.org/pdf/2601.03444) ·
[fsrs4anki tutorial](https://github.com/open-spaced-repetition/fsrs4anki/blob/main/docs/tutorial.md) ·
[FSRS vs SM-2 comparison](https://deepwiki.com/open-spaced-repetition/fsrs-optimizer/7.3-comparison-with-sm-2)
