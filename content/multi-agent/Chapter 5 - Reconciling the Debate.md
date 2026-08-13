# Chapter 5: Reconciling the Debate: It Was Never Single versus Multi

This chapter explains Patrick McGuinness's "The AI Agent Architecture Debate," which steps back from the apparent fight between Anthropic and Cognition and shows that both are right. It is the natural closing chapter for this folder, because it turns two opposing articles into one coherent way of thinking.

## The setup: two reports, opposite titles

In mid-2025, two reports landed close together and seemed to contradict each other. Anthropic published "How we built our multi-agent research system," justifying a multi-agent approach (covered in Chapter 2). Cognition published "Don't Build Multi-Agents," arguing for a single agent (covered in Chapter 3). The titles look like a direct clash, and the community treated it as a debate: should agents be single or multi?

McGuinness's answer is that this is a false dichotomy. Both positions are valid, because they are answers to differently shaped problems, and underneath both lies the same real concern: managing context.

## Recapping each side fairly

The article gives a fair summary of both, which is worth restating because it makes the reconciliation click.

Anthropic's research agent uses the [orchestrator-worker pattern](../glossary/Glossary.md#orchestrator-worker-pattern). A lead agent (Claude Opus 4) plans and spawns subagents (Claude Sonnet 4) that search different facets of the query in parallel, then it synthesizes their findings into a cited report. It works because the search-and-retrieve step parallelizes naturally, and because, in Anthropic's own words, multi-agent systems "work mainly because they help spend enough tokens to solve the problem." Parallelizing breaks past the [context window](../glossary/Glossary.md#context-window) and sequential-speed limits of a single agent, letting the system comb through hundreds of sources in minutes. The cost is real: roughly 15 times the [tokens](../glossary/Glossary.md#token) of a chat, plus three kinds of complexity (coordination, debugging, and engineering).

Cognition's Devin uses a single agent. Its case is that multi-agent systems are fragile because partitioning context causes miscommunication: subagents miss the nuance needed to complete subtasks correctly. From this come the two principles from Chapter 3 (share full context, and beware conflicting implicit decisions). Rather than orchestrating multiple agents, Cognition scales a single agent's reach through context compression. McGuinness finds this convincing on its own terms: simpler designs are more reliable, and even Anthropic's account of its struggles confirms that multi-agent systems carry heavy complexity.

## The hinge: both sides are really talking about context

Here is the move that resolves the debate. McGuinness points out that Cognition's whole position centers on how to best manage context. And that is exactly Anthropic's position too. Both companies make clear that a good agent system lives or dies on managing context: the prompts, the tool calls, the data, and the communication between agents. Doing that well is [context engineering](../glossary/Glossary.md#context-engineering).

So the two famous articles are not really arguing about architecture. They are both saying that context engineering is the thing that determines reliability. Cognition's solution is to avoid dividing context at all, for the simplest and most reliable operation. Anthropic's solution is to divide context across subagents but then invest heavily in making the division clean: highly specific instructions to subagents and precise tool definitions, exactly so that miscommunication does not creep in. Anthropic faced the very context problems Cognition warns about, and engineered its way through them. Same problem, two valid strategies.

## Why the tasks dictate the architecture

McGuinness then explains why the two teams reasonably chose differently, using the read-versus-write distinction from Chapter 1.

Anthropic's research agent does a "read" task: it collects and synthesizes information into a report. Read tasks split into independent subtopics, which makes them ideal for an orchestrator-worker design with parallel subagents.

Cognition's Devin does a "write" task: modifying code. Writing requires holding the whole codebase, the prior changes, and the user's directives in one unified context, so that no detail is neglected. Splitting that across parallel agents invites exactly the conflicting-decision failures Cognition warns about.

His conclusion: multi-agent is not a universally superior architecture, it is one that suits research-style workflows that decompose into independent, parallelizable subtasks. For inherently sequential problems, a single capable agent with unified context provides simplicity and reliability. The distinction between Devin and the Research agent is a matter of orchestration, not a fundamental technology difference. Both are built from the same parts: reasoning models, prompts, tools, and data plus memory. They differ only in how they break down and coordinate the work.

## The deeper takeaway: the last mile is the hard part

McGuinness ends on the point that both companies actually share, which is bigger than the architecture question. The real lesson from both is about taking an agent from prototype to production. He quotes the spirit of Anthropic's experience: when building agents, the last mile often becomes most of the journey. Code that works on a developer's machine needs significant engineering to become a reliable production system.

And the summary line that ties this whole folder together: an agent's capability comes from the quality of its context, the curated knowledge it can access, the tools it can operate, and the memory it retains. The most important task in building production agents is providing and supporting proper context. That is context engineering, and it is the common ground beneath the entire single-versus-multi debate.

## How to decide, in practice

Pulling Chapters 1 through 5 together into a decision guide:

- Is the task mostly reading (research, search, broad analysis)? Multi-agent with an orchestrator-worker pattern can pay off, if the value justifies the token cost and you invest in clean delegation.
- Is the task mostly writing (code, a single coherent document)? Prefer a single agent with unified context, and scale it with compression rather than parallelism.
- Is it mixed? Separate the phases: parallel reading, then single-threaded writing.
- Whichever you pick, the deciding factor for reliability is context engineering, supported by real infrastructure and outcome-based evaluation. If you go multi-agent, use MAST (Chapter 4) to find and fix your dominant failure modes.

## Key takeaways

- The single-versus-multi "debate" is a false dichotomy; both Anthropic and Cognition are right for their tasks.
- Both positions reduce to the same core: context engineering decides reliability.
- Cognition avoids dividing context; Anthropic divides it but engineers the division to be clean. Same problem, two valid strategies.
- Task shape decides architecture: read tasks favor multi-agent parallelism, write tasks favor a single unified-context agent.
- The hardest part for both is the last mile from prototype to production, and the common foundation is the quality of the agent's context.

This completes the Multi-Agent chapters. For the context engineering ideas these chapters lean on, see the context engineering folder; for memory, see the agentic memory folder.

## Review

**Quick Check**

1. What is McGuinness's central claim about the single-versus-multi debate?
   - A) Anthropic is right and Cognition overstated its case
   - B) Cognition is right and Anthropic's result does not replicate
   - C) It is a false dichotomy: both positions are valid answers to differently shaped problems
   - D) The debate will be settled once models get larger context windows
   <details><summary>Answer</summary>C) A false dichotomy - both are right, because they are answering differently shaped problems, and underneath both lies the same real concern: managing context.</details>

2. What is the common ground McGuinness identifies beneath both positions?
   - A) Token efficiency
   - B) Context engineering
   - C) Evaluation methodology
   - D) Model selection
   <details><summary>Answer</summary>B) Context engineering - both companies make clear that a good agent system lives or dies on managing context: the prompts, the tool calls, the data, and the communication between agents.</details>

3. How does the chapter contrast the two companies' strategies for handling context?
   - A) Cognition avoids dividing context; Anthropic divides it but invests heavily in making the division clean
   - B) Cognition compresses; Anthropic does not manage context at all
   - C) Anthropic avoids dividing context; Cognition divides it across subagents
   - D) Both divide context, differing only in how many agents they use
   <details><summary>Answer</summary>A) Cognition avoids dividing context for the simplest and most reliable operation; Anthropic divides it across subagents but uses highly specific instructions and precise tool definitions so miscommunication does not creep in. Same problem, two valid strategies.</details>

4. How does the chapter classify each product's task?
   - A) Both are write tasks
   - B) Both are read tasks
   - C) Devin does a write task (modifying code); the Research agent does a read task (collecting and synthesizing information)
   - D) Devin does a read task; the Research agent does a write task, since it produces a report
   <details><summary>Answer</summary>C) Devin modifies code, which requires holding the whole codebase, prior changes, and user directives in one unified context; the Research agent collects and synthesizes information, which splits into independent subtopics.</details>

5. Your product researches suppliers and then generates a single procurement contract. What does the decision guide say?
   - A) Multi-agent throughout, since research dominates the work
   - B) Single agent throughout, since the deliverable is one document
   - C) Separate the phases: parallel reading, then single-threaded writing
   - D) Use a swarm so the phases can overlap
   <details><summary>Answer</summary>C) Separate the phases - the guide handles mixed tasks by doing the reading in parallel and the writing with unified context.</details>

**More Questions**

6. In Anthropic's own words quoted in the chapter, why do multi-agent systems work?
   - A) Because specialization makes each agent more accurate
   - B) Because they "help spend enough tokens to solve the problem"
   - C) Because parallel agents catch each other's mistakes
   - D) Because orchestrators plan better than single agents
   <details><summary>Answer</summary>B) They "work mainly because they help spend enough tokens to solve the problem" - parallelizing breaks past the context window and sequential-speed limits of a single agent.</details>

7. What costs does the chapter attach to Anthropic's approach?
   - A) Roughly 15 times the tokens of a chat, plus coordination, debugging, and engineering complexity
   - B) Roughly 4 times the tokens, plus latency
   - C) Higher latency only, since token costs are amortized
   - D) Increased hallucination rates offset by the citation agent
   <details><summary>Answer</summary>A) Roughly 15 times the tokens of a chat, plus three kinds of complexity: coordination, debugging, and engineering.</details>

8. What does the chapter say distinguishes Devin from the Research agent at a technical level?
   - A) A fundamental technology difference in the models used
   - B) Only orchestration - both are built from the same parts (reasoning models, prompts, tools, and data plus memory) and differ in how they break down and coordinate work
   - C) Devin uses fine-tuned models while Research uses base models
   - D) Research uses retrieval and Devin does not use tools
   <details><summary>Answer</summary>B) A matter of orchestration, not a fundamental technology difference - same parts, different decomposition and coordination.</details>

9. What shared lesson does McGuinness end on, beyond the architecture question?
   - A) That token cost will fall and make the debate moot
   - B) That evaluation matters more than architecture
   - C) That the last mile from prototype to production often becomes most of the journey
   - D) That open-source frameworks should be avoided
   <details><summary>Answer</summary>C) The last mile often becomes most of the journey - code that works on a developer's machine needs significant engineering to become a reliable production system.</details>

10. You have committed to a multi-agent design for a research-style workload. What does the decision guide tell you to do about reliability?
    - A) Increase the token budget until quality plateaus
    - B) Invest in clean delegation, ground reliability in context engineering with real infrastructure and outcome-based evaluation, and use MAST to find and fix your dominant failure modes
    - C) Add a second orchestrator for redundancy
    - D) Switch to process-based evaluation so you can compare runs directly
    <details><summary>Answer</summary>B) Clean delegation, context engineering supported by real infrastructure and outcome-based evaluation, and MAST from Chapter 4 to diagnose dominant failure modes.</details>

**Think About It**

1. Two of the most credible teams in the field published near-opposite advice within weeks of each other, and the community read it as a fight. What did everyone miss?
<details><summary>Show answer</summary>
That the titles were answering different questions. "How we built our multi-agent research system" and "Don't Build Multi-Agents" only clash if you assume architecture is a universal choice - that one of these designs must be the better way to build agents in general. But Anthropic's system does a read task, collecting and synthesizing information into a report, which splits into independent subtopics and suits orchestrator-worker parallelism. Cognition's Devin does a write task, modifying code, which needs the whole codebase, prior changes, and user directives held in one unified context. Both teams reasoned correctly from the shape of their own problem. The debate existed because readers were comparing conclusions without comparing the tasks that produced them.
</details>

2. If both companies were secretly working on the same problem, what was it - and how did the same problem produce opposite architectures?
<details><summary>Show answer</summary>
The problem was context: how to get the right prompts, tool calls, data, and inter-agent communication in front of a model at the right time. Cognition's answer is to never divide it - one agent, one continuous context, scaled by compression rather than parallelism, because a simpler design is a more reliable one. Anthropic's answer is to divide it but engineer the division so cleanly that miscommunication cannot creep in: highly specific subagent instructions, precise tool definitions. Notice that Anthropic hit exactly the failures Cognition warns about and engineered through them rather than disproving them. So the architectures diverge but the discipline underneath is identical, which is why McGuinness treats context engineering as the real subject of both articles.
</details>

3. The most quoted justification for multi-agent systems is that they "help spend enough tokens to solve the problem." That is a strange thing to brag about. Why is it actually the most useful sentence in the debate?
<details><summary>Show answer</summary>
Because it tells you precisely when the architecture is worth buying and when it is not. If the mechanism is token spend across parallel context windows rather than some emergent group intelligence, then multi-agent only helps on problems that can absorb far more tokens productively - combing hundreds of sources in minutes, for example, which a single agent physically cannot do because the window fills and sequential processing is too slow. On a task that cannot use the extra spend, you have bought 15x the token cost plus coordination, debugging, and engineering complexity in exchange for nothing. Stripping the mystique out of the mechanism is what turns "should we go multi-agent?" from a philosophical question into a cost-benefit one.
</details>

4. A working agent prototype can come together in a day. Both teams say the remaining distance is where nearly all the effort goes. Why is that gap so much wider for agents than for ordinary software?
<details><summary>Show answer</summary>
Because an agent's quality is not in its code, it is in its context - the curated knowledge it can access, the tools it can operate, and the memory it retains. A prototype demonstrates the loop; production means actually supplying good context on every real query, which is the part that no framework hands you. On top of that, the failure modes are unfamiliar: non-determinism makes conventional debugging insufficient, long-running state makes small errors compound instead of dissipate, and deploys can disrupt sessions that are mid-task. None of that shows up on a developer's machine. That's why McGuinness lands where he does - the most important task in building production agents is providing and supporting proper context, and it is the common ground beneath the entire single-versus-multi debate.
</details>

**Coding Challenge**

**Build the decision guide**

Turn the chapter's decision guide into a `decide(task)` function. Given a task described by `read_steps` and `write_steps`, return the recommended architecture plus the reliability practices the guide attaches to it: clean delegation and MAST diagnosis when any part goes multi-agent, compression rather than parallelism when the write phase runs single-threaded, and context engineering in every case.

<details>
<summary>Python Solution</summary>

```python
def decide(read_steps, write_steps):
    plan = {"practices": ["context engineering", "outcome-based evaluation"]}

    if read_steps and write_steps:
        plan["architecture"] = "phase-split"
        plan["phases"] = [
            {"phase": "read", "mode": "multi-agent (orchestrator-worker)", "steps": read_steps},
            {"phase": "write", "mode": "single-agent (unified context)", "steps": write_steps},
        ]
    elif read_steps:
        plan["architecture"] = "multi-agent (orchestrator-worker)"
        plan["phases"] = [{"phase": "read", "mode": "parallel subagents", "steps": read_steps}]
    else:
        plan["architecture"] = "single-agent (unified context)"
        plan["phases"] = [{"phase": "write", "mode": "single-threaded", "steps": write_steps}]

    if read_steps:
        plan["practices"] += ["clean delegation", "MAST failure diagnosis"]
    if write_steps:
        plan["practices"] += ["scale via context compression, not parallelism"]
    return plan


print(decide(["survey vendors", "collect pricing"], ["draft contract"]))
print(decide([], ["refactor payments module"]))
print(decide(["find prior art"], []))
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function decide(readSteps, writeSteps) {
  const plan = { practices: ["context engineering", "outcome-based evaluation"] };

  if (readSteps.length && writeSteps.length) {
    plan.architecture = "phase-split";
    plan.phases = [
      { phase: "read", mode: "multi-agent (orchestrator-worker)", steps: readSteps },
      { phase: "write", mode: "single-agent (unified context)", steps: writeSteps },
    ];
  } else if (readSteps.length) {
    plan.architecture = "multi-agent (orchestrator-worker)";
    plan.phases = [{ phase: "read", mode: "parallel subagents", steps: readSteps }];
  } else {
    plan.architecture = "single-agent (unified context)";
    plan.phases = [{ phase: "write", mode: "single-threaded", steps: writeSteps }];
  }

  if (readSteps.length) plan.practices.push("clean delegation", "MAST failure diagnosis");
  if (writeSteps.length) plan.practices.push("scale via context compression, not parallelism");
  return plan;
}

console.log(decide(["survey vendors", "collect pricing"], ["draft contract"]));
console.log(decide([], ["refactor payments module"]));
console.log(decide(["find prior art"], []));
```

</details>
