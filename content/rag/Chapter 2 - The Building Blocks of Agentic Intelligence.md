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

Continue to Chapter 3 for the full taxonomy of agentic RAG systems.
