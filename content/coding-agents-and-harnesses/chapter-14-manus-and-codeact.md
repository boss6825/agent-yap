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

---

## Review

**Quick Check**

1. What is CodeAct?
   - A) A code-generation model fine-tuned specifically for writing Python
   - B) An action format where the model writes a short Python program as its action instead of emitting a structured tool call
   - C) A sandbox runtime that compiles model output to bytecode before running it
   - D) A protocol for streaming code edits back to the user's editor
   <details><summary>Answer</summary>B) An action format where the model writes a short Python program as its action instead of emitting a structured tool call - The sandbox runs that code and returns the output, or the error, as the observation. The action space becomes the whole language rather than a fixed menu of functions.</details>

2. What did the CodeAct paper (ICML 2024) find?
   - A) That code actions are safer than JSON tool calls because they are easier to validate
   - B) That code actions use fewer tokens than equivalent JSON tool calls
   - C) That agents producing code for actions have significantly higher success rates on complex tool-use tasks than those limited to text or JSON tool calls
   - D) That code actions only help when the model has been fine-tuned for them
   <details><summary>Answer</summary>C) That agents producing code for actions have significantly higher success rates on complex tool-use tasks than those limited to text or JSON tool calls - One snippet can chain several operations, add conditionals, loop, and use any library, which is far more expressive than a fixed menu.</details>

3. What is Manus's loop, and what is its deliberate constraint?
   - A) Read, write, test, repeat, with a hard cap of ten iterations
   - B) Analyze, plan, execute, observe, with one tool action per iteration
   - C) Plan, parallelize, merge, verify, with unlimited concurrent actions
   - D) Retrieve, generate, critique, revise, with one critique per generation
   <details><summary>Answer</summary>B) Analyze, plan, execute, observe, with one tool action per iteration - It must wait for each result before deciding the next step. This prevents the model from firing off a long chain of unchecked operations and keeps every step observable, which matters a lot for an agent running unattended.</details>

4. What is the `todo.md` trick?
   - A) A prompt template that lists the remaining steps at the top of every turn
   - B) A live checklist file on disk that the agent ticks off as it works, serving as the source of truth if context is truncated
   - C) A hook that blocks the agent from finishing until every planned step is complete
   - D) A summary the planner regenerates each iteration to keep the plan in context
   <details><summary>Answer</summary>B) A live checklist file on disk that the agent ticks off as it works, serving as the source of truth if context is truncated - It is external storage used as a planning spine. A human project manager keeps a checklist precisely because their own working memory is unreliable; Manus does the same for the same reason.</details>

5. Your agent must call three API endpoints, filter the combined results, and write the survivors to a file. Under a fixed tool-call menu this is many round trips. What does CodeAct let the model do instead, and what is the catch?
   - A) Emit all three tool calls in parallel and merge the results itself; the catch is cache invalidation
   - B) Write one Python snippet that chains the calls, filters, and writes the file, observed in a single step; the catch is that arbitrary code execution demands a locked sandbox
   - C) Delegate the whole thing to a subagent; the catch is the extra token cost
   - D) Define a new composite tool at runtime; the catch is that the schema must be re-sent, busting the cache
   <details><summary>Answer</summary>B) Write one Python snippet that chains the calls, filters, and writes the file, observed in a single step; the catch is that arbitrary code execution demands a locked sandbox - Code is far more expressive than a fixed menu because one snippet can chain operations, add conditionals, and loop. Manus pays for that with a full Ubuntu sandbox in the cloud and strict rules about what the code may do.</details>

**More Questions**

6. What does Manus's planner module produce?
   - A) A cost estimate for the task before execution begins
   - B) A set of subagent contracts, one per specialist
   - C) An ordered list of steps, injected as a "Plan" event that the agent follows and can revise on the fly
   - D) A dependency graph the executor traverses in parallel
   <details><summary>Answer</summary>C) An ordered list of steps, injected as a "Plan" event that the agent follows and can revise on the fly - This is the orchestrator's planner from Chapter 11, built into a single agent rather than split across subagents.</details>

7. What do the knowledge module and datasource module do?
   - A) Cache previous task results so repeated goals run faster
   - B) Inject reference material and authoritative data via pre-approved APIs, so the agent prefers real data over web scraping
   - C) Store the agent's long-term memory of user preferences across sessions
   - D) Index the sandbox filesystem so the agent can search its own outputs
   <details><summary>Answer</summary>B) Inject reference material and authoritative data via pre-approved APIs, so the agent prefers real data over web scraping - This is retrieval-augmented generation wired into the loop, and it is the anti-hallucination contract from Chapter 10 in a different guise: prefer authoritative sources, do not make things up.</details>

8. Besides the `todo.md` checklist, what are the other two file-based memory techniques the chapter lists?
   - A) Compressing old context into embeddings, and pruning the event stream
   - B) Snapshotting the sandbox, and diffing successive snapshots
   - C) Writing intermediate results to files and recombining them later, and drafting long documents in pieces then concatenating
   - D) Logging every observation to JSONL, and replaying it on resume
   <details><summary>Answer</summary>C) Writing intermediate results to files and recombining them later, and drafting long documents in pieces then concatenating - Drafting in pieces dodges output token limits and keeps long documents coherent, rather than trying to generate one giant output in a single pass.</details>

9. What safety rules does Manus follow given that it executes arbitrary code?
   - A) It runs all code twice and compares outputs before accepting a result
   - B) It requires user approval for every single action
   - C) It runs in a locked sandbox, takes one action per step, prefers non-interactive flags, and never runs irreversible operations without permission
   - D) It restricts the model to a whitelist of importable libraries
   <details><summary>Answer</summary>C) It runs in a locked sandbox, takes one action per step, prefers non-interactive flags, and never runs irreversible operations without permission - The sandbox is a full Ubuntu environment in the cloud, with a shell (even sudo), a browser, a filesystem, and Python and Node. Arbitrary code execution is the most dangerous thing an agent can do, so everything from Chapter 7 applies, doubly.</details>

10. You follow the replication blueprint and get the whole architecture working: an open CodeAct model, a Docker sandbox, a tool module, a planner, a vector store, and file-based memory. According to the report, what is still the hard part?
    - A) Getting the vector store to return relevant chunks
    - B) Reliability: prompt tuning and error handling to stop infinite loops and keep it from fabricating
    - C) Getting the headless browser to render pages correctly
    - D) Keeping the sandbox image small enough to start quickly
    <details><summary>Answer</summary>B) Reliability: prompt tuning and error handling to stop infinite loops and keep it from fabricating - The report is explicit that the hardest part is not the architecture. That matches every other source in this guide: the loop is easy, the harness is hard.</details>

**Think About It**

1. Most agents act through a clean menu of structured tool calls, which sounds like the more reliable design. Manus lets the model write arbitrary Python instead, and it works better. Why would the messier option win?
   <details><summary>Show answer</summary> A fixed tool menu forces every task to be expressed as a sequence of separate round trips, so anything involving a condition, a loop, or an intermediate transformation becomes many turns of the agent laboriously reassembling logic the language already has. A code action collapses all of that into one snippet: fetch, filter, branch, and print, in a form the model has seen millions of examples of. The CodeAct paper measured this as significantly higher success rates on complex tool-use tasks. There is a second effect that matters as much: when the snippet throws, the traceback is a precise, actionable observation, so the agent debugs itself the way a developer does at a REPL, instead of getting a vague "tool failed" and guessing. The cost of all this expressiveness is that you now must sandbox seriously, because arbitrary code execution is the most dangerous thing an agent can do.</details>

2. The fix for one of the hardest constraints in agent design, the context window, turns out to be a markdown checklist. Why does something that simple work?
   <details><summary>Show answer</summary> Because the context window's real failure is not running out of space, it is losing track of what has already been done, and a checklist addresses exactly that with almost no tokens. `todo.md` holds the plan and the progress in a form that survives truncation entirely, so if context is compacted away the agent can read the file and know precisely where it is. The reason it feels too simple is that we tend to look for the fix inside the model when the constraint is a property of the model. Humans solved the same problem the same way long ago, and for the same reason: working memory is unreliable, so put the state somewhere it cannot evaporate. It is Chapter 5's external-storage move used as a planning spine.</details>

3. Manus takes one action per iteration and waits for the result before deciding the next step. That throws away obvious parallelism. What is the handbrake for?
   <details><summary>Show answer</summary> An agent that emits a chain of actions before seeing any result is committing to a plan built on predictions rather than observations, and if step two's output is not what it assumed, steps three through six execute anyway on false premises. For an agent with sudo in a sandbox running unattended, that is a lot of unchecked activity between checkpoints. One action per step means every operation is followed by a real observation the model must account for, which keeps the loop grounded and every step individually reviewable. The trade is throughput for observability, and Manus makes it deliberately because it runs long tasks with nobody watching. Note that this is the opposite call from Chapter 8's parallel tool execution, and the difference is that parallel reads are independent while a chain of write actions is not.</details>

4. The team that reverse-engineered Manus concluded the architecture is easy to replicate and reliability is where the difficulty lives. Why is that the consistent verdict across every source in this guide?
   <details><summary>Show answer</summary> Because the architecture is a small amount of legible structure: a loop, a tool module, a sandbox, a planner, a vector store, file memory. You can draw it on a napkin and build it in a weekend, and it will work on the demo. Reliability is everything that happens on the paths you did not demo: the agent looping on a failing step, misreading an error, quietly fabricating a result when a tool returns nothing, or declaring success on a half-finished task. Each of those needs specific handling, and the handling is discovered by running the thing against real messy work rather than derived from a design. That gap between "the loop is easy" and "the harness is hard" is the through-line of this whole guide, and it is why the interesting engineering is in the scaffolding rather than the concept.</details>

5. Manus runs server-side, so it keeps working with your laptop closed. That sounds like a deployment detail. What does it actually change about what an agent can be?
   <details><summary>Show answer</summary> It changes the unit of work from a conversation to a job. A local agent is bounded by your session: you have to stay, watch, and keep the machine awake, which quietly limits tasks to things that finish while you are paying attention. A cloud agent with its own persistent sandbox can take a goal, work for an hour, and hand you a finished deliverable, which is why file-based memory and the `todo.md` checklist matter so much in this design rather than being nice extras. They are what let progress live somewhere durable across a long unattended run. The shift also raises the stakes on everything from Chapter 7 and Chapter 12, because an agent nobody is watching needs its sandbox, its budget caps, and its audit log to be right the first time.</details>

**Coding Challenge**

Resumable Todo Memory

Build a `TodoMemory` class that externalizes an agent's plan to a file so it survives context loss. `write_plan(steps)` creates the checklist on disk in `- [ ] step` form. `mark_done(step)` ticks that step off. `remaining()` re-reads the file and returns only the unchecked steps, with no reliance on in-memory state. Then write `codeact_step(code, executor)` that runs a code action and returns either its output or a formatted `ERROR: ...` observation, and a `resumable_loop(goal, code_for_step, memory)` that reads `remaining()` at the top of each iteration, so that a loop restarted after "context loss" picks up exactly where it left off. Demonstrate a restart.

<details><summary>Python Solution</summary>

```python
import os
import tempfile


class TodoMemory:
    """External storage as a planning spine: the file is the source of truth."""

    def __init__(self, path: str):
        self.path = path

    def write_plan(self, steps: list[str]) -> None:
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("\n".join(f"- [ ] {s}" for s in steps))

    def _lines(self) -> list[str]:
        with open(self.path, encoding="utf-8") as f:
            return f.read().splitlines()

    def mark_done(self, step: str) -> None:
        lines = [
            f"- [x] {step}" if line.endswith(step) else line
            for line in self._lines()
        ]
        with open(self.path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

    def remaining(self) -> list[str]:
        """Re-read from disk: no in-memory state, survives context loss."""
        return [line[6:] for line in self._lines() if line.startswith("- [ ] ")]


def codeact_step(code: str, executor) -> str:
    """Run a code action; an error is a useful observation, not a crash."""
    try:
        return executor(code)
    except Exception as e:
        return f"ERROR: {type(e).__name__}: {e}"


def resumable_loop(code_for_step, memory: TodoMemory, max_steps: int = 99) -> list[str]:
    observations = []
    for _ in range(max_steps):
        todo = memory.remaining()          # read the plan from disk every lap
        if not todo:
            break
        step = todo[0]                     # ONE action per iteration
        observations.append(codeact_step(code_for_step(step), lambda c: eval(c)))
        memory.mark_done(step)
    return observations


# --- demo ---
if __name__ == "__main__":
    path = os.path.join(tempfile.mkdtemp(), "todo.md")
    memory = TodoMemory(path)
    memory.write_plan(["gather", "analyze", "write report"])

    actions = {
        "gather": "'gathered 3 sources'",
        "analyze": "'the harness is hard'",
        "write report": "1 / 0",            # this one fails
    }

    # First run: context "dies" after one step.
    first = resumable_loop(lambda s: actions[s], memory, max_steps=1)
    print("run 1 observations:", first)
    print("still to do:       ", memory.remaining())

    # Fresh process, no memory of the above - the file is the source of truth.
    resumed = TodoMemory(path)
    print("resumed sees:      ", resumed.remaining())
    print("run 2 observations:", resumable_loop(lambda s: actions[s], resumed))
    print("still to do:       ", resumed.remaining())
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
const fs = require("fs");
const os = require("os");
const path = require("path");

class TodoMemory {
  // External storage as a planning spine: the file is the source of truth.
  constructor(filePath) {
    this.path = filePath;
  }

  writePlan(steps) {
    fs.writeFileSync(this.path, steps.map((s) => `- [ ] ${s}`).join("\n"));
  }

  _lines() {
    return fs.readFileSync(this.path, "utf-8").split("\n");
  }

  markDone(step) {
    const lines = this._lines().map((line) =>
      line.endsWith(step) ? `- [x] ${step}` : line
    );
    fs.writeFileSync(this.path, lines.join("\n"));
  }

  remaining() {
    // Re-read from disk: no in-memory state, survives context loss.
    return this._lines()
      .filter((line) => line.startsWith("- [ ] "))
      .map((line) => line.slice(6));
  }
}

function codeactStep(code, executor) {
  // Run a code action; an error is a useful observation, not a crash.
  try {
    return executor(code);
  } catch (e) {
    return `ERROR: ${e.name}: ${e.message}`;
  }
}

function resumableLoop(codeForStep, memory, maxSteps = 99) {
  const observations = [];
  for (let i = 0; i < maxSteps; i++) {
    const todo = memory.remaining(); // read the plan from disk every lap
    if (todo.length === 0) break;
    const step = todo[0]; // ONE action per iteration
    observations.push(codeactStep(codeForStep(step), (c) => eval(c)));
    memory.markDone(step);
  }
  return observations;
}

// --- demo ---
const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "manus-")), "todo.md");
const memory = new TodoMemory(file);
memory.writePlan(["gather", "analyze", "write report"]);

const actions = {
  gather: "'gathered 3 sources'",
  analyze: "'the harness is hard'",
  "write report": "(() => { throw new TypeError('cannot write'); })()",
};

// First run: context "dies" after one step.
console.log("run 1 observations:", resumableLoop((s) => actions[s], memory, 1));
console.log("still to do:       ", memory.remaining());

// Fresh object, no memory of the above - the file is the source of truth.
const resumed = new TodoMemory(file);
console.log("resumed sees:      ", resumed.remaining());
console.log("run 2 observations:", resumableLoop((s) => actions[s], resumed));
console.log("still to do:       ", resumed.remaining());
```

</details>
