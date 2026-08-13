# Chapter 18: Reference Architecture and a Design Checklist

This final chapter assembles everything into a single reference architecture and a checklist you can carry into your own design review. Treat it as the one-page (well, several-page) summary of the whole folder.

## The reference architecture

A complete, production-grade agent, the kind the earlier chapters describe, has this shape:

```
                          ┌─────────────────────────────────────────┐
                          │                 Client                  │
                          │   (renders streamed event timeline)     │
                          └───────────────┬─────────────────────────┘
                                          │  request + SSE stream
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               API / Web tier                                   │
│  • Edge hardening: security headers, CORS, rate limiting                       │
│  • Auth middleware (identity)            ─────────────► [Auth system]           │
│  • Authorization helpers (access checks)                                       │
│  • Input validation                                                            │
│  • Routes per resource (chat, documents, projects, …)                          │
└───────────────┬────────────────────────────────────────────────┬──────────────┘
                │                                                  │
                ▼                                                  ▼
┌───────────────────────────────────────┐         ┌──────────────────────────────┐
│            Agent core                  │         │      Document pipeline        │
│  • Context builder (assemble prompt)   │         │  ingest → store → convert →   │
│  • Orchestrator (the loop, streaming,  │         │  extract → version → ready    │
│    event timeline)                     │         └───────────────┬──────────────┘
│  • Tool executor (dispatch + results)  │                         │
│  • System prompt + emitted protocols   │                         │
└───────┬───────────────────────┬────────┘                        │
        │                       │                                  │
        ▼                       ▼                                  ▼
┌────────────────┐   ┌────────────────────────┐         ┌──────────────────────┐
│ Provider layer │   │        Tools           │         │   Object storage     │
│ (adapter +     │   │ read/find/list/fetch,  │◄───────►│   (file bytes)       │
│  registry +    │   │ generate, edit,        │         └──────────────────────┘
│  tiering)      │   │ research/integrations  │                  ▲
└──────┬─────────┘   └───────────┬────────────┘                  │
       │                         │                               │
       ▼                         ▼                               │
┌────────────────┐   ┌────────────────────────┐         ┌────────┴─────────────┐
│ Model providers│   │   External APIs        │         │   Relational DB      │
│ (Claude/Gemini/│   │   (+ cache table)      │◄───────►│  users, convos(events),│
│  OpenAI/…)     │   └────────────────────────┘         │  artifacts, versions, │
└────────────────┘                                      │  edits, sharing,      │
                                                        │  secrets(encrypted)   │
   [Secrets manager / env] ──► operator + user keys     └──────────────────────┘
   [Observability/tracing]  ◄── traces, tokens, events
   [Queue + workers]        ◄── heavy/async work (as scale demands)
```

The data flows: a request is authenticated, authorized, and validated at the API tier; the agent core builds context (loading durable state), runs the loop (calling the provider layer and tools), and streams an event timeline back; tools read/write object storage, the database, and external APIs; everything durable lives in the database and object storage; secrets come from the environment/manager; traces flow to observability; heavy work goes to workers via a queue when scale requires.

## How the chapters map onto it

- **API tier**: security & multi-tenancy (Ch 11), reliability at the edges (Ch 13), scaling/statelessness (Ch 16).
- **Agent core**: the loop (Ch 2), context engineering (Ch 5), prompt architecture (Ch 6), streaming/events (Ch 8).
- **Provider layer**: abstraction & tiering (Ch 4), cost/latency (Ch 14).
- **Tools**: tool design (Ch 3), retrieval strategy (Ch 7), integrations (Ch 7, 17).
- **Document pipeline**: file processing (Ch 10).
- **Data tier**: data modeling (Ch 9), storage & downloads.
- **Cross-cutting**: secrets/BYOK (Ch 12), observability/eval (Ch 15), domain/compliance (Ch 17), anatomy & vocabulary (Ch 1).

## The design checklist

Take this into a design review. Each item maps to a chapter for detail.

### Foundations
- [ ] Is the **agent loop** explicit, with a hard iteration cap and a guaranteed result per tool call? (Ch 2)
- [ ] Are **app servers stateless**, with all durable state in shared stores? (Ch 16)
- [ ] Is the **provider abstraction** in place, so swapping/adding a model is additive? (Ch 4)
- [ ] Is there a **model registry** that validates client-supplied model ids? (Ch 4)

### Context & prompts
- [ ] Is context **constructed per call** and curated to a budget, not stuffed? (Ch 5)
- [ ] Do you **reference content via tools** rather than embedding it, with short stable handles? (Ch 5, 7)
- [ ] Do you **distill/cap** large tool and API payloads before they hit context? (Ch 5, 7)
- [ ] Is there **prior-turn memory** and a **stale-content** discipline (re-fetch mutable data)? (Ch 5)
- [ ] Does the **system prompt** carry only invariant behavior, with task instructions loaded on demand? (Ch 6)
- [ ] Are there **emitted protocols** (e.g. citations) the model produces and your code parses deterministically? (Ch 6)

### Tools
- [ ] Is each tool **right-sized** to a user-level action, with a **teaching description**? (Ch 3)
- [ ] Are there **cheap/expensive** and **batch** variants where useful? (Ch 3)
- [ ] Are **schemas tight** (enums, bounds, required, field descriptions)? (Ch 3)
- [ ] Do tools with formatted output take **structured input** and format deterministically in code? (Ch 3)
- [ ] Do tool **results return useful errors** (not exceptions) the model can recover from? (Ch 3, 13)
- [ ] Are tools **scoped to the surface** where they make sense? (Ch 3)

### Data & artifacts
- [ ] Are conversations stored as **event logs**, not transcripts, for faithful replay? (Ch 9)
- [ ] Do you **persist the user message before** the turn and the outcome after? (Ch 9)
- [ ] Are artifacts **versioned and immutable**, with a current-version pointer and a `source` audit field? (Ch 9)
- [ ] Are async/multi-step flows driven by explicit **status state machines**? (Ch 9)
- [ ] Is **sharing modeled explicitly** in the schema? (Ch 9, 11)

### UX
- [ ] Is the orchestrator built to **stream an event timeline**, with the same events persisted? (Ch 8)
- [ ] Do you **hide machine protocols** from the visible stream while parsing them? (Ch 6, 8)
- [ ] Do you **flush text before tool calls** so the timeline stays chronological? (Ch 8)
- [ ] Is **reasoning surfaced or hidden** per call appropriately? (Ch 4, 8)

### Security
- [ ] Does **every protected route** authenticate via one middleware and **authorize via centralized helpers**? (Ch 11)
- [ ] Are **list/batch inputs filtered** to accessible resources before acting? (Ch 11)
- [ ] Is the agent's **blast radius bounded** by least-privilege tools, with **human-in-the-loop** for consequential actions? (Ch 11)
- [ ] Have you designed against **prompt injection** (untrusted content can't gain authority; actions authorized against the user)? (Ch 11)
- [ ] Are **user secrets encrypted** (AES-GCM, per-record IV, key from env, fail closed) and **never exposed to clients**? (Ch 12)
- [ ] Is credential resolution **user-beats-operator with fallback**, exposing status not secrets? (Ch 12)

### Reliability
- [ ] Is **all model output parsed defensively**, turning mistakes into recoverable signals? (Ch 13)
- [ ] Are transient failures **retried with capped backoff + jitter**, terminal ones not? (Ch 13)
- [ ] Are side-effecting operations **idempotent**? (Ch 13)
- [ ] Is progress **persisted for resumability**, and each dependency classified fatal vs degradable? (Ch 13)
- [ ] Do **streams fail cleanly** (error event + sentinel), with resource cleanup on disconnect? (Ch 8, 13)
- [ ] Are there **timeouts** on every external call? (Ch 13)

### Cost & performance
- [ ] Are tasks **tiered** to the cheapest capable model, with reasoning off for bulk? (Ch 4, 14)
- [ ] Do you **reduce iterations** (batching, good descriptions, discovery tools) and **parallelize** independent work? (Ch 14)
- [ ] Do you **cache external calls** and exploit **prompt caching** with a stable prefix? (Ch 9, 14)
- [ ] Is **usage metered** for per-user limits/attribution? (Ch 9, 14)

### Observability & quality
- [ ] Do you capture **per-turn traces** (context, model calls, tokens, tool calls, outcome)? (Ch 15)
- [ ] Is there an **eval set** run on every prompt/tool/model change, with deterministic checks where possible? (Ch 15)
- [ ] Do you watch **production signals** (feedback, accept/reject, failures) and feed cases back into evals? (Ch 15)

### Domain (if regulated)
- [ ] Are **claims grounded and citations precise/verbatim/machine-checkable**? (Ch 17)
- [ ] Does the agent produce the professional's **native artifacts** and **propose rather than impose**? (Ch 17)
- [ ] Is there a complete **immutable audit trail**, and **confidentiality/data-handling** appropriate to the regime? (Ch 17)
- [ ] Is **confidence calibrated** and scope respected (information vs advice)? (Ch 17)

## The build order, one more time

If you're starting fresh: skeleton & schema → provider layer → ingestion → agent loop → tools → prompt & citations → generation → editing → context assembly → auth & access → secrets → integrations → workflows → bulk extraction → storage/downloads, with observability, reliability, and cost discipline woven through from the start. (Chapter 19 of the explanations folder walks this order concretely.)

## Closing thought

Across every chapter, one belief recurs: **the model is the easy part.** The provider makes it smart; you make it useful, safe, grounded, reliable, observable, and affordable. A great agent is great *systems engineering* with a capable model at the center: the right context in front of it, well-designed tools around it, faithful records behind it, and disciplined operations beneath it. Build those, and the model will shine. Skip them, and no model can save you.

That's the whole craft. Go build something people can trust.

## Review

**Quick Check**

1. What single belief does the chapter say recurs across every chapter of the folder?
   - A) The model is the hardest part to get right
   - B) The model is the easy part - the provider makes it smart; you make it useful, safe, grounded, reliable, observable, and affordable
   - C) Bigger models remove the need for good engineering
   - D) Infrastructure matters more than the model
   <details><summary>Answer</summary>B) "The model is the easy part." A great agent is great systems engineering with a capable model at the center; skip that engineering and no model can save you.</details>

2. In the reference architecture, where does everything durable live?
   - A) In the process memory of the web tier
   - B) In the database (metadata, events, versions, encrypted secrets) and object storage (file bytes)
   - C) Only in the object storage layer
   - D) In the client
   <details><summary>Answer</summary>B) Durable state lives in the relational database (users, conversations/events, artifacts, versions, edits, sharing, encrypted secrets) and object storage (file bytes); the app tier stays stateless.</details>

3. What does the agent core stream back to the client?
   - A) A single final text blob
   - B) An event timeline, with the same events persisted
   - C) Raw model logits
   - D) Only tool results
   <details><summary>Answer</summary>B) The orchestrator runs the loop and streams an event timeline back to the client, and those same events are persisted for faithful replay.</details>

4. According to the architecture, which responsibilities belong to the API / Web tier?
   - A) Building the prompt and running the agent loop
   - B) Edge hardening (security headers, CORS, rate limiting), auth, authorization checks, input validation, and routing per resource
   - C) Converting and extracting documents
   - D) Storing file bytes
   <details><summary>Answer</summary>B) The API tier handles edge hardening, authentication, authorization helpers, input validation, and per-resource routes; the agent core and pipeline sit behind it.</details>

5. If you're starting fresh, what does the build order say to build first?
   - A) Bulk extraction and integrations
   - B) The skeleton and schema
   - C) The observability dashboards
   - D) The editing and generation tools
   <details><summary>Answer</summary>B) Start with the skeleton and schema, then provider layer, ingestion, agent loop, tools, prompt and citations, and so on - with observability, reliability, and cost discipline woven through from the start.</details>

**More Questions**

6. In the chapter-to-architecture mapping, the provider layer corresponds primarily to which concerns?
   - A) Security and multi-tenancy
   - B) Provider abstraction & tiering (Ch 4) and cost/latency (Ch 14)
   - C) Data modeling and storage
   - D) Streaming and events
   <details><summary>Answer</summary>B) The provider layer maps to abstraction & tiering (Ch 4) and cost/latency (Ch 14).</details>

7. In the reference diagram, when do the queue and workers come into play?
   - A) Always, on every request from day one
   - B) For heavy/async work, "as scale demands"
   - C) Only for authentication
   - D) Only for serving static files
   <details><summary>Answer</summary>B) The queue + workers handle heavy/async work and are added as scale demands - consistent with the "don't over-build early" guidance.</details>

8. A reviewer checks the design against the checklist and finds conversations are stored as full rendered transcripts. What does the checklist call for instead, and why?
   - A) Store nothing; regenerate on demand
   - B) Store conversations as event logs, not transcripts, so turns can be faithfully replayed
   - C) Store only the final assistant message
   - D) Store transcripts but encrypt them
   <details><summary>Answer</summary>B) The Data & artifacts checklist says conversations should be stored as event logs (not transcripts) for faithful replay, with the user message persisted before the turn and the outcome after.</details>

9. In the architecture, where do secrets come from?
   - A) Hard-coded in the container image
   - B) A secrets manager / environment, supplying operator and user keys
   - C) The client sends them with each request
   - D) They are stored in plaintext in the database
   <details><summary>Answer</summary>B) Secrets come from a secrets manager / environment supplying operator and user keys; in the DB, user secrets are stored encrypted and never exposed to clients (Ch 12).</details>

10. Which items appear under the checklist's "Domain (if regulated)" section?
    - A) Autoscaling and health checks
    - B) Grounded claims with precise/verbatim/machine-checkable citations, native artifacts with propose-not-impose, an immutable audit trail with appropriate confidentiality, and calibrated in-scope confidence
    - C) Prompt caching and tiering
    - D) Connection pooling and indexing
    <details><summary>Answer</summary>B) The domain section checks grounding/citations, producing native artifacts and proposing rather than imposing, an immutable audit trail with appropriate confidentiality/data-handling, and calibrated, in-scope confidence (Ch 17).</details>

**Coding Challenge**

**A runnable design checklist**

The chapter's checklist is meant to be carried into a design review, with each item mapped to a chapter. Model it in code: write a `DesignReview` class that holds checklist items (each with a short key, a description, and the chapter it maps to), lets you mark items satisfied, and reports which items are still unmet before you can "ship."

<details>
<summary>Python Solution</summary>

```python
class DesignReview:
    def __init__(self):
        self.items = {}   # key -> {"desc":..., "chapter":..., "ok":False}

    def add(self, key, desc, chapter):
        self.items[key] = {"desc": desc, "chapter": chapter, "ok": False}

    def satisfy(self, key):
        if key in self.items:
            self.items[key]["ok"] = True

    def unmet(self):
        return [f'{k} (Ch {v["chapter"]}): {v["desc"]}'
                for k, v in self.items.items() if not v["ok"]]

    def ready_to_ship(self):
        return not self.unmet()


review = DesignReview()
review.add("stateless", "App servers stateless, state in shared stores", 16)
review.add("loop_cap", "Agent loop has a hard iteration cap", 2)
review.add("citations", "Citations precise, verbatim, machine-checkable", 17)

review.satisfy("stateless")
review.satisfy("loop_cap")

print(review.ready_to_ship())   # False
for item in review.unmet():
    print("TODO:", item)        # TODO: citations (Ch 17): ...
```

</details>

**Think About It**

1. The whole folder is about building agents, yet its closing line insists "the model is the easy part." That sounds almost backwards — the model is the miraculous, hard-to-build thing. In what sense is it genuinely the *easy* part of shipping an agent people trust, and what does that reframing change about where you should spend your effort?
   <details><summary>Show answer</summary>The model arrives already smart — the provider spent the enormous effort of training it, and you get that capability by making an API call. What the model does *not* give you is everything around it: the right context assembled in front of it, well-designed tools it can actually use, faithful records behind it, authorization, reliability, cost control, and observability. Those are ordinary systems engineering, and they're where agents actually succeed or fail. Reframing the model as "easy" moves your attention off prompt-tuning-as-magic and onto the unglamorous scaffolding — because a weaker model inside a well-engineered system beats a stronger model inside a sloppy one. The craft is the system, not the model.</details>

2. A team stores each conversation as the final rendered transcript — exactly what the user saw — reasoning that it's the most faithful record. The checklist insists on storing an *event log* instead. Why is the seemingly "more faithful" transcript actually the worse record, and what can you do with an event log that you can't with a transcript?
   <details><summary>Show answer</summary>A transcript is a flattened snapshot of the output; it throws away the structure of what happened. It doesn't tell you which tool the agent called, what it read, in what order, where reasoning was surfaced or hidden, or how the turn was assembled — it just shows the end result. An event log records the sequence of discrete events (text, tool calls, results, status changes), so you can faithfully *replay* the turn, debug why the agent did something, feed real cases back into evals, and render the same timeline again later. The transcript looks faithful because it matches the screen, but it's lossy about causation; the event log preserves the causal structure, which is exactly what you need for observability, audit, and replay.</details>

3. The build order starts with "skeleton & schema" and puts flashy capabilities like generation, editing, and integrations much later. If the model is what makes the demo impressive, why does the recommended order bury the impressive parts and lead with plumbing — and what tends to go wrong for teams that build in the reverse order?
   <details><summary>Show answer</summary>Because almost everything impressive depends on the plumbing being right first. The schema decides whether you can version artifacts, keep an audit trail, and replay conversations; the provider layer decides whether adding a model is additive or a rewrite; the loop and tools decide whether generation and editing are even expressible. Teams that lead with the flashy capabilities tend to hard-code assumptions — a single provider, transcripts instead of event logs, state in memory — and then discover that adding auth, versioning, or a second model means tearing up the foundation. Leading with skeleton and schema means the exciting features slot into a structure that already supports them, and the disciplines the chapter cares about (reliability, observability, cost) are woven in rather than retrofitted. The order front-loads the decisions that are expensive to change later.</details>
