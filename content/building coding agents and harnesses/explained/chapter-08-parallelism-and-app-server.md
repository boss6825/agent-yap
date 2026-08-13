# Chapter 8: Parallelism, the Responses API, and the App Server

## Concept explanation

So far the loop has run one tool at a time. But a model often wants several things at once: read three files, run two independent checks. Doing those sequentially wastes time. This chapter covers three connected upgrades: running independent tool calls **in parallel**, the **API shape** that was designed for agents (OpenAI's Responses API), and the **protocol** that lets a single harness power a terminal, an IDE, and a website (the App Server). The first is something you build; the other two are mostly things you understand so you make good choices.

### Parallel tool calls

Modern agent APIs support `parallel_tool_calls`: the model can request several tool executions in a single response. When that happens, the harness has decisions to make (per the "Inside the Agent Harness" analysis):

1. **Dependency analysis.** Can these truly run at once, or does one depend on another's output? Reading two unrelated files is parallelizable; "create a directory then write a file into it" is not.
2. **Resource constraints.** How many processes can you safely spawn at once?
3. **Approval batching.** Ask the user to approve all of them together, or one at a time?

Codex collects the independent calls, runs them concurrently (it uses a `FuturesOrdered` collection in Rust to keep results in order), and sends all the outputs back to the model in a single follow-up request. There is also an important safety nuance from Chapter 5 and 6: read-only tools can run in parallel freely, but mutating tools should run sequentially to avoid race conditions (two edits to the same file at once is a recipe for corruption). Anthropic's harness follows the same rule: parallel reads, serial writes.

### The Responses API: built for agents

Codex migrated from the older Chat Completions API to the **Responses API**, and the reasons are instructive because they reveal what an agent actually needs from an API. The Codex deep-dive lists the wins:

- **40 to 80% better cache utilization**, because the API was designed for the access patterns of agentic loops (the prefix-caching behavior from Chapter 5).
- **A measurable SWE-bench improvement** (around 3%), because better caching frees compute for reasoning within the same budget.
- **Multi-turn tool use as a first-class shape**, where Chat Completions was a GPT-3.5-era format not built for it.
- **Parallel tool calls** in a single response.

The API streams its response as **Server-Sent Events** (SSE): a sequence of small JSON events like `response.output_text.delta` (for streaming text to the UI) and `response.output_item.added` (objects the harness appends to the conversation for the next call). The harness consumes this stream and republishes it as internal events. This is why you see text appear token by token, and it is also how the harness detects that a tool call is needed mid-stream.

One more design choice worth knowing, because it explains a tradeoff: Codex deliberately does **not** use the API's `previous_response_id` feature, which would let the server remember the conversation so the client could send less. Codex keeps every request fully **stateless** (sending the whole history each time) to support **Zero Data Retention** customers, who cannot have their data stored server-side. The apparent inefficiency (re-sending everything) is bought back by prompt caching. It is a clean example of a real engineering tradeoff: statelessness and privacy in exchange for bigger requests, with caching making the exchange affordable.

### The App Server: one harness, many surfaces

Codex runs in a terminal, an IDE extension, a desktop app, and the web. They all share the same agent loop. The thing that lets them is the **Codex App Server**, a long-lived process that hosts the agent and speaks a **JSON-RPC** protocol over stdio (or WebSocket for remote). The "Unlocking the Codex harness" write-up explains the design.

The App Server exposes the harness through three conversation primitives, which are a genuinely good model for any agent protocol:

| Primitive | What it is | Lifecycle |
|---|---|---|
| **Item** | The atomic unit of input or output (a user message, an agent message, a tool execution, an approval request, a diff) | `item/started` -> `item/*/delta` (streaming) -> `item/completed` |
| **Turn** | One unit of agent work from a user input to the outputs for that input | begins on submit, ends when the agent finishes |
| **Thread** | The durable container for a whole session; holds many turns; can be created, resumed, forked, archived | persisted so clients can reconnect |

The protocol is bidirectional: the client sends a request to start a turn, the server streams back many notifications (item started, deltas, item completed), and the server can itself send a request back to the client when it needs an approval, pausing the turn until the client answers. This is exactly the approval flow from Chapter 7, expressed as a protocol.

Why build this instead of just exposing the agent as an MCP server (Chapter 10)? Because MCP, while great for *calling* an agent as a tool, did not cleanly express the rich, streaming, diff-emitting interaction an IDE needs. The App Server is the answer when you want the full harness as a stable, UI-friendly event stream. The cost is integration work (you write a JSON-RPC client in your language), but the payoff is one harness behind every surface, with backward compatibility so old clients can talk to new servers.

## Why it matters

Parallelism is a direct speed win: independent reads finish in the time of the slowest one instead of the sum. The API and protocol material matters less for a hobby agent and more the moment you want to (a) control costs (use an agent-friendly API and protect caching), or (b) build anything beyond a single CLI session. If you ever want an orchestrator coordinating several agents, or an IDE plugin, you are building on something App-Server-shaped, and the items/turns/threads model is the right vocabulary to reach for.

## How it works: a parallel runner with a dependency guard

The buildable piece is the parallel executor. The key is to run read-only calls concurrently while forcing mutating calls to run one at a time, then collect results in order. We use a thread pool because tool calls are mostly I/O-bound (waiting on subprocesses and network).

## Code MVP: a parallel tool executor

```python
"""
chapter 08: parallel tool execution.
Run independent (read-only) tool calls concurrently, but force mutating
calls to run sequentially to avoid races. Results come back in order.
Builds on Chapter 6's registry and Chapter 7's gated_call.
"""
from concurrent.futures import ThreadPoolExecutor

# Which tools are safe to run in parallel (read-only) vs must be serialized.
READ_ONLY = {"shell_read", "read_file", "search", "list_files"}

def is_parallel_safe(call: dict) -> bool:
    """A toy classifier. Real harnesses also inspect the command itself."""
    return call["name"] in READ_ONLY

def run_tools(calls: list, execute, max_workers: int = 5) -> list:
    """
    calls: [{"call_id": ..., "name": ..., "args": ...}, ...]
    execute: a function(call) -> result string (e.g. wraps gated_call).
    Returns results in the SAME order as calls (like Codex's FuturesOrdered).
    """
    parallel = [c for c in calls if is_parallel_safe(c)]
    serial   = [c for c in calls if not is_parallel_safe(c)]

    results = {}
    # Read-only calls run concurrently.
    if parallel:
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            futures = {pool.submit(execute, c): c["call_id"] for c in parallel}
            for fut in futures:
                results[futures[fut]] = fut.result()
    # Mutating calls run one after another, in order.
    for c in serial:
        results[c["call_id"]] = execute(c)

    # Return in the original order so call_id linkage (Chapter 3) stays clean.
    return [{"call_id": c["call_id"], "output": results[c["call_id"]]} for c in calls]

if __name__ == "__main__":
    import time
    def fake_execute(call):
        time.sleep(0.5)                     # pretend each call takes 0.5s
        return f"result of {call['name']}({call['args']})"

    calls = [
        {"call_id": "a", "name": "read_file", "args": {"path": "x.py"}},
        {"call_id": "b", "name": "read_file", "args": {"path": "y.py"}},
        {"call_id": "c", "name": "read_file", "args": {"path": "z.py"}},
        {"call_id": "d", "name": "write_file", "args": {"path": "out.py"}},  # serial
    ]
    start = time.time()
    for r in run_tools(calls, fake_execute):
        print(r["call_id"], "->", r["output"])
    print(f"elapsed: {time.time() - start:.2f}s (3 reads in parallel + 1 serial write)")
```

Run it: the three reads finish together in about half a second instead of one and a half, and the write runs after them. Total time is roughly 1 second, not 2. That is the parallelism win, with the write safely serialized so it cannot race the reads.

## Connecting to the bigger picture

This executor wraps Chapter 6's registry and Chapter 7's `gated_call`, so parallel calls are still validated and approved. The items/turns/threads vocabulary from the App Server is the same structure Chapter 3 used for history and Chapter 11 will use for subagent communication. And the stateless-plus-caching tradeoff ties directly back to Chapter 5: re-sending everything is only viable because the prefix is cached. In the capstone, the loop uses `run_tools` whenever the model requests more than one call at once.

## Key takeaways

- Models can request several tool calls at once. Run independent read-only calls in parallel, but serialize mutating calls to avoid races; return results in order so `call_id` linkage stays intact.
- The **Responses API** is built for agents: much better cache utilization, native multi-turn tool use, parallel calls, and SSE streaming.
- Codex stays **stateless** (re-sending full history) to support Zero Data Retention, and relies on prompt caching to make that affordable. A clean privacy-versus-efficiency tradeoff.
- The **App Server** exposes one harness to many surfaces over JSON-RPC, using three primitives: **item**, **turn**, **thread**, with a bidirectional flow that can pause for approvals.
- Reach for App-Server-style design when you go beyond a single CLI session (orchestration, IDEs, web).

Original sources: "Inside the Agent Harness," the "Inside the Codex Agent Loop" deep-dive, and OpenAI's [Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/).

## Review

**Quick Check**

1. What is the rule both Codex and Anthropic's harness follow for parallel tool execution?
   - A) Parallel everything, then reconcile conflicts afterward
   - B) Parallel reads, serial writes
   - C) Parallel writes, serial reads
   - D) Never parallelize; the ordering guarantees are not worth the speed
   <details><summary>Answer</summary>B) Parallel reads, serial writes - Read-only tools can run concurrently freely, but mutating tools should run sequentially to avoid race conditions. Two edits to the same file at once is a recipe for corruption.</details>

2. When the model requests several tool calls at once, which three decisions does the harness have to make?
   - A) Model choice, temperature, and token budget
   - B) Dependency analysis, resource constraints, and approval batching
   - C) Cache strategy, truncation length, and retry policy
   - D) Sandbox mode, permission mode, and checkpoint frequency
   <details><summary>Answer</summary>B) Dependency analysis, resource constraints, and approval batching - Can these truly run at once? How many processes can you safely spawn? And do you ask the user to approve them together or one at a time?</details>

3. What cache improvement did Codex get from migrating to the Responses API?
   - A) 5 to 10% better cache utilization
   - B) 40 to 80% better cache utilization
   - C) Caching became unnecessary because the server stored the conversation
   - D) Cache utilization was unchanged; the win was purely in latency
   <details><summary>Answer</summary>B) 40 to 80% better cache utilization - The API was designed for the access patterns of agentic loops. Better caching also freed compute for reasoning within the same budget, which showed up as roughly a 3% SWE-bench improvement.</details>

4. Codex deliberately does not use the Responses API's `previous_response_id`, even though it would let the client send less. Why?
   - A) The feature is not available for parallel tool calls
   - B) Keeping every request stateless supports Zero Data Retention customers, whose data cannot be stored server-side
   - C) It would break Server-Sent Events streaming
   - D) `previous_response_id` is incompatible with prompt caching
   <details><summary>Answer</summary>B) Keeping every request stateless supports Zero Data Retention customers, whose data cannot be stored server-side - Re-sending the whole history looks inefficient, but prompt caching buys the cost back. It is a clean statelessness-and-privacy versus request-size tradeoff.</details>

5. In the App Server protocol, which primitive is the durable container that can be created, resumed, forked, and archived?
   - A) Item
   - B) Turn
   - C) Thread
   - D) Response
   <details><summary>Answer</summary>C) Thread - An item is the atomic unit of input or output, a turn is one unit of agent work from a user input to its outputs, and a thread holds many turns and is persisted so clients can reconnect.</details>

**More Questions**

6. The Responses API streams via Server-Sent Events. What does a `response.output_text.delta` event carry?
   - A) A completed tool result to append to the conversation
   - B) An incremental chunk of text, which is why output appears token by token in the UI
   - C) The final token usage and cache statistics for the turn
   - D) A request from the server asking the client for an approval
   <details><summary>Answer</summary>B) An incremental chunk of text, which is why output appears token by token in the UI - The companion event `response.output_item.added` carries objects the harness appends to the conversation for the next call, and it is how the harness detects mid-stream that a tool call is needed.</details>

7. Why did OpenAI build the App Server instead of simply exposing the agent as an MCP server?
   - A) MCP cannot be used over stdio
   - B) MCP is great for calling an agent as a tool but did not cleanly express the rich, streaming, diff-emitting interaction an IDE needs
   - C) MCP does not support authentication
   - D) MCP servers cannot be long-lived processes
   <details><summary>Answer</summary>B) MCP is great for calling an agent as a tool but did not cleanly express the rich, streaming, diff-emitting interaction an IDE needs - The cost of the App Server is integration work (writing a JSON-RPC client), and the payoff is one harness behind every surface with backward compatibility.</details>

8. The model requests "create a directory" and "write a file into that directory" in the same response. What should the harness do?
   - A) Run both concurrently, since they touch different resources
   - B) Run them sequentially, because the second depends on the first's effect
   - C) Reject both calls and ask the model to combine them into one
   - D) Run them concurrently but retry the write if it fails
   <details><summary>Answer</summary>B) Run them sequentially, because the second depends on the first's effect - This is exactly the dependency analysis step. Reading two unrelated files is parallelizable; a create-then-write pair is not.</details>

9. Codex uses a `FuturesOrdered` collection when running concurrent calls. What problem does that solve?
   - A) It limits how many processes can spawn at once
   - B) It keeps results in the original request order, so the `call_id` linkage back to the model stays clean
   - C) It retries failed futures automatically
   - D) It merges duplicate tool calls into one execution
   <details><summary>Answer</summary>B) It keeps results in the original request order, so the `call_id` linkage back to the model stays clean - The MVP's `run_tools` mirrors this by returning results indexed back to the original `calls` order, then sending all the outputs to the model in a single follow-up request.</details>

10. The App Server protocol is bidirectional. What does the server send *back* to the client mid-turn?
    - A) Nothing; the client only ever polls for status
    - B) A request for an approval, which pauses the turn until the client answers
    - C) A new system prompt for the client to store
    - D) A billing summary for the turn so far
    <details><summary>Answer</summary>B) A request for an approval, which pauses the turn until the client answers - This is Chapter 7's approval flow expressed as a protocol: the server can become the requester when it needs a human decision.</details>

**Think About It**

Every turn, Codex re-sends the entire conversation from scratch, even though the API offers a `previous_response_id` that would let it send almost nothing. That looks like a beginner's mistake. Why is it deliberate, and what makes it affordable?

<details><summary>Show answer</summary>
Using `previous_response_id` means the provider stores your conversation server-side, and some customers contractually cannot allow that: Zero Data Retention means nothing persists after the request completes. So Codex keeps every request fully stateless and pays the cost of a larger payload to preserve that guarantee. What makes the tradeoff survivable is prompt caching (Chapter 5): the re-sent history is an unchanged prefix, so it is billed at roughly a tenth the normal rate and does not have to be recomputed. This is a nice example of two design decisions that only make sense together, where the apparent inefficiency of one is exactly what the other was built to absorb.
</details>

Codex's SWE-bench score improved by around 3% from switching APIs. The model did not change and the prompts did not get smarter. Where did the extra capability come from?

<details><summary>Show answer</summary>
Reasoning is bought with compute, and compute inside an agent run is a fixed budget shared between re-processing the conversation and thinking about the problem. When cache utilization improved by 40 to 80%, a large fraction of each turn's prefix stopped needing recomputation, and that freed budget went to reasoning within the same overall cost. The lesson generalizes beyond one API migration: infrastructure choices that look purely economic (caching, prefix stability, tool-list churn) show up as capability, because they change how much of your budget is available for the part that actually solves the task.
</details>

If parallel execution is such a clear speed win, why not run every tool call the model requests concurrently?

<details><summary>Show answer</summary>
Because some calls are not independent, and concurrency turns dependence into a bug. A create-then-write pair fails if the write starts first, and two edits to the same file at once can corrupt it, which is why the rule is parallel reads and serial writes rather than parallel everything. There are also resource limits (you cannot spawn unbounded processes) and an approval question, since batching several risky commands into one prompt changes what the user is actually consenting to. And the ordering matters even for successful calls: results have to come back matched to their original `call_id` so the model can tell which output belongs to which request. Parallelism is a scheduling problem, not just a speed switch.
</details>

MCP already existed as a way to connect agents and tools, yet OpenAI wrote a whole new JSON-RPC protocol. What does that tell you about the difference between calling an agent and *hosting* one?

<details><summary>Show answer</summary>
Calling an agent as a tool is a request-response shape: send input, get output, done. Hosting an agent behind a real UI is a streaming, stateful, interruptible conversation: text arrives token by token, diffs need to be shown before they are applied, a turn can pause halfway to ask for an approval, and a session must survive a client disconnect and be resumable or forkable later. MCP expresses the first shape well and the second poorly, so the App Server introduces vocabulary built for it: items with started/delta/completed lifecycles, turns as units of work, threads as durable containers. The general lesson is that the right protocol follows from the interaction you need, and if you ever build an orchestrator or an IDE plugin, you will end up reinventing something App-Server-shaped.
</details>

**Coding Challenge**

Dependency-Aware Wave Scheduler

Build a function `plan_waves(calls)` that turns a list of requested tool calls into an ordered list of "waves," where every call in a wave may run concurrently and waves run one after another. A call is `{"call_id", "name", "args"}`. Group consecutive read-only calls (use a `READ_ONLY` name set) into a single wave, and give every mutating call a wave of its own so writes are serialized. Then build `execute_waves(waves, execute)` that runs each wave (concurrently within the wave) and returns results in the original `call_id` order, mirroring Codex's ordered-futures behavior.

<details><summary>Python Solution</summary>

```python
from concurrent.futures import ThreadPoolExecutor

READ_ONLY = {"read_file", "search", "list_files", "shell_read"}


def plan_waves(calls: list[dict]) -> list[list[dict]]:
    """Consecutive read-only calls share a wave; each mutating call gets its own."""
    waves: list[list[dict]] = []
    for call in calls:
        if call["name"] in READ_ONLY:
            if waves and all(c["name"] in READ_ONLY for c in waves[-1]):
                waves[-1].append(call)
            else:
                waves.append([call])
        else:
            waves.append([call])          # serialize the write
    return waves


def execute_waves(waves: list[list[dict]], execute, max_workers: int = 5) -> list[dict]:
    results: dict[str, str] = {}
    order: list[str] = []
    for wave in waves:
        order.extend(c["call_id"] for c in wave)
        if len(wave) == 1:
            results[wave[0]["call_id"]] = execute(wave[0])
        else:
            with ThreadPoolExecutor(max_workers=max_workers) as pool:
                futures = {pool.submit(execute, c): c["call_id"] for c in wave}
                for fut in futures:
                    results[futures[fut]] = fut.result()
    return [{"call_id": cid, "output": results[cid]} for cid in order]


# --- demo ---
if __name__ == "__main__":
    import time

    def fake_execute(call):
        time.sleep(0.3)
        return f"ran {call['name']}"

    calls = [
        {"call_id": "a", "name": "read_file", "args": {}},
        {"call_id": "b", "name": "read_file", "args": {}},
        {"call_id": "c", "name": "write_file", "args": {}},
        {"call_id": "d", "name": "search", "args": {}},
        {"call_id": "e", "name": "search", "args": {}},
    ]
    waves = plan_waves(calls)
    print("waves:", [[c["call_id"] for c in w] for w in waves])  # [[a,b],[c],[d,e]]

    start = time.time()
    for r in execute_waves(waves, fake_execute):
        print(r["call_id"], "->", r["output"])
    print(f"elapsed: {time.time() - start:.2f}s (3 waves, not 5 calls)")
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
const READ_ONLY = new Set(["read_file", "search", "list_files", "shell_read"]);

function planWaves(calls) {
  // Consecutive read-only calls share a wave; each mutating call gets its own.
  const waves = [];
  for (const call of calls) {
    const isRead = READ_ONLY.has(call.name);
    const lastWave = waves[waves.length - 1];
    if (isRead && lastWave && lastWave.every((c) => READ_ONLY.has(c.name))) {
      lastWave.push(call);
    } else {
      waves.push([call]); // new wave (serializes writes)
    }
  }
  return waves;
}

async function executeWaves(waves, execute) {
  const results = new Map();
  const order = [];
  for (const wave of waves) {
    wave.forEach((c) => order.push(c.call_id));
    const outputs = await Promise.all(wave.map((c) => execute(c)));
    wave.forEach((c, i) => results.set(c.call_id, outputs[i]));
  }
  return order.map((cid) => ({ call_id: cid, output: results.get(cid) }));
}

// --- demo ---
const fakeExecute = async (call) => {
  await new Promise((r) => setTimeout(r, 300));
  return `ran ${call.name}`;
};

const calls = [
  { call_id: "a", name: "read_file", args: {} },
  { call_id: "b", name: "read_file", args: {} },
  { call_id: "c", name: "write_file", args: {} },
  { call_id: "d", name: "search", args: {} },
  { call_id: "e", name: "search", args: {} },
];

const waves = planWaves(calls);
console.log("waves:", waves.map((w) => w.map((c) => c.call_id))); // [[a,b],[c],[d,e]]

const start = Date.now();
executeWaves(waves, fakeExecute).then((rows) => {
  rows.forEach((r) => console.log(r.call_id, "->", r.output));
  console.log(`elapsed: ${((Date.now() - start) / 1000).toFixed(2)}s (3 waves, not 5 calls)`);
});
```

</details>
