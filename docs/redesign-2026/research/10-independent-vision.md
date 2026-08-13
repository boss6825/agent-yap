# 10 — Independent Vision

> The founder asked directly: *"if you were allowed to think independently, what
> features would you introduce that would bring more and more users?"*
>
> This document ignores the constraints where I think they are wrong, and says so
> each time. It is deliberately more opinionated than reports 07–09. Everything
> here is optional; nothing here is on the critical path.

---

## 0. The uncomfortable premise

Before the feature list, the thing that decides whether any of it matters.

**Agent YAP's current differentiation is "well-written text about agents". That is
not defensible.** Not because the writing is bad — 196,000 words at this quality
is a real asset — but because in 2026 the marginal cost of well-written text
about agents is approximately zero, and the competition includes Anthropic's own
docs, Hugging Face's free course, Lilian Weng, and any frontier model asked
nicely. Report 04 makes this concrete: DeepLearning.AI occupies exactly this
position — excellent content, zero assessment — and it means competing on content
quality forever, against Andrew Ng.

**The three things that *are* defensible, ranked:**

1. **A verdict.** "You think you understand context engineering. Here are eleven
   traces. You got four." No LLM gives you that, because an LLM will not tell you
   you are wrong about yourself. This is the founder's instinct and it is correct.
2. **A corpus that is *complete and opinionated*.** Not "articles about agents"
   but "the twenty things, in order, with the arguments on both sides". Report 01
   found the raw material for this already on disk — including a 20-module
   prerequisite DAG derivable from existing files.
3. **Being the thing other agents read.** This is the one nobody is doing and the
   one this project is uniquely positioned for. See idea 1.

Everything below is downstream of one of those three. Anything that is not, I cut.

---

## 1. The ideas

### 1. Be the curriculum that agents teach from — an MCP server over the corpus

**One sentence.** Publish Agent YAP as an MCP server so that any coding agent —
Claude Code, Cursor, Codex — can pull an authoritative chapter or check into its
own context while a developer is building an agent.

**The pain.** A developer building an agent asks their coding agent "should I use
RAG or long context here?" The agent answers from weights: confidently, plausibly,
and with no citation. Meanwhile the correct, nuanced, tradeoff-first answer is
sitting in `content/architecture-and-system-design/chapter-07-retrieval-strategies.md`
and neither of them knows it exists.

**Why it brings *new* users.** It inverts distribution. Instead of a human finding
the site and choosing to read, the site arrives *inside the tool where the work is
happening*, at the exact moment the question is live. Every citation the agent
emits is an impression, attributed, in a context where the reader is maximally
motivated. This is SEO for the post-search era, and the repo has already
half-built it: `llms.txt` and `llms-full.txt` ship today
([src/app/llms.txt/route.ts](src/app/llms.txt/route.ts)).

**Minimum shippable.** A single-file MCP server exposing three tools —
`search_agent_knowledge(query)`, `get_chapter(slug)`, `get_check(topic)` — over the
existing BM25 index in `src/lib/search.ts`. Publish as `npx agent-yap-mcp`. Perhaps
300 lines.

**Cost:** S. **Risk:** MCP client adoption is the whole bet; if developers do not
install third-party MCP servers for reference material, this is a beautifully
engineered no-op. **Constraint violated:** none.

**This is my top pick and I do not think it is close.**

### 2. Trace Gym — the daily broken agent

**One sentence.** One authored, broken agent trace per day at `/gym`, permanently
free, no signup, with a shareable result — "I found the break at step 6, did you?"

**The pain.** Nobody practises reading traces. It is the highest-frequency real
task in AI engineering and there is no gym for it anywhere.

**Why new users.** It is the only genuinely shareable artefact in this design
space. Report 04's clearest evidence: Gandalf (Lakera's prompt-injection game)
runs free with no signup, ~8% of players beat level 7, and it became the single
most-shared educational artefact in AI security. Trace Gym is Gandalf's structure
applied to the thing this site actually teaches — and unlike Gandalf it needs no
model calls, because the trace is authored.

**Minimum shippable.** 30 traces, one per day, cycling. `/gym` is one page. Result
is a text string, not an image: *"Trace Gym #14 — step 6/12 · reason ✓"*. Text
shares better than OG images in developer channels and costs nothing to generate.

**Cost:** S given report 07's trace renderer. **Risk:** authoring 30 good traces
is real work; a bad trace teaches a wrong lesson. **Violates:** the plan.md
"no daily challenge" tension (CR-2026-013) — and I think that non-goal is wrong
here, because this is a *shareable artefact*, not a retention mechanic. No streak,
no penalty for missing a day.

### 3. Bring your own agent — grade a real agent against our rubric

**One sentence.** Paste an agent trace from *your* project (Langfuse export,
OpenTelemetry span, or raw JSON) and the site annotates it against the failure
taxonomy — client-side, nothing uploaded.

**The pain.** People finish a course and cannot connect it to their own broken
system. This closes the gap in one step.

**Why new users.** "Paste your agent trace, get a free review" is a self-explaining
value proposition that needs no course. It is also a legitimate reason for a team
to share the link internally.

**Minimum shippable.** A deterministic linter, in the browser: 12 heuristics over
a normalised trace shape (no tool timeout declared · retry without jitter · same
tool called twice with identical args · observation truncated silently · step count
approaching a stated max · no error contract on a failed call · unbounded array in
a tool result). Each finding cites the chapter that explains it. **No model call at
all.**

**Cost:** M. **Risk:** trace formats are a zoo; support two and say so. **Violates:**
nothing — it is pure client-side.

**This is the strongest bridge between the reading and the reader's actual job.**

### 4. The Argument Map — the site's real intellectual differentiator

**One sentence.** For each genuinely contested question in agentic AI, a page
showing the strongest case on each side, who holds it, and what evidence would
settle it.

**The pain.** Every other resource picks a side and pretends the question is
closed. "Should you build multi-agent systems?" has Cognition arguing no and
Anthropic arguing yes, in public, with reasons.

**Why new users.** This is the most linkable content type on the internet.
`content/multi-agent/` **already contains this material** — chapters 2, 3, 4 and 5
are literally "the case for", "the case against", "why they fail", "reconciling
the debate", and the `sources/` folder holds both original posts. It exists; it
just is not presented as the thing it is.

**Minimum shippable.** Three argument maps: multi-agent yes/no · RAG vs long
context · framework vs from-scratch. One page each, two columns, a verdict line
that says what would change our mind.

**Cost:** S (content exists). **Risk:** none. **Violates:** nothing.

**Cheapest high-status content move available.** It positions the site as
intellectually serious rather than instructional.

### 5. `npx agent-yap` — the corpus in the terminal

**One sentence.** A CLI that searches the corpus and prints a chapter in the
terminal, where the audience already lives.

**Why new users.** A `npx` one-liner is the most shareable artefact in developer
culture, it appears in dotfiles and team wikis, and npm downloads are a public
credibility number. It also makes the corpus available offline.

**Minimum shippable.** `npx agent-yap search "context rot"` /
`npx agent-yap read context-engineering/03`. Ships the markdown as a bundled
payload — no network, no server. Perhaps 200 lines.

**Cost:** S. **Risk:** low value per user; high value as a signal. **Violates:** nothing.

### 6. One concept a day, by email — and only that

**One sentence.** A daily email with one takeaway, one check, one link — no
newsletter, no roundup, no "hey folks".

**Why new users.** Email is the only channel that survives an algorithm change,
and forwarding is the highest-intent referral there is. The content already
exists: report 01 found ~425 `Key takeaways` bullets and 490 MCQs on disk. That is
well over a year of daily sends, harvestable by script.

**Cost:** S (Resend + a static queue). **Risk:** a daily cadence you cannot
sustain is worse than none — but here the queue is pre-generated, so it is
sustainable by construction. **Violates:** "no auth" in spirit (email is an
identity) — mitigate by never linking the address to progress.

### 7. Failure Postmortems — the incident library

**One sentence.** Ten real, cited, public agent failures written up like SRE
postmortems: timeline, root cause, the taxonomy label, the fix, the eval that
would have caught it.

**Why new users.** War stories are read and shared at a rate tutorials never
match, and this format is unclaimed in the agent space. It also feeds `trace` and
`classify` items directly, so the content does double duty.

**Cost:** M (research-heavy). **Risk:** accuracy and fairness — only cite public
post-hoc accounts, never speculate about a named company's internals.

### 8. Read the paper with me

**One sentence.** A guided pass through one landmark paper per month: the PDF
beside a slide-by-slide explanation and three checks.

**Why new users.** Report 01 found `content/research papers/` holds 17 explainers
plus ~20 PDFs, and characterised those explainers as **the most beginner-accessible
prose in the whole repo** — currently buried three directory levels deep. Paper
explainers are also the highest-authority content type in ML circles.

**Cost:** S to surface what exists; M per new paper. **Risk:** none. **Note:** it
carries an attribution obligation — the existing index credits an external
curator, and that credit must stay visible.

### 9. Interview Loop mode

**One sentence.** A timed 45-minute simulation of an AI-engineering interview
loop: one system-design scenario, four trace items, two cost questions, a report
at the end.

**Why new users.** "AI engineer interview prep" is a high-intent, high-volume
search term with one weak incumbent (AgenticPrep, 43 problems, code-only). This
targets the 80% of those interviews that are *not* coding.

**Cost:** M (mostly item authoring). **Risk:** interview-prep positioning attracts
a churny audience — report 04 flags exactly this in the Exercism case study. Keep
it a *mode*, never the homepage.

### 10. Embeddable check widget

**One sentence.** A one-line `<script>` (or iframe) that drops a single check into
someone else's blog post or internal wiki, attributed.

**Why new users.** Every embed is a permanent, contextual backlink placed by
someone else — the only distribution mechanic that compounds without ongoing
effort.

**Cost:** M (needs an isolated bundle and a stable embed contract). **Risk:**
low usage unless someone asks for it. **Ship on request, not speculatively.**

### 11. Design Review — the highest-ceiling idea here

**One sentence.** Describe the agent you are about to build in five dropdowns
(task type, latency budget, tool count, memory need, tenancy), and get back a
one-page architecture with citations, tradeoffs, and the three failure modes most
likely to hit you.

**Why new users.** It converts a reading site into a *tool you use at work*.
Deterministic version: a lookup table over the reference architecture in
`chapter-18-reference-architecture.md`, which already exists. No model call
required for v1.

**Cost:** M. **Risk:** a generic answer is worse than none; the rule set has to be
genuinely opinionated. **Violates:** nothing (deterministic version).

### 12. India-first, explicitly

**One sentence.** Price, examples, and compliance content written for the market
the founder is actually in: DPDP instead of only GDPR, rupee cost examples, and
the latency reality of serving from Indian regions.

**Why new users.** Report 01 verified the gap: `DPDP` 0, `PII` 0, `GDPR` 0 across
the entire corpus, in a chapter (`ch17-domain-and-compliance`) written
domain-generically. India has one of the largest and fastest-growing populations
of AI engineers and almost no content written for its regulatory and cost reality.
This is a genuine, ownable, uncontested position — and the team is native to it.

**Cost:** S–M (authoring). **Risk:** none. **This is the most under-valued idea on
the list and the one I would push hardest after the MCP server.**

### 13. A credential that is actually credible

**One sentence.** One hard exam — 40 items, 60 minutes, ~35% pass rate,
published pass rate — and nothing else called a certificate.

**Why new users.** Report 04 §1.20: Anthropic's certifications require a
company email tied to a Partner Network org. **There is no free, open, self-serve
way to find out whether you actually know this.** That gap is wide and the
audience for "prove it to yourself" is larger than the audience for "prove it to
an employer".

**Cost:** M. **Risk:** high. A credential is only worth what its difficulty
signals, and difficulty must be maintained forever. **Violates:** "no auth" — a
verifiable credential needs an identity. **Do not ship this until (a) the item
bank is large and calibrated and (b) there is a reason to draw a crowd.**

### 14. Teach-back mode — honestly self-graded

**One sentence.** "Explain compaction in your own words" → write freely → then see
a model answer plus a three-point rubric you score yourself against.

**Why it is here despite being weak.** The Feynman technique is the
best-evidenced learning method that fits a text site, and this is the only
implementation that does not need an LLM judge (κ≈0.64 human agreement makes that
a learner-quitting rate). **It must be labelled self-graded and must never feed
mastery.**

**Cost:** S. **Risk:** self-graded work is skipped by most people. That is
acceptable — it costs almost nothing.

### 15. Open the corpus, keep the product

**One sentence.** Make `content/` a public repo under CC-BY with PRs welcome,
while `src/` stays the product.

**Why new users.** Report 04 found `roadmap.sh`'s and Exercism's growth is
substantially community-authored. A public content repo is a distribution channel,
a credibility signal, a contributor funnel, and free proofreading. It also unlocks
the "public repo" precondition already noted as an open question in
`docs/growth/00-master-plan.md` (Q2).

**Cost:** S mechanically, M in review load. **Risk:** PR review becomes a job, and
quality dilution is the failure mode that kills community content (Codewars'
uneven kata quality is report 04's example). **Mitigate:** contributions accepted
only against the gap list, and every PR needs the frontmatter schema.

---

## 2. Impact × effort

```
             LOW EFFORT                     HIGH EFFORT
      ┌──────────────────────────┬──────────────────────────┐
 HIGH │  1  MCP server           │  3  Bring your own agent │
IMPACT│  4  Argument maps        │  11 Design Review        │
      │  2  Trace Gym            │  9  Interview Loop       │
      │  12 India-first          │  7  Failure postmortems  │
      │  8  Read the paper       │  15 Open the corpus      │
      ├──────────────────────────┼──────────────────────────┤
 LOW  │  5  npx CLI              │  13 Credential           │
IMPACT│  6  Daily email          │  10 Embed widget         │
      │  14 Teach-back           │                          │
      └──────────────────────────┴──────────────────────────┘
```

**Top three, with reasons:**

1. **MCP server (1).** The only idea that changes the *distribution model* rather
   than the product. Roughly 300 lines over an index that already exists. In a
   world where developers increasingly reach information through an agent, being
   the source the agent cites is worth more than any amount of SEO.
2. **Argument maps (4).** The content is already written and sitting in
   `content/multi-agent/`. It is the cheapest move from "tutorial site" to
   "the place where this field's real disagreements are documented", and status is
   what makes people link to you.
3. **Trace Gym (2).** The only shareable artefact in the plan, with Gandalf as
   direct precedent for exactly how far this format travels. Requires the trace
   renderer, which report 07 is building anyway.

---

## 3. The differentiation thesis

> **Why use Agent YAP over ChatGPT, a YouTube course, or the Anthropic docs?**

*ChatGPT* will answer any question about agents and will never tell you that your
mental model is wrong, because it does not know what your mental model is and it is
optimised to be agreeable. Agent YAP's product is the verdict: a set of authored
artefacts — traces, budgets, schemas — where exactly one answer survives the stated
constraints, so being wrong is unambiguous and therefore informative. **You cannot
get graded by something that wants you to like it.**

*A YouTube course* teaches one stack at one moment. This corpus is
framework-agnostic and argument-first: it teaches the tradeoff, then shows who
argues each side. That survives the next framework.

*The Anthropic docs* are excellent and are, correctly, about Anthropic's products.
Nobody's first-party docs will tell you when not to use their product, or compare
their harness to Codex's, or explain why Cognition thinks multi-agent is a
mistake. `content/` already does all three.

**Where the thesis is currently weakest, stated plainly:** none of that is true
*today*. Today the site is a well-written single book with no assessment, no
argument framing, and 75% of its own material unreachable. The thesis becomes
answerable when three things are true: the checks exist and produce a verdict, the
argument maps are published, and the corpus is complete enough that "the twenty
things, in order" is not aspirational. Reports 07 and 13 are what make it
answerable; this document is what makes it *interesting* once it is.

---

## 4. How the top three spread

| Idea | Distribution mechanic built into the feature |
|---|---|
| **MCP server** | Every agent citation is an attributed impression inside a developer's editor. Growth is a function of MCP installs, and the install is a one-liner in a README that other people copy. |
| **Argument maps** | Purpose-built for the "actually, both sides have a point" reply on HN/X — the highest-engagement comment shape in technical discourse. Each map is a canonical URL people reach for in an argument. |
| **Trace Gym** | The result string is the share. `Trace Gym #14 — step 6/12` is a puzzle-score format people already know how to post, and it is a *challenge* to the reader rather than a boast. Gandalf's ~8%-beat-level-7 statistic is the proof this travels. |

---

## 5. Business model, bluntly

| Model | Verdict for a small team |
|---|---|
| **Free forever, reputation as the return** | **Correct for the next 12 months.** The asset being built is authority; a paywall at this stage caps the only thing that compounds. |
| **Sponsorship (one sponsor, one line per module)** | Realistic once traffic is real. Observability and eval vendors are the natural buyers and the audience is precisely their ICP. Least intrusive money available. |
| **Paid credential (£20–40, one hard exam)** | Realistic, and the only thing here people genuinely pay for individually. Needs a calibrated item bank first. |
| **Team licence (private cohort dashboard, internal deployment)** | The realistic revenue line. Companies onboarding engineers onto agent work will pay per-seat for "does my team actually know this". Needs auth — which is the *one* justification for building it. |
| **Paid content tiers** | **Reject.** It would gate the corpus, which is the distribution engine, and it directly contradicts the free-and-open guardrail in `docs/growth/00-master-plan.md`. |
| **Ads** | **Reject.** Destroys the minimalism that is the brand. |

**Where free stops:** the corpus and every check stay free permanently. Money, if
it comes, comes from (a) sponsorship, (b) one paid credential, (c) team licences.
In that order.

---

## 6. What I would cut from the current plan

Independent thinking cuts as well as adds:

- **`/practice` as a destination in v1.** Inline checks in the reader prove the
  value; a separate practice surface can wait for evidence that anyone wants one.
  Cutting it removes a whole route tree and a filter UI.
- **The `budget` widget in v1.** It is the signature mechanic and I would still
  defer it. It is the only custom widget on the list, and it should be built when
  there is an audience to show it to, not before.
- **`/review` as its own page.** One line at the top of `/path` — *"6 due"* — does
  the same job.
- **The five templates, down to three, for v1.** `foundations` (the default),
  `debug`, and `ship`. `interview` and `current` are real audiences, but three
  genuinely different products is already ambitious, and `debug` is the most
  differentiated of the five — report 08 flags its content readiness as **red**,
  which makes it the one to build content for rather than the one to skip.

Cut ruthlessly here and the assessment layer ships months earlier, which is what
determines whether any of section 1 ever gets built.
