# Chapter 15: Observability and Evaluation

You cannot improve what you cannot see, and agents are unusually opaque: their behavior is probabilistic, multi-step, and dependent on context you assembled dynamically. This chapter covers two related disciplines, **observability** (seeing what an agent did) and **evaluation** (measuring whether it's any good). Together they turn "it seems to work" into "we know it works and we know when it regresses."

## Why agents are hard to observe

A traditional request is mostly deterministic: same input, same path, same output. An agent turn is none of those. The same prompt can take different paths (different tools, different order), the model's output varies run to run, and the quality is subjective ("was that a good answer?"). So agent observability needs to capture not just *that* something happened, but the full *trajectory*: what context went in, what the model decided, which tools ran with what inputs and outputs, and what came out.

## What to capture: the trace

The unit of agent observability is the **trace**: the complete record of one turn. A good trace includes:

- **Inputs**: the assembled context (system prompt version, the messages, the available tools), the user, the model and settings.
- **Each model call**: the request, the response, token counts (input/output/reasoning), latency, and finish reason.
- **Each tool call**: name, arguments, result (or error), and duration.
- **The loop shape**: how many iterations, in what order.
- **Outputs**: the final answer, emitted structured data (citations), and any artifacts produced.
- **Outcome**: success/failure, and any error details.

The **event timeline** you already build for streaming and persistence (Chapters 8, 9) is most of this for free: it's a structured, ordered record of the turn. Observability often means *also routing that timeline (plus the model-call metadata) to a tracing system* where you can search, aggregate, and inspect it.

## Tooling

Options range from rolling your own (structured logs keyed by a trace id, queryable in your log stack) to dedicated **LLM-observability platforms** that understand traces, spans, token costs, and prompt versions, and give you UIs to drill into a single turn or aggregate across many. Whatever you use, ensure:

- **A correlation id** threads through the whole turn (and ideally the whole conversation) so you can reconstruct it end to end.
- **Token and cost capture** per call, so you can attribute spend (Chapter 14).
- **Searchability** by user, model, tool, outcome, so you can answer "which tool fails most?" or "what did this user's failing turn look like?"

## Logging discipline

Even with a fancy platform, basic logging hygiene matters:

- **Structured, not free-text.** Log key-value fields (turn id, tool, document id, duration) so logs are queryable.
- **Context on every error.** A failure log should say which turn, which tool, which resource, and the error: enough to diagnose without reproducing.
- **Never log secrets** (Chapter 12) or sensitive document content; scrub them.
- **Log decisions, not just outcomes.** "Routed to mid-tier model because user has only a Gemini key" is more useful than "called Gemini."

## From observability to evaluation

Observability tells you what happened; evaluation tells you whether it was *good*. Evaluation is how you avoid the trap where a prompt tweak fixes one case and silently breaks five others.

### Build an eval set

Curate a set of representative inputs with known-good expectations: realistic user messages (and documents) paired with what a correct response looks like. Cover the common cases, the tricky ones, and past bugs (regression cases). This set is your safety net; run it whenever you change a prompt, a tool, or a model.

### What to measure

Agent quality is multi-dimensional. Useful metrics:

- **Task success**: did it accomplish the goal? (Often the hardest to measure automatically; may need a rubric.)
- **Grounding / faithfulness**: are factual claims actually supported by the source? For document agents, are citations correct (right location, verbatim quote)? This is checkable: verify each cited quote appears at the cited location.
- **Format compliance**: did it emit the required structured protocols correctly (parseable citation block, valid cell formats)? Deterministically checkable.
- **Tool-use correctness**: did it call the right tools, with valid arguments, in a sensible order? Did it avoid unnecessary calls?
- **Refusal/safety behavior**: does it refuse what it should and not over-refuse?
- **Cost and latency**: tokens and time per task (a quality regression can hide as a cost regression).

### How to grade

- **Deterministic checks** where possible: does the citation block parse? Do cited quotes match the source? Did it call the expected tool? These are cheap and reliable; prefer them.
- **LLM-as-judge** for subjective quality: use a model to grade an answer against a rubric. Useful at scale, but calibrate it (judges have biases) and spot-check against human judgment.
- **Human review** for the highest-stakes or most subjective cases, and to validate your automated graders.

### Run evals as part of change management

Treat prompts, tool definitions, and model choices as code: when you change them, run the eval set and compare to the baseline. A change that improves your target case but regresses others should be caught *before* it ships, not by users. This is the agent equivalent of a test suite, and it's what lets you iterate on a probabilistic system with confidence.

## Online signals

Beyond offline evals, watch production:

- **Explicit feedback**: thumbs up/down, corrections, regenerations. Aggregate by feature and model.
- **Implicit signals**: did the user accept the agent's proposed edit or reject it? Did they re-ask the same thing (a sign the first answer missed)? Did they abandon mid-turn?
- **Failure and degradation rates**: from your traces, which tools and dependencies fail most, and is it trending.

These tell you what your eval set can't: how the agent performs on the messy distribution of real use. Feed surprising production cases back into the eval set so it keeps reflecting reality.

## The virtuous loop

Observability and evaluation form a loop: traces show you what's happening and surface failures; you turn notable cases into eval examples; evals catch regressions when you change things; production signals reveal new gaps; those become new eval cases. An agent without this loop drifts; every change is a gamble. An agent with it improves steadily and safely. For probabilistic systems, this discipline isn't optional polish; it's how you engineer quality at all.

## Review

**Quick Check**

1. Why are agents unusually hard to observe compared to a traditional request?
   - A) They run on more servers
   - B) Their behavior is probabilistic, multi-step, and depends on context you assembled dynamically
   - C) They don't produce logs
   - D) They only fail silently
   <details><summary>Answer</summary>B) Unlike a deterministic request (same input, same path, same output), an agent turn can take different paths, varies run to run, and its quality is subjective — so you must capture the full trajectory.</details>

2. What is the unit of agent observability?
   - A) The log line
   - B) The trace — the complete record of one turn
   - C) The token count
   - D) The user session
   <details><summary>Answer</summary>B) The trace: the complete record of one turn, including inputs, each model call, each tool call, the loop shape, outputs, and outcome.</details>

3. The chapter says much of a good trace already exists "for free." From what?
   - A) The provider's dashboard
   - B) The event timeline you build for streaming and persistence (Chapters 8, 9)
   - C) The database's query log
   - D) The model's reasoning tokens
   <details><summary>Answer</summary>B) The event timeline built for streaming and persistence is a structured, ordered record of the turn; observability often means also routing it (plus model-call metadata) to a tracing system.</details>

4. What threads through the whole turn so you can reconstruct it end to end?
   - A) The user's email
   - B) A correlation id
   - C) The system prompt version
   - D) The model name
   <details><summary>Answer</summary>B) A correlation id threads through the whole turn (ideally the whole conversation) so you can reconstruct it end to end.</details>

5. What is the difference between observability and evaluation?
   - A) They are the same thing
   - B) Observability tells you what happened; evaluation tells you whether it was *good*
   - C) Observability measures quality; evaluation measures cost
   - D) Evaluation runs in production; observability runs offline
   <details><summary>Answer</summary>B) Observability tells you what happened; evaluation tells you whether it was good — how you avoid a prompt tweak fixing one case and silently breaking five others.</details>

**More Questions**

6. What belongs in an eval set?
   - A) Only the trickiest edge cases
   - B) Representative inputs with known-good expectations — common cases, tricky ones, and past bugs as regression cases
   - C) Random production traffic
   - D) Only cases the agent already passes
   <details><summary>Answer</summary>B) Curate representative inputs paired with what a correct response looks like: common cases, tricky ones, and past bugs (regression cases). Run it whenever you change a prompt, tool, or model.</details>

7. For a document agent, "grounding / faithfulness" is checkable. How?
   - A) Ask the user if they liked the answer
   - B) Verify each cited quote actually appears at the cited location
   - C) Count the number of citations
   - D) Measure the response latency
   <details><summary>Answer</summary>B) Verify each cited quote appears verbatim at the cited location. Grounding is deterministically checkable, which is why the chapter prefers such checks.</details>

8. When should you prefer deterministic checks over LLM-as-judge grading?
   - A) Never; LLM-as-judge is always better
   - B) Whenever possible — does the citation block parse, do cited quotes match, was the expected tool called? They're cheap and reliable
   - C) Only for subjective quality
   - D) Only in production
   <details><summary>Answer</summary>B) Prefer deterministic checks wherever possible — parseable format, matching quotes, correct tool calls — because they're cheap and reliable. Use LLM-as-judge for subjective quality, calibrated and spot-checked.</details>

9. The chapter says to treat prompts, tool definitions, and model choices "as code." What does that imply for change management?
   - A) Store them in a database
   - B) When you change them, run the eval set and compare to the baseline so regressions are caught before they ship
   - C) Never change them once deployed
   - D) Let users vote on changes
   <details><summary>Answer</summary>B) Run the eval set on every change and compare to baseline. A change that improves your target case but regresses others should be caught before it ships — the agent equivalent of a test suite.</details>

10. Which is an *implicit* online signal (as opposed to explicit feedback)?
    - A) A thumbs-down rating
    - B) A written correction
    - C) The user rejecting the agent's proposed edit, or re-asking the same question
    - D) A support ticket
    <details><summary>Answer</summary>C) Implicit signals include accepting vs rejecting a proposed edit, re-asking the same thing (the first answer missed), or abandoning mid-turn. Explicit feedback is thumbs up/down, corrections, regenerations.</details>

**Coding Challenge**

*A deterministic grounding check*

Write `check_citations(source_text, citations)` where each citation is a `(quote, offset)` pair. Return the list of citations that FAIL — i.e. where `source_text` does not contain `quote` starting at exactly `offset`. This implements the chapter's "verify each cited quote appears at the cited location" grounding check.

<details>
<summary>Python Solution</summary>

```python
def check_citations(source_text, citations):
    """Return citations whose quote doesn't appear at its claimed offset."""
    failures = []
    for quote, offset in citations:
        end = offset + len(quote)
        if source_text[offset:end] != quote:   # not verbatim at that location
            failures.append((quote, offset))
    return failures


source = "The pipeline marks the record ready only when every step succeeds."
cites = [
    ("marks the record ready", 13),   # correct location
    ("every step succeeds", 5),       # wrong offset -> fabricated grounding
]

print(check_citations(source, cites))
# [('every step succeeds', 5)]  -> flagged: doesn't match at offset 5
```

</details>

**Think About It**

1. For a normal web service, "it works" usually means the same input reliably produces the same output, and a passing test today means a passing test tomorrow. The chapter argues an agent breaks that assumption so badly that you need a whole discipline (traces + evals) just to know if it's any good. What is it about an agent turn that makes "it seems to work" such a dangerous thing to believe?
   <details><summary>Show answer</summary>An agent turn is non-deterministic on three axes at once: the same prompt can take different paths (different tools, different order), the model's output varies run to run, and "was that a good answer?" is often subjective. So a single successful run tells you almost nothing about the next one — you might have gotten lucky, or hit a path you'll rarely see again. Worse, the usual safety net fails: a prompt tweak that fixes the case in front of you can silently break five others you didn't retest, because there's no compiler or unit test catching the regression. "It seems to work" is dangerous because it's a sample of size one from a distribution you can't see. The trace-plus-eval loop exists to replace that gut feeling with evidence: capture the full trajectory so you can inspect what actually happened, and run a curated eval set on every change so regressions surface before users find them.</details>

2. The chapter treats prompts, tool definitions, and model choices as "code" that deserves a test suite — but grading an agent is trickier than checking a return value. Notice how it splits quality into things like citation-matching (deterministic) versus "was this answer good?" (LLM-as-judge). Why does it push you so hard toward the deterministic checks, and what's the catch with letting a model grade another model?
   <details><summary>Show answer</summary>Deterministic checks — does the citation block parse, does each cited quote appear verbatim at its claimed location, was the expected tool called — are cheap, fast, and reliable: they give the same verdict every time and can't be argued with. That reliability is exactly what you want in a regression gate, so the chapter says to prefer them wherever a quality property can be reduced to something checkable. The catch with LLM-as-judge is that you've introduced a *second* probabilistic component to evaluate the first: judges have biases, can be inconsistent, and can be wrong in correlated ways. It's genuinely useful for subjective quality at scale, but only if you calibrate it and spot-check against human judgment rather than trusting it blindly. The deeper lesson is to convert as much of "quality" as possible into deterministic facts, and reserve fuzzy graders for the genuinely subjective remainder.</details>

3. The chapter describes observability and evaluation as a *loop* — traces feed evals, evals catch regressions, production signals reveal new gaps that become new eval cases — and warns that "an agent without this loop drifts." Drifts toward what, exactly, and why would a system that nobody changed still get worse over time?
   <details><summary>Show answer</summary>"Drift" here is less about the code changing on its own and more about the gap between your agent and reality quietly widening. Every prompt tweak, tool change, or model swap is a gamble that, without evals, you make blind — so quality wanders as changes accumulate, each one fixing a visible case while silently breaking invisible ones. Meanwhile the world moves: real users bring inputs your original test cases never imagined, and an eval set that isn't refreshed stops reflecting how the agent is actually used. So even a "frozen" agent effectively degrades because the distribution around it shifts and you have no instrument detecting it. The loop counters both: production signals (rejected edits, re-asked questions, rising failure rates) surface the new gaps, and folding those surprising cases back into the eval set keeps your safety net reflecting reality. Without the loop you're flying blind on a probabilistic system; with it, you improve steadily and catch regressions before users do.</details>

---

Next: [Chapter 16: Scaling and infrastructure](chapter-16-scaling-infra.md)
