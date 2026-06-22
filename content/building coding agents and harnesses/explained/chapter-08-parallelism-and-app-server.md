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
