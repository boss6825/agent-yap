# Chapter 3: The Case Against: Cognition's "Don't Build Multi-Agents"

This chapter explains Walden Yan's article "Don't Build Multi-Agents," written from Cognition, the team behind the Devin software engineering agent. Where Chapter 2 made the case for multi-agent systems, this article argues that for serious, long-running, reliable agents, you should usually avoid them. The two are not as contradictory as they sound, which Chapter 5 resolves, but first it is worth taking this argument on its own terms, because it is sharp and well reasoned.

## Why think in principles at all

Yan opens with an analogy to web development. HTML arrived in 1993; React arrived in 2013; by 2025 React and its descendants dominate. React won not just as a tool but as a philosophy, a pattern of reactivity and modularity that became the accepted standard. His point is that building agents in 2025 feels like the early days of raw HTML and CSS: no approach has become the agreed standard yet. So rather than copying a framework, he wants to reason up from principles. He is explicitly critical of libraries like OpenAI's Swarm and Microsoft's AutoGen for pushing multi-agent architectures, which he believes are the wrong default.

The whole article builds to two principles.

## The foundation: context engineering and reliability

The starting point is reliability. When an agent must run for a long time and stay coherent, you have to contain the risk of compounding errors. If you are not careful, small mistakes accumulate and the system falls apart. At the core of reliability, Yan argues, is [context engineering](../glossary/Glossary.md#context-engineering).

His framing of the term is memorable: prompt engineering was about writing your task in the ideal format for a chatbot; context engineering is the next level, doing this automatically in a dynamic system. He calls it "effectively the number one job of engineers building AI agents." This is the same conclusion the context-engineering articles reach, arrived at from a different direction.

## The fragile architecture, illustrated with Flappy Bird

Yan takes aim at a tempting and common design:

1. The agent breaks the work into parts.
2. It starts subagents to work on those parts in parallel.
3. It combines the results at the end.

He calls this fragile, and uses a concrete example. Suppose the task is "build a Flappy Bird clone." It gets split into Subtask 1, "build a moving game background with green pipes and hit boxes," and Subtask 2, "build a bird you can move up and down."

Things go wrong. Subagent 1 misreads its subtask and builds a background that looks like Super Mario Bros. Subagent 2 builds a bird, but it does not look like a game asset and it moves nothing like Flappy Bird. Now the final agent is stuck trying to combine two pieces that do not fit. The example may sound contrived, but Yan's point is that real tasks carry many layers of nuance, and each layer is a chance for a subagent to misunderstand.

## Principle 1: Share context, and share full traces

The obvious patch is to give the subagents the original task as context. Yan agrees this helps, and states it as the first principle:

> Principle 1: Share context, and share full agent traces, not just individual messages.

The emphasis on full traces matters. In a real production system the conversation is multi-turn, the agent probably made tool calls to decide how to break down the task, and any of those details could change how a subtask should be interpreted. Sharing just the final subtask instruction is not enough; a subagent needs to see the whole trajectory that led to its assignment, or it will fill the gaps with its own assumptions.

## Principle 2: Actions carry implicit decisions

Even after sharing the original task, the Flappy Bird system can still fail. This time you might get a bird and a background that work individually but clash visually, because Subagent 1 and Subagent 2 could not see what the other was doing. Each made reasonable assumptions, but the assumptions conflicted. This leads to the second principle:

> Principle 2: Actions carry implicit decisions, and conflicting decisions carry bad results.

The insight is that every action an agent takes silently encodes a decision (a visual style, a data format, an interpretation). When two agents act in parallel without seeing each other's choices, their hidden decisions collide, and the collision shows up only at the end, when it is expensive to fix.

Yan argues these two principles are so important, and so rarely worth violating, that you should by default rule out any architecture that breaks them. The parallel-subagent pattern breaks them, which is why he distrusts it.

## What to build instead

If you follow the principles, the simplest compliant design is a single-threaded linear agent: one agent, one continuous context, doing steps in order. Context stays continuous and nothing is lost. Yan says this simple approach "will get you very far."

The honest limitation is that for very large tasks, a single context window eventually overflows. His proposed answer is not to abandon the single thread, but to add a dedicated step that compresses the history of actions and conversation into key details, events, and decisions. He notes this is genuinely hard to get right, and that Cognition has gone as far as [fine-tuning](../glossary/Glossary.md#fine-tuning) a smaller model specifically for this compression job. The benefit is an agent that stays effective over much longer contexts. He is upfront that you will still hit a limit eventually, and frames managing arbitrarily long context as a deep open problem.

## Real-world examples Yan offers

The article grounds the theory in two examples worth remembering:

Claude Code subagents. As of mid-2025, Claude Code does spawn subtasks, but it never runs work in parallel with the subtask agent, and the subagent is usually only asked to answer a question, not to write code. Why? The subagent lacks the main agent's full context, so it can only safely handle a well-defined question. Running multiple parallel subagents would risk the conflicting-decisions problem. The benefit it does capture is that the subagent's investigative work stays out of the main agent's history, allowing longer traces before running out of context. This is a [sub-agent](../glossary/Glossary.md#sub-agent) used for context isolation, not for parallel labor, and the design is deliberately simple.

Edit-apply models. In 2024, many models were bad at editing code, so a common practice was to have a large model write a markdown explanation of the changes, then feed that to a small "edit apply" model to rewrite the file. These systems were faulty: the small model often misread the large model's instructions over the slightest ambiguity. Today the editing decision and the applying are more often done by a single model in one action. The lesson mirrors the principles: splitting a decision across two models introduced a communication gap that caused errors.

## On multi-agent collaboration specifically

Yan does address the dream of agents that "talk to each other" to resolve conflicts, the way two engineers would hash out a merge conflict. His view is that in 2025, agents cannot reliably hold that kind of long-context, proactive back-and-forth. Human communication is efficient because it rests on real intelligence, and agents are not there yet. So running multiple agents in collaboration tends to produce fragile systems where decision-making is too dispersed and context is not shared thoroughly enough. He is optimistic about the long term, predicting that this will improve naturally as single agents get better at communicating with humans, but he does not think it is solved now.

## Key takeaways

- Cognition's argument rests on reliability: long-running agents must contain compounding errors, and context engineering is the core of doing so.
- The naive parallel-subagent pattern is fragile, because subagents misread subtasks (the Flappy Bird example) and make conflicting hidden decisions.
- Principle 1: share full agent traces, not just individual messages.
- Principle 2: actions carry implicit decisions, and conflicting decisions produce bad results.
- The recommended default is a single-threaded linear agent; for very long tasks, add a hard-to-build compression step rather than splitting into parallel agents.
- Claude Code uses subagents only for context isolation on well-defined questions, never for parallel code-writing, exactly because of the conflicting-decisions risk.

Continue to Chapter 4 to see the research on why multi-agent systems fail in practice.
