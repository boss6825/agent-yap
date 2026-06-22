# Chapter 2: The Case For Multi-Agent: Anthropic's Research System

This chapter draws on two articles that describe the same system: "How Anthropic Built a Multi-Agent Research System" and the ZenML writeup "Building a Multi-Agent Research System for Complex Information Tasks." Together they are the strongest worked example of a multi-agent system that earns its complexity. The system powers Claude's Research feature, which produces in-depth reports grounded in web and enterprise sources.

## Why research needs more than a single agent

The motivation is the read-versus-write idea from Chapter 1. Open-ended research does not follow a predictable path. Each discovery can shift the direction of inquiry, so you cannot script a fixed pipeline in advance. A single agent also runs into two hard walls: the [context window](../glossary/Glossary.md#context-window) fills up, and its sequential processing makes broad searches slow.

The articles also contrast this with traditional [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation). Standard RAG fetches a fixed set of documents once, based on similarity to the query, and then answers from them. Research needs more: it needs to search repeatedly, adapt based on what it finds, and follow new leads. A multi-agent system can do this dynamic, branching exploration in a way a single static retrieval cannot.

The payoff was large. In internal evaluations, a system using Claude Opus 4 as the lead agent and Claude Sonnet 4 as subagents outperformed a single-agent Claude Opus 4 by 90.2 percent on their research evaluation. The articles are candid that this works largely because multi-agent systems spend more [tokens](../glossary/Glossary.md#token): token usage alone explained about 80 percent of the performance variance in their browsing evaluations, with the number of tool calls and the model choice as the next biggest factors.

## The architecture: orchestrator-worker

The system uses the [orchestrator-worker pattern](../glossary/Glossary.md#orchestrator-worker-pattern), built from three kinds of component.

The Lead Researcher agent is the orchestrator. When a query arrives, it analyzes the request, decides on an overall strategy, and writes its plan into memory. That last detail matters: large research tasks can exceed the model's [context window](../glossary/Glossary.md#context-window), and the system persists context when conversations pass 200,000 tokens so the plan and findings are not lost when tokens run out. This is memory used as a safeguard against [context rot](../glossary/Glossary.md#context-rot).

The subagents are specialized workers spawned by the lead. Each gets a specific assignment (explore a particular company, a time period, a technical detail), and each runs in its own [context window](../glossary/Glossary.md#context-window) with its own tools and its own exploration path. Because they run in parallel and do not interfere with each other, they cover far more ground than a single agent could. They act as intelligent filters: they gather a lot, then condense their findings before sending them back to the lead.

The Citation Agent is a dedicated final component. After the research is gathered, it checks every claim against its sources, matches citations correctly, and makes sure the report is traceable. This guards against [hallucination](../glossary/Glossary.md#hallucination) and against attributing a fact to the wrong source.

The full flow: the user submits a query, the lead plans, subagents are spawned to search in parallel, the lead gathers and synthesizes their results and decides whether more work is needed (spawning more subagents or refining the strategy), and once enough is collected the Citation Agent verifies sourcing before the final report is returned. The system also uses parallelism at two levels: the lead spawns 3 to 5 subagents at once, and each subagent runs multiple tool calls in parallel, cutting research time by up to 90 percent for complex queries.

## Prompt engineering becomes the main control lever

A central lesson from both articles is that in a multi-agent system, prompt engineering gets much harder and much more important, because small wording changes ripple into emergent coordination behavior. Anthropic identified several principles.

Think like your agent. The team ran simulations watching agents work step by step with the real tools and prompts. This revealed failure patterns: agents kept searching after they had enough, repeated the same queries, or picked the wrong tools. Watching the behavior let them predict and fix these problems through wording.

Teach the orchestrator to delegate. The lead's prompt must produce detailed, unambiguous subtask descriptions. Each subagent needs a clear objective, an output format, guidance on which tools to use, and precise task boundaries. Without this, subagents duplicated work or left gaps. The articles give a real example: one subagent investigated the 2021 semiconductor shortage while two others ran nearly identical searches on 2025 supply chains, wasting effort.

Scale effort to query complexity. Agents are bad at judging how much effort a task deserves, so the team wrote explicit [effort scaling](../glossary/Glossary.md#effort-scaling) rules into the prompts: a simple fact check uses one agent and 3 to 10 tool calls; a direct comparison uses 2 to 4 subagents with 10 to 15 calls each; a complex problem might use 10 or more subagents with clearly divided responsibilities. This prevents both over-investing in easy queries and under-investing in hard ones.

Design tools carefully. The interface between an agent and its tools matters as much as a human-computer interface. A poorly described tool can send an agent down completely the wrong path. With [MCP](../glossary/Glossary.md#mcp-model-context-protocol) servers exposing many external tools of varying quality, this gets worse. The team gave agents explicit heuristics: examine all available tools first, match the tool to the user's intent, and prefer specialized tools over generic ones. They even built a tool-testing agent that repeatedly tried a flawed tool and then rewrote its description to avoid the mistakes, which cut task completion time by about 40 percent for later agents. This is a striking example of agents improving their own environment.

Let agents improve their own prompts. Claude 4 models proved capable of acting as their own prompt engineers: given a failing scenario, they could diagnose what went wrong and suggest better wording.

Start wide, then narrow. Agents tended to jump straight to overly specific queries that returned little. Prompting them to start broad, survey the landscape, and then narrow down mirrors how skilled human researchers work.

Guide the thinking process. The team used [extended thinking](../glossary/Glossary.md#chain-of-thought-and-extended-interleaved-thinking) as a controllable scratchpad for the lead to plan before acting, and interleaved thinking for subagents to evaluate tool results, spot gaps, and refine their next query.

## Evaluating a system that has no single right path

Evaluation is hard here because multi-agent systems are non-deterministic: two runs can take completely different but equally valid routes to the same answer. One agent searches three sources, another searches ten. So evaluation has to focus on outcomes, not on whether a specific process was followed. The articles describe a layered approach.

Start small. Early in development, effect sizes were huge (success rates jumping from 30 percent to 80 percent), so a test set of about 20 representative queries was enough to detect changes. This pushes back on the belief that you always need large evaluation sets.

Use [LLM-as-a-judge](../glossary/Glossary.md#llm-as-a-judge). A separate model graded outputs against a rubric covering factual accuracy, citation accuracy, completeness, source quality, and tool efficiency, producing a 0.0 to 1.0 score and a pass or fail grade. A single well-designed judge prompt proved more consistent than several specialized judges.

Keep humans in the loop. Human testers caught what automation missed: hallucinated answers on unusual queries, subtle biases, and a tendency in early agents to prefer SEO-optimized content farms over authoritative sources like academic PDFs. That finding led to adding source-quality heuristics to the prompts.

## Production engineering: the last mile is most of the journey

Both articles stress that going from prototype to production was harder than expected, because errors in long-running [stateful](../glossary/Glossary.md#stateful-and-stateless) agents compound. A minor glitch that would just slow down ordinary software can completely derail an agent's research trajectory. The key production lessons:

- State management and recovery. Agents run for a long time across many tool calls and cannot simply restart from scratch when something fails. The team built the ability to resume from failure points, and combined the model's adaptability with deterministic safeguards like retry logic and regular checkpoints. They also let agents handle tool failures gracefully by informing them and allowing adaptive responses.
- Debugging non-determinism. Because the same prompt can lead to different paths, ordinary logging was not enough. They added production tracing that monitored high-level decision patterns, while deliberately not storing the contents of individual user conversations, for privacy.
- Safe deployment. Updating code could break agents that were running mid-task. The solution was [rainbow deployments](../glossary/Glossary.md#rainbow-deployment), which gradually shift traffic from the old version to the new one while keeping both alive, so in-progress sessions are not disrupted.
- A known bottleneck: synchronous execution. The lead currently waits for each batch of subagents to finish before continuing. This keeps coordination simple but slows things down and prevents real-time steering. Asynchronous execution would unlock more parallelism but adds hard problems in coordinating results, keeping state consistent, and propagating errors. The team names this as future work.

## When multi-agent is worth it

The honest conclusion from these articles: multi-agent systems shine for high-value tasks that involve heavy parallelization, information that exceeds a single context window, and complex tool interfaces. They are a poor fit for tightly interdependent work like coding, where shared context matters more than breadth. And they are expensive, around 15 times the tokens of a chat, so the task has to be valuable enough to justify the cost.

## Key takeaways

- Anthropic's research system uses an orchestrator-worker design: a lead agent plans and delegates, parallel subagents explore in isolated context windows, and a citation agent verifies sources.
- It beat a single-agent baseline by about 90 percent, mostly because it spends far more tokens across parallel context windows.
- Prompt engineering is the main control lever: teach delegation, scale effort to complexity, design tools carefully, start broad then narrow, and guide the thinking process.
- Evaluate by outcomes, not process: start with small test sets, use a single strong LLM judge, and keep humans in the loop for edge cases.
- Production demands recovery from failures, tracing for non-deterministic debugging, and rainbow deployments; synchronous execution remains a bottleneck.
- Reserve multi-agent for high-value, parallelizable, breadth-heavy tasks, not for interdependent work like coding.

Continue to Chapter 3 for the opposing view.
