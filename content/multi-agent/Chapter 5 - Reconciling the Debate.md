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
