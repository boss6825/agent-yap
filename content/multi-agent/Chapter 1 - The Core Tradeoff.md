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
