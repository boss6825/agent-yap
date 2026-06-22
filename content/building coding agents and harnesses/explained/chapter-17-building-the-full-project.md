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
