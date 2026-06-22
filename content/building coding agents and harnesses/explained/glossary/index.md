# Glossary

Short, plain-language definitions of the genuinely technical terms used across this guide. Common programming words (API, function, class) are not listed; these are the ones that are domain-specific to agents, harnesses, and the systems they are trained on. Each entry notes the chapter where it is discussed most.

Jump to a term: [agent loop](#agent-loop) · [agentic harness](#agentic-harness) · [anti-hallucination contract](#anti-hallucination-contract) · [App Server](#app-server) · [auto memory](#auto-memory) · [case-based reasoning (CBR)](#case-based-reasoning-cbr) · [checkpoint](#checkpoint) · [CodeAct](#codeact) · [compaction](#compaction) · [context diffing](#context-diffing) · [context window](#context-window) · [deterministic computation](#deterministic-computation) · [DPO](#dpo) · [GRPO](#grpo) · [guardian subagent](#guardian-subagent) · [hook](#hook) · [inference](#inference) · [jagged intelligence](#jagged-intelligence) · [JSON-RPC](#json-rpc) · [KV cache](#kv-cache) · [MCP](#mcp-model-context-protocol) · [PPO](#ppo) · [progressive disclosure](#progressive-disclosure) · [prompt caching](#prompt-caching) · [quadratic growth](#quadratic-growth) · [RAG](#rag-retrieval-augmented-generation) · [ReAct](#react) · [Responses API](#responses-api) · [reward model](#reward-model) · [sandbox](#sandbox) · [SFT](#sft-supervised-fine-tuning) · [skill](#skill) · [SSE](#sse-server-sent-events) · [subagent](#subagent) · [SWE-bench](#swe-bench) · [token / tokenization](#token--tokenization) · [tool call](#tool-call--function-calling) · [turn / thread](#turn--thread) · [worktree](#worktree) · [ZDR](#zdr-zero-data-retention)

---

### Agent loop
The small repeating cycle at the heart of every agent: gather the conversation, call the model, run any tool the model asks for, append the result, and repeat until the model returns plain text. Anthropic phrases it as "gather context, take action, verify results." The agentic behavior emerges from running this simple loop, not from a separate planning engine. See Chapter 2.

### Agentic harness
All the software wrapped around a language model that turns it into a capable agent: the loop, prompt construction, context management, tool execution, sandboxing, memory, and safety. The model reasons; the harness mediates every action. The recurring thesis of this guide is that the harness, not the model, is most of the engineering. See Chapter 1.

### Anti-hallucination contract
A design rule: if a tool can fetch the real answer, the agent must not be allowed to fabricate it. The fix is structural (route all real data through tools whose output the model must use, removing its ability to make things up) rather than relying on the model's restraint. See Chapter 10.

### App Server
A long-lived process that hosts a coding agent and exposes it to many surfaces (CLI, IDE, web) over a [JSON-RPC](#json-rpc) protocol. OpenAI's Codex App Server models the interaction with three primitives: item, turn, and thread. See Chapter 8.

### Auto memory
Notes an agent writes to itself as it works (project patterns, your preferences), loaded at the start of later sessions. A form of [memory outside the weights](#agentic-harness). See Chapter 9.

### Case-based reasoning (CBR)
A non-parametric way for an agent to improve at runtime: retrieve, adapt, and reuse whole past problem-solving trajectories from a "case bank," rather than updating model weights. Unlike [RAG](#rag-retrieval-augmented-generation), which retrieves static text, CBR retrieves and adapts reasoning trajectories. See Chapter 15.

### Checkpoint
A snapshot of a file's contents taken before an agent edits it, so the change can be undone. Local to the session and separate from git. Checkpoints cover only file changes; they cannot undo external side effects like deploys or API calls. See Chapter 7.

### CodeAct
An action style where the model's "action" is a short program (usually Python) that the harness executes, rather than a fixed structured tool call. More expressive (one snippet can chain operations, loop, and use libraries) and self-correcting, but it requires tight sandboxing. From the ICML 2024 paper "Executable Code Actions Elicit Better LLM Agents," used by Manus. See Chapter 14.

### Compaction
Replacing a long conversation history with a shorter representative summary when the token count crosses a threshold, freeing space in the [context window](#context-window) while preserving the agent's understanding. Oldest tool outputs are usually cleared first. Compaction is lossy. See Chapter 5.

### Context diffing
An optimization where the harness tracks a reference context and avoids re-sending the full context when little has changed between turns, saving tokens and improving cache hits. See Chapter 5.

### Context window
The maximum number of tokens a model can use for a single [inference](#inference) call, counting both input and output. A hard ceiling that the harness must manage through [compaction](#compaction), truncation, and external storage. See Chapter 4.

### Deterministic computation
The discipline of pushing exact work (arithmetic, lookups, diffs) into code the model calls, instead of asking the model to do it in its head, where it is unreliable. The engineering backbone of the [anti-hallucination contract](#anti-hallucination-contract). See Chapter 10.

### DPO
Direct Preference Optimization. A training method that tunes a model directly from preference data (this output is better than that one) without a separate [reward model](#reward-model). Used by some deep research systems (for example WebThinker's iterative online DPO). See Chapter 15.

### GRPO
Group Relative Policy Optimization. The reinforcement-learning recipe favored for deep research agents. It drops [PPO](#ppo)'s separate value network and computes advantages relative to a group of responses, giving richer gradient signal, faster convergence, and fewer conflicting objectives. See Chapter 15.

### Guardian subagent
A small agent that applies approval-policy rules to a risky action and returns approve, deny, or escalate, so an unattended run does not stall waiting for a human. The mechanism behind Codex's Smart Approvals. See Chapter 7.

### Hook
Deterministic code that fires on a fixed lifecycle event (`PreToolUse`, `PostToolUse`, `Stop`, `PreCompact`, `SubagentStop`). Unlike a [skill](#skill), which the model chooses to use, a hook fires every time its event occurs, regardless of the model. Hooks run in the harness and cost no model context. See Chapter 12.

### Inference
The act of running the model: the text prompt is turned into input [tokens](#token--tokenization), the model samples output tokens one at a time, and those are decoded back to text. The token-by-token streaming you see is this process exposed. See Chapters 2 and 4.

### Jagged intelligence
The uneven, unpredictable capability profile of current models and agents: brilliant at some hard tasks, surprisingly bad at simpler, closely related ones. A reason verification matters. See Chapters 15 and 16.

### JSON-RPC
A lightweight remote-procedure-call protocol using JSON messages (request, response, notification). The transport the [App Server](#app-server) uses so clients in any language can drive the agent. Codex uses a "JSON-RPC lite" variant framed as JSONL over stdio. See Chapter 8.

### KV cache
The key-value state a model builds while processing tokens. [Prompt caching](#prompt-caching) works by saving and reusing this state for a repeated prompt prefix. See Chapter 5.

### MCP (Model Context Protocol)
An open standard for connecting external tools (databases, browsers, internal APIs) to an agent as named tools, usually prefixed `mcp__server__action`. Lets one harness serve many domains. MCP tools are not covered by the harness sandbox and must guard themselves. See Chapter 10.

### PPO
Proximal Policy Optimization. A standard reinforcement-learning algorithm that uses a separate value network. In agent training it is increasingly replaced by [GRPO](#grpo). See Chapter 15.

### Progressive disclosure
Loading only a [skill](#skill)'s short name and description into context at startup, and loading its full body only when the agent actually invokes it. Keeps many skills available at near-zero token cost. See Chapter 10.

### Prompt caching
Saving the computed [KV-cache](#kv-cache) state for a prompt prefix the first time it is seen, and reusing it on later calls that share the exact same prefix, at roughly a tenth the cost. Requires exact prefix matches, which is why stable content goes first. It turns the [quadratic](#quadratic-growth) cost curve back into a linear one. See Chapter 5.

### Quadratic growth
Because every [turn](#turn--thread) re-sends the entire conversation history, the total tokens sent over a session grow quadratically with the number of turns: doubling the length roughly quadruples the total. [Prompt caching](#prompt-caching) is the main mitigation. See Chapter 4.

### RAG (Retrieval-Augmented Generation)
Fetching relevant external text and adding it to the prompt so the model can ground its answer in it. RAG boosts factual accuracy but does not, by itself, provide sustained reasoning or planning, which is what distinguishes a deep research agent from plain RAG. See Chapter 15.

### ReAct
A single-agent pattern that interleaves Reasoning and Acting: the agent thinks, takes an action (tool call), observes the result, and repeats. The basic shape of most single-agent loops. See Chapter 15.

### Responses API
OpenAI's API designed for agentic use, with much better [prompt caching](#prompt-caching) utilization, native multi-turn tool use, parallel tool calls, and [SSE](#sse-server-sent-events) streaming. Codex migrated to it from the older Chat Completions API. See Chapter 8.

### Reward model
In reinforcement learning, the component that scores an agent's output to provide the learning signal. Many open agent systems use simple rule-based rewards (retrieval relevance, answer correctness, successful tool call) rather than a learned model. See Chapter 15.

### Sandbox
An execution environment that restricts what a command can do (which files, whether it can reach the network) at the operating-system level, so even a dangerous request is contained. Codex uses Seatbelt on macOS, Landlock on Linux, and a custom sandbox on Windows. See Chapter 7.

### SFT (Supervised Fine-Tuning)
Training a model on curated examples of good agent behavior (good search queries, structured reports, correct tool use). Improves quality but is limited to offline, static data. Often the first stage before reinforcement learning. See Chapter 15.

### Skill
A packaged procedure: a `SKILL.md` file with metadata and a body of instructions (and optionally scripts) that the agent loads on demand via [progressive disclosure](#progressive-disclosure). Encodes a repeatable workflow. See Chapter 10.

### SSE (Server-Sent Events)
A streaming format where a server pushes a sequence of events to the client over one connection. How agent APIs stream a response (text deltas, tool-call events), enabling token-by-token UI updates. See Chapter 8.

### Subagent
A fresh agent instance with its own [context window](#context-window) that a parent agent delegates a task to. Its main value is context isolation: noisy intermediate work stays in the subagent, and only a summary returns to the parent. See Chapter 11.

### SWE-bench
A widely cited benchmark of real-world software-engineering tasks (resolving GitHub issues), used to compare coding agents. "SWE-bench Verified" is a human-validated subset. See Chapters 8 and 16.

### Token / tokenization
Tokenization chops text into tokens (chunks roughly the size of a short word, about 4 characters on average) and maps each to an integer in the model's vocabulary. Models read and generate in tokens, and billing and the [context window](#context-window) are measured in them. See Chapter 4.

### Tool call / function calling
The mechanism by which a model "does" something: it returns a structured request to run a named tool with arguments, and the harness (never the model) executes it. Described to the model by a JSON schema. See Chapters 3 and 6.

### Turn / thread
A turn is one cycle of user input to the agent's assistant message; inside a turn the inference-and-tool loop may run many times. A thread (Codex's term) or conversation is the whole session, made of many turns, each re-sending the full history. See Chapter 2.

### Worktree
A git feature that gives each parallel agent its own working copy of the same repository, so concurrent agents' edits never collide. Used to run several tasks at once. See Chapters 8 and 11.

### ZDR (Zero Data Retention)
A configuration where the provider does not store the customer's request data. To support it, Codex keeps every request fully stateless (re-sending the whole history each time) instead of relying on server-side conversation state, accepting bigger requests that [prompt caching](#prompt-caching) makes affordable. See Chapter 8.
