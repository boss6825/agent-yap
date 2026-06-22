# Chapter 14: Autonomous Task Agents: Manus and CodeAct

## Concept explanation

Coding agents like Claude Code and Codex are tuned for software work in a repo. **Manus** is a more general autonomous agent: give it a goal ("research this topic and write a report," "build and deploy a small website") and it runs end to end in a cloud sandbox, browsing the web, writing and running code, and producing real deliverables. It is a great capstone case study because it combines almost everything from earlier chapters (the loop, tools, sandbox, memory, planning, multi-agent) and adds two distinctive ideas worth stealing: **CodeAct** and **file-based memory**. Most of what follows comes from a reverse-engineering report based on Manus's leaked system prompt and the CodeAct research paper it cites.

### The setup: a digital worker in a sandbox

Manus is a wrapper around foundation models (it reportedly started on Claude 3.5 plus fine-tuned Qwen models) running inside a full Ubuntu sandbox in the cloud, with a shell (even sudo), a browser it controls, a file system, and Python and Node interpreters. Because it runs server-side, it keeps working even if your laptop is off. That sandbox-with-tools is Chapters 6 and 7 at full scale.

### CodeAct: code as the action language

Here is Manus's signature idea. Most agents act through structured tool calls: the model emits something like `{"action": "search", "query": "..."}` and the harness runs it. CodeAct instead lets the model **write a short Python program as its action**. Need the weather? It writes Python that imports a client, calls the API, and prints the result. The sandbox runs that code and returns the output (or the error) as the observation.

Why is this powerful? Because code is far more expressive than a fixed menu of tool calls. One snippet can chain several operations, add conditionals, loop, and use any library. The CodeAct paper (ICML 2024) found that agents which produce code for actions have significantly higher success rates on complex tool-use tasks than those limited to text or JSON tool calls. The action space is the whole language, not a handful of functions. And the agent can debug itself: if the code throws, it reads the error and rewrites the code, exactly like a developer at a REPL.

The flip side, and Manus handles this carefully, is safety. Arbitrary code execution is the most dangerous thing an agent can do, which is why Manus runs it in a locked sandbox and follows strict rules (one action per step, prefer non-interactive flags, never run irreversible operations without permission). Everything from Chapter 7 applies, doubly.

### The loop with a plan and a checklist

Manus runs the now-familiar loop, framed as **analyze, plan, execute, observe**, repeated until the task is done, with one deliberate constraint: **one tool action per iteration**. It must wait for each result before deciding the next step. This prevents the model from firing off a long chain of unchecked operations and keeps every step observable, which matters a lot for an agent that runs unattended.

Two modules structure the autonomy:

- A **planner module** decomposes a high-level goal into an ordered list of steps, injected as a "Plan" event the agent follows and can revise on the fly. This is the orchestrator's planner from Chapter 11, built into a single agent.
- A **knowledge module** and a **datasource module** inject reference material and authoritative data (via pre-approved APIs) into context when relevant, so the agent prefers real data over web scraping. This is retrieval-augmented generation wired into the loop, and it is the anti-hallucination contract from Chapter 10 ("prefer authoritative sources; do not make things up").

### File-based memory: the todo.md trick

This is the second idea worth stealing, and it is the practical answer to Chapter 4's context limit. Instead of trying to hold everything in the context window, Manus **externalizes memory to files**. Its working memory is an **event stream** (a typed log of user messages, actions, and observations, the structured history from Chapter 3), but the durable memory lives on disk:

- It writes intermediate results to files (one per report section, say) and recombines them later.
- It keeps a live `todo.md` checklist of the plan, ticking off each step as it finishes. If the context gets truncated, the `todo.md` is the source of truth for what is done and what remains.
- Long documents are drafted in pieces and concatenated, rather than generated in one giant output, which dodges token limits and keeps things coherent.

The `todo.md` trick is the kind of simple idea that punches above its weight. A human project manager keeps a checklist precisely because their own working memory is unreliable; Manus does the same for the same reason. It is external storage (Chapter 5's third context move) used as a planning spine.

### Replicating it with open tools

The reverse-engineering report includes a blueprint for rebuilding Manus from open components, which doubles as a tidy summary of the architecture: an LLM core (the open CodeActAgent model, a fine-tuned Mistral, is purpose-built for this), a Docker sandbox with Python/Node/a headless browser, a tool module (`search_web`, `browse_url`, `execute_python`, `run_shell`, file ops), a planner, a vector store for retrieval, and file-based memory. The hardest part, the report stresses, is not the architecture but the reliability: prompt tuning and error handling to stop infinite loops and keep it from fabricating. That matches every other source in this guide; the loop is easy, the harness is hard.

## Why it matters

Manus shows what the harness ideas look like when pushed to a fully autonomous, general-purpose agent. CodeAct is a genuinely different action model that you may want for agents doing varied, open-ended work (it trades a bigger action space for tighter sandboxing needs). And file-based memory, especially the `todo.md` pattern, is a cheap, robust technique any agent can adopt to survive long tasks without drowning its context window. Together they round out your toolkit beyond the repo-focused coding agents.

## How it works: a CodeAct loop with a planner and a todo file

The MVP combines three pieces: a planner that turns a goal into a `todo.md`, a CodeAct executor that runs the model's Python in a (here, simplified) sandbox and feeds back the result, and file-based memory that persists progress. One action per iteration, observe, repeat.

## Code MVP: a CodeAct-style agent loop

```python
"""
chapter 14: a CodeAct-style autonomous loop with file-based memory.
The model's "action" is a short Python snippet (CodeAct). A planner writes a
todo.md checklist; the loop executes one action per iteration and records
progress to disk. (Execution here is simplified; use Chapter 7's sandbox.)
"""
import os, io, contextlib

WORKSPACE = "/tmp/manus_demo"
os.makedirs(WORKSPACE, exist_ok=True)

# --- Planner: goal -> ordered steps, persisted as todo.md ---
def make_plan(goal: str) -> list:
    # A real planner asks the model; here we sketch a fixed decomposition.
    steps = [f"Gather info for: {goal}", "Analyze findings", "Write output.md"]
    with open(os.path.join(WORKSPACE, "todo.md"), "w") as f:
        f.write("\n".join(f"- [ ] {s}" for s in steps))
    return steps

def mark_done(step_index: int, steps: list):
    """Tick a step off in todo.md (file-based memory, survives context loss)."""
    lines = [f"- [{'x' if i <= step_index else ' '}] {s}" for i, s in enumerate(steps)]
    open(os.path.join(WORKSPACE, "todo.md"), "w").write("\n".join(lines))

# --- CodeAct executor: run the model's Python action, capture output ---
def execute_code_action(code: str) -> str:
    """Run a snippet and capture stdout. PRODUCTION: run in Chapter 7's sandbox,
    never with raw exec on the host."""
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            exec(code, {"WORKSPACE": WORKSPACE, "os": os})   # toy sandbox only
        return buf.getvalue() or "(no output)"
    except Exception as e:
        return f"ERROR: {e}"            # the agent reads this and self-corrects

# --- The loop: analyze -> plan -> execute -> observe, one action per step ---
def codeact_loop(goal: str, code_for_step):
    steps = make_plan(goal)
    event_stream = [{"type": "user", "content": goal}]
    for i, step in enumerate(steps):
        code = code_for_step(i, step)               # the model writes Python here
        event_stream.append({"type": "action", "content": code})
        observation = execute_code_action(code)     # ONE action, then observe
        event_stream.append({"type": "observation", "content": observation})
        mark_done(i, steps)                         # persist progress to disk
    return event_stream

if __name__ == "__main__":
    # Fake "model": returns a Python action for each step (CodeAct in action).
    def code_for_step(i, step):
        if i == 0:
            return "print('gathered: agents need a loop, tools, memory')"
        if i == 1:
            return "print('analysis: the loop is simple, the harness is hard')"
        return ("open(os.path.join(WORKSPACE, 'output.md'), 'w')"
                ".write('# Report\\nThe harness is the product.')\n"
                "print('wrote output.md')")
    stream = codeact_loop("explain coding agents", code_for_step)
    print("\n".join(f"{e['type']}: {e['content'][:60]}" for e in stream))
    print("\ntodo.md:\n" + open(os.path.join(WORKSPACE, "todo.md")).read())
    print("\noutput.md:\n" + open(os.path.join(WORKSPACE, "output.md")).read())
```

Run it: the planner writes a three-item `todo.md`, the loop executes one Python action per step (gather, analyze, write the report file), checks each item off on disk, and produces `output.md`. The `todo.md` and `output.md` persisting to disk is the whole point: the agent's progress and deliverable live in files, not in a context window that could overflow. (Note the giant caveat in the code: never `exec` model-written code on the host. Route it through Chapter 7's sandbox.)

## Connecting to the bigger picture

Manus is a tour of the whole guide: the loop (Chapter 2), structured events (Chapter 3), the context wall and external storage (Chapters 4 and 5), tools and sandboxing (Chapters 6 and 7), retrieval and the anti-hallucination contract (Chapter 10), and planning and multi-agent design (Chapter 11). Its two new contributions, CodeAct and the `todo.md` checklist, both feed the capstone: Chapter 17 offers a code-action mode and a planner as optional components. Chapter 15 takes the planning-and-retrieval theme into deep research agents specifically.

## Key takeaways

- **Manus** is a general autonomous agent in a cloud sandbox: a foundation model plus a planner, tools, retrieval, and file memory, producing real deliverables end to end.
- **CodeAct** makes the model's action a short Python program rather than a fixed tool call, which is far more expressive and self-correcting, at the cost of needing tight sandboxing.
- The loop is **analyze, plan, execute, observe**, with **one action per iteration** so every step is observable and controllable.
- **File-based memory** beats the context limit: write intermediate results to files, keep a live `todo.md` checklist, and draft long documents in pieces. The checklist is the source of truth if context is lost.
- The architecture is replicable with open tools; the hard part is reliability (error handling, loop prevention, not fabricating), not the architecture itself.

Original sources: the Manus technical analysis and replication blueprint (based on the leaked Manus prompt and the CodeAct ICML 2024 paper "Executable Code Actions Elicit Better LLM Agents").
