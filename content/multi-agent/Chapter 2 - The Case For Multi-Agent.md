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

## Review

**Quick Check**

1. By roughly how much did the multi-agent system (Claude Opus 4 lead, Claude Sonnet 4 subagents) outperform a single-agent Claude Opus 4 on Anthropic's internal research evaluation?
   - A) 12 percent
   - B) 40 percent
   - C) 90.2 percent
   - D) 200 percent
   <details><summary>Answer</summary>C) 90.2 percent - measured on their internal research evaluation, with the articles candid that this works largely because multi-agent systems spend more tokens.</details>

2. Which single factor explained about 80 percent of the performance variance in the browsing evaluations?
   - A) Model choice
   - B) Token usage
   - C) Number of subagents
   - D) Quality of the citation agent
   <details><summary>Answer</summary>B) Token usage - with the number of tool calls and the model choice as the next biggest factors.</details>

3. What is the Citation Agent's job?
   - A) Formatting the report into markdown
   - B) Deciding which subagents to spawn
   - C) Checking every claim against its sources and matching citations correctly
   - D) Compressing subagent findings before they reach the lead
   <details><summary>Answer</summary>C) Checking every claim against its sources and matching citations correctly - it guards against hallucination and against attributing a fact to the wrong source.</details>

4. Under the effort scaling rules written into the prompts, what does a simple fact check get?
   - A) One agent and 3 to 10 tool calls
   - B) 2 to 4 subagents with 10 to 15 calls each
   - C) 10 or more subagents
   - D) Whatever the lead agent judges appropriate at runtime
   <details><summary>Answer</summary>A) One agent and 3 to 10 tool calls - the rules exist precisely because agents are bad at judging how much effort a task deserves.</details>

5. One subagent investigated the 2021 semiconductor shortage while two others ran nearly identical searches on 2025 supply chains. What does the chapter identify as the fix?
   - A) Increasing the token budget so duplication costs less
   - B) Prompting the orchestrator to produce detailed, unambiguous subtask descriptions with clear objectives, output formats, tool guidance, and task boundaries
   - C) Reducing the number of subagents to one
   - D) Adding a second citation agent
   <details><summary>Answer</summary>B) Teaching the orchestrator to delegate properly - without a clear objective, output format, tool guidance, and precise boundaries, subagents duplicated work or left gaps.</details>

**More Questions**

6. At what point does the system persist context so a long research task does not lose its plan and findings?
   - A) After every subagent returns
   - B) When conversations pass 200,000 tokens
   - C) Only on failure and retry
   - D) After the citation agent finishes
   <details><summary>Answer</summary>B) When conversations pass 200,000 tokens - the lead writes its plan into memory, and persisting past that threshold protects the plan from being lost when tokens run out. This is memory used as a safeguard against context rot.</details>

7. How does the system use parallelism at two levels, and what is the reported effect?
   - A) The lead spawns 3 to 5 subagents at once and each subagent runs multiple tool calls in parallel, cutting research time by up to 90 percent for complex queries
   - B) Two leads run concurrently, halving latency
   - C) Every subagent is duplicated for redundancy, improving accuracy by 90 percent
   - D) Tool calls are batched across subagents by a scheduler
   <details><summary>Answer</summary>A) The lead spawns 3 to 5 subagents at once, and each subagent runs multiple tool calls in parallel - cutting research time by up to 90 percent for complex queries.</details>

8. Deploying new code could break agents running mid-task. What solved it?
   - A) Pausing all traffic during deploys
   - B) Rainbow deployments, which gradually shift traffic from the old version to the new while keeping both alive
   - C) Forcing agents to checkpoint and restart on the new version
   - D) Deploying only during low-traffic windows
   <details><summary>Answer</summary>B) Rainbow deployments - both versions stay alive while traffic shifts gradually, so in-progress sessions are not disrupted.</details>

9. What did Anthropic find about the size and structure of their evaluations?
   - A) Large evaluation sets were mandatory from day one
   - B) Effect sizes were so large early on that about 20 representative queries sufficed, and one well-designed judge prompt beat several specialized judges
   - C) Human review could be dropped once the LLM judge reached 90 percent accuracy
   - D) Process-based grading proved more reliable than outcome-based grading
   <details><summary>Answer</summary>B) About 20 representative queries were enough early on because success rates were jumping from 30 to 80 percent, and a single well-designed judge prompt proved more consistent than several specialized judges.</details>

10. What does the chapter name as the system's known remaining bottleneck?
    - A) The citation agent's throughput
    - B) Context window size
    - C) Synchronous execution, where the lead waits for each batch of subagents to finish
    - D) The cost of the Opus lead model
    <details><summary>Answer</summary>C) Synchronous execution - it keeps coordination simple but slows things down and prevents real-time steering. Asynchronous execution would unlock more parallelism but adds hard problems in coordinating results, keeping state consistent, and propagating errors.</details>

**Think About It**

1. The team built an agent whose only job was to repeatedly try a badly described tool and then rewrite its description. That sounds like a strange thing to spend engineering time on. What made it worth it?
<details><summary>Show answer</summary>
It cut task completion time by about 40 percent for later agents - a bigger win than most prompt tweaks produce, from an agent that never touches the actual research task. The reason it works is that the interface between an agent and its tools matters as much as a human-computer interface, and a poorly described tool can send an agent down completely the wrong path. That failure is invisible from the outside: the agent looks like it is reasoning badly when actually it was misinformed about what the tool does. The tool-testing agent is a striking case of an agent improving its own environment rather than its own reasoning - and once MCP servers start exposing many external tools of wildly varying quality, that becomes the more scalable place to intervene.
</details>

2. The honest headline is that the multi-agent system beat the single agent by 90 percent - and that token usage alone explains about 80 percent of the performance variance. Doesn't that deflate the result?
<details><summary>Show answer</summary>
It reframes it rather than deflating it. The architecture is not making the model smarter; it is a mechanism for spending far more tokens on a problem across parallel context windows than a single agent could ever spend inside one. That is a real capability - a single agent physically cannot comb hundreds of sources, because the window fills and the sequential processing is too slow - but it tells you exactly when the trade is worth making. If a task cannot absorb more tokens productively, multi-agent has nothing to offer it. And since the system costs roughly 15 times the tokens of a chat, the task has to be valuable enough to justify buying that spend.
</details>

3. Human testers were still catching things the automated judge missed. What kind of thing, and why couldn't the judge see it?
<details><summary>Show answer</summary>
They caught hallucinated answers on unusual queries, subtle biases, and - the most interesting one - a tendency in early agents to prefer SEO-optimized content farms over authoritative sources like academic PDFs. A rubric-based judge grading factual accuracy, citation accuracy, completeness, source quality, and tool efficiency will happily pass a report that is internally consistent and correctly cited to a bad source, because nothing in the output looks wrong. The problem lives in what the agent chose to read, not in what it wrote. That finding is what led to adding explicit source-quality heuristics to the prompts - a fix that only exists because a human noticed a pattern the automation had no way to flag.
</details>

4. Standard RAG already retrieves documents and answers from them. Why wasn't that enough for research?
<details><summary>Show answer</summary>
Because standard RAG fetches a fixed set of documents once, based on similarity to the original query, and then answers from them - it assumes you know what to look for before you start looking. Open-ended research does not work that way: each discovery can shift the direction of inquiry, so you cannot script a fixed pipeline in advance. What the task needs is repeated searching, adaptation based on what turns up, and the freedom to follow new leads, which is dynamic branching exploration rather than static retrieval. That requirement - not a preference for elaborate architecture - is what pushes the design toward agents that decide their own next query.
</details>

5. Both articles say going from prototype to production was harder than expected. Why should a minor glitch matter more for an agent than for ordinary software?
<details><summary>Show answer</summary>
Because errors in long-running stateful agents compound. In ordinary software a transient glitch slows a request down and the next request starts clean; in an agent, a bad tool result becomes part of the context that shapes every subsequent decision, so it can completely derail a research trajectory rather than just delaying it. That is why the production work looks the way it does: the ability to resume from failure points instead of restarting from scratch, deterministic safeguards like retry logic and regular checkpoints wrapped around the model's adaptability, and telling agents about tool failures so they can adapt rather than silently absorbing them. Debugging is harder too - the same prompt can take different paths, so ordinary logging isn't enough and they added tracing over high-level decision patterns while deliberately not storing the contents of individual user conversations.
</details>

**Coding Challenge**

**Implement the effort-scaling rules**

Write a `scale_effort(complexity)` function that encodes the chapter's explicit effort scaling rules. For `"fact_check"` return 1 agent and a 3-to-10 tool-call budget; for `"comparison"` return 2 to 4 subagents with 10 to 15 calls each; for `"complex"` return 10 or more subagents with clearly divided responsibilities. Raise a clear error for anything else rather than guessing, since the whole point is that agents judge effort badly.

<details>
<summary>Python Solution</summary>

```python
RULES = {
    "fact_check": {"agents": (1, 1), "calls_per_agent": (3, 10)},
    "comparison": {"agents": (2, 4), "calls_per_agent": (10, 15)},
    "complex":    {"agents": (10, None), "calls_per_agent": (10, 15)},
}


def scale_effort(complexity):
    if complexity not in RULES:
        raise ValueError(f"unknown complexity {complexity!r}; expected {sorted(RULES)}")
    rule = RULES[complexity]
    lo, hi = rule["agents"]
    return {
        "subagents": f"{lo}+" if hi is None else (str(lo) if lo == hi else f"{lo}-{hi}"),
        "tool_calls_per_agent": "{}-{}".format(*rule["calls_per_agent"]),
        "max_total_calls": (hi or lo) * rule["calls_per_agent"][1],
    }


for c in ("fact_check", "comparison", "complex"):
    print(c, scale_effort(c))
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
const RULES = {
  fact_check: { agents: [1, 1], callsPerAgent: [3, 10] },
  comparison: { agents: [2, 4], callsPerAgent: [10, 15] },
  complex: { agents: [10, null], callsPerAgent: [10, 15] },
};

function scaleEffort(complexity) {
  const rule = RULES[complexity];
  if (!rule) throw new Error(`unknown complexity "${complexity}"`);
  const [lo, hi] = rule.agents;
  return {
    subagents: hi === null ? `${lo}+` : lo === hi ? `${lo}` : `${lo}-${hi}`,
    toolCallsPerAgent: rule.callsPerAgent.join("-"),
    maxTotalCalls: (hi ?? lo) * rule.callsPerAgent[1],
  };
}

for (const c of ["fact_check", "comparison", "complex"]) console.log(c, scaleEffort(c));
```

</details>
