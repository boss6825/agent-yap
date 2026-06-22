# Multi-Agent Systems: Overview and Reading Order

These chapters explain the six articles in this folder for someone who understands the basics of AI agents (an [agent](../glossary/Glossary.md#agent) is an LLM that calls [tools](../glossary/Glossary.md#tool-calling-function-calling) in a loop) and now wants to understand the bigger architectural debate: should you build one agent or many?

## The articles being explained

1. "Single vs Multi-Agent System?" by Philipp Schmid. A clean side-by-side comparison.
2. "How Anthropic Built a Multi-Agent Research System" by ByteByteGo. A walkthrough of Anthropic's design.
3. "Building a Multi-Agent Research System for Complex Information Tasks" (the ZenML LLMOps writeup of Anthropic's system). A deeper, production-focused account of the same system.
4. "Don't Build Multi-Agents" by Walden Yan of Cognition. The strongest argument for sticking with a single agent.
5. "Why Do Multi-Agent LLM Systems Fail?" by Anna Alexandra Grigoryan. A summary of the research paper that built the MAST failure taxonomy.
6. "The AI Agent Architecture Debate" by Patrick McGuinness. The piece that reconciles the apparent contradiction between the camps.

## The surprising headline

Two famous articles seem to directly contradict each other. Anthropic published "How we built our multi-agent research system" while Cognition published "Don't Build Multi-Agents." Despite the opposing titles, they agree on the thing that matters most: the real challenge is managing [context](../glossary/Glossary.md#context-engineering), and the choice of architecture should follow the shape of the task, not ideology.

## Suggested reading order

- Chapter 1: Single Agent versus Multi-Agent: The Core Tradeoff
- Chapter 2: The Case For Multi-Agent: Anthropic's Research System
- Chapter 3: The Case Against: Cognition's "Don't Build Multi-Agents"
- Chapter 4: Why Multi-Agent Systems Fail: The MAST Taxonomy
- Chapter 5: Reconciling the Debate: It Was Never Single versus Multi

Note: this folder also contains a PDF version of the "Why Do Multi-Agent LLM Systems Fail" paper. These chapters are based on the markdown articles, but Chapter 4 covers that paper's ideas.

If a term is unfamiliar, follow its link to the [shared glossary](../glossary/Glossary.md).
