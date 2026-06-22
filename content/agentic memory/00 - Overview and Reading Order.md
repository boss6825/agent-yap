# Agentic Memory: Overview and Reading Order

These chapters explain the articles in this folder for someone who understands the basics of AI agents and now wants to understand memory: why agents need it, how it is built and stored, how it fails, and how to keep it safe.

## The articles being explained

1. "A Practical Guide to Memory for Autonomous LLM Agents" by Nick Lawson. A practitioner walking through a formal memory survey alongside his own real system. The best starting point.
2. "Building Long-Term Memory for Agentic AI Systems" (Starnus blog). A clear architectural overview of the three memory types and how retrieval works.
3. "Building smarter AI agents: AgentCore long-term memory deep dive" (AWS). A detailed look at how a real production memory service extracts, consolidates, and retrieves memories.
4. "Building agents with the Claude Agent SDK" (Anthropic). Less about memory specifically, more about the agent loop, but it covers context-handling tools (compaction, subagents, agentic versus semantic search) that are part of the memory picture.
5. "Governing Evolving Memory in LLM Agents" (the SSGM framework paper). An academic paper on what goes wrong when memory can rewrite itself, and how to govern it. The most advanced piece.

## The one idea behind everything

A plain LLM is [stateless](../glossary/Glossary.md#stateful-and-stateless): it forgets everything between calls. Memory is the system you build around the model to make it remember. One survey's headline claim sets the tone: the gap between an agent that has memory and one that does not is often larger than the gap between different underlying models. In other words, memory architecture can matter more than model choice.

## Suggested reading order

- Chapter 1: Why Memory Matters, and the Write-Manage-Read Loop
- Chapter 2: The Four Types of Memory
- Chapter 3: How Memory Is Built and Retrieved
- Chapter 4: How Memory Fails
- Chapter 5: Governing Evolving Memory (the SSGM Framework)

Note: this folder also contains a PDF, "A-Mem: Agentic Memory for LLM Agents." These chapters are based on the markdown files, though the SSGM chapter references ideas related to that line of work.

If a term is unfamiliar, follow its link to the [shared glossary](../glossary/Glossary.md).
