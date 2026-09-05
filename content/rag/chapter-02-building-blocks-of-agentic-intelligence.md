# Chapter 2: The Building Blocks of Agentic Intelligence

Before the survey describes specific agentic RAG architectures, it lays out the ingredients those architectures are made from. This chapter covers two layers: the four core agentic patterns (what makes an agent "agentic" at all) and the five workflow patterns (how you wire agents together). Understanding these makes the taxonomy in Chapter 3 much easier, because every architecture there is just a particular combination of these pieces.

## What an AI agent is made of

The survey first defines the components of an AI [agent](../glossary/Glossary.md#agent):

- The LLM, with a defined role and task, serving as the reasoning engine and dialogue interface.
- Memory, both short-term (the immediate conversation state) and long-term (accumulated knowledge and past experience). This connects directly to the agentic memory topic.
- Planning, including reflection and self-critique, which guides iterative reasoning and breaks complex tasks down.
- Tools, such as vector search, web search, and APIs, which extend the agent beyond text generation.

With those parts in mind, the survey introduces four design patterns that turn a plain model into an agent.

## The four core agentic patterns

### Reflection

[Reflection](../glossary/Glossary.md#reflection-and-reflexion) is the pattern where an agent evaluates and critiques its own output, then uses that critique to improve on the next iteration. The agent is prompted to check its work for correctness, style, and efficiency, and external tools (like unit tests or web searches) can validate results and highlight gaps. In multi-agent setups, reflection can be split across roles, with one agent generating and another critiquing. The survey cites Self-Refine, Reflexion, and CRITIC as methods showing real performance gains from this pattern. It is the most reliable and mature of the four.

### Planning

Planning is the pattern where an agent decomposes a complex task into smaller, manageable subtasks, then determines the sequence of steps to accomplish the larger goal. This is essential for [multi-hop reasoning](../glossary/Glossary.md#multi-hop-reasoning) and for situations that cannot be scripted in advance. The survey notes a tradeoff: planning enables flexibility, but it produces less predictable outcomes than a fixed, deterministic workflow. You gain adaptability and lose certainty.

### Tool use

[Tool use](../glossary/Glossary.md#tool-calling-function-calling) is the pattern where an agent interacts with external tools, APIs, or computational resources to go beyond its pre-trained knowledge. It can gather information, run computations, and manipulate data. The survey notes this matured significantly with function calling capabilities in modern models. It also flags a real challenge: when there are many tools available, selecting the right one is hard, and techniques inspired by RAG itself (like heuristic-based tool selection) are used to manage it. This is the same "too many tools causes confusion" problem seen in the context-engineering material.

### Multi-agent

Multi-agent collaboration is the pattern where work is split across specialized agents that communicate and share intermediate results, enabling task specialization and parallel processing. Each agent has its own memory and workflow and can itself use tools, reflection, or planning. The survey is honest that this is the least predictable of the four patterns compared to the more mature reflection and tool use, and it points to frameworks like AutoGen, CrewAI, and LangGraph as ways to implement it. This connects directly to the multi-agent topic and its whole debate about reliability.

The survey's framing: these four patterns are the foundation, and agentic RAG systems combine them, from simple sequential steps to adaptive collaborative processes, to handle tasks that exceed traditional RAG.

## The five workflow patterns

On top of the four agentic patterns, the survey describes five workflow patterns: structured ways to organize how LLM calls and agents are wired together. These come from the broader agent-building literature (the survey cites Anthropic's "Building Effective Agents" and LangGraph tutorials). Different patterns suit different task complexities.

### Prompt chaining

A complex task is decomposed into a sequence of steps, where each step builds on the output of the previous one. Breaking the problem into simpler subtasks improves accuracy. The tradeoff is added latency, because the steps run in sequence rather than at once.

### Routing

An incoming query is classified and directed to a specialized process or tool best suited to handle it. Rather than treating every query the same, a routing step sends a database question to a database tool and a web question to a web search. This improves both efficiency and relevance. The single-agent "router" architecture in Chapter 3 is built entirely around this pattern.

### Parallelization

A task is split into independent parts that run concurrently, and the results are combined. This is the key to speeding up [read-style](../glossary/Glossary.md#orchestrator-worker-pattern) work, because independent subtasks do not have to wait for each other. It only helps when the parts are genuinely independent, echoing the read-versus-write lesson from the multi-agent topic.

### Orchestrator-workers

A central [orchestrator](../glossary/Glossary.md#orchestrator-worker-pattern) agent dynamically breaks a task into subtasks, delegates them to worker agents, and synthesizes their results. Unlike simple parallelization, the orchestrator decides the decomposition at runtime based on the query. This is exactly the pattern behind Anthropic's research system from the multi-agent topic.

### Evaluator-optimizer

One agent generates a result while another evaluates it against criteria, and the feedback drives iterative refinement until the output is good enough. This is reflection turned into a two-role loop, and it is the engine behind the "corrective" RAG architecture in Chapter 3.

## How the pieces fit together

The relationship between the two layers is the thing to take away. The four agentic patterns (reflection, planning, tool use, multi-agent) are capabilities an individual agent can have. The five workflow patterns (prompt chaining, routing, parallelization, orchestrator-workers, evaluator-optimizer) are ways to arrange agents and calls into a system. Every agentic RAG architecture in the next chapter is a specific recipe combining these: a router architecture is mostly the routing pattern, a corrective architecture is mostly the evaluator-optimizer pattern, a hierarchical architecture is the orchestrator-workers pattern applied in tiers, and so on.

Holding this in mind turns the long taxonomy of Chapter 3 from a list to memorize into a small set of building blocks you can recognize being recombined.

## Key takeaways

- An AI agent is built from an LLM, memory (short and long term), planning, and tools.
- Four core agentic patterns: reflection (self-critique), planning (task decomposition), tool use (external actions), and multi-agent (specialized collaboration). Reflection and tool use are the most mature; planning and multi-agent are more powerful but less predictable.
- Five workflow patterns wire these together: prompt chaining (sequential), routing (classify and direct), parallelization (concurrent independent work), orchestrator-workers (dynamic delegation), and evaluator-optimizer (generate-and-critique loop).
- Every agentic RAG architecture in Chapter 3 is just a particular combination of these building blocks.

## Review

**Quick Check**

1. According to the survey, what are the components of an AI agent?
   - A) A retriever, a re-ranker, and a generator
   - B) An LLM with a defined role, memory (short- and long-term), planning, and tools
   - C) A classifier, a router, and a synthesizer
   - D) A knowledge graph, a critic, and a feedback loop
   <details><summary>Answer</summary>B) The LLM is the reasoning engine and dialogue interface; memory covers immediate conversation state and accumulated knowledge; planning includes reflection and self-critique; tools (vector search, web search, APIs) extend the agent beyond text generation.</details>

2. Which of the four core agentic patterns does the chapter call the most reliable and mature?
   - A) Planning
   - B) Multi-agent collaboration
   - C) Reflection
   - D) Tool use
   <details><summary>Answer</summary>C) Reflection — the agent evaluates and critiques its own output, then improves on the next iteration. The survey cites Self-Refine, Reflexion, and CRITIC as methods showing real performance gains.</details>

3. What tradeoff does the chapter attach to the planning pattern?
   - A) It is cheap but inaccurate
   - B) It enables flexibility but produces less predictable outcomes than a fixed, deterministic workflow
   - C) It only works with a knowledge graph
   - D) It removes the need for tools
   <details><summary>Answer</summary>B) Planning decomposes complex tasks and handles situations that cannot be scripted in advance. You gain adaptability and lose certainty.</details>

4. What challenge does the chapter flag for the tool use pattern?
   - A) Function calling is not yet supported by modern models
   - B) Tools cannot return structured data
   - C) When many tools are available, selecting the right one is hard — techniques inspired by RAG itself, like heuristic-based tool selection, are used to manage it
   - D) Tools make the agent stateless
   <details><summary>Answer</summary>C) The chapter notes this is the same "too many tools causes confusion" problem seen in the context-engineering material, even though tool use matured significantly with function calling.</details>

5. You want database questions to go to a Text-to-SQL tool and web questions to go to web search, instead of treating every query the same way. Which workflow pattern is that, and which Chapter 3 architecture is built around it?
   - A) Prompt chaining; the corrective architecture
   - B) Routing; the single-agent "router" architecture
   - C) Parallelization; the hierarchical architecture
   - D) Evaluator-optimizer; the adaptive architecture
   <details><summary>Answer</summary>B) Routing classifies an incoming query and directs it to the specialized process or tool best suited to handle it, improving both efficiency and relevance. The single-agent router architecture in Chapter 3 is built entirely around this pattern.</details>

**More Questions**

6. What does the chapter say about the maturity of multi-agent collaboration, and which frameworks does it point to?
   - A) It is the most predictable pattern; frameworks are unnecessary
   - B) It is the least predictable of the four patterns compared to reflection and tool use; it points to AutoGen, CrewAI, and LangGraph
   - C) It is equivalent to prompt chaining; it points to BM25 and TF-IDF
   - D) It has been superseded by routing; it points to Text-to-SQL engines
   <details><summary>Answer</summary>B) Work is split across specialized agents that communicate and share intermediate results, enabling specialization and parallel processing — but the chapter is honest that it is the least predictable pattern, and it connects to the multi-agent topic's whole reliability debate.</details>

7. What is the cost of the prompt chaining pattern?
   - A) Reduced accuracy, because subtasks lose context
   - B) Added latency, because the steps run in sequence rather than at once
   - C) Higher hallucination rates
   - D) It requires a knowledge graph to sequence steps
   <details><summary>Answer</summary>B) Breaking a complex task into simpler subtasks improves accuracy, but each step builds on the previous one's output, so they run sequentially and latency adds up.</details>

8. What distinguishes orchestrator-workers from simple parallelization?
   - A) Orchestrator-workers runs subtasks sequentially
   - B) Parallelization uses agents; orchestrator-workers uses single LLM calls
   - C) The orchestrator decides the decomposition at runtime based on the query, then delegates and synthesizes
   - D) Orchestrator-workers requires an evaluator to approve each result
   <details><summary>Answer</summary>C) Plain parallelization splits a task into independent parts that run concurrently; the orchestrator dynamically breaks the task down at runtime. The chapter notes this is exactly the pattern behind Anthropic's research system from the multi-agent topic.</details>

9. How does the chapter relate the evaluator-optimizer pattern to the four core patterns?
   - A) It is planning applied to retrieval
   - B) It is tool use with a validation step
   - C) It is reflection turned into a two-role loop — one agent generates, another evaluates against criteria — and it is the engine behind the corrective RAG architecture
   - D) It is multi-agent collaboration without a coordinator
   <details><summary>Answer</summary>C) The feedback drives iterative refinement until the output is good enough, which is the "corrective" architecture in Chapter 3.</details>

10. You split a research task into four lookups to run concurrently, but lookup 3 needs the entity names that lookup 1 discovers and lookup 4 depends on 3's output. What does the chapter's account of parallelization tell you?
    - A) Parallelization still applies; concurrency always speeds things up
    - B) Parallelization only helps when the parts are genuinely independent — this task needs a sequential or orchestrated arrangement instead
    - C) Add a second orchestrator to resolve the ordering
    - D) Convert the dependent lookups into reflection loops
    <details><summary>Answer</summary>B) The chapter is explicit that parallelization is the key to speeding up read-style work *because* independent subtasks do not have to wait for each other, and that it only helps when the parts are genuinely independent — echoing the read-versus-write lesson from the multi-agent topic.</details>

**Coding Challenge**

*An evaluator-optimizer loop*

Implement `refine(task, generate, evaluate, max_rounds=3)`. `generate(task, feedback)` produces a candidate; `evaluate(candidate)` returns `(passed, feedback)`. Loop until the evaluator passes or the round cap is hit, returning the last candidate and how many rounds it took. This is reflection expressed as the two-role loop from the chapter — and note that the round cap is the "explicit stopping criterion" the later chapters insist on.

<details>
<summary>Python Solution</summary>

```python
def refine(task, generate, evaluate, max_rounds=3):
    feedback = None
    candidate = None
    for round_no in range(1, max_rounds + 1):
        candidate = generate(task, feedback)          # generator role
        passed, feedback = evaluate(candidate)       # evaluator role
        if passed:
            return candidate, round_no
    return candidate, max_rounds  # cap reached: bounded, not infinite


# --- demo: draft a summary until it cites a source and stays short ---
def generate(task, feedback):
    draft = f"Summary of {task}."
    if feedback and "cite" in feedback:
        draft += " [source: survey]"
    return draft


def evaluate(candidate):
    if "[source:" not in candidate:
        return False, "cite a source"
    return True, "ok"


print(refine("agentic RAG", generate, evaluate))
# ('Summary of agentic RAG. [source: survey]', 2)
```

</details>

**Think About It**

1. The chapter ranks the four patterns by how much you can trust them: reflection and tool use are mature, planning and multi-agent are powerful but unpredictable. Yet nearly every architecture in the next chapter reaches straight for multiple agents. What makes multi-agent so tempting despite the warning?
   <details><summary>Show answer</summary>Because it buys two things that are hard to get any other way: task specialization, where each agent is tuned to one domain and carries its own memory and workflow, and parallel processing, where independent work happens at once instead of in a queue. Those gains are visible immediately in a demo. The costs arrive later and elsewhere — agents that must communicate, intermediate results that must be shared coherently, and behaviour that gets harder to predict as the number of participants grows. That's why the chapter names frameworks like AutoGen, CrewAI, and LangGraph in the same breath as the warning: the pattern is worth having, but it needs scaffolding that reflection and tool use simply don't.</details>

2. Notice the loop hiding in the tool use section. Function calling made tools work properly, which meant systems could offer many tools, which created a *new* problem — and the fix the survey mentions is borrowed from RAG. Why is that funny, and what does it suggest?
   <details><summary>Show answer</summary>It's funny because retrieval machinery ends up being used to manage the tools that were partly there to fix retrieval. Once an agent has dozens of tools, "which tool should I call?" starts to look exactly like "which document is relevant?" — a selection problem over too many candidates described in text — so heuristic, RAG-inspired tool selection is the natural answer. The deeper suggestion is that selection-under-abundance is the recurring shape of these systems, not a quirk of documents: whatever you give the model more of, you eventually need a retrieval step to narrow. It also explains why the context-engineering material's advice to keep toolsets small is not laziness but a way to avoid needing that extra machinery at all.</details>

3. The chapter insists Chapter 3's taxonomy is "a small set of building blocks recombined" rather than a list to memorize. Try to test that claim: is it really true that the fancy-sounding architectures are just workflow patterns in disguise?
   <details><summary>Show answer</summary>Largely yes, and the chapter shows its work: the router architecture is mostly the routing pattern, the corrective architecture is mostly the evaluator-optimizer pattern, and the hierarchical architecture is the orchestrator-workers pattern applied in tiers. The distinction that makes this coherent is the two-layer split — reflection, planning, tool use, and multi-agent are capabilities an individual agent can have, while prompt chaining, routing, parallelization, orchestrator-workers, and evaluator-optimizer are ways to arrange agents and calls into a system. An architecture is a choice on both axes at once. What the recipe view doesn't hand you is the engineering judgement about which combination fits your task, which is why Chapter 4 exists.</details>

---

Continue to Chapter 3 for the full taxonomy of agentic RAG systems.
