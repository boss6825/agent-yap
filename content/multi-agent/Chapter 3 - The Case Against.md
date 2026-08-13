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

## Review

**Quick Check**

1. What is Yan's Principle 1?
   - A) Never spawn more than three subagents
   - B) Share context, and share full agent traces, not just individual messages
   - C) Always compress context before delegating
   - D) Prefer specialized tools over generic ones
   <details><summary>Answer</summary>B) Share context, and share full agent traces, not just individual messages - a subagent needs to see the whole trajectory that led to its assignment, or it fills the gaps with its own assumptions.</details>

2. What is Yan's Principle 2?
   - A) Actions carry implicit decisions, and conflicting decisions carry bad results
   - B) Every agent must have a verifier
   - C) Token cost grows quadratically with agent count
   - D) Single agents always outperform multi-agent systems
   <details><summary>Answer</summary>A) Actions carry implicit decisions, and conflicting decisions carry bad results - every action silently encodes a decision, and parallel agents that cannot see each other's choices collide.</details>

3. In the Flappy Bird example, what goes wrong first?
   - A) The two subagents deadlock waiting on each other
   - B) The final agent runs out of context window
   - C) Subagent 1 misreads its subtask and builds a background that looks like Super Mario Bros
   - D) The task is never decomposed at all
   <details><summary>Answer</summary>C) Subagent 1 misreads its subtask and builds a Super Mario Bros-style background, while Subagent 2's bird does not look like a game asset and moves nothing like Flappy Bird - leaving the final agent combining two pieces that do not fit.</details>

4. How does Claude Code use subagents, as of the mid-2025 snapshot in the article?
   - A) Multiple subagents write code in parallel and the main agent merges the results
   - B) Subtasks are spawned but never run in parallel, and the subagent is usually only asked to answer a question, not to write code
   - C) Subagents replace the main agent once context fills
   - D) Subagents only handle tool discovery
   <details><summary>Answer</summary>B) Subtasks are spawned but never run in parallel with the subtask agent, and the subagent usually only answers a well-defined question - it lacks the main agent's full context, so anything more would risk the conflicting-decisions problem.</details>

5. If you follow both principles, what is the simplest compliant design?
   - A) An orchestrator-worker system with very detailed subtask prompts
   - B) A swarm of peer agents with a shared message bus
   - C) A single-threaded linear agent: one agent, one continuous context, steps in order
   - D) Two agents that alternate turns on the same context
   <details><summary>Answer</summary>C) A single-threaded linear agent - context stays continuous and nothing is lost. Yan says this simple approach "will get you very far."</details>

**More Questions**

6. What does Yan propose for tasks too large to fit one context window?
   - A) Split the work across parallel subagents after all
   - B) Add a dedicated step that compresses history into key details, events, and decisions - Cognition even fine-tuned a smaller model for the job
   - C) Switch to a model with a larger window and stop worrying
   - D) Restart the agent with a fresh context at fixed intervals
   <details><summary>Answer</summary>B) A dedicated compression step distilling history into key details, events, and decisions. He notes it is genuinely hard to get right, that Cognition fine-tuned a smaller model specifically for it, and that you will still hit a limit eventually.</details>

7. What is the lesson from the 2024 "edit apply" model pattern?
   - A) Small models are always unsafe for code
   - B) Markdown is a poor format for describing code changes
   - C) Splitting the editing decision from the applying introduced a communication gap that caused errors; today one model more often does both in one action
   - D) Fine-tuning cannot fix instruction-following problems
   <details><summary>Answer</summary>C) The small model often misread the large model's instructions over the slightest ambiguity - splitting a decision across two models introduced a communication gap, mirroring the two principles.</details>

8. Why does Yan open with the history of HTML and React?
   - A) To argue that agent frameworks should adopt reactivity
   - B) To show that React won as a philosophy, and that agent building in 2025 is still at the raw HTML stage with no agreed standard, so you should reason up from principles
   - C) To claim web development is a solved problem and agents are not
   - D) To date the article precisely
   <details><summary>Answer</summary>B) React won not just as a tool but as a philosophy that became the accepted standard; agents in 2025 have no such standard yet, so rather than copying a framework he reasons up from principles.</details>

9. Which existing libraries does Yan explicitly criticise, and for what?
   - A) LangChain and LlamaIndex, for poor retrieval defaults
   - B) OpenAI's Swarm and Microsoft's AutoGen, for pushing multi-agent architectures he believes are the wrong default
   - C) React and Next.js, for encouraging over-abstraction
   - D) None; he criticises only in-house designs
   <details><summary>Answer</summary>B) OpenAI's Swarm and Microsoft's AutoGen, for pushing multi-agent architectures as the default.</details>

10. You patch the Flappy Bird system so both subagents receive the full original task. The bird and the background now each look correct, but clash visually. Which principle explains this?
    - A) Principle 1, because the traces still were not shared
    - B) Principle 2, because each subagent made reasonable but conflicting hidden decisions it could not reconcile
    - C) Neither; this is a model capability problem
    - D) Both principles equally, since the task was still decomposed
    <details><summary>Answer</summary>B) Principle 2 - each made reasonable assumptions the other could not see, and the collision only shows up at the end, when it is expensive to fix.</details>

**Think About It**

1. When subagents misread their subtasks, the obvious fix is to hand them the original task too. Yan agrees that helps - and then says it still is not enough. Why not?
<details><summary>Show answer</summary>
Two reasons stack on top of each other. First, "the original task" is rarely a single sentence in a real production system: the conversation is multi-turn, the agent probably made tool calls while deciding how to break the work down, and any of those details could change how a subtask should be interpreted. That is why Principle 1 insists on full agent traces rather than individual messages - the subagent needs the whole trajectory that led to its assignment. Second, even perfect context sharing at dispatch time doesn't help with what happens after. The subagents act in parallel, and each action silently encodes decisions - a visual style, a data format, an interpretation - that the other cannot see. Two reasonable agents make two reasonable but incompatible choices, and you find out at merge time.
</details>

2. Claude Code does spawn subagents. Doesn't that quietly contradict an article titled "Don't Build Multi-Agents"?
<details><summary>Show answer</summary>
No, and the details are the argument. Claude Code never runs work in parallel with the subtask agent, and the subagent is usually only asked to answer a question rather than write code - because it lacks the main agent's full context, so a well-defined question is the only thing it can safely handle. What the design buys is not parallel labour but context isolation: the subagent's investigative work stays out of the main agent's history, so the main trace can run longer before running out of context. That is a subagent used as a context management device, and it violates neither principle. The thing Yan objects to is parallel subagents making independent decisions, which is exactly what this design refuses to do.
</details>

3. In 2024 the standard trick was a large model writing out the change and a small "edit apply" model performing it - big brain for thinking, cheap specialist for typing. Efficient, obviously. Why did it fail?
<details><summary>Show answer</summary>
Because the handoff created an interpretation gap that the small model was not equipped to close. The large model produced a markdown explanation of the changes, and the small model often misread it over the slightest ambiguity - it had the instruction but none of the reasoning behind it, so it could not tell which reading was intended. This is Principle 1's failure mode in miniature: a decision was made in one context and executed in another without the trace that would disambiguate it. The industry's resolution is telling - the editing decision and the applying are now more often done by a single model in one action, folding the two steps back together rather than trying to make the handoff more precise.
</details>

4. Yan is optimistic that multi-agent collaboration will eventually work, yet says building on it now produces fragile systems. What is he claiming is missing?
<details><summary>Show answer</summary>
The ability to hold a long-context, proactive back-and-forth - the way two engineers hash out a merge conflict. His point is that human communication is efficient because it rests on real intelligence: people notice when an assumption of theirs might collide with someone else's, and raise it unprompted. Agents in 2025 don't reliably do that, so running several in collaboration disperses decision-making across parties that never adequately share context, and the system gets fragile. The optimism is grounded in the same observation: he expects this to improve naturally as single agents get better at communicating with humans, since it is the same underlying skill. It just isn't a foundation you can build a reliable product on today.
</details>

**Coding Challenge**

**Detect conflicting implicit decisions**

Write a `find_conflicts(traces)` function that takes a dict mapping each subagent's name to the implicit decisions it made (a dict of decision key to chosen value) and returns, for every key that two or more subagents decided differently, the conflicting choices. This is Principle 2 made mechanical: surface the collision before the merge step rather than after.

<details>
<summary>Python Solution</summary>

```python
from collections import defaultdict


def find_conflicts(traces):
    by_key = defaultdict(dict)
    for agent, decisions in traces.items():
        for key, value in decisions.items():
            by_key[key][agent] = value

    return {
        key: choices
        for key, choices in by_key.items()
        if len(set(choices.values())) > 1
    }


traces = {
    "subagent_1": {"art_style": "super_mario", "palette": "bright", "fps": 60},
    "subagent_2": {"art_style": "flat_vector", "palette": "bright", "fps": 60},
}
print(find_conflicts(traces))
# {'art_style': {'subagent_1': 'super_mario', 'subagent_2': 'flat_vector'}}
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function findConflicts(traces) {
  const byKey = {};
  for (const [agent, decisions] of Object.entries(traces)) {
    for (const [key, value] of Object.entries(decisions)) {
      (byKey[key] ??= {})[agent] = value;
    }
  }
  return Object.fromEntries(
    Object.entries(byKey).filter(
      ([, choices]) => new Set(Object.values(choices)).size > 1
    )
  );
}

console.log(
  findConflicts({
    subagent_1: { art_style: "super_mario", palette: "bright", fps: 60 },
    subagent_2: { art_style: "flat_vector", palette: "bright", fps: 60 },
  })
);
```

</details>
