# Chapter 8 — Streaming and Real-Time UX

Agents are slow by the standards of web requests — a single turn can take many seconds, involving several model calls and tool executions. If the user stares at a spinner the whole time, the agent feels broken even when it's working perfectly. **Streaming** is the answer, and it's not a cosmetic add-on: it's an architectural choice that shapes your orchestrator, your transport, and your data model. This chapter explains how to design a streaming agent.

## Why streaming is architectural

It's tempting to think of streaming as "show the text as it arrives" — a frontend concern. But to stream well, the *whole pipeline* must be built around incremental output:

- The orchestrator must emit events as things happen, not accumulate and return at the end.
- The transport must push those events to the client in real time.
- The client must render a timeline that updates live.
- And the durable record must capture the same events so a reload reproduces the experience.

If you build the agent to return one big response and bolt streaming on later, you'll fight it. Design for streaming from the start: an orchestrator whose fundamental operation is "write an event."

## The transport: SSE vs WebSockets

Two common transports:

- **Server-Sent Events (SSE)** — a one-way stream of text events from server to client over plain HTTP. Simple, works through most proxies, auto-reconnects, and fits the agent case perfectly because the data flow is overwhelmingly server→client. The request carries the user's message; the response *is* the stream of events.
- **WebSockets** — full-duplex. Worth it only if you need rich client→server messaging mid-turn (e.g. interrupting, live collaboration). For most agents, that's overkill.

SSE is the pragmatic default. Set the right headers (event-stream content type, no caching, disable proxy buffering), flush immediately, and write events as `data:` frames. End with a sentinel (`[DONE]`) so the client knows the turn is complete.

## The event-timeline pattern

The single most useful streaming design is to model a turn as an **ordered stream of typed events**, not just a stream of text tokens. Event types might include:

- `reasoning_delta` / `reasoning_end` — the model's thinking, if surfaced.
- `content_delta` — visible answer text.
- `tool_call_start` — the model has decided to call a tool (so the UI can show "Working…").
- domain events — `document_read`, `document_generated`, `document_edited`, `cell_updated` — each carrying the data the UI needs to render a rich element (a chip, a download card, an accept/reject card, a spreadsheet cell).
- `citations` — the parsed structured trailer.
- `error` and `done`.

This event vocabulary is the contract between your orchestrator and your UI. It lets the frontend render *meaningful* activity — "read contract.pdf," "generated draft.docx" — instead of an opaque spinner. And because the events are typed and ordered, the UI can reconstruct exactly what happened, in sequence.

## Streaming text while hiding machine protocol

A practical wrinkle: if the model emits a structured trailer (a citation block, Chapter 6) in the same token stream as its prose, you must stream the prose to the user but *not* the trailer. The technique is a small buffer: as tokens arrive, hold back just enough characters to detect the trailer's opening marker; stream everything before it; once the marker appears, stop streaming visible text and route the rest to your parser. The user sees clean prose; your code still gets the structured data. Build this boundary detection into the streaming path.

## Ordering: flush before you act

Keep events in the order the user expects. A common bug: the model writes some text, then calls a tool, but the text hasn't been flushed, so the tool's output appears *before* the text that preceded it. The fix is to **flush any buffered text whenever the model transitions to a tool call**, so the timeline stays chronological. Emit a `tool_call_start` event at that moment too, so the UI can immediately show activity rather than a dead gap while the tool runs.

## Surfacing reasoning

If your model exposes a reasoning/thinking stream, deciding whether to show it is a UX choice:

- **Show it** on interactive surfaces where users value seeing the agent's process — it builds trust and fills the latency productively.
- **Hide it** (or don't even request it) on bulk/background tasks where it's noise and cost.

Make it a per-call decision (Chapter 4), and stream reasoning as its own event type so the UI can render it distinctly (often collapsed/greyed) from the final answer.

## Persisting the stream for replay

The stream is ephemeral, but the conversation must survive a reload. So **persist the same event timeline** you streamed. Store the assistant turn as the ordered array of events (not just the final text). On reload, the client replays the events to reconstruct the full rich rendering — the chips, the cards, the citations — exactly as they appeared live. This is why the data model stores conversation content as structured events, not plain strings (Chapter 9). Streaming and persistence share one representation.

## Handling failures mid-stream

Because the response is a long-lived stream, errors can happen after you've started sending. Design for it:

- Wrap the orchestration so that on error you can still write an `error` event and the `done` sentinel, rather than dropping the connection silently. The client should show a clear failure, not hang.
- Persist what you can. If the user's message was saved before the stream started (it should be — Chapter 9), a failed turn doesn't lose their input.
- Consider resumability for long tasks: if each unit of work is persisted as it completes (e.g. each extracted cell), a dropped connection doesn't lose finished work, and a retry can resume.

## Backpressure and connection management

A few operational notes:

- **Disable buffering** at every hop (the framework, and reverse proxies via the appropriate header), or events will be batched and the "real-time" feel disappears.
- **Heartbeats** (periodic comments) keep idle connections alive through proxies that time out quiet streams.
- **Clean up** server-side resources when the client disconnects mid-stream (abort the model call if possible) so an abandoned turn doesn't keep burning tokens.

## The payoff

Done well, streaming transforms the perceived quality of an agent. A turn that takes fifteen seconds *feels* fast because the user sees reasoning, then "reading contract.pdf," then the answer flowing in, then a download card — a narrative of work, not a frozen screen. The architecture that delivers this — an event-emitting orchestrator, an SSE transport, a typed event timeline, and a persisted-events data model — is the same architecture that makes your agent debuggable and your history faithful. Streaming isn't a feature you add; it's a shape you build in.

---

Next: [Chapter 9 — Data modeling for agents](chapter-09-data-modeling.md)

---

## Review

### Quick Check

1. Why is SSE the pragmatic default transport for agents?
   * A) The data flow is overwhelmingly server-to-client, and SSE is simple, proxy-friendly, and auto-reconnecting
   * B) It is full-duplex for rich client-to-server messaging mid-turn
   * C) It requires WebSockets under the hood
   * D) It cannot be buffered by proxies under any circumstances
   <details><summary>Answer</summary>A) The data flow is overwhelmingly server-to-client, and SSE is simple, proxy-friendly, and auto-reconnecting - full-duplex WebSockets are usually overkill.</details>

2. A turn is best modeled as:
   * A) A single final text blob
   * B) An ordered stream of typed events
   * C) One reasoning token
   * D) A flat list of role and text pairs only
   <details><summary>Answer</summary>B) An ordered stream of typed events - this lets the UI render meaningful activity and lets persistence replay the turn exactly.</details>

3. The model writes some text, then calls a tool, but the tool's output appears before the preceding text. The fix is:
   * A) Disable streaming entirely
   * B) Increase the iteration cap
   * C) Hide all reasoning output
   * D) Flush buffered text when transitioning to a tool call, and emit a tool_call_start event
   <details><summary>Answer</summary>D) Flush buffered text when transitioning to a tool call, and emit a tool_call_start event - this keeps the timeline chronological.</details>

4. You want a reloaded conversation to reproduce the chips, cards, and citations exactly as they streamed. You should:
   * A) Store only the final text
   * B) Re-run the model on every reload
   * C) Persist the same ordered event timeline you streamed
   * D) Save a screenshot of the rendering
   <details><summary>Answer</summary>C) Persist the same ordered event timeline you streamed - the client replays the events to reconstruct the rich rendering.</details>

5. Your streaming code is correct, yet the real-time feel disappears. The most likely cause is:
   * A) Buffering at a framework hop or reverse proxy is batching events; disable buffering at every hop
   * B) The model is responding too fast
   * C) SSE does not support text content
   * D) Heartbeats are slowing the stream
   <details><summary>Answer</summary>A) Buffering at a framework hop or reverse proxy is batching events - disable buffering at every hop or events arrive in clumps.</details>

### Coding Challenge

**Stream visible prose while hiding a machine trailer**

Write a generator `stream_visible(chunks, marker)` that emits visible prose from incoming token chunks but stops emitting as soon as a trailer marker appears (the marker may straddle two chunks). Hold back only a marker-sized tail so a split marker is still detected.

<details>
<summary>Python Solution</summary>

```python
def stream_visible(chunks, marker="<cite>"):
    """Emit visible prose tokens; withhold everything from the marker onward."""
    buffer = ""
    for chunk in chunks:
        buffer += chunk
        i = buffer.find(marker)
        if i != -1:
            if buffer[:i]:
                yield buffer[:i]
            return                              # rest is machine protocol; stop
        safe = len(buffer) - (len(marker) - 1)  # keep a tail for a split marker
        if safe > 0:
            yield buffer[:safe]
            buffer = buffer[safe:]
    if buffer:
        yield buffer


chunks = ["The sum is 5.", "<ci", "te>data"]
print("".join(stream_visible(chunks)))   # The sum is 5.
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function* streamVisible(chunks, marker = "<cite>") {
  let buffer = "";
  for (const chunk of chunks) {
    buffer += chunk;
    const i = buffer.indexOf(marker);
    if (i !== -1) {
      if (buffer.slice(0, i)) yield buffer.slice(0, i);
      return;                                  // rest is machine protocol; stop
    }
    const safe = buffer.length - (marker.length - 1); // keep a tail for a split marker
    if (safe > 0) {
      yield buffer.slice(0, safe);
      buffer = buffer.slice(safe);
    }
  }
  if (buffer) yield buffer;
}

const chunks = ["The sum is 5.", "<ci", "te>data"];
console.log([...streamVisible(chunks)].join(""));  // The sum is 5.
```

</details>
