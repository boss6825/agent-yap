# Chapter 11: Subagents and Multi-Agent Orchestration

## Concept explanation

By now you have a single agent that loops, builds prompts, manages context, runs tools safely, and remembers things. The next leap is to let it spawn *other* agents. A **subagent** is a fresh agent instance with its own context window that the parent hands a task; it works autonomously and returns a result. This is the "multi-agent" layer (layer 5) and "agent contracts and orchestration" (pillar 4).

The single most important reason subagents exist is **context isolation**, and it follows directly from Chapter 4. A research or exploration task generates a huge amount of noisy intermediate output (file dumps, search results, DOM snapshots). If that all lands in your main conversation, it eats your context window and your budget. A subagent does that messy work in its *own* window and returns only a tidy summary. Cursor's docs say it plainly: "Long research or exploration tasks don't consume space in your main conversation." The parent stays focused on decisions; the subagent absorbs the mess.

A real-life analogy: you are leading a project and need a competitor analysis. You do not read fifty articles yourself and clutter your desk; you ask a researcher to do it and bring back a two-page brief. You get the conclusion without the fifty tabs. The subagent is that researcher, and its fresh context window is the separate desk.

### Built-in subagents

Cursor ships three built-in subagents, chosen by analyzing where context limits got hit:

| Subagent | Job | Why isolate it |
|---|---|---|
| Explore | Search and analyze the codebase | Generates large intermediate output; uses a faster model to run many parallel searches |
| Bash | Run a series of shell commands | Command output is verbose; isolating it keeps the parent focused on decisions, not logs |
| Browser | Drive a browser via MCP tools | Produces noisy DOM snapshots and screenshots; the subagent filters to relevant results |

Notice the model-flexibility trick: the Explore subagent uses a *faster, cheaper* model by default, so it can run ten parallel searches in the time one main-agent search would take. That ties back to pillar 5, **tiered execution**: use a cheap model for the grunt work and reserve the expensive one for the hard reasoning.

### Foreground vs background, and the contract

Subagents run in one of two modes. **Foreground** blocks until done and returns the result, good for sequential work where you need the output now. **Background** returns immediately and works independently, good for long-running or parallel workstreams. Cursor lets you launch several at once for throughput, and (since version 2.5) subagents can even launch their own child subagents, up to a nesting limit.

The thing that makes orchestration reliable is the **contract**, pillar 4. Each subagent gets a clear input (a self-contained prompt, because it has no access to the parent's history) and returns a structured output the next step can consume. The "Seven Pillars" breakdown is strict about this: define explicit contracts so a subagent does one thing, does it in isolation, and returns a predictable shape. Codex exposes the lifecycle as primitives: `spawn_agent`, `wait_agent`, `send_message`, `close_agent`. Each subagent has its own context and sandbox.

### The orchestrator and verifier patterns

Two patterns recur across the sources. The **orchestrator pattern**: a parent coordinates specialists in sequence, for example Planner (analyze requirements, make a plan) then Implementer (build it) then Verifier (confirm it matches). The "Everything About Codex" guide describes Codex's subagent manager decomposing work and dispatching parallel workers, each with its own context, which is how it claims to compress weeks of work into days by running independent threads at once. The likely near future it sketches: an architect agent proposes, builder agents implement in parallel, a test agent verifies, a reviewer critiques, and a human signs off.

The **verification agent** deserves special attention because it fixes a real, common failure. AI agents love to declare victory. They mark a task done when the implementation is partial or broken. A verifier is a deliberately skeptical subagent whose only job is to check claims: identify what was claimed, confirm the implementation exists and runs, run the tests, look for missed edge cases, and report what actually passed versus what is broken. Cursor's example prompt instructs it to "not accept claims at face value. Test everything." This is the multi-agent expression of Chapter 10's "an agent cannot mark its own homework," and it leads straight into Chapter 13's security agents.

### Worktrees and teams

Two more pieces for completeness. **Worktree isolation** (git worktrees) gives parallel agents separate working copies of the same repo so their edits never collide, which is how Codex runs a feature task, a bug fix, and a refactor at once. **Agent teams** (experimental in Claude Code) coordinate multiple independent sessions with a shared task list, a stronger separation than subagents, which only report upward.

### The honest tradeoffs

Subagents are not free. Cursor's docs lay out the costs candidly: each subagent has its own context and token usage, so running five in parallel uses roughly five times the tokens; there is startup overhead because each gathers its own context; and for a simple task a subagent can be *slower* than the main agent because it starts fresh. The benefit is context isolation and parallelism, not raw speed. The anti-pattern to avoid: do not create dozens of vague "helper" agents. Cursor warns that fifty subagents with descriptions like "helps with coding" are useless because the agent cannot tell when to use them. Start with two or three focused ones with sharp descriptions.

## Why it matters

Subagents are the answer to the context wall from Chapter 4 and the path to parallel throughput from Chapter 8. They are also how you encode specialization (a security reviewer, a test runner, a verifier) and how you keep noisy work from poisoning the main thread. Most importantly, the verifier pattern is a structural reliability mechanism: independent checking is how you catch an agent that confidently shipped something broken, which is the central risk Chapters 13 and 16 are about.

## How it works: a spawner with isolated context

The mechanism is a function that takes a task, runs a *fresh* agent loop with its own history (not the parent's), and returns only the final summary to the parent. The parent's context never sees the subagent's intermediate steps. We reuse Chapter 2's loop shape.

## Code MVP: a subagent spawner

```python
"""
chapter 11: subagents and orchestration.
spawn_subagent runs a FRESH agent loop with its own context window and
returns only a summary to the parent. An orchestrator chains a planner,
an implementer, and a skeptical verifier.
"""
from dataclasses import dataclass

@dataclass
class SubagentSpec:
    name: str
    instructions: str          # the subagent's system prompt (its contract)
    model: str = "inherit"     # 'inherit' or a cheaper/faster model (tiered execution)

def run_isolated_loop(spec: SubagentSpec, task: str, model_fn, tools) -> str:
    """A subagent: its own history, separate from the parent's. Returns a
    summary string. (Real version reuses Chapter 2's agent_loop verbatim.)"""
    history = [
        {"role": "system", "content": spec.instructions},
        {"role": "user", "content": task},          # self-contained: no parent history
    ]
    # ... the same loop as Chapter 2 runs here, using model_fn and tools ...
    summary = model_fn(history, spec.model)          # produces ONLY a final summary
    return summary

def spawn_subagent(spec, task, model_fn, tools, background=False):
    if background:
        # Real harness: launch on a thread/process and return a handle.
        # Toy version stays synchronous for clarity.
        pass
    return run_isolated_loop(spec, task, model_fn, tools)

# --- The orchestrator pattern: planner -> implementer -> verifier ---
PLANNER = SubagentSpec("planner",
    "Analyze the request and output a numbered technical plan. Plan only.")
IMPLEMENTER = SubagentSpec("implementer",
    "Implement the plan. Make the edits and run the build.")
VERIFIER = SubagentSpec("verifier",
    "You are a SKEPTICAL validator. Confirm the work actually runs and tests "
    "pass. Report what passed vs what is incomplete. Do not trust claims.")

def orchestrate(request, model_fn, tools):
    plan = spawn_subagent(PLANNER, request, model_fn, tools)
    result = spawn_subagent(IMPLEMENTER, f"Plan:\n{plan}\n\nImplement it.", model_fn, tools)
    verdict = spawn_subagent(VERIFIER, f"Claim:\n{result}\n\nVerify it.", model_fn, tools)
    return {"plan": plan, "result": result, "verdict": verdict}

if __name__ == "__main__":
    # Fake model: each subagent returns a canned summary so the flow is visible.
    def fake_model(history, model):
        role = history[0]["content"][:20]
        if "Analyze" in history[0]["content"]:
            return "1. Add validateEmail()  2. Add tests  3. Run pytest"
        if "Implement" in history[0]["content"]:
            return "Added validateEmail() and 3 tests. Claimed: all pass."
        return "VERIFIED: function exists, 3/3 tests pass. No edge cases missed."
    from pprint import pprint
    pprint(orchestrate("add email validation", fake_model, tools={}))
```

Run it and you see three isolated subagents hand structured output down the chain: a plan, an implementation claim, and an independent verdict. The parent only ever sees those three summaries, not the dozens of tool calls each subagent might have made internally. That is context isolation plus the orchestrator and verifier patterns in one small flow.

## Connecting to the bigger picture

Subagents are the best context-management tool of all, completing the set from Chapter 5: a subagent keeps noisy work out of the main window entirely. The contract idea is pillar 4 made concrete, and the verifier is Chapter 10's anti-homework rule scaled into a role. Tiered execution (cheap model for grunt work) is pillar 5. Chapter 13's security agents are specialized verifiers, and Chapter 14's Manus and Chapter 15's deep research agents are multi-agent systems built on exactly these primitives. In the capstone, `spawn_subagent` lets the main loop delegate a research pass and get back a summary.

## Key takeaways

- A **subagent** is a fresh agent with its own context window; its main purpose is **context isolation**, keeping noisy intermediate work out of the parent's window.
- Built-in subagents (Explore, Bash, Browser) isolate the noisiest operations; Explore uses a cheaper model to run many searches in parallel (tiered execution).
- Run subagents in **foreground** (blocking, you need the result) or **background** (parallel workstreams); give each a clear **contract**: self-contained input, structured output.
- The **orchestrator** pattern chains specialists (planner, implementer, verifier); the **verifier** is a skeptical agent that catches work falsely marked done.
- Subagents cost more tokens and add startup overhead; their benefit is isolation and parallelism, not speed. Keep them few and sharply described.

Original sources: Cursor's [Subagents docs](https://docs.cursor.com/), Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works), the "Inside the Codex Agent Loop" deep-dive, and the "Seven Pillars" breakdown.
