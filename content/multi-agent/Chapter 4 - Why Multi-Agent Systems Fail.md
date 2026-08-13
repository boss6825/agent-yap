# Chapter 4: Why Multi-Agent Systems Fail: The MAST Taxonomy

This chapter explains "Why Do Multi-Agent LLM Systems Fail?" by Anna Alexandra Grigoryan, which summarizes a research paper that set out to study failure systematically. Where Chapter 3 argued from principles that multi-agent systems are fragile, this chapter brings evidence: a careful, data-driven catalog of how they actually break, and a method for diagnosing your own system.

## The motivating puzzle

Multi-agent systems are appealing in theory. They promise modular reasoning, distributed workload, and emergent coordination, with agents specialized in planning, coding, reviewing, tool use, and verification. Yet in practice their performance is inconsistent. Across tasks like code generation, web interaction, and software simulation, many multi-agent systems perform worse than a strong single agent, or even worse than simple best-of-N sampling (just running one model several times and picking the best answer).

The sharpest finding: these failures cannot be blamed on the model. In several cases the very same model in a single-agent setup outperforms the multi-agent version. That tells you the problem is architectural, in communication, coordination, and workflow orchestration, not a matter of the model being too weak. The paper's framing line is that coordination, not capability, is what breaks multi-agent systems.

## The contributions, in plain terms

The paper makes three contributions:

1. MAST, a Multi-Agent System Failure Taxonomy: a careful catalog of 14 failure modes grouped into three categories.
2. An [LLM-as-a-judge](../glossary/Glossary.md#llm-as-a-judge) method that automatically labels failures according to MAST, reaching about 94 percent accuracy and strong agreement with human experts (a Cohen's Kappa of 0.77, which is a statistical measure of agreement beyond chance).
3. Case studies showing that you can improve real systems by fixing the failure modes MAST reveals, rather than just reaching for a bigger model.

The taxonomy itself was not invented from a whiteboard. It came from manually annotating over 200 execution traces, each averaging more than 15,000 tokens, using a careful method (grounded theory) and refining the categories until annotators agreed with each other. That grounding is what makes the taxonomy credible.

## The three categories of failure

MAST sorts its 14 failure modes by the stage of the agent lifecycle where they originate: before execution, during execution, and after execution.

### 1. Specification issues (about 41.8 percent of failures)

These come from a flawed setup: poor prompt design, missing role constraints, or no clear stopping criteria. Representative modes include:

- Disobeying the task specification.
- Repeating steps that were already completed.
- Losing track of the conversation history.
- Failing to recognize when the task is actually done.

This is the largest category, which is a striking result on its own: the single biggest source of failure is how the system was specified and set up, before any agent even starts talking to another.

### 2. Inter-agent misalignment (about 36.9 percent)

These happen during execution, from miscommunication, conflicting assumptions, or context that never gets passed along. Examples include:

- Ignoring what other agents said.
- Proceeding without asking for clarification.
- Resetting conversations unexpectedly.
- A mismatch between what an agent reasons and what it actually does.

This category is essentially the empirical confirmation of Cognition's Principle 2 from Chapter 3: conflicting hidden decisions and unshared context are not just a theoretical worry, they account for over a third of observed failures.

### 3. Task verification failures (about 21.3 percent)

These come from weak quality control at the end:

- Ending the task too early.
- Skipping validation entirely.
- Accepting an incorrect solution because the check was shallow.

The article highlights a recurring pattern here: many systems do include a verifier agent, but its checks are superficial. Code is accepted just because it compiles. A program is assumed correct because its comments look consistent. That is not real verification.

An important note: many traces contain several failure modes at once, which is why the paper argues for structured diagnosis rather than ad hoc inspection.

## A practical fix: layered verification

One of the most actionable recommendations is that verification should be layered and integrated, not a single shallow pass:

- Low level: syntax and execution (does it run?).
- Mid level: behavioral checks and task-specific logic (does it do the right thing?).
- High level: alignment with the user's actual intent or objective success (is it what was wanted?).

Adding these layers requires real architectural changes and sometimes symbolic checks, not just more instructions in a prompt. This connects directly to the "Intern Test" idea from the context-engineering material: prefer hard, computable checks.

## How to use MAST on your own system

The article gives a concrete recipe, which is the practical heart of the piece:

1. Collect execution traces. Instrument your system to save complete conversation histories, including all messages between agents and with the environment, across a variety of task types and difficulty levels.
2. Set up the MAST annotator. Use the published MAST repository as a base, and prompt a capable model with the full list of failure-mode definitions plus a few example traces (this is few-shot prompting).
3. Annotate your traces. Run them through the annotator to label each with the failure modes present, and manually validate a subset to check reliability.
4. Analyze the distribution. Ask which failures are most common, whether they cluster in one phase (coordination versus verification), and which agents propagate the most errors.
5. Design targeted interventions. Focus on the high-frequency failure types: add clarification strategies if agents proceed without asking; add domain-aware test cases if verification is weak; reorder agent responsibilities if specification issues dominate.
6. Re-run and compare. Use the same pipeline after your changes, and compare both the overall success rate and the shift in the failure distribution.

This turns failure analysis from guesswork into a repeatable engineering loop, the same way traditional software is profiled and optimized.

## The big-picture lesson

The most important takeaway is the one stated up front: improving a multi-agent system is mostly about better orchestration, not bigger models or more tokens. Many failures come from agents operating on incorrect assumptions, ignoring peer input, or failing to verify their outputs, all of which are design problems. The article's broader contribution is to move the whole conversation from anecdote ("multi-agent systems are flaky") to diagnosis ("here is exactly which of 14 failure modes is hurting your system, and here is how to measure improvement").

## Key takeaways

- Multi-agent systems often underperform a single agent using the same model, which proves the problem is coordination, not capability.
- MAST catalogs 14 failure modes in three groups: specification issues (about 42 percent), inter-agent misalignment (about 37 percent), and verification failures (about 21 percent).
- Specification issues are the largest single source of failure, meaning setup and role clarity matter enormously.
- Verifier agents often exist but check too shallowly; verification should be layered (syntax, behavior, intent).
- MAST plus an LLM judge gives a repeatable loop: collect traces, annotate, find dominant failures, intervene, re-measure.
- Fixing orchestration beats reaching for a bigger model.

Continue to Chapter 5, which reconciles the for and against arguments into a single coherent view.

## Review

**Quick Check**

1. What does MAST stand for and contain?
   - A) A benchmark of 14 multi-agent tasks
   - B) A Multi-Agent System Failure Taxonomy cataloguing 14 failure modes in three categories
   - C) A scoring rubric for LLM judges
   - D) A framework for building orchestrator-worker systems
   <details><summary>Answer</summary>B) A Multi-Agent System Failure Taxonomy - 14 failure modes grouped into three categories by the stage of the agent lifecycle where they originate.</details>

2. Which category accounts for the largest share of observed failures?
   - A) Specification issues, about 41.8 percent
   - B) Inter-agent misalignment, about 36.9 percent
   - C) Task verification failures, about 21.3 percent
   - D) Model capability limits, about 50 percent
   <details><summary>Answer</summary>A) Specification issues, about 41.8 percent - flawed setup: poor prompt design, missing role constraints, no clear stopping criteria.</details>

3. How well does the paper's LLM-as-a-judge annotator perform?
   - A) About 70 percent accuracy with no agreement measure reported
   - B) About 94 percent accuracy, with a Cohen's Kappa of 0.77 against human experts
   - C) About 99 percent accuracy, exceeding human annotators
   - D) Accuracy was not measured; only speed was
   <details><summary>Answer</summary>B) About 94 percent accuracy and a Cohen's Kappa of 0.77 - a statistical measure of agreement beyond chance.</details>

4. What does the chapter mean by layered verification?
   - A) Running the verifier agent multiple times and taking a majority vote
   - B) Low level syntax and execution, mid level behavioral and task-specific logic, high level alignment with the user's actual intent
   - C) Verifying at each agent boundary rather than only at the end
   - D) Having a second model rewrite the output before checking it
   <details><summary>Answer</summary>B) Low level (does it run?), mid level (does it do the right thing?), and high level (is it what was wanted?) - and adding these requires real architectural changes, sometimes symbolic checks, not just more prompt instructions.</details>

5. Your verifier agent marks a coding task complete because the code compiles. Which MAST category is this, and what is the diagnosis?
   - A) Specification issues - the stopping criteria were never defined
   - B) Inter-agent misalignment - the verifier ignored the coder
   - C) Task verification failure - the check is superficial, accepting an incorrect solution because the check was shallow
   - D) None; compiling is a legitimate completion signal
   <details><summary>Answer</summary>C) A task verification failure - the article highlights exactly this pattern, where a verifier agent exists but code is accepted just because it compiles, or a program is assumed correct because its comments look consistent.</details>

**More Questions**

6. Which failures fall under inter-agent misalignment?
   - A) Disobeying the task specification and repeating completed steps
   - B) Ignoring what other agents said, proceeding without asking for clarification, resetting conversations unexpectedly, and reasoning that mismatches action
   - C) Ending the task too early and skipping validation
   - D) Exceeding the context window and losing tool outputs
   <details><summary>Answer</summary>B) Those four - at about 36.9 percent of failures, this category is the empirical confirmation of Cognition's Principle 2 from Chapter 3.</details>

7. What share of failures are task verification failures, and what do they look like?
   - A) About 21.3 percent: ending the task too early, skipping validation, accepting an incorrect solution after a shallow check
   - B) About 36.9 percent: conflicting assumptions between agents
   - C) About 41.8 percent: missing role constraints
   - D) About 10 percent: tool call errors
   <details><summary>Answer</summary>A) About 21.3 percent - weak quality control at the end of the lifecycle.</details>

8. How was the taxonomy actually built?
   - A) Derived from first principles by the authors
   - B) By manually annotating over 200 execution traces averaging more than 15,000 tokens each, using grounded theory and refining categories until annotators agreed
   - C) By clustering error messages from production logs
   - D) By surveying practitioners about their worst outages
   <details><summary>Answer</summary>B) Over 200 manually annotated traces averaging 15,000+ tokens, using grounded theory with categories refined until annotators agreed - that grounding is what makes the taxonomy credible.</details>

9. Why does the paper conclude the problem is architectural rather than a model weakness?
   - A) Because larger models failed more often
   - B) Because the same model in a single-agent setup outperforms the multi-agent version in several cases
   - C) Because failures disappeared when temperature was lowered
   - D) Because the failures only occurred with open-weight models
   <details><summary>Answer</summary>B) The same model single-agent beats the multi-agent version in several cases - which is why the framing line is that coordination, not capability, is what breaks multi-agent systems.</details>

10. You have annotated your traces and found that specification issues dominate. Which intervention does the recipe suggest?
    - A) Add domain-aware test cases
    - B) Add clarification strategies so agents stop proceeding without asking
    - C) Reorder agent responsibilities
    - D) Switch to a larger model and re-annotate
    <details><summary>Answer</summary>C) Reorder agent responsibilities - the recipe pairs each dominant failure type with a targeted fix: clarification strategies when agents proceed without asking, domain-aware test cases when verification is weak, and reordering responsibilities when specification issues dominate.</details>

**Think About It**

1. Multi-agent systems sometimes lose not just to a strong single agent but to best-of-N sampling - running one model several times and picking the best answer. Why is that particular comparison so damaging?
<details><summary>Show answer</summary>
Because best-of-N is the least sophisticated thing you can do with extra compute. It has no planning, no specialization, no coordination, no roles - just the same model, several times over. If an architecture built out of planners, coders, reviewers, tool users, and verifiers cannot beat that, then all the structure you added is not merely failing to help, it is actively costing you. And since in several cases the very same model in a single-agent setup outperforms the multi-agent version, you cannot explain the gap away as the model being too weak. The structure itself is where the loss comes from - which is what makes the problem architectural, and fixable by design rather than by waiting for a better model.
</details>

2. You would expect a multi-agent system's failures to be mostly about agents talking to each other. The largest category is something else. What, and why is that surprising?
<details><summary>Show answer</summary>
Specification issues - about 41.8 percent, larger than inter-agent misalignment's 36.9 percent. These originate before execution: poor prompt design, missing role constraints, no clear stopping criteria, which surface as agents disobeying the task spec, repeating completed steps, losing track of history, or failing to recognise when the task is done. The surprise is that the single biggest source of failure lands before any agent has said a word to another one. It reframes where you should spend effort: the instinct is to invest in better inter-agent protocols and message passing, but the data says the bigger win is in how carefully you specified roles, boundaries, and stopping conditions in the first place.
</details>

3. Most of these systems already had a verifier agent. So why did verification failures still account for over a fifth of the total?
<details><summary>Show answer</summary>
Because having a verifier and verifying are different things. The recurring pattern the article highlights is that the checks are superficial: code gets accepted because it compiles, a program is assumed correct because its comments look consistent. That is a check that confirms the output exists in a well-formed state, not that it is right - and it produces a system that feels safeguarded while being no safer. The fix is not a better-worded verifier prompt but layered verification: syntax and execution at the low level, behavioral and task-specific logic at the mid level, alignment with the user's actual intent at the high level. Getting those layers requires real architectural changes and sometimes symbolic checks, which is exactly why so many systems settle for the shallow version.
</details>

4. The taxonomy came out of hand-annotating 200-plus traces, each averaging over 15,000 tokens. That is an enormous amount of tedious work for a list of 14 categories. Why does the provenance matter?
<details><summary>Show answer</summary>
Because the alternative - a plausible taxonomy invented on a whiteboard - would give you categories that sound right and don't carve the problem at its joints, and you'd never know. Building it bottom-up from real execution traces using grounded theory, with categories refined until independent annotators agreed with each other, is what makes the percentages meaningful rather than decorative. It is also what makes the automated annotator trustworthy: you can only claim 94 percent accuracy and a Kappa of 0.77 against a human-labelled ground truth that was built carefully. The payoff is the shift the article is really arguing for - from anecdote ("multi-agent systems are flaky") to diagnosis ("here is which of 14 failure modes is hurting you, and here is how to measure whether your fix worked").
</details>

**Coding Challenge**

**Build a MAST failure profiler**

Write a `profile(traces)` function that takes a list of traces, where each trace is a list of failure-mode names, and returns the percentage of traces exhibiting each MAST category plus the dominant category and its suggested intervention. Note that a single trace can contain several failure modes at once, so count a trace once per category it touches, not once overall.

<details>
<summary>Python Solution</summary>

```python
CATEGORY = {
    "disobey_task_spec": "specification",
    "repeat_completed_step": "specification",
    "lose_history": "specification",
    "miss_termination": "specification",
    "ignore_other_agent": "misalignment",
    "no_clarification": "misalignment",
    "unexpected_reset": "misalignment",
    "reason_action_mismatch": "misalignment",
    "premature_end": "verification",
    "skip_validation": "verification",
    "shallow_check": "verification",
}

INTERVENTION = {
    "specification": "reorder agent responsibilities and tighten roles/stopping criteria",
    "misalignment": "add clarification strategies before agents proceed",
    "verification": "add layered, domain-aware checks (syntax, behavior, intent)",
}


def profile(traces):
    total = len(traces)
    counts = {c: 0 for c in INTERVENTION}
    for trace in traces:
        for category in {CATEGORY[m] for m in trace if m in CATEGORY}:
            counts[category] += 1

    pct = {c: round(100 * n / total, 1) for c, n in counts.items()} if total else counts
    dominant = max(pct, key=pct.get) if total else None
    return {"pct": pct, "dominant": dominant, "intervention": INTERVENTION.get(dominant)}


print(profile([
    ["disobey_task_spec", "shallow_check"],
    ["miss_termination"],
    ["ignore_other_agent", "no_clarification"],
    ["lose_history", "reason_action_mismatch"],
]))
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
const CATEGORY = {
  disobey_task_spec: "specification",
  repeat_completed_step: "specification",
  lose_history: "specification",
  miss_termination: "specification",
  ignore_other_agent: "misalignment",
  no_clarification: "misalignment",
  unexpected_reset: "misalignment",
  reason_action_mismatch: "misalignment",
  premature_end: "verification",
  skip_validation: "verification",
  shallow_check: "verification",
};

const INTERVENTION = {
  specification: "reorder agent responsibilities and tighten roles/stopping criteria",
  misalignment: "add clarification strategies before agents proceed",
  verification: "add layered, domain-aware checks (syntax, behavior, intent)",
};

function profile(traces) {
  const counts = { specification: 0, misalignment: 0, verification: 0 };
  for (const trace of traces) {
    const cats = new Set(trace.map((m) => CATEGORY[m]).filter(Boolean));
    for (const c of cats) counts[c]++;
  }
  const pct = Object.fromEntries(
    Object.entries(counts).map(([c, n]) => [c, +((100 * n) / traces.length).toFixed(1)])
  );
  const dominant = Object.keys(pct).reduce((a, b) => (pct[a] >= pct[b] ? a : b));
  return { pct, dominant, intervention: INTERVENTION[dominant] };
}

console.log(
  profile([
    ["disobey_task_spec", "shallow_check"],
    ["miss_termination"],
    ["ignore_other_agent", "no_clarification"],
    ["lose_history", "reason_action_mismatch"],
  ])
);
```

</details>
