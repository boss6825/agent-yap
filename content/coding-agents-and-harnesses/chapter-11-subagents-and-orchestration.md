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

---

## Review

**Quick Check**

1. What is a subagent, and what is the single most important reason it exists?
   - A) A cheaper model tier the parent switches to when the budget runs low
   - B) A fresh agent instance with its own context window, existing mainly for context isolation
   - C) A background thread that runs the same conversation history in parallel for speed
   - D) A restricted tool wrapper that limits what the parent agent is allowed to do
   <details><summary>Answer</summary>B) A fresh agent instance with its own context window, existing mainly for context isolation - The parent hands it a task, it works autonomously in its own window, and returns only a tidy summary. Cursor's docs put it plainly: "Long research or exploration tasks don't consume space in your main conversation."</details>

2. Which three subagents does Cursor ship built in?
   - A) Planner, Implementer, Verifier
   - B) Reader, Writer, Reviewer
   - C) Explore, Bash, Browser
   - D) Search, Edit, Test
   <details><summary>Answer</summary>C) Explore, Bash, Browser - They were chosen by analyzing where context limits got hit. Explore searches and analyzes the codebase, Bash runs shell command series, and Browser drives a browser via MCP tools. All three isolate operations that generate large, noisy intermediate output.</details>

3. Why does the Explore subagent default to a faster, cheaper model?
   - A) Because searching is low-stakes, so accuracy does not matter
   - B) Because cheap models have larger context windows than expensive ones
   - C) So it can run many parallel searches in the time one main-agent search would take, which is tiered execution
   - D) Because the expensive model is reserved for the parent's exclusive use by the harness
   <details><summary>Answer</summary>C) So it can run many parallel searches in the time one main-agent search would take, which is tiered execution - Pillar 5 says to use a cheap model for the grunt work and reserve the expensive one for the hard reasoning. Explore can run ten parallel searches at the cost and latency of one main-agent search.</details>

4. What must a subagent's input look like, and why?
   - A) A diff of the parent's context since the last subagent call, to save tokens
   - B) A self-contained prompt, because the subagent has no access to the parent's history
   - C) The full parent conversation history, so the subagent has complete context
   - D) A pointer to a shared memory store the parent and subagent both read from
   <details><summary>Answer</summary>B) A self-contained prompt, because the subagent has no access to the parent's history - That is the contract, pillar 4: clear input in, structured output back. The isolation that makes subagents valuable is the same isolation that makes a self-contained prompt mandatory.</details>

5. A teammate proposes creating fifty subagents so the harness has a specialist for everything. Based on the chapter, what goes wrong?
   - A) The harness enforces a hard limit of ten registered subagents
   - B) Descriptions like "helps with coding" are too vague for the agent to tell when to use them, so they are useless
   - C) Each registered subagent loads its full system prompt into the parent's context at startup
   - D) Nesting rules mean subagents beyond the tenth can never actually be spawned
   <details><summary>Answer</summary>B) Descriptions like "helps with coding" are too vague for the agent to tell when to use them, so they are useless - Cursor warns against exactly this anti-pattern. The recommendation is to start with two or three focused subagents with sharp descriptions rather than a crowd of vague helpers.</details>

**More Questions**

6. What is the difference between running a subagent in foreground versus background mode?
   - A) Foreground uses the expensive model; background always uses a cheaper one
   - B) Foreground runs on the parent's context; background gets a fresh one
   - C) Foreground blocks until done and returns the result; background returns immediately and works independently
   - D) Foreground results are summarized; background results are returned in full
   <details><summary>Answer</summary>C) Foreground blocks until done and returns the result; background returns immediately and works independently - Foreground suits sequential work where you need the output now. Background suits long-running or parallel workstreams, and Cursor lets you launch several at once for throughput.</details>

7. Which set of primitives does Codex expose for the subagent lifecycle?
   - A) `fork`, `join`, `kill`, `reap`
   - B) `spawn_agent`, `wait_agent`, `send_message`, `close_agent`
   - C) `create_task`, `poll_task`, `read_task`, `finish_task`
   - D) `start`, `status`, `result`, `stop`
   <details><summary>Answer</summary>B) `spawn_agent`, `wait_agent`, `send_message`, `close_agent` - Each subagent created through these primitives has its own context and its own sandbox, which is what makes the isolation real rather than nominal.</details>

8. What is the verifier subagent for, and what failure does it fix?
   - A) It checks the parent's token budget before each subagent is spawned
   - B) It validates that tool schemas match what the MCP server actually exposes
   - C) It is a deliberately skeptical agent that checks claims, fixing the tendency of agents to mark work done when it is partial or broken
   - D) It re-runs the implementer's work with a second model and compares outputs
   <details><summary>Answer</summary>C) It is a deliberately skeptical agent that checks claims, fixing the tendency of agents to mark work done when it is partial or broken - It identifies what was claimed, confirms the implementation exists and runs, runs the tests, and reports what actually passed versus what is broken. Cursor's example prompt tells it to "not accept claims at face value. Test everything."</details>

9. What problem do git worktrees solve for parallel agents?
   - A) They let agents share a single working copy without locking
   - B) They give each agent a separate working copy of the same repo so edits never collide
   - C) They compress the repo so several copies fit in memory at once
   - D) They give each agent a separate branch of the conversation history
   <details><summary>Answer</summary>B) They give each agent a separate working copy of the same repo so edits never collide - Worktree isolation is how Codex can run a feature task, a bug fix, and a refactor at the same time without the three agents overwriting each other's files.</details>

10. You delegate a one-line config change to a subagent and it takes longer and costs more than doing it in the main loop. Is this a bug?
    - A) Yes, a subagent should always be at least as fast as the main agent
    - B) Yes, it means the subagent's contract was written badly
    - C) No, subagents have startup overhead because each gathers its own context, so for simple tasks they can be slower
    - D) No, but only because background mode was not used
    <details><summary>Answer</summary>C) No, subagents have startup overhead because each gathers its own context, so for simple tasks they can be slower - Cursor's docs are candid about this. The benefit of a subagent is context isolation and parallelism, not raw speed, and a task small enough to fit comfortably in the main window does not need one.</details>

**Think About It**

1. Cursor's own documentation admits a subagent can be slower than the main agent and that five in parallel burn roughly five times the tokens. So why would you ever reach for one?
   <details><summary>Show answer</summary> Because the resource you are protecting is not time or tokens, it is the parent's context window, and that is the one thing you cannot buy more of mid-session. A codebase exploration might churn through file dumps and search results that would fill the main window and push out the thing the agent actually needs to remember: the user's goal and the decisions made so far. Paying five times the tokens to keep the main thread clean is a good trade when the alternative is a parent that has forgotten why it started. It reframes the whole decision: you spawn a subagent not when the task is big, but when the task is noisy.</details>

2. Fifty specialists sounds strictly better than three. Why does adding more subagents make the whole system worse?
   <details><summary>Show answer</summary> Because the parent has to choose, and choosing is done from names and one-line descriptions. If fifty of them say things like "helps with coding," the descriptions carry no signal and the parent either picks arbitrarily or ignores them all, which is worse than having no subagents at all because you now pay startup overhead for a bad choice. The scarce resource is not the number of specialists but the distinguishability of their descriptions. This is why Cursor's advice is two or three subagents with sharp, non-overlapping jobs, and it generalizes: any menu you hand a model has to be one it can actually route on.</details>

3. The verifier subagent exists because agents love declaring victory. Why can't you just tell the same agent to double-check its own work?
   <details><summary>Show answer</summary> Because the context that produced the claim is the same context that would evaluate it, and everything in that window is already committed to the story that the work is done. The agent wrote the plan, wrote the code, watched itself do it, and has a running narrative of success; asking it to be skeptical of that narrative is asking it to argue against its own most recent tokens. A verifier gets a fresh window and sees only the claim and the artifact, with none of the reasoning that made the claim feel obvious. That is why the chapter frames it as a structural fix rather than a prompting one, and why it is the same idea as "an agent cannot mark its own homework" scaled up into a role.</details>

4. There is something backwards about the Explore subagent: the harness deliberately hands the hardest search work to a weaker model. What makes that the right call?
   <details><summary>Show answer</summary> Searching a codebase is mostly breadth rather than depth, and breadth is what a fast cheap model is good at. Ten parallel greps and file skims from a small model, filtered down to the handful of relevant hits, gives the expensive model better raw material than one careful search would. The expensive reasoning is then spent where it actually matters: deciding what the findings mean and what to do about them. The general principle, tiered execution, is that model capability should be matched to the cognitive demand of the sub-task rather than applied uniformly across a job, and most agent work turns out to be mostly grunt work with a few hard decisions in it.</details>

5. A subagent starts with none of the parent's conversation history. That looks like an obvious limitation. Why is it the whole point?
   <details><summary>Show answer</summary> If the subagent inherited the parent's history, it would inherit the parent's context pressure too, and you would be paying for two copies of the same growing window instead of getting a clean one. Starting empty is what makes the isolation real: the subagent's own noisy intermediate work has room to happen, and none of it flows back. The cost is that you must write a genuinely self-contained prompt, which forces you to state the task precisely rather than relying on shared context you never made explicit. That discipline is the contract from pillar 4, and it is why orchestration works at all: each step has a defined input and a predictable output shape, so the next step can consume it.</details>

**Coding Challenge**

Context Isolation Accountant

Write two functions that show what context isolation actually buys. `inline_research(parent_history, raw_findings)` appends every raw finding to the parent's history and returns the new history. `subagent_research(parent_history, raw_findings, summarize)` runs the findings through a `summarize` callable in an isolated history that is discarded, and appends only the resulting summary to the parent. Add `context_tokens(history)` using `len(text) // 4` per entry. Then write `verify(claim, evidence)` that returns `"VERIFIED"` only when every token of the claim's asserted artifacts appears in the evidence, and `"UNVERIFIED"` otherwise. Demonstrate the parent's context size under both strategies.

<details><summary>Python Solution</summary>

```python
def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def context_tokens(history: list[str]) -> int:
    return sum(estimate_tokens(entry) for entry in history)


def inline_research(parent_history: list[str], raw_findings: list[str]) -> list[str]:
    """No isolation: every noisy finding lands in the parent's window."""
    return list(parent_history) + list(raw_findings)


def subagent_research(parent_history, raw_findings, summarize) -> list[str]:
    """Isolation: the subagent's own history is built, used, and thrown away."""
    isolated_history = ["system: you are a research subagent"] + list(raw_findings)
    summary = summarize(isolated_history)      # only this crosses back
    return list(parent_history) + [summary]


def verify(claim: dict, evidence: str) -> str:
    """A skeptical check: every claimed artifact must appear in the evidence."""
    missing = [a for a in claim["artifacts"] if a not in evidence]
    return "VERIFIED" if not missing else f"UNVERIFIED (missing: {missing})"


# --- demo ---
if __name__ == "__main__":
    parent = ["system: you are a coding agent", "user: add email validation"]
    findings = [f"file_{i}.py contents: " + ("x" * 800) for i in range(10)]

    def summarize(history):
        return "Summary: validation lives in utils/validators.py, 3 call sites."

    noisy = inline_research(parent, findings)
    clean = subagent_research(parent, findings, summarize)

    print("inline parent context:  ", context_tokens(noisy), "tokens")
    print("subagent parent context:", context_tokens(clean), "tokens")

    claim = {"summary": "Added validateEmail and 3 tests",
             "artifacts": ["validateEmail", "test_email.py"]}
    print(verify(claim, "def validateEmail(addr): ..."))
    print(verify(claim, "def validateEmail(addr): ...\n# test_email.py: 3 passed"))
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function estimateTokens(text) {
  return Math.max(1, Math.floor(text.length / 4));
}

function contextTokens(history) {
  return history.reduce((sum, entry) => sum + estimateTokens(entry), 0);
}

function inlineResearch(parentHistory, rawFindings) {
  // No isolation: every noisy finding lands in the parent's window.
  return [...parentHistory, ...rawFindings];
}

function subagentResearch(parentHistory, rawFindings, summarize) {
  // Isolation: the subagent's own history is built, used, and thrown away.
  const isolatedHistory = ["system: you are a research subagent", ...rawFindings];
  const summary = summarize(isolatedHistory); // only this crosses back
  return [...parentHistory, summary];
}

function verify(claim, evidence) {
  // A skeptical check: every claimed artifact must appear in the evidence.
  const missing = claim.artifacts.filter((a) => !evidence.includes(a));
  return missing.length === 0 ? "VERIFIED" : `UNVERIFIED (missing: ${missing})`;
}

// --- demo ---
const parent = ["system: you are a coding agent", "user: add email validation"];
const findings = Array.from(
  { length: 10 },
  (_, i) => `file_${i}.py contents: ` + "x".repeat(800)
);

const summarize = () =>
  "Summary: validation lives in utils/validators.py, 3 call sites.";

const noisy = inlineResearch(parent, findings);
const clean = subagentResearch(parent, findings, summarize);

console.log("inline parent context:  ", contextTokens(noisy), "tokens");
console.log("subagent parent context:", contextTokens(clean), "tokens");

const claim = {
  summary: "Added validateEmail and 3 tests",
  artifacts: ["validateEmail", "test_email.py"],
};
console.log(verify(claim, "def validateEmail(addr): ..."));
console.log(verify(claim, "def validateEmail(addr): ...\n// test_email.py: 3 passed"));
```

</details>
