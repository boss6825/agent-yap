# Building Coding Agents and Harnesses: A Field Guide

## What this is

You already know what an AI agent is. You know an LLM takes text in and gives text out, and you have probably written a few prompts that made one do something useful. This guide is about the next layer up: the **harness**. The harness is all the code wrapped around the model that turns "a thing that predicts the next token" into "a thing that reads your codebase, runs your tests, fixes a bug, and opens a pull request." 

The surprising lesson that runs through every source in this collection is that the model is the small part. The loop that calls it is almost trivial. The hard, valuable, interesting engineering lives in the harness: how you build the prompt, how you manage a context window that keeps filling up, how you run tools safely, how you keep costs from exploding, how you let many agents work at once without trampling each other, and how you make any of it trustworthy enough to run on real code. As one engineer who reverse-engineered OpenAI's Codex put it, building an agent is "5% calling the model in a loop and 95% context management, tool execution, sandboxing, and error handling."

This guide takes apart how the leading coding agents actually work (Claude Code, OpenAI Codex, Cursor, Manus) plus the research-agent and deep-research systems that share the same DNA. Then it rebuilds the ideas from scratch, one small runnable piece at a time, until the final chapter assembles them into a working mini coding-agent harness you can run yourself.

A note on the code: every chapter's MVP is written in **Python**, because it is the most readable language for showing an idea and because the pieces stack cleanly into one project by the end. The real systems are written in Rust (Codex), TypeScript, and other languages, but the patterns are identical. Where a real system does something a toy cannot, the chapter says so.

## How to read it

The chapters are ordered for learning, not in the order the source articles were written. Part I builds the beating heart (the loop, the prompt, the context window). Part II adds hands (tools, sandboxing, parallelism). Part III adds memory and a team (persistent knowledge, skills, subagents, observability). Part IV looks at specialized agents in the wild (security review, Manus, deep research) and the economics of running them. The capstone ties it all together.

If a term looks unfamiliar, check the [glossary](glossary/). Genuinely technical terms (compaction, GRPO, MCP, ReAct, and friends) each have a short entry there, so chapters can stay readable and link out instead of re-explaining the same thing five times.

## Table of contents

### Part I: The beating heart

**[Chapter 1: What Is an Agent Harness?](chapter-01-what-is-a-harness.md)**
The difference between the model and the harness, and why the harness is where the magic (and the debuggability) lives. We introduce two mental maps used throughout the guide: the "six layers" view of Claude Code and the "seven pillars" of a production harness.
Key concepts: agentic harness, model vs harness split, the six-layer model, the seven pillars, why infrastructure beats prompt tweaking.

**[Chapter 2: The Agent Loop](chapter-02-the-agent-loop.md)**
The single most important idea in the whole field, and it fits in about ten lines of pseudocode. We trace one "turn" from user input through inference, tool calls, and the assistant message that signals "done."
Key concepts: the agent loop, gather/act/verify, turn, inference, tool call vs assistant message, termination signal.

**[Chapter 3: Building the Prompt](chapter-03-building-the-prompt.md)**
What actually gets sent to the model on every single call: layered system instructions, the full structured conversation history, and tool definitions as JSON schemas. We build a prompt assembler.
Key concepts: layered instructions, roles (system/developer/user/assistant), structured conversation items, tool schemas, environment context, call_id linkage.

**[Chapter 4: Tokens, Context Windows, and the Quadratic Problem](chapter-04-tokens-and-context.md)**
Why long agent sessions get expensive in a way that surprises people, and why a single session should do one focused job. We build a token and cost estimator.
Key concepts: tokenization, context window, quadratic token growth, why editing-heavy sessions burn context fast.

**[Chapter 5: Prompt Caching and Context Management](chapter-05-caching-and-context-management.md)**
The two tricks that keep the quadratic monster in check: caching the stable prefix of the prompt, and compacting the conversation when it gets too long. We build a cache-aware prompt ordering and a compactor.
Key concepts: prompt caching, prefix matching, cache invalidation, compaction, truncation, context diffing, stable prefixes.

### Part II: Hands

**[Chapter 6: Tools and Tool Execution](chapter-06-tools-and-execution.md)**
How a model "does" anything: it asks, the harness executes. We build a tool registry and a shell tool with the full parse, validate, execute, truncate, format pipeline.
Key concepts: tool registry, argument validation, output truncation (head/tail), structured tool results, exit codes and timing.

**[Chapter 7: Sandboxing, Approvals, and Checkpoints](chapter-07-sandbox-approvals-checkpoints.md)**
Safety for a program that runs arbitrary commands. We cover OS-level sandboxes, the layered approval system, guardian subagents, permission modes, and undo via checkpoints. We build an approval policy engine.
Key concepts: sandboxing (Seatbelt, Landlock), approval policy, guardian subagent, permission modes, checkpoints, least privilege.

**[Chapter 8: Parallelism, the Responses API, and the App Server](chapter-08-parallelism-and-app-server.md)**
Running independent tool calls at once, the API shape designed for agents, and the protocol that lets one harness power a CLI, an IDE, and the web. We build a parallel tool executor.
Key concepts: parallel tool calls, dependency analysis, Responses API vs Chat Completions, SSE streaming, JSON-RPC, App Server, items/turns/threads.

### Part III: Memory and a team

**[Chapter 9: Memory Outside the Weights](chapter-09-memory-outside-the-weights.md)**
How an agent remembers things across a session and across sessions when the model itself is stateless. We cover CLAUDE.md/AGENTS.md, auto memory, rules, and the two-tier memory pattern. We build a memory loader.
Key concepts: persistent instructions, CLAUDE.md/AGENTS.md, auto memory, rules directory, two-tier (shared vs personal) memory, file-based memory.

**[Chapter 10: Skills, MCP, and Deterministic Computation](chapter-10-skills-mcp-deterministic.md)**
Packaging expertise the agent loads on demand (skills), connecting external tools through a standard protocol (MCP), and the rule that you should push exact work into code instead of asking the model to do arithmetic. We build a skill loader and a tiny MCP-style server.
Key concepts: skills (SKILL.md), progressive disclosure, Model Context Protocol, deferred tool schemas / tool search, deterministic computation, anti-hallucination contract.

**[Chapter 11: Subagents and Multi-Agent Orchestration](chapter-11-subagents-and-orchestration.md)**
Why you spin up a fresh agent with its own context window, and how orchestrator/planner/implementer/verifier teams divide work. We build a subagent spawner.
Key concepts: subagents, context isolation, foreground vs background, orchestrator pattern, verification agent, agent contracts, agent teams, worktree isolation.

**[Chapter 12: Observability, Hooks, and the Agent SDK](chapter-12-observability-hooks-sdk.md)**
Deterministic control points that fire on lifecycle events (not chosen by the model), plus budgets that stop a runaway agent. We build a hooks system with turn and cost caps.
Key concepts: hooks (PreToolUse, PostToolUse, Stop), lifecycle events, deterministic vs model-chosen, Agent SDK, max_turns, max_budget, session logs.

### Part IV: Agents in the wild

**[Chapter 13: Code Review and Security Agents](chapter-13-code-review-security-agents.md)**
How Cursor's Bugbot and its four security agents work, why a 15-line prompt can catch hundreds of bugs, and why "an agent cannot mark its own homework." We build a PR-review agent.
Key concepts: PR review agent, threat-model prompting, deterministic validation layer, human-in-the-loop, the agentic supply chain, learned rules.

**[Chapter 14: Autonomous Task Agents: Manus and CodeAct](chapter-14-manus-and-codeact.md)**
A general autonomous agent that writes Python as its action language, plans with a checklist file, and externalizes memory to disk. We build a CodeAct-style loop and a planner.
Key concepts: CodeAct (code as action), analyze/plan/execute/observe loop, planner module, todo.md checklist, event stream, knowledge and datasource modules, one action per iteration.

**[Chapter 15: Deep Research Agents and How They Are Trained](chapter-15-deep-research-agents.md)**
Agents that browse, retrieve, reason, and write reports, plus the training methods (SFT, RL with GRPO, non-parametric continual learning) that sharpen them. We build a research loop with planning and fact-checking.
Key concepts: static vs dynamic workflows, planning strategies, single vs multi-agent, memory mechanisms, SFT, RL/GRPO/PPO, case-based reasoning, fact-checking loops, benchmarks.

**[Chapter 16: Production Realities: Economics, Security, and Governance](chapter-16-production-realities.md)**
What changes when you go from one developer to thousands of repos: token economics, CI/CD patterns, the 2026 security incidents, jagged intelligence, and the verification principle. Mostly concepts, with a cost-model snippet.
Key concepts: token economics, cached-input cost lever, CI/CD headless runs, governance and least privilege, supply-chain attacks, verification principle, jagged intelligence.

### Capstone

**[Chapter 17: Building the Full Mini-Harness](chapter-17-building-the-full-project.md)**
Every MVP from Chapters 2 through 14 assembled into one runnable Python coding agent: loop, prompt builder, context manager, tool registry, sandbox/approvals, memory, skills, subagents, and hooks. Architecture, file layout, and step-by-step assembly.
Key concepts: integration, file structure, wiring the components, running the agent, where to take it next.

## What you will build

Each chapter in Parts I through III ends with a small, self-contained Python file. They are not throwaway demos; they are the actual parts of the capstone. By the final chapter they snap together into `minimalist-harness`, a working terminal coding agent. Here is the map from chapter to component.

| Chapter | MVP you build | Becomes this part of the capstone |
|---|---|---|
| 2. Agent loop | `agent_loop()` skeleton | The main control loop |
| 3. Building the prompt | `PromptBuilder` | Assembles instructions + history + tools each turn |
| 4. Tokens and context | `estimate_tokens()`, cost model | The budget meter |
| 5. Caching and compaction | `Compactor`, prefix ordering | Keeps the context window from overflowing |
| 6. Tools and execution | `ToolRegistry`, `shell` tool | The agent's hands |
| 7. Sandbox and approvals | `ApprovalPolicy` | The safety gate before any tool runs |
| 8. Parallelism | `run_tools_parallel()` | Executes independent tool calls at once |
| 9. Memory | `MemoryLoader` (AGENTS.md) | Loads project rules into every session |
| 10. Skills and MCP | `SkillLoader`, mini MCP client | Loads expertise on demand, connects external tools |
| 11. Subagents | `spawn_subagent()` | Delegates research to a fresh context |
| 12. Hooks and budgets | `HookManager`, budget caps | Lifecycle control and the kill switch |
| 13. Review agent | review subagent prompt | An optional self-review pass |
| 14. CodeAct and planner | `Planner`, code-action mode | Optional planning and a code-first action style |

The end result is small enough to read in one sitting and complete enough to actually edit a file, run a command, and verify its own work in a loop. It is, in miniature, the same shape as the production systems this guide dissects.

## A map of the sources

This guide synthesizes eighteen sources: Anthropic's own Claude Code documentation, OpenAI's engineering write-ups on the Codex agent loop and App Server, community deep-dives that read the open-source Codex codebase, Cursor's docs on subagents and Bugbot, a Snyk analysis of Cursor's security agent prompts, the SAP Community "Seven Pillars" harness breakdown, reverse-engineering reports on Manus, and two academic surveys on deep research agents. Individual chapters cite the specific source they draw from, and link to the original where one is publicly available.
