# Chapter 8: Streaming and Real-Time UX

Agents are slow by the standards of web requests; a single turn can take many seconds, involving several model calls and tool executions. If the user stares at a spinner the whole time, the agent feels broken even when it's working perfectly. **Streaming** is the answer, and it's not a cosmetic add-on: it's an architectural choice that shapes your orchestrator, your transport, and your data model. This chapter explains how to design a streaming agent.

## Why streaming is architectural

It's tempting to think of streaming as "show the text as it arrives," a frontend concern. But to stream well, the *whole pipeline* must be built around incremental output:

- The orchestrator must emit events as things happen, not accumulate and return at the end.
- The transport must push those events to the client in real time.
- The client must render a timeline that updates live.
- And the durable record must capture the same events so a reload reproduces the experience.

If you build the agent to return one big response and bolt streaming on later, you'll fight it. Design for streaming from the start: an orchestrator whose fundamental operation is "write an event."

## The transport: SSE vs WebSockets

Two common transports:

- **Server-Sent Events (SSE)**: a one-way stream of text events from server to client over plain HTTP. Simple, works through most proxies, auto-reconnects, and fits the agent case perfectly because the data flow is overwhelmingly server→client. The request carries the user's message; the response *is* the stream of events.
- **WebSockets**: full-duplex. Worth it only if you need rich client→server messaging mid-turn (e.g. interrupting, live collaboration). For most agents, that's overkill.

SSE is the pragmatic default. Set the right headers (event-stream content type, no caching, disable proxy buffering), flush immediately, and write events as `data:` frames. End with a sentinel (`[DONE]`) so the client knows the turn is complete.

## The event-timeline pattern

The single most useful streaming design is to model a turn as an **ordered stream of typed events**, not just a stream of text tokens. Event types might include:

- `reasoning_delta` / `reasoning_end`: the model's thinking, if surfaced.
- `content_delta`: visible answer text.
- `tool_call_start`: the model has decided to call a tool (so the UI can show "Working…").
- domain events: `document_read`, `document_generated`, `document_edited`, `cell_updated`, each carrying the data the UI needs to render a rich element (a chip, a download card, an accept/reject card, a spreadsheet cell).
- `citations`: the parsed structured trailer.
- `error` and `done`.

This event vocabulary is the contract between your orchestrator and your UI. It lets the frontend render *meaningful* activity, "read contract.pdf," "generated draft.docx," instead of an opaque spinner. And because the events are typed and ordered, the UI can reconstruct exactly what happened, in sequence.

## Streaming text while hiding machine protocol

A practical wrinkle: if the model emits a structured trailer (a citation block, Chapter 6) in the same token stream as its prose, you must stream the prose to the user but *not* the trailer. The technique is a small buffer: as tokens arrive, hold back just enough characters to detect the trailer's opening marker; stream everything before it; once the marker appears, stop streaming visible text and route the rest to your parser. The user sees clean prose; your code still gets the structured data. Build this boundary detection into the streaming path.

## Ordering: flush before you act

Keep events in the order the user expects. A common bug: the model writes some text, then calls a tool, but the text hasn't been flushed, so the tool's output appears *before* the text that preceded it. The fix is to **flush any buffered text whenever the model transitions to a tool call**, so the timeline stays chronological. Emit a `tool_call_start` event at that moment too, so the UI can immediately show activity rather than a dead gap while the tool runs.

## Surfacing reasoning

If your model exposes a reasoning/thinking stream, deciding whether to show it is a UX choice:

- **Show it** on interactive surfaces where users value seeing the agent's process; it builds trust and fills the latency productively.
- **Hide it** (or don't even request it) on bulk/background tasks where it's noise and cost.

Make it a per-call decision (Chapter 4), and stream reasoning as its own event type so the UI can render it distinctly (often collapsed/greyed) from the final answer.

## Persisting the stream for replay

The stream is ephemeral, but the conversation must survive a reload. So **persist the same event timeline** you streamed. Store the assistant turn as the ordered array of events (not just the final text). On reload, the client replays the events to reconstruct the full rich rendering, the chips, the cards, the citations, exactly as they appeared live. This is why the data model stores conversation content as structured events, not plain strings (Chapter 9). Streaming and persistence share one representation.

## Handling failures mid-stream

Because the response is a long-lived stream, errors can happen after you've started sending. Design for it:

- Wrap the orchestration so that on error you can still write an `error` event and the `done` sentinel, rather than dropping the connection silently. The client should show a clear failure, not hang.
- Persist what you can. If the user's message was saved before the stream started (it should be, Chapter 9), a failed turn doesn't lose their input.
- Consider resumability for long tasks: if each unit of work is persisted as it completes (e.g. each extracted cell), a dropped connection doesn't lose finished work, and a retry can resume.

## Backpressure and connection management

A few operational notes:

- **Disable buffering** at every hop (the framework, and reverse proxies via the appropriate header), or events will be batched and the "real-time" feel disappears.
- **Heartbeats** (periodic comments) keep idle connections alive through proxies that time out quiet streams.
- **Clean up** server-side resources when the client disconnects mid-stream (abort the model call if possible) so an abandoned turn doesn't keep burning tokens.

## The payoff

Done well, streaming transforms the perceived quality of an agent. A turn that takes fifteen seconds *feels* fast because the user sees reasoning, then "reading contract.pdf," then the answer flowing in, then a download card: a narrative of work, not a frozen screen. The architecture that delivers this, an event-emitting orchestrator, an SSE transport, a typed event timeline, and a persisted-events data model, is the same architecture that makes your agent debuggable and your history faithful. Streaming isn't a feature you add; it's a shape you build in.

## Review

**Quick Check**

1. Why does the chapter insist streaming is architectural rather than a frontend concern?
   - A) Because streaming libraries only work server-side
   - B) Because the orchestrator, transport, client, and durable record must all be built around incremental output
   - C) Because streaming requires a different model provider
   - D) Because tokens must be re-ordered before display
   <details><summary>Answer</summary>B) The whole pipeline must emit, push, render, and persist events incrementally. Build the agent to return one big response and you'll fight streaming forever.</details>

2. Why is SSE the pragmatic default transport for agents?
   - A) It supports full-duplex messaging mid-turn
   - B) It compresses tokens more efficiently than WebSockets
   - C) The data flow is overwhelmingly server→client, and SSE is simple, proxy-friendly, and auto-reconnects
   - D) It is the only transport that survives a page reload
   <details><summary>Answer</summary>C) Agent turns are server→client dominated. SSE runs over plain HTTP, works through most proxies, and auto-reconnects; WebSockets' full duplex is overkill unless you need rich mid-turn client→server messaging.</details>

3. What is the "event-timeline pattern"?
   - A) Logging every model call with a timestamp for later analysis
   - B) Modelling a turn as an ordered stream of typed events, not just a stream of text tokens
   - C) Showing the user an estimated completion time
   - D) Rate-limiting events so the UI doesn't re-render too often
   <details><summary>Answer</summary>B) A turn is an ordered stream of typed events (`content_delta`, `tool_call_start`, `document_read`, `citations`, `error`, `done`), which is the contract between orchestrator and UI.</details>

4. How do you stream prose to the user while still capturing a structured trailer in the same token stream?
   - A) Ask the model to emit the trailer in a separate follow-up call
   - B) Stream everything and strip the trailer client-side after `[DONE]`
   - C) Hold back a small buffer of characters to detect the trailer's opening marker, then route the rest to your parser
   - D) Use WebSockets so the trailer arrives on a second channel
   <details><summary>Answer</summary>C) A small buffer detects the opening marker: stream everything before it, then stop visible output and send the remainder to the parser. Build this boundary detection into the streaming path.</details>

5. The model writes a sentence, then calls a tool, and users report the tool's output appearing *above* the sentence that preceded it. What's the fix?
   - A) Sort events by timestamp on the client
   - B) Flush any buffered text whenever the model transitions to a tool call, and emit `tool_call_start` at that moment
   - C) Delay all tool calls until the turn's text is complete
   - D) Disable reasoning events
   <details><summary>Answer</summary>B) Flush before you act, so the timeline stays chronological — and emit `tool_call_start` immediately so the UI shows activity instead of a dead gap.</details>

**More Questions**

6. What does the chapter say about surfacing the model's reasoning stream?
   - A) Always show it; hiding it damages trust
   - B) Never show it; it confuses users and leaks internals
   - C) Make it a per-call decision: show it on interactive surfaces, hide or skip it on bulk/background tasks
   - D) Show it only after the final answer completes
   <details><summary>Answer</summary>C) It's a UX choice per call — valuable on interactive surfaces where it builds trust and fills latency, noise and cost on bulk work. Stream it as its own event type so the UI can render it distinctly.</details>

7. Why persist the event timeline rather than just the final text of an assistant turn?
   - A) To reduce database size
   - B) So a reload can replay the events and reconstruct the chips, cards, and citations exactly as they appeared live
   - C) So the model can re-read its own reasoning next turn
   - D) Because SSE requires a durable log to reconnect
   <details><summary>Answer</summary>B) Streaming and persistence share one representation; replaying the stored events reproduces the full rich rendering after a reload.</details>

8. What should happen when the orchestration errors *after* the stream has already started?
   - A) Drop the connection so the client's auto-reconnect retries the turn
   - B) Still write an `error` event and the `done` sentinel so the client shows a clear failure instead of hanging
   - C) Roll back the user's message so the conversation stays clean
   - D) Swallow the error and end the stream normally
   <details><summary>Answer</summary>B) Wrap the orchestration so you can emit `error` then `done`. Silently dropping the connection leaves the client hanging.</details>

9. Your streaming agent feels laggy in production even though events are emitted promptly in local testing — text arrives in large clumps. What does the chapter point to first?
   - A) The model is too slow; switch tiers
   - B) Buffering somewhere in the chain — disable it at every hop, including reverse proxies
   - C) The client is re-rendering too often
   - D) Heartbeats are being sent too frequently
   <details><summary>Answer</summary>B) Buffering at the framework or a reverse proxy batches events and destroys the real-time feel. Disable it at every hop and flush immediately.</details>

10. What is the purpose of heartbeats in a streaming connection?
    - A) To measure round-trip latency for metrics
    - B) To keep idle connections alive through proxies that time out quiet streams
    - C) To signal that the model is still generating tokens
    - D) To trigger client-side reconnection
    <details><summary>Answer</summary>B) Periodic comments keep otherwise-quiet connections from being closed by proxies that time out idle streams.</details>

**Coding Challenge**

*Flush before you act*

Write a `StreamOrderer` class with `write_text(chunk)`, `tool_call(name)`, and `finish()`. Text accumulates in a buffer; calling `tool_call` must first flush any buffered text as a `content` event, then append a `tool_call_start` event. `finish()` flushes remaining text and appends a `done` event. Return the ordered event list from `finish()`.

<details>
<summary>Python Solution</summary>

```python
class StreamOrderer:
    def __init__(self):
        self.events = []
        self.buffer = ""

    def _flush(self):
        if self.buffer:
            self.events.append({"type": "content", "text": self.buffer})
            self.buffer = ""

    def write_text(self, chunk):
        self.buffer += chunk

    def tool_call(self, name):
        self._flush()                       # flush before you act
        self.events.append({"type": "tool_call_start", "name": name})

    def finish(self):
        self._flush()
        self.events.append({"type": "done"})
        return self.events


s = StreamOrderer()
s.write_text("Let me check the contract. ")
s.tool_call("read_document")
s.write_text("The notice period is 30 days.")
for e in s.finish():
    print(e)
# {'type': 'content', 'text': 'Let me check the contract. '}
# {'type': 'tool_call_start', 'name': 'read_document'}
# {'type': 'content', 'text': 'The notice period is 30 days.'}
# {'type': 'done'}
```

</details>

**Think About It**

1. The chapter opens with a claim that sounds like a trick: a turn that takes fifteen seconds can *feel* fast. Nothing about the actual work got quicker — so where did the speed come from, and what does that suggest about which latency numbers are worth optimising?
   <details><summary>Show answer</summary>The speed comes from replacing a frozen screen with a narrative of work: the user sees reasoning, then "reading contract.pdf," then the answer flowing in, then a download card. Perceived latency is dominated by uncertainty, not duration — a spinner gives you no evidence anything is happening, so every second feels like possible failure. Once each stage announces itself, the same fifteen seconds reads as progress. The practical consequence is that time-to-first-event is often a more valuable metric than total turn time, and that engineering effort spent making the timeline legible can beat effort spent shaving seconds off the model call.</details>

2. There's a bug in this chapter that only shows up in production: the model writes a sentence, calls a tool, and the tool's output appears *before* the sentence. Nothing was actually out of order on the server. Why does an ordering bug appear out of nowhere the moment you add buffering — and what general hazard does that point at?
   <details><summary>Show answer</summary>The events were generated in the right order, but the text was sitting in a buffer waiting to be flushed while the tool event went out immediately — so the *transmission* order diverged from the *generation* order. Buffering is invisible in slow, single-threaded testing and only bites when two paths to the client have different latencies. The fix is a discipline, not a patch: flush any pending output at every point where you hand off to a different emission path. It generalises to anything with mixed buffered and unbuffered channels — logs interleaved with stdout, metrics versus traces — where "it happened first" and "it arrived first" quietly stop being the same statement.</details>

3. Streaming is ephemeral by definition and persistence is durable by definition, yet the chapter insists they "share one representation." Why isn't it simpler to stream tokens for the live view and save a clean final transcript for history?
   <details><summary>Show answer</summary>Because the live view isn't just text — it's chips, cards, accept/reject controls, and clickable citations, all of which came from typed events. Save only the final prose and a reload silently downgrades the conversation to a shadow of what the user saw, and you now maintain two divergent renderers for the same turn. Storing the ordered event array means replay *is* the render path, so live and historical views can't drift apart. It's the same argument as event sourcing generally: keep what happened, derive the view, rather than keeping the view and losing what happened.</details>

4. If a client disconnects mid-turn, the chapter says to clean up and abort the model call — but also, for long tasks, to persist each unit of work as it completes so a retry can resume. Those pull in opposite directions. How do you decide which posture a given turn deserves?
   <details><summary>Show answer</summary>It hinges on whether the work has value independent of the connection that requested it. A chat answer nobody is watching is pure waste, so aborting stops an abandoned turn from burning tokens. But a bulk extraction that has already completed forty cells has produced real, reusable output, and throwing it away means paying for it twice. The reconciling principle is to persist at the granularity of useful work: each finished cell is durable, and only the in-flight remainder is abandoned. Once persistence is fine-grained, "abort" and "resume" stop being in tension — you cancel the model call and keep everything it already earned.</details>

---

Next: [Chapter 9: Data modeling for agents](chapter-09-data-modeling.md)
