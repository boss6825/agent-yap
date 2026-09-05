# Claude Code Architecture Explained: Six Harness Layers Beyond the LLM - Mervin Praison

Categories

[News](https://mer.vin/category/ai/news/)

# Claude Code Architecture Explained: Six Harness Layers Beyond the LLM

-   Post author By[](https://mer.vin/author/)
-   Post date [May 22, 2026](https://mer.vin/2026/05/claude-code-architecture-explained-six-harness-layers-beyond-the-llm/)

[Claude Code](https://code.claude.com/docs/en/how-claude-code-works) is not “a CLI that calls Claude.” It is an **agentic harness**: a Node.js runtime that wraps the Claude model with permissions, memory, tools, compaction, MCP integrations, subagents, and lifecycle hooks. The model reasons; the harness mediates every action. That split is why the product can feel magical while remaining debuggable once you map the layers.

Your prompt

Input layer

Knowledge layer

Agent loop

Claude model API

Execution layer tools

Integration MCP plugins

Observability hooks

Multi-agent subagents teams

![Diagram of six Claude Code harness layers around central agent loop](https://mer.vin/wp-content/uploads/2026/05/claude-code-six-layers.png)

## Why the harness matters more than the model alone

Claude Code and Claude are separate software: the CLI runs locally (or in a managed surface), while inference runs on Anthropic’s [Messages API](https://platform.claude.com/docs/en/api/messages). Each turn, the harness assembles system instructions, tool schemas, conversation history, CLAUDE.md, skills metadata, and permission state—then streams tool calls back into the loop until Claude stops requesting tools. Community architecture diagrams often show **six layers** around a central loop; the table below maps those layers to what Anthropic documents today.

Layer

What it does

Official building blocks

**1\. Input**

Session boundary, trust, approval policy

[Sessions](https://code.claude.com/docs/en/glossary#session), [permission modes](https://code.claude.com/en/permission-modes), [permission rules](https://code.claude.com/en/permissions), [project trust](https://code.claude.com/docs/en/glossary#project-trust), layered `.claude/settings.json`

**2\. Knowledge**

Persistent instructions and context survival

[CLAUDE.md](https://code.claude.com/en/memory), [auto memory](https://code.claude.com/docs/en/glossary#auto-memory), [Skills](https://code.claude.com/en/skills) (`SKILL.md`), [compaction](https://code.claude.com/docs/en/glossary#compaction), path-scoped `.claude/rules/`

**3\. Execution**

Tool dispatch and the agentic loop

Built-in tools (`Read`, `Edit`, `Write`, `Bash`, `Grep`, `Glob`, …), streaming turns, parallel read-only tools, [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) on stable prefixes

**4\. Integration**

External systems and packaged extensions

[MCP servers](https://code.claude.com/en/mcp), [plugins](https://code.claude.com/en/plugins), optional [channels](https://code.claude.com/en/channels) (event-driven surfaces)

**5\. Multi-agent**

Delegated work without blowing the main context

[Subagents](https://code.claude.com/en/sub-agents) (`Agent` tool), [agent teams](https://code.claude.com/en/agent-teams) (experimental), [git worktree isolation](https://code.claude.com/en/worktrees)

**6\. Observability**

Deterministic control and audit points

[Hooks](https://code.claude.com/en/hooks) (PreToolUse, PostToolUse, Stop, SubagentStart, PreCompact, …), [checkpoints](https://code.claude.com/en/checkpointing), session JSONL under `~/.claude/projects/`

![Circular diagram: gather context, take action, verify results](https://mer.vin/wp-content/uploads/2026/05/claude-code-loop.png)

## The central agent loop (the “dumb” part on purpose)

Anthropic describes a deliberately simple cycle: **gather context → take action → verify results**, repeated until the task completes. The [Agent SDK](https://code.claude.com/docs/en/agent-sdk/agent-loop) exposes the same loop programmatically: each _turn_ is one model response that may include tool calls; the harness executes tools, appends results, and continues until a text-only finish or a budget/turn limit.

Phase

Typical tools

Harness role

Gather context

`Read`, `Grep`, `Glob`, web fetch/search

Inject CLAUDE.md, defer heavy MCP schemas via tool search

Take action

`Edit`, `Write`, `Bash`, MCP actions

Permission checks, sandbox, checkpoints before edits

Verify

Re-run tests, read linter output, ask user

Stop hooks, `max_turns` / `max_budget_usd` in SDK

## Layer 1 — Input: sessions and permission gating

Before any model call, Claude Code establishes **where** it runs (project directory, worktree, cloud sandbox) and **what it may do**. Permission modes (`default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`) set the baseline; fine-grained rules like `Bash(npm test)` or `Read(./src/**)` match specific tool invocations. **Project trust** gates whether project-local hooks and MCP configs execute—important for supply-chain safety on unfamiliar repos.

## Layer 2 — Knowledge: memory outside the weights

Harness intelligence lives largely here. **CLAUDE.md** reloads after compaction so persistent conventions survive long sessions. **Auto memory** lets Claude write project notes under `~/.claude/projects/`. **Skills** package procedural expertise in `SKILL.md` files (Agent Skills open standard). When the context window fills, **compaction** summarizes older turns—older tool outputs cleared first—while CLAUDE.md and memory files stay authoritative if you put rules there rather than only in chat.

## Layer 3 — Execution: tools, streaming, cost control

Tools are the agentic difference: each `tool_use` block becomes a real side effect (file read, patch, shell command). Read-only tools may run in parallel; mutating tools run sequentially to avoid races. Stable system prompts and tool definitions benefit from **prompt caching** (~90% cheaper cache reads on repeated prefixes per Anthropic’s caching docs—often cited as “10% cost” for cache hits in harness discussions). Undo paths use **checkpoints** (per-prompt file snapshots), not a separate “revert” tool in the public tool reference.

## Layer 4 — Integration: MCP and plugins

**MCP** registers external capabilities (databases, browsers, ticketing systems) as named tools—typically prefixed `mcp__server__action`. **MCP Tool Search** loads schemas on demand so idle servers do not dominate context. **Plugins** bundle skills, hooks, subagents, and MCP config for repeatable team rollouts. This layer is how the same harness lands in finance, life sciences, or internal platforms without forking the core CLI.

## Layer 5 — Multi-agent: subagents, teams, worktrees

**Subagents** run in isolated context windows and return summaries—so a research pass does not dump thousands of tokens into the parent thread. Built-in Explore and Plan subagents ship for codebase search and design-only passes. **Agent teams** (experimental; env flag required) coordinate multiple independent sessions with a shared task list—stronger separation than subagents, which report only upward. **Worktree isolation** (`-w`) keeps parallel agents on separate branches under `.claude/worktrees/` to prevent file clashes.

## Layer 6 — Observability: hooks and lifecycle events

**Hooks** fire at fixed lifecycle points—unlike skills, they are deterministic, not model-chosen. Use `PreToolUse` to block destructive commands, `PostToolUse` to format or log, `PreCompact` to archive transcripts before summarization, and `SubagentStop` to aggregate parallel results. Handler types include shell commands, HTTP webhooks, MCP tools, prompt judges, and experimental agent-based verifiers. Hooks run in your process and do not consume model context.

## Agent SDK: same loop, programmatic control

The [Claude Agent SDK](https://code.claude.com/en/agent-sdk/overview) exports the production loop for CI, services, and custom UIs: configure `allowed_tools`, `max_turns`, `max_budget_usd`, `effort`, and `setting_sources` to load project CLAUDE.md/skills/hooks. Result messages expose `subtype` (`success`, `error_max_turns`, `error_max_budget_usd`, …) plus per-session cost—making budget-aware agents an engineering task, not a hope.

```markup
# Minimal SDK pattern (Python)
from claude_agent_sdk import query, ClaudeAgentOptions

async for message in query(
    prompt="Fix failing auth tests",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Bash", "Grep", "Glob"],
        setting_sources=["project"],
        max_turns=30,
    ),
):
    ...  # handle AssistantMessage, ResultMessage
```

## Practical takeaways for builders

-   **Invest in the harness** — tool descriptions, permissions, CLAUDE.md, and hooks often beat prompt tweaking.
-   **Default to workflows** when steps are known; use full agent loops only when exploration is required (same guidance as Anthropic’s [effective agents](https://www.anthropic.com/research/building-effective-agents) post).
-   **Think inside the context window** — if you would be lost with only the last screenshot and tool output, the model will be too.
-   **Measure turns and dollars** — set SDK budgets early for production agents.

## Summary

Point

Detail

What Claude Code is

Agentic harness around Claude models, not a monolithic “coding LLM”

Six-layer view

Input, knowledge, execution, integration, multi-agent, observability—loop in the middle

Core loop

Context → action → verify; tools chain until done

Extensions

Skills (expertise), MCP (connectivity), hooks (policy), subagents (isolation)

Where to read more

[Glossary](https://code.claude.com/docs/en/glossary), [tools reference](https://code.claude.com/en/tools-reference), [agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop)

## Research supplement

The following sources from Anthropic's official documentation corroborate and extend the article's six-layer framework. No URLs were retrieved via live search in this session; the references below point to Anthropic's publicly documented pages that builders should consult to verify figures (such as prompt-caching cost ratios) and to track the experimental status of agent teams.

-   **Prompt caching**: Anthropic's caching documentation describes cache-read pricing as a fraction of standard input-token cost. The article's "~90% cheaper" figure aligns with the published cache-read multiplier, but readers should verify against the current [Anthropic prompt caching docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) before citing in cost models, as pricing tiers can change.
-   **Claude Agent SDK**: The SDK's `ClaudeAgentOptions` parameters (`allowed_tools`, `max_turns`, `max_budget_usd`, `setting_sources`) are documented in the [Claude Code SDK reference](https://docs.anthropic.com/en/docs/claude-code/sdk). The `ResultMessage` subtypes (`error_max_turns`, `error_max_budget_usd`) are described there and are important for production error handling.
-   **Hooks reference**: The full list of lifecycle events (PreToolUse, PostToolUse, Stop, SubagentStop, PreCompact) and supported handler types (shell, HTTP webhook, MCP tool, prompt judge) is in the [Claude Code hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).
-   **Agent Skills open standard**: SKILL.md packaging is described in the [Claude Code skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills). The article's claim that this is an "open standard" is worth verifying — readers should check whether a formal spec has been published outside Anthropic's own docs.
-   **MCP Tool Search and deferred schemas**: The pattern of loading MCP tool schemas on demand (to avoid context saturation from idle servers) is described in Claude Code's MCP integration guidance at [the MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp).

\---

## References

-   [Anthropic — Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
-   [Anthropic — Claude Code SDK Reference](https://docs.anthropic.com/en/docs/claude-code/sdk)
-   [Anthropic — Claude Code Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)
-   [Anthropic — Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
-   [Anthropic — Claude Code MCP Integration](https://docs.anthropic.com/en/docs/claude-code/mcp)

[Facebook](/#facebook "Facebook")[Twitter](/#twitter "Twitter")[Email](/#email "Email")[LinkedIn](/#linkedin "LinkedIn")[WhatsApp](/#whatsapp "WhatsApp")[Threads](/#threads "Threads")[Reddit](/#reddit "Reddit")[Share](https://www.addtoany.com/share#url=https%3A%2F%2Fmer.vin%2F2026%2F05%2Fclaude-code-architecture-explained-six-harness-layers-beyond-the-llm%2F&title=Claude%20Code%20Architecture%20Explained%3A%20Six%20Harness%20Layers%20Beyond%20the%20LLM)

## Embedded Content