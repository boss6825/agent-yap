# The AI Agent Architecture Debate - by Patrick McGuinness

# The AI Agent Architecture Debate

### A recent debate on AI agent architecture pits single AI agents against multi-agent systems. Yet for AI agents, managing context is what matters most.

[

![Patrick McGuinness's avatar](https://substackcdn.com/image/fetch/$s_!3TKw!,w_36,h_36,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Faea5a672-3ab4-400c-ace6-24acd9e6ee5b_686x686.webp)

](https://substack.com/@patmcguinness)

[Patrick McGuinness](https://substack.com/@patmcguinness)

Jun 28, 2025

1

1

Share

![A cartoon of boys with remote controls and flying drones

AI-generated content may be incorrect.](https://substackcdn.com/image/fetch/$s_!bvqQ!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F37597b71-101a-453d-aa8a-a6f06cd347a9_651x566.jpeg)
Figure 1. AI art: Launching drones.

#### Tale of Two AI Agent Architectures

The development and adoption of ever-more capable AI agents has raised the stakes on the question of AI agent architecture. Two reports on AI agents published earlier this month created a debate stir due to their seemingly contradictory positions.

Anthropic published a lengthy report titled “**[How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system)**,” describing how they build their Claude AI Research agent, including lessons learned and a justification for building a multi-agent system.

Cognition, the team behind the Devin AI software engineering agent, published a blog post with a starkly different position. In “**[Don’t Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents)**,” they described why they needed a single AI agent approach to avoid the pitfalls of multi-agent systems.

These contending perspectives sparked heated debate around AI agent architectures: Should AI agents be a single AI agent or multi-agent systems? The answer is not a simple choice of one or the other. Rather, both perspectives are valid, and this debate highlighted other key considerations needed to make production-grade AI agents work.

#### Anthropic’s AI Research Agent

**[Anthropic's detailed account of building its multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system)** provides a transparent case study of using a Multi-Agent System (MAS) to develop a production-grade AI tool. Anthropic's Research tool in Claude, like the Deep Research tools in Gemini and ChatGPT, gives users an in-depth report on a specific topic, grounded in results from web search.

To implement this, the Research agent is built using the orchestrator-worker pattern. When a user poses a complex research query, a lead agent, powered by the highly capable Claude 4 Opus model, first analyzes the request and devises a research strategy. The lead agent acts as an orchestrator of the task and spawns multiple specialized subagents, powered by Claude 4 Sonnet, to search for sources for different facets of the query in parallel.

Each subagent autonomously uses tools like web search, evaluates the results, and returns its synthesized findings to the lead agent. The lead agent then compiles these parallel streams of information into a comprehensive answer, complete with citations verified by a dedicated Citation Agent. It then synthesizes the final report.

![A diagram of a level architecture

AI-generated content may be incorrect.](https://substackcdn.com/image/fetch/$s_!WrSz!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4ab9faec-3bca-4ae5-9ba4-7d4075c03a3c_936x526.png)
Figure 2. Architecture of Anthropic’s Research Agent. A lead agent acts as an orchestrator, spawning search and retrieval tasks by subagents. Then in collates the information to complete the report generation task.

Anthropic conducted experiments across multiple AI agent designs to arrive at this architecture:

> _**Our internal evaluations show that multi-agent research systems excel especially for breadth-first queries that involve pursuing multiple independent directions simultaneously.** We found that a multi-agent system with Claude Opus 4 as the lead agent and Claude Sonnet 4 subagents **outperformed single-agent Claude Opus 4 by 90.2% on our internal research eval.**_

They found that a multi-agent system worked for this research task because the search-and-retrieve step lends itself to parallelization:

Multi-agent systems work mainly because they help spend enough tokens to solve the problem. … **Multi-agent architectures effectively scale token usage for tasks that exceed the limits of single agents.**

Parallelizing the task and breaking up the context overcomes the context window and sequential processing limitations of a single LLM. As a result, the AI Research agent can comb through hundreds of website sources in minute with parallelization, a task that would take hours if done sequentially.

#### Cost and Complexity Challenges of Multi-Agent Systems

However, this performance comes at a significant cost and added complexity. Anthropic reported that their multi-agent systems use approximately 15 times more tokens than standard chat interactions. An additional challenge of multi-agent systems is the higher complexity of the system.

The complexity challenge is three-fold:

-   **Coordination complexity:** Orchestrating multiple autonomous, non-deterministic agents is exceptionally difficult.
    
-   **Debugging complexity:** Because minor changes can cascade into large, unpredictable behavioral shifts between sub-agents, debugging these systems is difficult.
    
-   **Engineering complexity:** Deploying and maintaining a multi-agent system in production requires relatively higher engineering sophistication versus simpler single-agent deployments.
    

These complexity challenges compound to make reliable implementations difficult. Early versions of Anthropic's system struggled with reliability, with agents continuing to search long after sufficient results were found, duplicating each other's work, and failing to find necessary information due to poor task descriptions. Standard observability and logging tools were insufficient, so Anthropic built a custom system to monitor agent decisions and interactions to diagnose failures.

#### Key Takeaways for Building Better Agent Systems

Since each agent is steered by a prompt, prompt engineering was our primary lever for improving these behaviors. – Anthropic, in “

Overcoming the above challenges enabled Anthropic to leverage parallelism and cut research time by up to 90% for complex queries. Anthropic learned several lessons along the way in how to build multi-agent systems.

One learning for Anthropic was the need for effective prompting in AI agent task delegation. Their prompting guidance to keep the Research agent on track:

-   **Teach the orchestrator to delegate properly:** The lead agent's prompt must instruct it to create detailed and unambiguous task descriptions for subagents. Effective delegation requires specifying a clear objective, output format, recommended tools, and precise task boundaries for each subagent.
    
-   **Scale effort to query complexity:** Agents struggle to judge the appropriate amount of effort for a given task. Anthropic embedded explicit scaling rules to prevent over-analyzing simple queries.
    
-   **Design and describe tools precisely:** The interface between an agent and its tools is as critical as a human-computer interface. Anthropic provides agents with explicit heuristics for tool selection and emphasizes that clear, distinct tool descriptions are vital.
    

Another takeaway is the importance of evaluations to iteratively improve the AI agent system. They share this guidance:

-   _**Start evaluating immediately with small samples.**_
    
-   _**LLM-as-judge evaluation scales when done well.**_
    
-   _**Human evaluation catches what automation misses.**_
    

By taking care of the complexity challenges, honing the prompting, and iteratively improving with robust evaluations, they were able to get sufficient reliability to build a production multi-agent system.

[Leave a comment](https://patmcguinness.substack.com/p/the-ai-agent-architecture-debate/comments)

#### Devin and the Single-Agent Solution

**At the core of reliability is Context Engineering. - Cognition**

**[Cognition AI’s Devin](https://app.devin.ai/)** is a powerful AI agent for software engineering tasks, built as single-agent system. In their blog post “[Don’t Build Multi-Agents](https://cognition.ai/blog/dont-build-multi-agents),” Cognition AI argues that their single-agent is a reliable and effective AI agent architecture for their use case, while multi-agents systems are overly complex, hard to debug, and prone to failure.

To justify their position, Cognition makes the case for maintaining a single coherent context in the AI agent system over managing the complexities of multiple collaborating agents. Cognition argues that multi-agent systems are flawed due to miscommunications that result when context is partitioned; sub-agents fail to understand proper context and miss the nuance needed to complete subtasks correctly.

Their experience leads to two rules for successful context management in AI agent systems:

> _**Principle 1: Share context, and share full agent traces, not just individual messages.**_
> 
> _**Principle 2: Actions carry implicit decisions, and conflicting decisions carry bad results.**_

AI agents require the comprehensive task context to effectively and reliably complete subtasks. The challenge occurs when the task goes beyond a single AI model’s context. Instead of building complex orchestrations to try to build reliability into multi-agent systems, they propose scaling a single AI agent’s capability through context compression.

![A screenshot of a computer

AI-generated content may be incorrect.](https://substackcdn.com/image/fetch/$s_!fYh_!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5467f6d3-0ed5-41d7-995d-f66d7cc35551_936x462.png)
Figure 3. The Single Agent System (on left) maintains a single context and is reliable on shorter tasks, but risks running out of context on longer tasks. Context compression is used (on right) to manage context size within a Single Agent System and make a reliable system for longer tasks.

The Cognition case is convincing: Simpler designs are more reliable. Even Anthropic’s descriptions of their challenges to productize their multi-agent system confirm it has complexity.

#### **Context Matters**

“Prompt engineering” was coined as a term for the effort needing to write your task in the ideal format for a LLM chatbot. **“Context engineering” is the next level of this. It is about doing this automatically in a dynamic system.** It takes more nuance and is effectively the #1 job of engineers building AI agents. - Cognition

What’s further convincing about Cognition argument is that **their position centers on the question of how to best manage context**. This aligns with Anthropic. Both companies make clear that a good AI agent system relies on managing context: Managing prompts, tool calls, data, and agent communications. Ensuring this happens is context engineering.

**For both Cognition and Anthropic, managing context with context engineering is needed to make the AI agent reliably succeed.** An agent's reliable utility is a function of the specificity of its instruction prompting, the knowledge it can retrieve, the tools it can operate, and the memory it can retain.

The Cognition solution is to avoid dividing context for the simplest and most reliable operation.

**If you’re an agent-builder, ensure your agent’s every action is informed by the context of all relevant decisions made by other parts of the system.** - Cognition

Anthropic faced context challenges but fixed them: Highly specific directions to sub-agents; precise definitions of tools. **Anthropic’s context engineering limited the potential for miscommunications and errors**.

#### Single Agent versus Multi-Agent is a False Dichotomy

The distinction between Cognition’s Devin and Anthropic’s Research agent is a matter of orchestration and not a fundamental technology difference. Both are compound AI systems built on the same core components: AI reasoning models, prompts, tools, and data and memory context. The difference is their orchestration architecture, i.e., how they break down the workflow and coordinate work.

Each given problem or task dictates the appropriate AI agent workflow that applies. As our previous article **[Design Patterns for Effective AI Agents](https://patmcguinness.substack.com/p/design-patterns-for-effective-ai)** shows, there are several standard workflow design patterns, each appropriate for different types of tasks.

The Research agent task is a “read mode” task that collects and synthesizes data to generate a report. This lends itself to an orchestrator-worker design pattern that allows for parallelization (independent sub-agents searching on different subtopics).

In contrast, coding assistance is a “write” task, and modifying code requires maintaining the codebase, prior changes, and user directives in a full, single context, to avoid neglecting details.

![A screenshot of a computer screen

AI-generated content may be incorrect.](https://substackcdn.com/image/fetch/$s_!nM6j!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe86ad063-ade4-47c3-ac3c-6b22149f8d59_935x356.png)
Figure 4. Different tasks favor different workflows and AI agent architectures. Read tasks favor parallelization (multi-agent / split context), write tasks are more sequential (single agent / unified context).

The difference in how tasks can be decomposed and coordinated will therefore influence which workflow pattern or orchestration architecture is most suitable.

The multi-agent system is not a universally superior architecture but one that suits Research workflows, which can be broken down into independent, parallelizable subtasks. For inherently sequential problems, a workflow pattern based on a single, highly capable agent provides simplicity and reliability.

The bottom line is that both Cognition and Anthropic are justified in their position. Cognition use of a single-agent system for their AI software engineering agent application adheres to the KISS (Keep It Simple Stupid) principle; it is more reliable because it is simpler and maintains unified context.

Anthropic’s Research agent multi-agent system is able to do something a single AI agent cannot do. It can scour the web for over a hundred sources, collate them, and generate a report on a specified topic in minutes. This cuts the latency by an order of magnitude and enables the Research agent to take on larger tasks. The added complexity and its challenges are the price Anthropic is willing to pay to get a more capable system.

#### **Conclusion**

The real lessons from both Anthropic and Cognition are not about single agent versus multi-agent architectures for AI agent systems. Rather, both shared learnings about overcoming the challenges of taking an AI agent from prototype into production. Anthropic notes the significant effort to build a reliable, scalable production system from a prototype AI agent:

**When building AI agents, the last mile often becomes most of the journey. Codebases that work on developer machines require significant engineering to become reliable production systems.**

**An agent's capability comes from the quality of its context**: the curated knowledge it can access, the tools it can operate, and the memory it retains. The most important task in building production AI agents is providing and supporting proper context - _**context engineering**_.

Thanks for reading AI Changes Everything! Subscribe for free to receive new posts and support my work.

Subscribe

[

![Patrick McGuinness's avatar](https://substackcdn.com/image/fetch/$s_!3TKw!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Faea5a672-3ab4-400c-ace6-24acd9e6ee5b_686x686.webp)

](https://substack.com/profile/12153990-patrick-mcguinness)[

![Fausto Albers's avatar](https://substackcdn.com/image/fetch/$s_!tw_g!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fd5a86e51-f837-4783-9dad-4f16111f02ec_1167x1167.jpeg)

](https://substack.com/profile/36904776-fausto-albers)

1 Like∙

[1 Restack](https://substack.com/note/p-167006238/restacks?utm_source=substack&utm_content=facepile-restacks)

1

1

Share

PreviousNext

## Embedded Content