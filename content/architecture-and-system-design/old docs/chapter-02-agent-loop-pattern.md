# Chapter 2 — The Agent Loop Pattern

The agent loop is the heart of every agent. This chapter examines it as a pattern: its essential shape, its variants, how it terminates, and the safety properties you must build in. Get the loop right and the rest of the system has a solid spine to hang off.

## The essential loop

Stripped to its core, every agent loop is:

```
messages = [system_prompt, ...history, user_message]
repeat up to N times:
    response = model.call(messages, tools)
    if response has no tool calls:
        return response.text          # the model is done
    results = run(response.tool_calls)  # execute the actions
    messages.append(response)           # record what the model did
    messages.append(results)            # record what the tools returned
```

That's it. The model is given the conversation and the tool catalog; it either answers or asks for tools; if it asks, you run them, append both the request and the results, and call again. The loop ends when the model answers without requesting tools (or a cap is hit).

This simple structure is deceptively powerful: by chaining tool calls, the model can read a file, use what it learned to search an API, use *those* results to draft a document, and finally summarise — all from a single user message, with the loop carrying it through.

## Why both the request and the result must be appended

A subtlety that trips up first implementations: when the model requests a tool, you must append **both** the model's tool-request turn *and* the tool-result turn before the next call. The providers require this pairing — the model needs to see "I asked for X, and X returned Y" to continue coherently. Most provider APIs also require that *every* tool call in a turn gets a corresponding result. Skipping a result, or mismatching ids, breaks the next call. A robust loop therefore guarantees a result for every call, synthesising an error result if a tool failed to produce one.

## Termination and the safety cap

The loop needs two stopping conditions:

1. **Natural termination** — the model produces a final answer with no tool calls.
2. **A hard iteration cap** — a maximum number of loop turns (commonly 5–15).

The cap is non-negotiable. Without it, a confused model can loop forever — calling a tool, getting a result it doesn't like, calling again, ad infinitum — burning tokens and money. The cap converts "infinite loop" into "bounded, eventually-terminating process." When the cap is hit, return whatever the model has produced so far (or a graceful "I wasn't able to complete this") rather than erroring.

A second guard worth considering: detect **non-productive loops** — the same tool called with the same arguments repeatedly — and break early. The model is signalling it's stuck.

## Where the loop lives

A key design decision: does *your* orchestrator drive the loop, or does the provider's SDK? There are two common arrangements:

- **You own the loop explicitly** — your code does the `repeat` and decides when to stop. Maximum control and visibility; you can inject logic between turns.
- **The provider SDK owns the loop** and calls back to you for tool execution — you supply a "run these tools" function and the SDK iterates internally.

A clean hybrid (and a good default) is to own a thin loop that delegates tool execution through a callback, so your orchestrator stays declarative while the provider-specific iteration is encapsulated. Either way, the *control* — the cap, the termination logic, the event recording — should be yours, not buried in a library.

## Variants of the loop

The basic single loop scales surprisingly far, but you'll encounter variants:

### Single-loop (ReAct-style)

One model, one loop, tools available. The model reasons and acts in an interleaved stream. This is the workhorse and is sufficient for most agents — including document assistants. Start here; don't reach for more complexity until you've proven you need it.

### Planner–executor

A first model call produces a *plan* (a list of steps), then a loop executes each step, possibly with its own sub-loops. Useful when tasks are long and benefit from explicit decomposition, or when you want the plan visible/editable by the user. The cost is added complexity and latency; the benefit is structure and steerability.

### Multi-agent

Several specialised agents (each its own loop, prompt, and tools) coordinate — a "researcher" hands off to a "writer," or a "supervisor" routes work to "workers." Powerful for genuinely heterogeneous tasks, but it multiplies cost, latency, and failure modes, and the coordination overhead is real. Most products that *think* they need multi-agent actually need better tools and context in a single loop. Reach for it only when sub-tasks are truly independent and benefit from isolation.

### Reflection / critique loops

After producing output, the agent critiques its own work and revises. Improves quality on hard tasks at the cost of extra calls. Often implemented as an explicit "now check your answer" step rather than a separate agent.

## The event timeline

A loop that just returns final text throws away everything interesting that happened along the way. A production loop should emit an **ordered event timeline** as it runs: "model reasoned," "called tool X," "tool X returned," "model wrote text." This timeline is gold:

- It drives a rich UI (showing tool activity as it happens — Chapter 8).
- It's the durable record of the turn (persisted as the conversation's content — Chapter 9).
- It's the raw material for observability and debugging (Chapter 15).

Design the loop to record an explicit, typed event for every meaningful action, in order. Don't try to reconstruct what happened from the final text afterward — capture it as it occurs.

## Statelessness within, state at the edges

The loop itself is best kept **stateless** — it takes the assembled context in, runs, and returns a result plus events. Persistence happens at the edges: load history *before* the loop, save the outcome *after*. This keeps the loop a pure function of its inputs, which makes it testable, retryable, and easy to reason about. (More in Chapter 9.)

## Common failure modes to design against

- **Runaway iteration** → the hard cap.
- **Stuck loops** (same call repeated) → repetition detection.
- **Missing tool results** → guarantee one result per call.
- **Malformed tool arguments** → parse defensively, default to empty, return a useful error the model can recover from.
- **Tool exceptions** → catch them and feed the error back as a tool result, so the model can adapt rather than the whole turn crashing.

The theme: the loop is where the model's unreliability meets your code, so the loop is where you must be most defensive.

---

Next: [Chapter 3 — Tool design](chapter-03-tool-design.md)

---

## Review

### Quick Check

1. The agent loop terminates under which two conditions?
   * A) The user disconnects, or a tool fails
   * B) The model produces a final answer with no tool calls, or a hard iteration cap is hit
   * C) The context window fills, or the model requests a tool
   * D) A reflection step approves, or memory runs out
   <details><summary>Answer</summary>B) The model produces a final answer with no tool calls, or a hard iteration cap is hit - these are the loop's two stopping conditions.</details>

2. When the model requests a tool, what must be appended before the next model call?
   * A) Only the tool result
   * B) Only the model's tool-request turn
   * C) Both the model's tool-request turn and the matching tool-result turn
   * D) A natural-language summary of the result
   <details><summary>Answer</summary>C) Both the model's tool-request turn and the matching tool-result turn - providers need to see "I asked for X and X returned Y" to continue coherently.</details>

3. Your agent occasionally spins, re-calling the same tool with identical arguments. Beyond the hard cap, what guard directly addresses this?
   * A) Increasing the iteration cap
   * B) Repetition detection that breaks when the same call repeats
   * C) Switching to a planner-executor variant
   * D) Disabling streaming
   <details><summary>Answer</summary>B) Repetition detection that breaks when the same call repeats - identical repeated calls signal the model is stuck, so break early.</details>

4. A team is convinced they need several coordinating agents. What does the chapter suggest they consider first?
   * A) That most products which think they need multi-agent actually need better tools and context in a single loop
   * B) Immediately adopting a supervisor and worker design
   * C) Adding a reflection loop to every agent
   * D) Removing the iteration cap to allow deeper reasoning
   <details><summary>Answer</summary>A) That most products which think they need multi-agent actually need better tools and context in a single loop - reach for multi-agent only when sub-tasks are truly independent.</details>

5. A tool throws an exception in the middle of a turn. What is the recommended handling?
   * A) Let the exception propagate and crash the turn so the user retries
   * B) Skip appending any result for that call and continue
   * C) Catch it and feed the error back as a tool result so the model can adapt
   * D) Immediately hit the iteration cap and return
   <details><summary>Answer</summary>C) Catch it and feed the error back as a tool result so the model can adapt - this also satisfies the rule that every call gets a result.</details>

### Coding Challenge

**Build a minimal agent loop**

Write a `run_agent(model, tools, user_msg, max_iters)` function that drives the loop. Call the model; return its text when there are no tool calls; otherwise run each requested tool, append both the request turn and a result for every call, and stop at a hard iteration cap. Guarantee a result even when a tool raises.

<details>
<summary>Python Solution</summary>

```python
def run_agent(model, tools, user_msg, max_iters=10):
    messages = [{"role": "user", "content": user_msg}]
    for _ in range(max_iters):
        resp = model(messages)
        if not resp.get("tool_calls"):
            return resp.get("text", "")
        messages.append({"role": "assistant", "tool_calls": resp["tool_calls"]})
        results = []
        for call in resp["tool_calls"]:
            try:
                output = tools[call["name"]](**call.get("args", {}))
            except Exception as e:                 # guarantee a result per call
                output = f"error: {e}"
            results.append({"id": call["id"], "content": str(output)})
        messages.append({"role": "tool", "results": results})
    return "Stopped: iteration cap reached."


def fake_model(messages):
    if not any(m["role"] == "tool" for m in messages):
        return {"tool_calls": [{"id": "1", "name": "add", "args": {"a": 2, "b": 3}}]}
    return {"text": "The sum is 5."}


print(run_agent(fake_model, {"add": lambda a, b: a + b}, "add 2 and 3"))
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function runAgent(model, tools, userMsg, maxIters = 10) {
  const messages = [{ role: "user", content: userMsg }];
  for (let i = 0; i < maxIters; i++) {
    const resp = model(messages);
    if (!resp.toolCalls || resp.toolCalls.length === 0) return resp.text || "";
    messages.push({ role: "assistant", toolCalls: resp.toolCalls });
    const results = resp.toolCalls.map((call) => {
      try {
        return { id: call.id, content: String(tools[call.name](call.args || {})) };
      } catch (e) {                                // guarantee a result per call
        return { id: call.id, content: `error: ${e.message}` };
      }
    });
    messages.push({ role: "tool", results });
  }
  return "Stopped: iteration cap reached.";
}

function fakeModel(messages) {
  if (!messages.some((m) => m.role === "tool")) {
    return { toolCalls: [{ id: "1", name: "add", args: { a: 2, b: 3 } }] };
  }
  return { text: "The sum is 5." };
}

console.log(runAgent(fakeModel, { add: ({ a, b }) => a + b }, "add 2 and 3"));
```

</details>
