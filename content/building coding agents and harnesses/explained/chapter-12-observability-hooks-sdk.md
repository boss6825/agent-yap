# Chapter 12: Observability, Hooks, and the Agent SDK

## Concept explanation

Everything so far has been the agent deciding what to do. This chapter is about the parts *you* control deterministically, regardless of what the model decides: **hooks** (code that fires on lifecycle events), **budgets** (hard limits on turns and cost), and the **Agent SDK** (the production loop exposed for programmatic use). This is the "observability" layer (layer 6), and its defining property is right there in the name: it is deterministic, not model-chosen.

### Hooks: deterministic control points

A **hook** is a handler that fires at a fixed point in the agent's lifecycle. The contrast with skills is the key insight from the Claude Code architecture breakdown: a skill is invoked when the *model* decides it is relevant, but a hook fires *every time* its event occurs, no matter what the model wants. Skills are suggestions the model may take; hooks are rules the harness enforces.

The standard lifecycle events:

| Hook | Fires | Typical use |
|---|---|---|
| `PreToolUse` | Before a tool runs | Block destructive commands; enforce policy |
| `PostToolUse` | After a tool runs | Auto-format edited files; log the result |
| `Stop` | When the agent finishes a turn | Aggregate results, notify |
| `SubagentStop` | When a subagent finishes | Collect parallel results |
| `PreCompact` | Before compaction runs | Archive the full transcript before it is summarized |

Handlers can be shell commands, HTTP webhooks, MCP tools, prompt judges, or (experimentally) agent-based verifiers. Two properties make hooks valuable: they are deterministic (a `PreToolUse` hook that blocks `git push` blocks it *always*, not "usually"), and they run in your process without consuming model context. So a hook is free in tokens, unlike an instruction you would otherwise stuff into the prompt and pay for every turn.

Notice how `PreToolUse` overlaps with Chapter 7's approval policy: both can block a tool before it runs. The difference is that the approval policy is a built-in classifier and a hook is your custom code. In practice you use both, the policy for the common safety tiers and hooks for project-specific rules.

### Observability: knowing what happened

Beyond hooks, the harness records what it did. Claude Code writes every message, tool use, and result to a plaintext JSONL file under `~/.claude/projects/`, which is what enables rewinding, resuming, and forking sessions (Chapter 2's session vocabulary). That log is your audit trail and your debugger. When an agent does something surprising, the JSONL is where you go to see the exact sequence of tool calls and results. For a system that runs code and holds credentials, an audit trail is not optional; Chapter 16's security incidents are partly stories about organizations that could not answer "what did the agent actually touch?"

### The Agent SDK and budgets: making cost an engineering decision

The same production loop is exposed programmatically through the **Agent SDK**, for CI, services, and custom UIs. What matters for this chapter is the set of knobs it gives you, because they turn the vague worry "what if it runs forever?" into concrete configuration:

- `allowed_tools`: which tools the agent may use.
- `max_turns`: cap the number of laps (the real version of Chapter 2's crude limit).
- `max_budget_usd`: a hard spending cap.
- `effort`: how hard the model should think.
- `setting_sources`: load the project's `CLAUDE.md`, skills, and hooks.

And the result it returns carries a `subtype` telling you *how* it ended: `success`, `error_max_turns`, `error_max_budget_usd`, and so on, plus the per-session cost. The architecture breakdown's line is worth quoting: this makes "budget-aware agents an engineering task, not a hope." You do not cross your fingers that the agent stops; you set `max_budget_usd` and it stops. This directly addresses the Chapter 4 cost curve and the Chapter 16 warning about retry loops quietly running up a bill.

Here is the minimal SDK shape from the breakdown, so you recognize it:

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def run():
    async for message in query(
        prompt="Fix failing auth tests",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Bash", "Grep", "Glob"],
            setting_sources=["project"],   # load project CLAUDE.md, skills, hooks
            max_turns=30,
        ),
    ):
        ...  # handle each message; check the final ResultMessage.subtype
```

## Why it matters

Hooks and budgets are what make an agent safe to *automate* rather than babysit. A `PreToolUse` hook that blocks dangerous commands and a `max_budget_usd` cap together mean you can let an agent run unattended in CI and trust that it will not destroy anything or run up a surprise bill. Observability (the session log) is what lets you debug and audit after the fact. The general guidance from the architecture breakdown captures the spirit: default to workflows when the steps are known, use full agent loops only when exploration is needed, and measure turns and dollars from the start. Observability turns an agent from a black box into a system you can reason about, control, and trust.

## How it works: a hook manager plus a budget meter

Two pieces that wrap the loop. A `HookManager` registers handlers per event and fires them at the right moments; a `PreToolUse` hook can veto a tool call. A `Budget` tracks turns and estimated cost (reusing Chapter 4's estimator) and raises a stop when a cap is hit. Both are deterministic and live entirely in the harness.

## Code MVP: hooks and budgets

```python
"""
chapter 12: hooks and budgets.
HookManager fires deterministic handlers on lifecycle events; a PreToolUse
hook can veto a call. Budget enforces max_turns and max_cost (the real
version of Chapter 2's crude limit). Reuses Chapter 4's token estimate.
"""
from dataclasses import dataclass, field

def estimate_tokens(text: str) -> int:
    return max(1, len(str(text)) // 4)

class HookManager:
    def __init__(self):
        self.hooks = {"PreToolUse": [], "PostToolUse": [], "Stop": [], "PreCompact": []}

    def register(self, event: str, handler):
        self.hooks.setdefault(event, []).append(handler)

    def fire(self, event: str, payload: dict) -> dict:
        """Run all handlers for an event. A PreToolUse handler may return
        {'block': True, 'reason': ...} to veto the action."""
        for handler in self.hooks.get(event, []):
            result = handler(payload) or {}
            if result.get("block"):
                return result
        return {"block": False}

class BudgetExceeded(Exception):
    pass

@dataclass
class Budget:
    max_turns: int = 30
    max_cost: float = 5.0           # arbitrary cost units
    input_rate: float = 1.0
    output_rate: float = 4.0
    turns: int = 0
    cost: float = 0.0

    def charge(self, prompt_text: str, output_text: str):
        self.turns += 1
        self.cost += estimate_tokens(prompt_text) / 1000 * self.input_rate
        self.cost += estimate_tokens(output_text) / 1000 * self.output_rate
        if self.turns > self.max_turns:
            raise BudgetExceeded(f"error_max_turns ({self.max_turns})")
        if self.cost > self.max_cost:
            raise BudgetExceeded(f"error_max_budget ({self.max_cost})")

# --- example deterministic hooks ---
def block_pushes(payload):
    cmd = payload.get("args", {}).get("command", "")
    if "git push" in cmd:
        return {"block": True, "reason": "pushes are blocked by a PreToolUse hook"}

def autoformat(payload):
    if payload.get("name") == "edit":
        print(f"[PostToolUse] would auto-format {payload['args'].get('path')}")

if __name__ == "__main__":
    hm = HookManager()
    hm.register("PreToolUse", block_pushes)
    hm.register("PostToolUse", autoformat)
    budget = Budget(max_turns=3, max_cost=100)

    # A blocked call:
    print(hm.fire("PreToolUse", {"name": "shell", "args": {"command": "git push"}}))
    # An allowed call, then a post hook:
    print(hm.fire("PreToolUse", {"name": "shell", "args": {"command": "ls"}}))
    hm.fire("PostToolUse", {"name": "edit", "args": {"path": "main.py"}})

    # Budget stops a runaway loop:
    try:
        for i in range(10):
            budget.charge("prompt " * 100, "output")
            print("turn", budget.turns, "cost", round(budget.cost, 2))
    except BudgetExceeded as e:
        print("STOPPED:", e)
```

Run it: the `git push` is vetoed by the hook, `ls` passes, the edit triggers a post-hook, and the loop halts at the turn cap with a clear `error_max_turns` reason, just like the SDK's `ResultMessage.subtype`. Hooks and budgets are small, deterministic, and exactly the controls that make unattended runs safe.

## Connecting to the bigger picture

This chapter closes Part III by adding the control plane around everything you built: the `PreToolUse` hook complements Chapter 7's approval policy, the `Budget` replaces Chapter 2's crude `max_turns` and consumes Chapter 4's estimator, and `PreCompact` archives the transcript before Chapter 5's compactor runs. The session-log idea is the observability that Chapter 16's governance section requires. In the capstone, the loop fires hooks around every tool call and checks the budget every turn, which is what makes the little harness safe to run.

## Key takeaways

- A **hook** is deterministic code that fires on a lifecycle event (`PreToolUse`, `PostToolUse`, `Stop`, `PreCompact`, `SubagentStop`), unlike a skill, which the model chooses. Hooks run in your process and cost no model context.
- `PreToolUse` hooks can veto a tool call, complementing Chapter 7's approval policy with custom rules.
- Observability comes from the session log (JSONL of every message, tool use, and result), which enables rewind, resume, fork, and audit.
- The **Agent SDK** exposes `allowed_tools`, `max_turns`, `max_budget_usd`, `effort`, and `setting_sources`, and returns a result `subtype` like `error_max_turns`. This makes budget-aware agents an engineering task, not a hope.
- Hooks plus budgets are what make an agent safe to run unattended; observability is what lets you debug and audit it.

Original sources: the Claude Code six-layers architecture breakdown and Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works).
