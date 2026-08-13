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

---

## Review

**Quick Check**

1. What is the defining difference between a hook and a skill?
   - A) A hook is written in Python; a skill is written in markdown
   - B) A hook fires every time its event occurs regardless of what the model wants; a skill is invoked only when the model decides it is relevant
   - C) A hook runs after the turn completes; a skill runs before it begins
   - D) A hook can be disabled by the model; a skill cannot
   <details><summary>Answer</summary>B) A hook fires every time its event occurs regardless of what the model wants; a skill is invoked only when the model decides it is relevant - Skills are suggestions the model may take; hooks are rules the harness enforces. That determinism is the whole reason the observability layer exists.</details>

2. Which hook event fires before a tool runs and can block it?
   - A) `PreCompact`
   - B) `Stop`
   - C) `PreToolUse`
   - D) `SubagentStop`
   <details><summary>Answer</summary>C) `PreToolUse` - It is the standard place to block destructive commands and enforce policy. A `PreToolUse` handler can veto the call outright, for example by returning a block result with a reason.</details>

3. Why is a hook described as costing no model context?
   - A) Because hook output is compressed before being added to the prompt
   - B) Because hooks run in your process, not in the model's prompt
   - C) Because hook results are cached at the provider and billed at one-tenth rate
   - D) Because hooks only fire once per session
   <details><summary>Answer</summary>B) Because hooks run in your process, not in the model's prompt - A hook is free in tokens, unlike an instruction you would otherwise stuff into the prompt and pay for on every turn. It is also deterministic, so it blocks something always rather than usually.</details>

4. Where does Claude Code write its session log, and what does that log enable?
   - A) An encrypted SQLite database; it enables cost reporting
   - B) A plaintext JSONL file under `~/.claude/projects/`; it enables rewinding, resuming, and forking sessions
   - C) The provider's servers; it enables cross-device sync
   - D) An in-memory ring buffer; it enables undo within the current turn
   <details><summary>Answer</summary>B) A plaintext JSONL file under `~/.claude/projects/`; it enables rewinding, resuming, and forking sessions - Every message, tool use, and result is recorded. That log is both the audit trail and the debugger: when an agent does something surprising, the JSONL is where you see the exact sequence of tool calls and results.</details>

5. Which Agent SDK option turns "what if it runs forever?" into configuration?
   - A) `effort`
   - B) `setting_sources`
   - C) `allowed_tools`
   - D) `max_turns` and `max_budget_usd`
   <details><summary>Answer</summary>D) `max_turns` and `max_budget_usd` - `max_turns` caps the number of laps and `max_budget_usd` is a hard spending cap. As the architecture breakdown puts it, this makes "budget-aware agents an engineering task, not a hope."</details>

**More Questions**

6. What does the `subtype` on the SDK's result message tell you?
   - A) Which model tier served the request
   - B) How the run ended, for example `success`, `error_max_turns`, or `error_max_budget_usd`
   - C) Which hooks fired during the run
   - D) Whether the session was resumed or started fresh
   <details><summary>Answer</summary>B) How the run ended, for example `success`, `error_max_turns`, or `error_max_budget_usd` - The result also carries the per-session cost, so a caller can branch on why the agent stopped rather than guessing from an empty output.</details>

7. Which of these is a valid hook handler type according to the chapter?
   - A) Only shell commands
   - B) Only in-process Python functions
   - C) Shell commands, HTTP webhooks, MCP tools, prompt judges, and experimentally agent-based verifiers
   - D) Only handlers registered through the Agent SDK
   <details><summary>Answer</summary>C) Shell commands, HTTP webhooks, MCP tools, prompt judges, and experimentally agent-based verifiers - The range matters: a hook can be as simple as a formatter shell command or as involved as another agent checking the work, while still firing deterministically on its event.</details>

8. How does a `PreToolUse` hook relate to Chapter 7's approval policy?
   - A) The hook replaces the approval policy entirely
   - B) Both can block a tool before it runs; the approval policy is a built-in classifier and the hook is your custom code, and in practice you use both
   - C) The approval policy runs only in sandboxed mode; hooks run only outside it
   - D) The hook fires first and, if it passes, the approval policy is skipped
   <details><summary>Answer</summary>B) Both can block a tool before it runs; the approval policy is a built-in classifier and the hook is your custom code, and in practice you use both - The policy covers the common safety tiers and hooks cover project-specific rules.</details>

9. What is `PreCompact` typically used for?
   - A) Estimating whether compaction is necessary this turn
   - B) Choosing which compaction strategy the harness should apply
   - C) Archiving the full transcript before it is summarized
   - D) Warning the user that context is nearly full
   <details><summary>Answer</summary>C) Archiving the full transcript before it is summarized - Compaction is lossy, so `PreCompact` is the last moment at which the complete history still exists. Archiving there preserves what the summary will drop.</details>

10. You want to run an agent unattended in CI on every pull request, and you are worried it might push to main or run up a surprise bill. Which pair of controls addresses both risks?
    - A) A lower `effort` setting and a smaller model
    - B) A `PreToolUse` hook that blocks pushes, plus `max_budget_usd`
    - C) A `Stop` hook that notifies you, plus the session JSONL log
    - D) `setting_sources` loading the project `CLAUDE.md`, plus `allowed_tools`
    <details><summary>Answer</summary>B) A `PreToolUse` hook that blocks pushes, plus `max_budget_usd` - The hook is deterministic, so the push is blocked always rather than usually, and the budget cap stops the run with an `error_max_budget_usd` result instead of quietly spending. Together they are what make unattended runs safe.</details>

**Think About It**

1. You could write "never run `git push`" in the system prompt, or you could write a five-line `PreToolUse` hook. Both express the same rule. Why is the second one a completely different kind of thing?
   <details><summary>Show answer</summary> The prompt version is a request to a probabilistic system that will comply most of the time, and "most of the time" is not a security property when the action is irreversible. The hook is code in your process that runs on every tool call and returns a block, so the push does not happen even if the model is confused, adversarially prompted, or in the middle of a plausible-sounding chain of reasoning that ends in a push. There is a cost dimension too: the prompt instruction is tokens you pay for on every single turn for the whole session, while the hook costs nothing in context at all. The general shape is that anything you can enforce deterministically should not be delegated to the model's judgment, and the harness is where that enforcement lives.</details>

2. The architecture breakdown says the SDK makes budget-aware agents "an engineering task, not a hope." What were people doing before, and why was hoping the default?
   <details><summary>Show answer</summary> Before explicit caps, the only stopping conditions were the model deciding it was finished and whatever crude turn limit the loop happened to have, like the arbitrary counter in Chapter 2's toy loop. An agent stuck in a retry cycle, re-reading the same file, or looping on a failing test would keep spending until someone noticed, and because each individual turn is cheap the bill only becomes visible in aggregate. Hoping was the default because cost was an emergent property of the loop rather than an input to it. `max_turns` and `max_budget_usd` invert that: you declare the ceiling up front, the run halts with a named reason like `error_max_budget_usd`, and your code can branch on it. The shift is from observing cost after the fact to specifying it before.</details>

3. Rewind, resume, and fork sound like features that would need a database and careful state management. They come out of a plaintext JSONL file. How does that work?
   <details><summary>Show answer</summary> An agent session has no hidden state worth preserving: it is a prompt built from an ordered list of messages, tool calls, and results. If you have that list on disk in order, you can reconstruct any point in the session by replaying a prefix of it, which is exactly what rewinding is. Resume is replaying the whole file and continuing; fork is replaying a prefix and appending different events after it. The append-only log is doing all the work because the conversation itself is the state. It is also why the same file doubles as your audit trail, and why Chapter 16's security stories are partly about organizations that could not answer "what did the agent actually touch?"</details>

4. Skills and hooks can encode the same rule, and the chapter treats that as a critical distinction rather than redundancy. When does the difference actually bite?
   <details><summary>Show answer</summary> It bites in exactly the cases you built the rule for. A skill that says "always run the formatter after editing" gets used when the model judges it relevant, which means it gets skipped on the turn where the model is distracted by a failing test, which is the turn where you most wanted it. A `PostToolUse` hook runs then too. The difference shows up as a reliability floor: hooks give you a guarantee you can reason about, while skills give you a behavior you can usually expect. The practical rule is to encode judgment in skills and invariants in hooks, and to be honest with yourself about which category a given rule belongs to.</details>

5. The people who build agent harnesses advise defaulting to workflows and using full agent loops only when exploration is needed. Coming from them, isn't that an odd thing to recommend?
   <details><summary>Show answer</summary> It is only odd if you think the agent loop is the product. The loop's value is handling situations where the steps are not known in advance, and it pays for that flexibility with nondeterminism, variable cost, and a much larger surface for things to go wrong. If you already know the sequence, encoding it as a workflow gives you the same outcome with predictable cost and behavior you can test. The recommendation is really about matching the tool to the uncertainty in the task, and it pairs with the other advice in the chapter, to measure turns and dollars from the start, because you cannot tell whether a loop is earning its nondeterminism until you are watching what it costs.</details>

**Coding Challenge**

Session Log with Rewind and Fork

Build a `SessionLog` that appends typed events (`{"type": ..., "content": ...}`) to an in-memory JSONL-style list, with `append(event)`, `replay()` returning all events, `rewind(n)` truncating to the first `n` events, and `fork(at)` returning a new independent `SessionLog` containing the first `at` events. Then add a `HookManager` with a single `PreToolUse` deny-list handler: given a set of forbidden substrings, `check(command)` returns `{"block": True, "reason": ...}` when any appears, otherwise `{"block": False}`. Wire them together so blocked calls are still recorded in the log.

<details><summary>Python Solution</summary>

```python
import copy


class SessionLog:
    def __init__(self, events=None):
        self.events = list(events or [])

    def append(self, event: dict) -> None:
        self.events.append(copy.deepcopy(event))

    def replay(self) -> list[dict]:
        return list(self.events)

    def rewind(self, n: int) -> None:
        """Truncate to the first n events - the conversation IS the state."""
        self.events = self.events[:n]

    def fork(self, at: int) -> "SessionLog":
        """A new independent session sharing the first `at` events."""
        return SessionLog(copy.deepcopy(self.events[:at]))


class HookManager:
    def __init__(self, forbidden: set[str]):
        self.forbidden = forbidden

    def check(self, command: str) -> dict:
        for bad in self.forbidden:
            if bad in command:
                return {"block": True, "reason": f"'{bad}' blocked by PreToolUse hook"}
        return {"block": False}


def run_tool(log: SessionLog, hooks: HookManager, command: str) -> str:
    verdict = hooks.check(command)
    if verdict["block"]:
        log.append({"type": "tool_blocked", "content": command, "reason": verdict["reason"]})
        return f"BLOCKED: {verdict['reason']}"
    log.append({"type": "tool_use", "content": command})
    log.append({"type": "tool_result", "content": f"ran: {command}"})
    return f"ok: {command}"


# --- demo ---
if __name__ == "__main__":
    log = SessionLog()
    hooks = HookManager({"git push", "rm -rf"})

    log.append({"type": "user", "content": "clean up the branch"})
    print(run_tool(log, hooks, "ls -la"))
    print(run_tool(log, hooks, "git push origin main"))
    print(run_tool(log, hooks, "git status"))

    print("\nevents:", len(log.replay()))
    for e in log.replay():
        print(" ", e["type"], "-", e["content"])

    branch = log.fork(at=3)
    branch.append({"type": "user", "content": "actually, try a different approach"})
    print("\nforked session events:", len(branch.replay()))
    print("original still has:    ", len(log.replay()))

    log.rewind(1)
    print("after rewind(1):       ", log.replay())
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
class SessionLog {
  constructor(events = []) {
    this.events = structuredClone(events);
  }

  append(event) {
    this.events.push(structuredClone(event));
  }

  replay() {
    return [...this.events];
  }

  rewind(n) {
    // Truncate to the first n events - the conversation IS the state.
    this.events = this.events.slice(0, n);
  }

  fork(at) {
    // A new independent session sharing the first `at` events.
    return new SessionLog(this.events.slice(0, at));
  }
}

class HookManager {
  constructor(forbidden) {
    this.forbidden = forbidden;
  }

  check(command) {
    for (const bad of this.forbidden) {
      if (command.includes(bad)) {
        return { block: true, reason: `'${bad}' blocked by PreToolUse hook` };
      }
    }
    return { block: false };
  }
}

function runTool(log, hooks, command) {
  const verdict = hooks.check(command);
  if (verdict.block) {
    log.append({ type: "tool_blocked", content: command, reason: verdict.reason });
    return `BLOCKED: ${verdict.reason}`;
  }
  log.append({ type: "tool_use", content: command });
  log.append({ type: "tool_result", content: `ran: ${command}` });
  return `ok: ${command}`;
}

// --- demo ---
const log = new SessionLog();
const hooks = new HookManager(new Set(["git push", "rm -rf"]));

log.append({ type: "user", content: "clean up the branch" });
console.log(runTool(log, hooks, "ls -la"));
console.log(runTool(log, hooks, "git push origin main"));
console.log(runTool(log, hooks, "git status"));

console.log("\nevents:", log.replay().length);
for (const e of log.replay()) console.log(" ", e.type, "-", e.content);

const branch = log.fork(3);
branch.append({ type: "user", content: "actually, try a different approach" });
console.log("\nforked session events:", branch.replay().length);
console.log("original still has:    ", log.replay().length);

log.rewind(1);
console.log("after rewind(1):       ", log.replay());
```

</details>
