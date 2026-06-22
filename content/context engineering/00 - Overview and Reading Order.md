# Context Engineering: Overview and Reading Order

These chapters explain the three articles in this folder for someone who already understands the basics of AI agents (an [agent](../glossary/Glossary.md#agent) is an LLM that calls [tools](../glossary/Glossary.md#tool-calling-function-calling) in a loop) but is now moving toward the more advanced engineering ideas.

## The articles being explained

1. "The New Skill in AI is Not Prompting, It's Context Engineering" by Philipp Schmid. A clear introduction to what context engineering is and why it matters.
2. "Context Engineering in Manus" by Lance Martin (notes from a webinar with Manus co-founder Peak Ji). A detailed look at how a real, popular agent manages context.
3. "Context Engineering for AI Agents: Part 2" by Philipp Schmid. A follow-up that captures newer lessons from Manus and LangChain, including failure modes and best practices.

All three circle the same big idea, so rather than summarizing them one by one, these chapters weave them into themes.

## The one idea behind everything

Most agent failures today are not the model being stupid. They are the model being given the wrong information, too much information, or badly formatted information. Fixing that is [context engineering](../glossary/Glossary.md#context-engineering), and it has quietly become the most important skill in building reliable agents.

## Suggested reading order

- Chapter 1: What Context Engineering Is, and Why It Replaced Prompt Engineering
- Chapter 2: How Context Goes Wrong: Rot, Pollution, and Confusion
- Chapter 3: The Four Moves: Reduce, Offload, Isolate, Retrieve
- Chapter 4: Practical Lessons from Building Manus

If a term is unfamiliar, follow its link to the [shared glossary](../glossary/Glossary.md).
