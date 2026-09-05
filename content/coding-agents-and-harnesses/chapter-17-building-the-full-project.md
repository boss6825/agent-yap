# Chapter 17: Building the Full Mini-Harness

## What we are building

Time to assemble. Every MVP from Chapters 2 through 14 was a real part of one system, and this chapter snaps them together into `mininharness`, a small but genuine terminal coding agent. It runs the loop, builds layered prompts, manages context and budget, runs tools behind an approval gate, loads project memory and skills, and can delegate to a subagent. It is a few hundred lines, small enough to read in a sitting, and shaped like the production systems this guide dissects. The only thing it does not ship with is a real model; you drop in an API call (Anthropic, OpenAI, or a local model) in one place, and everything else is the harness, which, as Chapter 1 promised, is 95% of the work.

## Architecture overview

The pieces and where they came from:

```text
                        +-------------------+
   user request ----->  |    agent loop     |  <-- Chapter 2 (the spine)
                        +---------+---------+
                                  |
            +---------------------+----------------------+
            |                     |                      |
     +------v------+      +-------v-------+      +--------v--------+
     | PromptBuilder|     |  ContextMgr   |      |  Budget+Hooks   |
     |  Ch 3 + Ch 9 |     | Ch 4 + Ch 5   |      |  Ch 4 + Ch 12   |
     | (instr+memory|     | (tokens,      |      | (cost/turn caps,|
     |  +skills)    |     |  compaction)  |      |  PreToolUse)    |
     +------+-------+     +-------+-------+      +--------+--------+
            |                     |                      |
            +----------+----------+----------+-----------+
                       |                     |
                +------v------+      +-------v-------+
                | ToolRegistry|      | ApprovalPolicy|
                |   Ch 6      | <--- |    Ch 7       |  every call is gated
                | (+ MCP Ch10)|      | (+ guardian)  |
                +------+------+      +---------------+
                       |
                +------v------+
                |  subagents  |  <-- Chapter 11 (delegate, isolate context)
                |   Ch 11     |
                +-------------+
```

The loop is the spine. Each turn it asks the `ContextManager` to compact if needed, asks the `PromptBuilder` to assemble the request (with memory and skills folded in), calls the model, and for any tool call runs it through `Budget` and `Hooks` and the `ApprovalPolicy` before the `ToolRegistry` executes it. When the model returns plain text, the turn ends. Optional extras: a planner and CodeAct action mode (Chapter 14), a review subagent (Chapters 11 and 13).

## File structure

```text
minharness/
  __init__.py
  model.py          # the ONE place you plug in a real model (Ch 2)
  prompt.py         # PromptBuilder + structured-item helpers (Ch 3)
  context.py        # estimate_tokens, CostModel, Compactor (Ch 4, 5)
  tools.py          # ToolRegistry, shell tool, truncation (Ch 6)
  approvals.py      # ApprovalPolicy, gated_call, Checkpointer (Ch 7)
  parallel.py       # run_tools (Ch 8)
  memory.py         # MemoryLoader (Ch 9)
  skills.py         # SkillLoader + mini MCP (Ch 10)
  subagents.py      # spawn_subagent, orchestrate (Ch 11)
  control.py        # HookManager, Budget (Ch 12)
  agent.py          # the loop that wires it all together (Ch 2 + everything)
  main.py           # CLI entry point
```

Each file is essentially the MVP from its chapter, lightly cleaned so the imports line up. Below is the integration layer, `agent.py`, which is the new code: the glue that turns eleven separate demos into one agent.

## Step-by-step assembly

### Step 1: the model seam

Everything depends on one function. This is the only place that talks to a real model, so it is the only place you change to go from toy to real.

```python
# minharness/model.py
"""The single seam between the harness and a real model.
Swap the body of call_model for an Anthropic / OpenAI / local call.
It must return one of:
  {"type": "text", "content": "..."}                      -> turn ends
  {"type": "tool_calls", "calls": [{"call_id","name","args"}, ...]}
"""
def call_model(request: dict) -> dict:
    # request has keys: instructions (str), tools (list), input (list)  [Chapter 3]
    #
    # REAL VERSION (Anthropic example, pseudocode):
    #   resp = anthropic.messages.create(
    #       system=request["instructions"], tools=request["tools"],
    #       messages=to_messages(request["input"]), model="claude-sonnet-4-6")
    #   return parse(resp)
    #
    # For a runnable demo without an API key, we script a tiny behavior:
    history = request["input"]
    ran_tool = any(it.get("type") == "tool_result" for it in history)
    if not ran_tool:
        return {"type": "tool_calls", "calls": [
            {"call_id": "c1", "name": "shell", "args": {"command": "ls"}}]}
    return {"type": "text", "content": "Done. I listed the directory."}
```

### Step 2: wire the loop

`agent.py` brings every component together. Read it top to bottom; the comments name the chapter each piece comes from.

```python
# minharness/agent.py
"""The integration layer: one agent loop wiring every chapter together."""
from .model import call_model
from .prompt import PromptBuilder, user_msg, tool_call, tool_result
from .context import Compactor, estimate_items_tokens
from .tools import ToolRegistry, Tool, shell_handler
from .approvals import ApprovalPolicy, gated_call
from .parallel import run_tools
from .memory import MemoryLoader
from .skills import SkillLoader
from .control import HookManager, Budget, BudgetExceeded
from .subagents import spawn_subagent, VERIFIER

class MiniHarness:
    def __init__(self, project_root: str, mode: str = "default"):
        # --- Chapter 6: the tool registry (the agent's hands) ---
        self.registry = ToolRegistry()
        self.registry.register(Tool(
            name="shell", description="Run a shell command",
            parameters={"type": "object",
                        "properties": {"command": {"type": "string"}},
                        "required": ["command"]},
            handler=shell_handler))

        # --- Chapter 7: the safety gate in front of every tool ---
        self.policy = ApprovalPolicy(allowlist=[r"^ls", r"^cat", r"^pytest"], mode=mode)

        # --- Chapter 9 + 10: project memory and skills feed the prompt ---
        self.memory = MemoryLoader(project_root)
        self.skills = SkillLoader(f"{project_root}/.skills")

        # --- Chapter 3 + 9 + 10: the prompt assembler ---
        self.prompt = PromptBuilder(
            base_instructions="You are minharness, a careful coding agent.",
            project_instructions=self.memory.load_instructions(project_root),
            skills_summary=self.skills.summary(),
            cwd=project_root,
            tools=self.registry.schemas())

        # --- Chapter 4 + 5: context management ---
        self.compactor = Compactor(max_tokens=8000, keep_recent=6)

        # --- Chapter 12: deterministic control + budget kill switch ---
        self.hooks = HookManager()
        self.hooks.register("PreToolUse", _block_dangerous)
        self.budget = Budget(max_turns=25, max_cost=5.0)

    def _execute_call(self, call: dict) -> str:
        """One tool call: hooks -> approval -> registry (Ch 12, 7, 6)."""
        veto = self.hooks.fire("PreToolUse", call)
        if veto.get("block"):
            return f"Exit code: 126\nBlocked by hook: {veto['reason']}"
        return gated_call(self.registry, self.policy, call["name"], call["args"],
                          unattended=(self.policy.mode == "full-auto"))

    def run(self, user_request: str) -> str:
        history = [user_msg(user_request)]                       # Chapter 3
        while True:
            history = self.compactor.compact(history)            # Chapter 5
            request = self.prompt.build_request(history)         # Chapter 3
            try:
                self.budget.charge(str(request), "")             # Chapter 12
            except BudgetExceeded as e:
                return f"Stopped: {e}"

            response = call_model(request)                       # Chapter 2

            if response["type"] == "text":                       # turn ends
                return response["content"]

            # one or more tool calls: run them (parallel-safe) -> append results
            calls = response["calls"]                            # Chapter 8
            for c in calls:
                history.append(tool_call(c["call_id"], c["name"], c["args"]))
            results = run_tools(calls, lambda c: self._execute_call(c))
            for r in results:
                history.append(tool_result(r["call_id"], r["output"]))

    def review(self, claim: str):                                # Chapters 11, 13
        """Optional: delegate an independent check to a verifier subagent."""
        return spawn_subagent(VERIFIER, f"Verify: {claim}",
                              lambda h, m: "VERIFIED (stub)", self.registry)

def _block_dangerous(payload):                                   # Chapter 12 hook
    cmd = payload.get("args", {}).get("command", "")
    if any(x in cmd for x in ("rm -rf", "git push", "curl")):
        return {"block": True, "reason": f"dangerous command: {cmd!r}"}
```

### Step 3: the entry point

```python
# minharness/main.py
import sys
from .agent import MiniHarness

def main():
    project = sys.argv[1] if len(sys.argv) > 1 else "."
    agent = MiniHarness(project_root=project, mode="default")
    print("minharness ready. Type a request (Ctrl-C to quit).")
    try:
        while True:
            request = input("\n> ")
            print(agent.run(request))
    except KeyboardInterrupt:
        print("\nbye")

if __name__ == "__main__":
    main()
```

### Step 4: run it

```bash
# from the directory that contains the minharness/ package
python -m minharness.main /path/to/your/project
```

With the scripted `call_model`, you will see the agent take a request, ask to run `ls` (gated by the approval policy and the hook), feed the result back, and finish with a text message. Replace the body of `call_model` with a real API call and the same harness becomes a real coding agent: now the model decides what to run, and every safety, memory, context, and budget mechanism you built is already wrapped around it.

## How the chapters show up at runtime

Trace one real turn through the assembled system to see the whole guide working at once:

1. You type a request. The loop wraps it as a structured `user_msg` (Chapter 3).
2. `Compactor` checks the token count and summarizes old turns if the history is too big (Chapters 4, 5).
3. `PromptBuilder` assembles instructions (with `AGENTS.md` memory from Chapter 9 and skill descriptions from Chapter 10), the tool schemas (Chapter 6), and the structured history, stable content first for caching (Chapter 5).
4. `Budget.charge` checks you have not blown the turn or cost cap (Chapters 4, 12).
5. `call_model` runs inference (Chapter 2). It returns a tool call.
6. The `PreToolUse` hook (Chapter 12) and the `ApprovalPolicy` (Chapter 7) both get a veto before the `ToolRegistry` (Chapter 6) executes anything. Multiple calls run through `run_tools` (Chapter 8).
7. Results are appended with `call_id` linkage (Chapter 3) and the loop repeats.
8. Eventually the model returns text; the turn ends. For a risky claim, you can call `review()` to spin up a verifier subagent (Chapters 11, 13).

That is the entire guide, running.

## Where to take it next

The mini-harness is a foundation, not a finish line. Natural extensions, each pointing back to a chapter:

- **Real sandboxing.** Replace the bare `subprocess` call with an actual sandbox (containers, or the OS mechanisms from Chapter 7). This is the single most important hardening step before running it on anything you care about.
- **CodeAct mode.** Add Chapter 14's code-action executor as an alternative to discrete tool calls, plus a `Planner` that writes a `todo.md`.
- **MCP servers.** Register external tools through the Chapter 10 MCP client to connect real systems.
- **A real review pass.** Wire Chapter 13's two-tier review (LLM plus a deterministic check) into `review()`.
- **Budgets and observability for production.** Persist a session log (Chapter 12), expose `max_budget_usd` properly (Chapter 16), and run it headless in CI with a human gate.
- **Deep research mode.** Add Chapter 15's MasterAgent/SubAgent/ReviewAgent flow for sourced reports.

## Connecting to the bigger picture

This is the payoff of the whole guide. Chapter 1 claimed the harness is the product and the loop is the small part; you just built a harness where the loop is maybe twenty lines and everything else, the prompt, the context management, the tools, the safety, the memory, the budgets, is the substance. Every component is a recognizable, simplified version of what Claude Code, Codex, Cursor, and Manus run in production. The ideas scale; the structure does not change.

## Key takeaways

- The capstone is the eleven MVPs wired together: a loop (Ch 2) that builds prompts (Ch 3, 9, 10), manages context and budget (Ch 4, 5, 12), and runs tools (Ch 6) through an approval gate (Ch 7), in parallel (Ch 8), with optional subagents (Ch 11).
- There is exactly **one seam to a real model** (`call_model`); swapping it turns the demo into a working agent, proving Chapter 1's point that the harness is the bulk of the work.
- Safety is structural: every tool call passes a hook and an approval policy before executing, and a budget caps runaway loops.
- The architecture is small enough to read and faithful enough to scale; the production systems differ in polish and robustness, not in shape.
- Harden it next with real sandboxing, then extend with CodeAct, MCP, a two-tier review, observability, and research mode.

## Review

**Quick Check**

1. In the mini-harness, what is the significance of `call_model`?
   - A) It is the only function that can be run in parallel
   - B) It is the single seam to a real model; swapping its body turns the demo into a working agent
   - C) It owns the approval policy, so every tool call passes through it
   - D) It caches the assembled prompt so the loop does not rebuild it each turn
   <details><summary>Answer</summary>B) It is the single seam to a real model; swapping its body turns the demo into a working agent - Everything else is harness. That one function being the only thing you change is the proof of Chapter 1's claim that the harness is 95% of the work.</details>

2. What ends a turn in the mini-harness loop?
   - A) The budget's `max_turns` cap being reached
   - B) The `ApprovalPolicy` denying a tool call
   - C) The model returning `{"type": "text", ...}` instead of tool calls
   - D) The `Compactor` deciding the history is too large to continue
   <details><summary>Answer</summary>C) The model returning `{"type": "text", ...}` instead of tool calls - When the model returns plain text, `run` returns its content. Tool calls keep the loop going: results are appended to history and the loop repeats.</details>

3. In `_execute_call`, what order do the safety layers run in?
   - A) Registry, then approval policy, then hooks
   - B) Approval policy, then hooks, then registry
   - C) Hooks (`PreToolUse`), then approval policy via `gated_call`, then the registry executes
   - D) Budget, then registry, then hooks
   <details><summary>Answer</summary>C) Hooks (`PreToolUse`), then approval policy via `gated_call`, then the registry executes - The hook gets the first veto (returning exit code 126 with a reason if it blocks), then `gated_call` applies the approval policy, and only then does the `ToolRegistry` run anything.</details>

4. You want the mini-harness to run unattended in CI, where no human can answer an approval prompt. Which part of the wiring handles that?
   - A) Setting `Compactor(max_tokens=...)` higher so the run never pauses to compact
   - B) The `unattended` flag passed to `gated_call`, derived from whether the policy mode is `full-auto`
   - C) Registering an extra `PreToolUse` hook that auto-approves everything
   - D) Removing the `ApprovalPolicy` from the constructor
   <details><summary>Answer</summary>B) The `unattended` flag passed to `gated_call`, derived from whether the policy mode is `full-auto` - `_execute_call` computes `unattended=(self.policy.mode == "full-auto")`, so the mode chosen at construction decides whether the gate can prompt a human or must decide on its own.</details>

5. A developer says the capstone proves the agent loop is the hard part, since everything routes through it. What does the chapter actually argue?
   - A) The loop is the hard part, but only once subagents are involved
   - B) The loop is maybe twenty lines; the substance is the prompt, context management, tools, safety, memory, and budgets around it
   - C) The loop and the harness are equally sized, which is why the file structure has twelve modules
   - D) The loop is trivial only because the model is scripted; a real model would require far more loop logic
   <details><summary>Answer</summary>B) The loop is maybe twenty lines; the substance is the prompt, context management, tools, safety, memory, and budgets around it - Chapter 1 claimed the harness is the product and the loop is the small part, and the assembled capstone is the demonstration. Every component is a recognizable, simplified version of what production systems run.</details>

**More Questions**

6. What does the `_block_dangerous` hook do, and what makes it different from the approval policy?
   - A) It prompts the user before any command runs; the approval policy runs only in `full-auto` mode
   - B) It is a deterministic `PreToolUse` check that vetoes commands containing `rm -rf`, `git push`, or `curl`, running before the approval policy gets involved
   - C) It rewrites dangerous commands into safe equivalents before execution
   - D) It logs dangerous commands for audit but does not block them
   <details><summary>Answer</summary>B) It is a deterministic `PreToolUse` check that vetoes commands containing `rm -rf`, `git push`, or `curl`, running before the approval policy gets involved - It returns `{"block": True, "reason": ...}`, and `_execute_call` turns that into an exit-code-126 result. It is Chapter 12's deterministic control, layered in front of Chapter 7's policy.</details>

7. Where do `AGENTS.md` project memory and skill descriptions enter the system?
   - A) They are appended to the history as user messages on the first turn
   - B) They are loaded by `MemoryLoader` and `SkillLoader` and passed into `PromptBuilder` as `project_instructions` and `skills_summary`
   - C) They are injected by the `Compactor` when it summarizes old turns
   - D) They are registered as tools in the `ToolRegistry` so the model can call them
   <details><summary>Answer</summary>B) They are loaded by `MemoryLoader` and `SkillLoader` and passed into `PromptBuilder` as `project_instructions` and `skills_summary` - This puts them in the instructions block at the front of the prompt, which is exactly why editing `AGENTS.md` mid-session busts the cache.</details>

8. Trace one turn: after `Compactor` runs and `PromptBuilder` assembles the request, what happens before `call_model` is invoked?
   - A) The `ToolRegistry` pre-validates every tool schema
   - B) `Budget.charge` checks that the turn and cost caps have not been blown, raising `BudgetExceeded` if they have
   - C) The `ApprovalPolicy` asks the user to confirm the turn
   - D) `run_tools` warms up the parallel execution pool
   <details><summary>Answer</summary>B) `Budget.charge` checks that the turn and cost caps have not been blown, raising `BudgetExceeded` if they have - The loop catches it and returns `Stopped: {e}`, which is the kill switch from Chapter 12 acting as both a safety and a financial control.</details>

9. The chapter's "where to take it next" list calls one extension the single most important hardening step. Which is it, and why?
   - A) Adding MCP servers, because external tools are where most real work happens
   - B) Wiring a two-tier review pass, because agents cannot mark their own homework
   - C) Real sandboxing to replace the bare `subprocess` call, before running the harness on anything you care about
   - D) Persisting a session log, because without audit trails you cannot debug failures
   <details><summary>Answer</summary>C) Real sandboxing to replace the bare `subprocess` call, before running the harness on anything you care about - Containers or the OS mechanisms from Chapter 7. The other extensions add capability; this one is what makes it safe to point at a real machine.</details>

10. What is the argument for why this few-hundred-line harness is a faithful model of production systems?
    - A) It uses the same model APIs, so behavior is identical at any scale
    - B) Every component is a recognizable simplified version of what Claude Code, Codex, Cursor, and Manus run; the production systems differ in polish and robustness, not in shape
    - C) It has been benchmarked against production agents on the same tasks
    - D) It implements every feature those systems ship, just with smaller limits
    <details><summary>Answer</summary>B) Every component is a recognizable simplified version of what Claude Code, Codex, Cursor, and Manus run; the production systems differ in polish and robustness, not in shape - The ideas scale; the structure does not change. That is the payoff of reading the whole guide.</details>

**Coding Challenge**

The Gauntlet: Layered Tool Gate

Rebuild `_execute_call` as a standalone, testable pipeline. Write `execute_call(call, hooks, policy, registry)` where `hooks` is a list of functions returning either `None` or `{"block": True, "reason": str}`, `policy` is a dict with an `allowlist` of regex patterns and a `mode` of `"default"` or `"full-auto"`, and `registry` maps tool names to handlers. Enforce the chapter's order: every hook runs first (first veto wins, returning `Exit code: 126\nBlocked by hook: <reason>`), then the allowlist check (a non-matching command is denied in `full-auto` but returns `NEEDS_APPROVAL` in `default`), and only then the handler. An unknown tool name must return an error without reaching any handler.

<details><summary>Python Solution</summary>

```python
import re


def execute_call(call: dict, hooks: list, policy: dict, registry: dict) -> str:
    """Layered gate: hooks (Ch 12) -> approval (Ch 7) -> registry (Ch 6)."""
    name, args = call["name"], call.get("args", {})

    # Layer 1: deterministic hooks get the first veto.
    for hook in hooks:
        veto = hook(call) or {}
        if veto.get("block"):
            return f"Exit code: 126\nBlocked by hook: {veto['reason']}"

    # Layer 2: the approval policy.
    command = args.get("command", "")
    allowed = any(re.match(p, command) for p in policy.get("allowlist", []))
    if not allowed:
        if policy.get("mode") == "full-auto":
            return f"Exit code: 126\nDenied by policy: {command!r}"
        return "NEEDS_APPROVAL"

    # Layer 3: the registry finally executes.
    handler = registry.get(name)
    if handler is None:
        return f"Exit code: 127\nUnknown tool: {name}"
    return handler(args)


# --- demo ---
if __name__ == "__main__":
    def block_dangerous(call):
        cmd = call.get("args", {}).get("command", "")
        if any(x in cmd for x in ("rm -rf", "git push", "curl")):
            return {"block": True, "reason": f"dangerous command: {cmd!r}"}

    registry = {"shell": lambda a: f"ran {a['command']!r}"}
    policy = {"allowlist": [r"^ls", r"^cat", r"^pytest"], "mode": "default"}
    hooks = [block_dangerous]

    def call(cmd, name="shell"):
        return {"call_id": "c1", "name": name, "args": {"command": cmd}}

    print(execute_call(call("ls -la"), hooks, policy, registry))
    print(execute_call(call("rm -rf /"), hooks, policy, registry))
    print(execute_call(call("git status"), hooks, policy, registry))
    print(execute_call(call("ls"), hooks, {**policy, "mode": "full-auto"}, registry))
    print(execute_call(call("ls", name="deploy"), hooks, policy, registry))
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function executeCall(call, hooks, policy, registry) {
  // Layered gate: hooks (Ch 12) -> approval (Ch 7) -> registry (Ch 6).
  const name = call.name;
  const args = call.args || {};

  // Layer 1: deterministic hooks get the first veto.
  for (const hook of hooks) {
    const veto = hook(call) || {};
    if (veto.block) {
      return `Exit code: 126\nBlocked by hook: ${veto.reason}`;
    }
  }

  // Layer 2: the approval policy.
  const command = args.command || "";
  const allowed = (policy.allowlist || []).some((p) =>
    new RegExp(p).test(command)
  );
  if (!allowed) {
    if (policy.mode === "full-auto") {
      return `Exit code: 126\nDenied by policy: '${command}'`;
    }
    return "NEEDS_APPROVAL";
  }

  // Layer 3: the registry finally executes.
  const handler = registry[name];
  if (!handler) return `Exit code: 127\nUnknown tool: ${name}`;
  return handler(args);
}

// --- demo ---
function blockDangerous(call) {
  const cmd = (call.args || {}).command || "";
  if (["rm -rf", "git push", "curl"].some((x) => cmd.includes(x))) {
    return { block: true, reason: `dangerous command: '${cmd}'` };
  }
  return null;
}

const registry = { shell: (a) => `ran '${a.command}'` };
const policy = { allowlist: ["^ls", "^cat", "^pytest"], mode: "default" };
const hooks = [blockDangerous];
const mk = (cmd, name = "shell") => ({ call_id: "c1", name, args: { command: cmd } });

console.log(executeCall(mk("ls -la"), hooks, policy, registry));
console.log(executeCall(mk("rm -rf /"), hooks, policy, registry));
console.log(executeCall(mk("git status"), hooks, policy, registry));
console.log(executeCall(mk("ls"), hooks, { ...policy, mode: "full-auto" }, registry));
console.log(executeCall(mk("ls", "deploy"), hooks, policy, registry));
```

</details>

**Think About It**

1. Chapter 1 made a claim that probably sounded like rhetoric at the time: the harness is the product, and the loop is 95% of the work. Now you have the code. Look at the file structure - twelve modules, and the loop is one `while True` inside one of them. What exactly did those other eleven files buy?
   <details><summary>Show answer</summary>They bought everything that separates a demo from something you would let near a real repo. The loop by itself is: build a request, call the model, run what it asks for, repeat. That works perfectly right up until the conversation outgrows the context window (so you need `context.py`), or the model asks to run `rm -rf` (so you need `approvals.py` and a hook), or a flaky test sends it into forty retries (so you need `control.py`), or it does not know your project's conventions (so you need `memory.py` and `skills.py`). None of those is a cleverness problem, and none is solved by a better model - they are all the environment being messier than the loop assumes. That is why swapping `call_model` for a real API turns this into a working agent immediately: the hard part was already built, and it was never the loop.</details>

2. Every safety mechanism in the capstone is a filter the agent passes *through*, not an instruction it is asked to follow. There is no "please do not run destructive commands" in the system prompt doing this work. Why is the design structural rather than instructional?
   <details><summary>Show answer</summary>Because an instruction is a request to a probabilistic system, and a gate is a property of the code path. Telling the model to avoid `rm -rf` works most of the time, which is a different thing from working - and the cases where it fails are exactly the confusing, high-pressure situations where you needed it most. The capstone's arrangement makes compliance unnecessary: `_execute_call` is the only way to reach the registry, and it runs the hook and then the approval policy every single time, so a dangerous command is stopped by control flow whether the model intended it or not. Notice the same logic in `Budget.charge`, which raises before inference rather than asking the model to be frugal. The general principle worth carrying out of the guide: when a property must always hold, put it somewhere that cannot be talked out of it.</details>

3. Read `model.py` again. It is a stub - it does not call anything, it just returns a canned tool call and then a canned text response. And yet the whole harness runs end to end against it. Why is being able to run the system with no model at all more than a convenience?
   <details><summary>Show answer</summary>Because it lets you test the harness independently of the thing that makes testing hard. A real model is nondeterministic, slow, and costs money per run, which means any bug you find while it is in the loop comes with the question of whether the model or your code caused it. Script the model and that ambiguity disappears: the hook either blocks `rm -rf` or it does not, the compactor either triggers at the token threshold or it does not, and the same input produces the same trace every time. It also localizes the risk of the swap - `call_model` has a contract (text, or tool calls with `call_id`, `name`, `args`) and as long as the real implementation honors it, nothing downstream needs to change. That is worth noticing as a design pattern well beyond agents: pushing the nondeterministic dependency behind one narrow seam is what makes the deterministic 95% testable.</details>

4. The chapter insists this few-hundred-line project differs from Claude Code and Codex in polish and robustness, not in shape. That is a bold thing to say about systems with enormous engineering teams behind them. What would make it true - and what would make it false?
   <details><summary>Show answer</summary>It is true in the sense that matters for understanding: trace a turn through a production agent and you find the same components in the same order - assemble a prompt from instructions, memory, and tool schemas; manage context against a window; call the model; gate every tool call; append results; repeat. Nothing in the capstone is a toy stand-in for a structurally different production mechanism; they are the same mechanisms with less hardening. What separates them is the part the guide keeps calling the hard part - a real sandbox instead of `subprocess`, retry and error handling that survives a flaky network, prompt tuning refined over millions of sessions, observability, and the accumulated handling of thousands of edge cases. The claim would be false if scale forced a different architecture, and the evidence across every system dissected here is that it does not. The ideas scale; the structure does not change. What grows is the amount of reality the code has to absorb.</details>
