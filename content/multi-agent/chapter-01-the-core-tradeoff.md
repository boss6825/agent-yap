# Chapter 1: Single Agent versus Multi-Agent: The Core Tradeoff

## Two ways to organize an agent system

Start with the cleanest possible definition, the one used across these articles: an AI [agent](../glossary/Glossary.md#agent) is a system that uses an LLM as a reasoning engine to decide the control flow of an application. From that base, there are two ways to organize the work.

A single-agent system is one focused worker handling a task from start to finish. It keeps one continuous thread of thought and action, so every step has access to everything that came before it.

A multi-agent system is structured like a team. A "lead" agent breaks a goal into smaller subtasks and delegates them to multiple "worker" agents, often running at the same time, then combines their results.

Most of this chapter is about understanding the precise tradeoffs between these two, because the rest of the debate (Chapters 2 through 5) is really an argument about when each one is the right choice.

## What a single agent gives you

The defining characteristics of a single agent, from "Single vs Multi-Agent System?":

- Sequential: it does step A, then step B, in order.
- Unified context: it keeps one continuous history of the whole conversation. Every new step sees all previous steps, thoughts, and [tool](../glossary/Glossary.md#tool-calling-function-calling) outputs.
- Stateful: early decisions directly inform later actions with no need to pass messages between separate components.

The strengths that follow from this are about reliability:

- Context continuity: no information is lost between steps, because it all lives in one place.
- Simplicity: it is easier to debug, test, and maintain.
- Transparency: there is one clear execution path and decision trail.

The weaknesses are about scale and speed:

- Sequential bottlenecks: it is slow for work that could have been done in parallel.
- Context window limits: a long task will eventually overflow the useful [context window](../glossary/Glossary.md#context-window), leading to errors and forgotten details (this is closely related to [context rot](../glossary/Glossary.md#context-rot)).
- Inefficiency: it can waste [tokens](../glossary/Glossary.md#token) repeating context, and it is limited to one model's capabilities.

## What a multi-agent system gives you

The defining characteristics of a multi-agent system:

- Parallel execution: subtasks run simultaneously.
- Delegation: a lead agent decomposes the goal, hands out subtasks, and synthesizes the results.
- Distributed context: each agent works with its own context, usually a subset of the whole.

The strengths are the mirror image of the single agent's weaknesses:

- Parallelization: it can explore many paths at once, cutting the total time.
- Specialization: each agent can be tuned and instructed for a specific job.
- Breadth: it can tackle large, many-sided problems.

And the weaknesses are the mirror image of the single agent's strengths:

- Context sharing is hard: getting the right context to each agent is a real problem (this is the heart of Chapter 3).
- Coordination: agents may duplicate work or make conflicting decisions.
- Cost: it is far more token-intensive. Anthropic measured their multi-agent system using about 15 times the tokens of a standard chat.

The article also mentions that not every multi-agent design uses a lead agent. "Swarm" patterns let agents collaborate peer-to-peer, which mixes traits of both approaches and brings its own challenges.

## The numbers worth remembering

The comparison article gives a few rough figures that are useful anchors:

- A single agent uses roughly 4 times the tokens of a plain chat interaction.
- A multi-agent system uses roughly 15 times the tokens of a plain chat.
- Single agents are described as high and predictable in reliability; multi-agent systems as lower, with emergent (hard to predict) behaviors.

These are not precise laws, but they capture the tradeoff: multi-agent buys you breadth and speed at a large cost in tokens, reliability, and debugging difficulty.

## The insight that reframes the whole debate: read versus write

Here is the idea that the comparison article and the architecture-debate article both land on, and it is the most useful takeaway in this entire folder. The important distinction is not single versus multi. It is whether your task is mostly reading or mostly writing.

- Read tasks are about gathering and analyzing information: research, search, fact-finding, synthesis. These split naturally into independent parts, so they parallelize well and suit multi-agent systems.
- Write tasks are about producing one coherent artifact: code, a long document, a set of file edits. These parts depend on each other, so splitting them across parallel agents creates coordination problems. They favor a single agent with unified context.
- Mixed tasks should be separated by phase: do the reading (research) in a parallel, multi-agent way, then do the writing in a single, unified-context way.

This is why, as the next chapters show, Anthropic chose multi-agent for a research tool (a read task) and Cognition chose single-agent for a coding tool (a write task). They did not disagree about principles. They were solving differently shaped problems.

## The universal truths that apply to both

"Single vs Multi-Agent System?" closes with four points that hold no matter which architecture you pick:

1. Context engineering is everything. Building systems that keep the right information available at the right time is the key to reliability. This is not just prompt engineering.
2. Read versus write is the distinction that matters, more than single versus multi.
3. Reliable agents need real infrastructure: durable execution that survives failures, observability to debug behavior, and evaluation that measures what actually matters.
4. Models keep improving fast, so do not over-engineer today a solution that a simpler design will handle tomorrow. This echoes [the Bitter Lesson](../glossary/Glossary.md#the-bitter-lesson).

## Key takeaways

- Single agent: sequential, unified context, simple and reliable, but slow and limited by the context window.
- Multi-agent: parallel, specialized, broad, but costly (around 15 times the tokens of a chat), harder to coordinate, and harder to debug.
- The decisive question is read versus write, not single versus multi. Read tasks parallelize well; write tasks need unified context.
- Mixed tasks should split the read phase from the write phase architecturally.
- Whatever you choose, context engineering, good infrastructure, and real evaluation decide whether it works.

Continue to Chapter 2 for the strongest real example of a multi-agent system done well.

## Review

**Quick Check**

1. Which set of properties defines a single-agent system in this chapter?
   - A) Parallel, delegating, distributed context
   - B) Sequential, unified context, stateful
   - C) Peer-to-peer, stateless, specialized
   - D) Orchestrated, cached, sharded
   <details><summary>Answer</summary>B) Sequential, unified context, stateful - it does step A then step B, keeps one continuous history, and early decisions directly inform later actions with no message passing between components.</details>

2. Roughly how many times the tokens of a plain chat interaction does the chapter attribute to each architecture?
   - A) Single agent 2x, multi-agent 5x
   - B) Single agent 4x, multi-agent 15x
   - C) Single agent 15x, multi-agent 40x
   - D) Both around 10x
   <details><summary>Answer</summary>B) Single agent 4x, multi-agent 15x - rough anchors rather than precise laws, but they capture the size of the cost jump.</details>

3. According to the chapter, what is the distinction that actually matters when choosing an architecture?
   - A) Single versus multi
   - B) Open-source versus proprietary models
   - C) Read tasks versus write tasks
   - D) Streaming versus batch execution
   <details><summary>Answer</summary>C) Read tasks versus write tasks - the chapter calls this the most useful takeaway in the folder. Reads split into independent parts and parallelize; writes produce one coherent artifact and need unified context.</details>

4. Your team is building a tool that makes coordinated edits across many files in a codebase. Which architecture does the chapter's framing point to, and why?
   - A) Multi-agent, because there are many files and files are independent
   - B) Multi-agent, because parallelism always reduces latency
   - C) Single agent, because this is a write task whose parts depend on each other
   - D) Either one; the chapter treats the choice as arbitrary
   <details><summary>Answer</summary>C) Single agent, because this is a write task whose parts depend on each other - splitting interdependent edits across parallel agents creates coordination problems, so unified context wins.</details>

5. What is a "swarm" pattern, as the chapter describes it?
   - A) A multi-agent design where agents collaborate peer-to-peer without a lead agent
   - B) A single agent that spawns copies of itself sequentially
   - C) A retrieval strategy for very large corpora
   - D) A deployment technique for updating running agents
   <details><summary>Answer</summary>A) A multi-agent design where agents collaborate peer-to-peer without a lead agent - it mixes traits of both approaches and brings its own challenges.</details>

**More Questions**

6. Which three weaknesses does the chapter list for single agents?
   - A) Cost, coordination, and context sharing
   - B) Sequential bottlenecks, context window limits, and inefficiency
   - C) Hallucination, latency, and poor tool use
   - D) Emergent behavior, debugging difficulty, and token waste
   <details><summary>Answer</summary>B) Sequential bottlenecks, context window limits, and inefficiency - it is slow for parallelizable work, a long task eventually overflows the useful context window, and it can waste tokens repeating context.</details>

7. How does the chapter characterise reliability across the two architectures?
   - A) Both are equally reliable; only cost differs
   - B) Multi-agent is more reliable because errors are isolated to subagents
   - C) Single agents are high and predictable; multi-agent is lower with emergent, hard-to-predict behaviors
   - D) Reliability depends only on the model, not the architecture
   <details><summary>Answer</summary>C) Single agents are high and predictable; multi-agent is lower with emergent, hard-to-predict behaviors.</details>

8. A task requires researching a market and then writing one long strategy document. What does the chapter recommend?
   - A) Run the whole thing multi-agent for speed
   - B) Run the whole thing single-agent for coherence
   - C) Separate by phase: parallel multi-agent reading, then single-agent unified-context writing
   - D) Alternate between the two on every step
   <details><summary>Answer</summary>C) Separate by phase - mixed tasks should split the read phase from the write phase architecturally.</details>

9. Why, according to the chapter, did Anthropic and Cognition reach opposite conclusions?
   - A) They disagreed about the underlying principles of agent design
   - B) One had access to better models than the other
   - C) They were solving differently shaped problems: a read task versus a write task
   - D) One measured cost and the other measured latency
   <details><summary>Answer</summary>C) They were solving differently shaped problems - Anthropic chose multi-agent for a research tool (a read task) and Cognition chose single-agent for a coding tool (a write task). They did not disagree about principles.</details>

10. Which of the four universal truths warns against over-engineering?
    - A) Context engineering is everything
    - B) Read versus write is the distinction that matters
    - C) Reliable agents need durable execution, observability, and evaluation
    - D) Models keep improving fast, so do not over-engineer today what a simpler design will handle tomorrow
    <details><summary>Answer</summary>D) Models keep improving fast, so do not over-engineer today a solution that a simpler design will handle tomorrow - the chapter ties this to the Bitter Lesson.</details>

**Think About It**

1. Multi-agent systems get roughly 15 times the tokens of a chat and can explore many paths at once. If more tokens and more parallelism are strictly more resources, why isn't multi-agent simply better at everything?
<details><summary>Show answer</summary>
Because the extra resources buy breadth, and breadth is only valuable when the work actually splits. The strengths and weaknesses of the two architectures are exact mirror images of each other: everything a single agent gains from unified context - continuity, simplicity, one clear decision trail - is what a multi-agent system gives up when it distributes context across workers. So the extra tokens don't add capability on top of a single agent; they trade one kind of capability for another. On a task whose parts genuinely depend on each other, you have paid 15x the tokens to buy parallelism you cannot use, and spent it on coordination problems, duplicated work, and conflicting decisions you didn't previously have.
</details>

2. The chapter says the argument was never really about single versus multi. So what were the two camps actually arguing about, and why did it look like a fight?
<details><summary>Show answer</summary>
It looked like a fight because the conclusions were opposite and stated confidently: Anthropic built a multi-agent research system and reported large gains; Cognition told people not to build multi-agents at all. But both were reasoning correctly from the shape of their own problem. Research is a read task - gathering and analysing information, which splits into independent parts and parallelises naturally. Coding is a write task - producing one coherent artifact whose parts depend on each other. Once you notice that the deciding variable is read versus write rather than single versus multi, the two positions stop competing and start being two correct answers to two different questions. That reframing is the point of the entire folder.
</details>

3. Both architectures run into the context window, but in opposite ways. What is the difference, and why does it matter for which one you pick?
<details><summary>Show answer</summary>
A single agent hits the window as a hard ceiling: it keeps one continuous history, so a long task eventually overflows it and starts producing errors and forgotten details - the failure the chapter connects to context rot. A multi-agent system dodges that ceiling by giving each agent its own window with a subset of the whole, so total capacity scales with the number of agents. But it inherits the opposite problem: getting the right context into each of those separate windows is now a real engineering problem, and it is the subject of the entire case against multi-agent in Chapter 3. So the choice isn't "does context fit" - it's which failure you would rather engineer around, overflow or fragmentation.
</details>

**Coding Challenge**

**Route a task by read/write shape**

Write a `route(steps)` function that takes a list of `(name, kind)` tuples where `kind` is `"read"` or `"write"`, and returns the architecture the chapter would recommend: `"multi-agent"` when every step is a read, `"single-agent"` when every step is a write, and a two-phase plan when the task is mixed - reads grouped into a parallel phase, writes into a single-threaded phase that runs after.

<details>
<summary>Python Solution</summary>

```python
def route(steps):
    reads = [name for name, kind in steps if kind == "read"]
    writes = [name for name, kind in steps if kind == "write"]

    if reads and not writes:
        return {"architecture": "multi-agent", "phases": [("parallel", reads)]}
    if writes and not reads:
        return {"architecture": "single-agent", "phases": [("sequential", writes)]}
    return {
        "architecture": "phase-split",
        "phases": [("parallel", reads), ("sequential", writes)],
    }


print(route([("survey competitors", "read"), ("find pricing", "read")]))
print(route([("edit api.py", "write"), ("edit models.py", "write")]))
print(route([("research market", "read"), ("write strategy doc", "write")]))
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function route(steps) {
  const reads = steps.filter(([, kind]) => kind === "read").map(([name]) => name);
  const writes = steps.filter(([, kind]) => kind === "write").map(([name]) => name);

  if (reads.length && !writes.length)
    return { architecture: "multi-agent", phases: [["parallel", reads]] };
  if (writes.length && !reads.length)
    return { architecture: "single-agent", phases: [["sequential", writes]] };
  return {
    architecture: "phase-split",
    phases: [["parallel", reads], ["sequential", writes]],
  };
}

console.log(route([["survey competitors", "read"], ["find pricing", "read"]]));
console.log(route([["edit api.py", "write"], ["edit models.py", "write"]]));
console.log(route([["research market", "read"], ["write strategy doc", "write"]]));
```

</details>
