# Inside the Agent Harness: How Codex and Claude Code Actually Work | by Jonathan Fulton | Jonathan’s Musings | Apr, 2026 | Medium

# Inside the Agent Harness: How Codex and Claude Code Actually Work

## _A deep technical dive into how CLI coding agents structure their conversations, manage context, and orchestrate tool calls._

[

![Jonathan Fulton](https://miro.medium.com/v2/resize:fill:64:64/1*N3Bdis7K2nKnLw2dytSX1g.png)

](/@jonathan_fulton?source=post_page---byline--63593e26c176---------------------------------------)

[Jonathan Fulton](/@jonathan_fulton?source=post_page---byline--63593e26c176---------------------------------------)

Follow

6 min read

·

Apr 22, 2026

4

[

Listen

](/plans?dimension=post_audio_button&postId=63593e26c176&source=upgrade_membership---post_audio_button-----------------------------------------)

Share

More

![](https://miro.medium.com/v2/resize:fit:875/1*xCmpKL7GdnxGGLul0UIbyw.png)

If you’ve used Claude Code or OpenAI’s Codex CLI, you’ve experienced the magic: type a request, watch the agent think, and see it execute shell commands, edit files, and solve complex problems. But what’s actually happening under the hood?

[](/plans?source=promotion_paragraph---post_body_banner_unlock_stories_blocks--63593e26c176---------------------------------------)

I spent time analyzing the [Codex CLI codebase](https://github.com/openai/codex) (which OpenAI open-sourced) to understand exactly how these agent harnesses work. The details are fascinating — and very different from what most people imagine.

## The Core Loop: It’s Simpler Than You Think

At its heart, every coding agent runs a surprisingly simple loop. Here’s the pseudocode from Codex’s `turn.rs`:

while needs\_follow\_up:  
    1. Gather conversation history  
    2. Send to LLM with tools  
    3. Process response:  
       - If tool calls → execute them, add results to history, continue  
       - If just text → done with this turn

That’s it. The “agentic” behavior emerges from this loop running until the model decides it’s done. There’s no complex planning system, no separate “reasoning engine” — just repeated calls to the same LLM with an accumulating context.

## What Actually Gets Sent to the Model

This is where it gets interesting. The agent harness constructs a `ResponsesApiRequest` with several key components:

## 1\. System Instructions (Base + User)

Codex builds layered instructions:

-   **Base instructions:** Model-specific guidance (the “personality”)
-   **User instructions:** Wrapped in `<user_instructions>` tags
-   **Skills instructions:** Dynamic guidance based on detected needs
-   **App/plugin instructions:** Context from connected tools

These get concatenated into the `instructions` field of the API request. The layering is deliberate — it lets the agent inject context-specific guidance without polluting the base prompt.

## 2\. Conversation History (The Input Array)

The `input` field contains the full conversation transcript as `ResponseItem` objects:

-   User messages
-   Assistant messages (previous model outputs)
-   Function calls (tool invocations)
-   Function call outputs (tool results)

Critically, the harness doesn’t just store text — it preserves the _structure_. A shell command and its output are linked by `call_id`, so the model understands the causal relationship.

## 3\. Tool Definitions

The `tools` array contains JSON schemas for each available tool. Here's what Codex's `shell` tool looks like:

{  
  "type": "function",  
  "name": "shell",  
  "description": "Run a shell command",  
  "strict": false,  
  "parameters": {  
    "type": "object",  
    "properties": {  
      "command": {  
        "type": "array",  
        "items": { "type": "string" },  
        "description": "The command to execute"  
      },  
      "workdir": {  
        "type": "string",  
        "description": "Working directory"  
      },  
      "timeout\_ms": {  
        "type": "number",  
        "description": "Timeout in milliseconds"  
      }  
    },  
    "required": \["command"\]  
  }  
}

The harness dynamically adjusts which tools are available based on permissions, sandbox mode, and detected context (e.g., adding `view_image` only when images are present).

## The Magic of Tool Call Execution

When the model returns a tool call, the harness has to:

1.  **Parse the arguments:** The model returns JSON arguments that must be validated against the schema
2.  **Check permissions:** Does this command require user approval? Is it in the sandbox allowlist?
3.  **Execute in sandbox:** On macOS, commands run under `sandbox-exec` (Seatbelt). On Linux, Landlock. Windows has its own sandbox.
4.  **Capture output:** stdout, stderr, exit code, and timing
5.  **Truncate if needed:** Long outputs get truncated with head/tail preservation
6.  **Format for model:** The output is structured so the model can understand success/failure

The truncation logic is particularly clever. Codex uses token-aware truncation that preserves the beginning and end of output while eliding the middle:

Exit code: 0  
Wall time: 1.23 seconds  
Total output lines: 5000  
Output:  
\[first 100 lines...\]  
... (4800 lines omitted) ...  
\[last 100 lines...\]

## Context Management: The Unsung Hero

Context management is where agent harnesses earn their keep. The `ContextManager` in Codex handles:

## Token Counting and Limits

The harness estimates token counts for every message using byte-based heuristics (roughly 4 characters per token). When approaching the model’s context limit, it triggers compaction.

## Auto-Compaction

When context gets too long, Codex calls the model with a special “summarize this conversation” prompt. The summary replaces the old history, preserving the essential context while freeing tokens. This happens mid-turn if needed — the user never sees the interruption.

## Context Diffing

Codex tracks a “reference context” and only sends _changes_ when possible. If nothing significant changed between turns, it doesn’t re-inject the full context. This saves tokens and improves cache hit rates.

## The Responses API: Built for Agents

OpenAI’s Responses API (used by Codex) has features specifically designed for agentic use:

-   `**parallel_tool_calls**`**:** The model can request multiple tool executions at once
-   `**tool_choice**`**:** Can be "auto", "required", or a specific tool name
-   `**reasoning**`**:** Controls extended thinking (`effort: "low" | "medium" | "high"`)
-   `**store**`**:** Whether to persist the conversation for later retrieval
-   `**prompt_cache_key**`**:** Enables KV-cache sharing across requests

The streaming response returns structured events: `OutputItemDone`, `ToolCallInputDelta`, `ReasoningContentDelta`, etc. The harness parses these to update the UI in real-time and detect when tool execution is needed.

## Parallel Tool Execution

When the model requests multiple tools simultaneously, the harness has decisions to make:

1.  **Dependency analysis:** Can these truly run in parallel, or does one depend on another’s output?
2.  **Resource constraints:** How many concurrent processes can we spawn?
3.  **Approval batching:** Should we ask the user to approve all at once, or one at a time?

Codex uses a `FuturesOrdered` collection to run independent tool calls concurrently while maintaining result order. The outputs get collected and sent back to the model in a single follow-up request.

## The Approval System

Safety is non-negotiable in a tool that can execute arbitrary commands. Codex implements a layered approval system:

-   **Safe commands:** `ls`, `cat`, `git status` — auto-approved
-   **Pattern-matched:** Commands matching configured allowlists
-   **Sandbox violations:** Network access, file writes outside workspace — require explicit approval
-   **Granular policies:** “Trust file writes but prompt for network”

The `Guardian` module intercepts tool calls before execution, evaluates them against the policy, and either proceeds, prompts the user, or blocks entirely.

## Sub-Agents and Multi-Agent Coordination

Codex supports spawning sub-agents for parallel work. The parent agent can:

-   `**spawn_agent**`**:** Create a new agent instance with a specific task
-   `**wait_agent**`**:** Block until a spawned agent completes
-   `**send_message**`**:** Communicate with a running sub-agent
-   `**close_agent**`**:** Terminate a sub-agent

Each sub-agent maintains its own context and tool execution sandbox. The parent receives structured status updates and can coordinate complex multi-step workflows.

## MCP: The Protocol Layer

Codex supports the Model Context Protocol (MCP) for external tool integration. MCP servers expose tools that the harness can discover and invoke:

mcp\_tools = await mcp\_connection\_manager.list\_all\_tools()  
for tool in mcp\_tools:  
    tool\_spec = mcp\_tool\_to\_responses\_api\_tool(tool)  
    available\_tools.append(tool\_spec)

This enables plugins like database connectors, API wrappers, and custom enterprise tools — all without modifying the core agent.

## What This Means for Agent Development

After studying Codex’s architecture, a few things stand out:

1.  **The loop is trivial; the infrastructure is everything.** Building an agent is 5% “call the model in a loop” and 95% context management, tool execution, sandboxing, and error handling.
2.  **Token efficiency matters enormously.** Without intelligent truncation and compaction, agents hit context limits after a few commands. The difference between a toy demo and a production agent is in these details.
3.  **Structured tool outputs are critical.** The model needs to understand _what happened_. Raw stdout isn’t enough — you need exit codes, timing, truncation indicators, and clear success/failure signals.
4.  **Safety is table stakes.** Any agent that can execute shell commands needs approval flows, sandboxing, and audit logging. Codex’s layered approach (Guardian → sandbox → policy) is a good template.
5.  **The API contract matters.** OpenAI’s Responses API was clearly designed with agents in mind. Features like `parallel_tool_calls`, structured streaming events, and `prompt_cache_key` only make sense in an agentic context.

## Looking Forward

Agent harnesses like Codex and Claude Code are still early. The architectures are converging on similar patterns — the loop, the context manager, the tool registry, the approval system. It’s exciting to see where they’ll go!

_This post is based on analysis of the_ [_Codex CLI source code_](https://github.com/openai/codex)_. If you’re building agents, the codebase is worth studying — it’s well-structured Rust with comprehensive tests and clear architectural separation._

## Embedded Content

---