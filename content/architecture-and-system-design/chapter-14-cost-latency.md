# Chapter 14: Cost, Latency, and Model Tiering

Agents can be expensive and slow if built naively, and both problems compound: an agent loop makes *multiple* model calls per turn, each potentially large. Cost and latency are not afterthoughts to optimize later; they're design constraints that shape your architecture. This chapter covers where the costs and delays come from and the levers that control them.

## Where cost comes from

LLM cost is driven by **tokens**: input (everything you send) and output (everything the model generates), usually priced separately with output more expensive. For an agent, the multipliers are:

- **Loop iterations.** Each tool round-trip is another model call that re-sends accumulated context. A 5-iteration turn can cost several times a single call.
- **Context size.** Every token of context is paid for on every call. Bloated prompts and dumped tool results are paid for repeatedly across the loop.
- **Model choice.** Top-tier models can cost 10–50× a small model per token. Using a flagship model for a trivial task is the most common waste.
- **Reasoning tokens.** Thinking/reasoning generates extra (billed) tokens. Valuable when it improves a hard answer; pure waste on a bulk job.

## Where latency comes from

Latency has overlapping sources:

- **Time to first token**: how long before the model starts responding. Streaming hides this, but it still gates perceived responsiveness.
- **Generation time**: proportional to output length and model speed.
- **Loop depth**: each iteration is a serial round-trip; a deep loop is slow even if each call is fast.
- **Tool latency**: slow external APIs (some take tens of seconds) stall the turn.
- **Context size**: larger inputs take longer to process (prefill).

## The master lever: model tiering

The highest-leverage optimization is **routing each task to the cheapest model that can do it well** (Chapter 4). A three-tier scheme:

- **Top tier** for the primary interactive task where quality is paramount.
- **Mid tier** for high-volume structured work (bulk extraction, classification) where you need throughput and lower cost and a capable-enough model suffices.
- **Low tier** for trivial background tasks (titles, quick reformats, yes/no checks).

This often cuts cost dramatically *and* improves perceived speed, because the cheap models are also faster. Map every task to a tier explicitly; the default of "use the best model everywhere" is the costliest mistake.

## Turn reasoning on and off per call

Reasoning is a per-call decision (Chapters 4, 8). On for hard interactive tasks where it improves quality and the user benefits from seeing it; **off** for bulk and one-shot jobs, where you should also explicitly zero the thinking budget where the provider allows, so you actually stop paying for it. A bulk extraction over a thousand documents with reasoning left on can multiply the bill for no benefit.

## Shrink and curate context

Since context is paid for on every loop iteration, controlling it is controlling cost:

- **Reference, don't embed** (Chapter 5). Don't paste documents into the prompt; let the model fetch via tools, paying for content only when used.
- **Distill tool results.** Cap long payloads, return decision-relevant fields, offer a "get more" tool. A giant unfiltered tool result is re-sent on every subsequent iteration, paying for it repeatedly.
- **Curate history.** Use a recent window or summarization rather than re-sending an ever-growing transcript.
- **Keep prompts focused.** Load task-specific instructions on demand instead of carrying every possible instruction in the system prompt on every call.

## Reduce loop iterations

Fewer iterations means fewer calls means less cost and latency:

- **Batching tools.** "Fetch these N documents" in one call avoids N serial iterations. "Extract all columns for this document in one call" instead of one call per cell.
- **Good tool design and descriptions** so the model picks the right tool first time instead of fumbling through several.
- **Cheap discovery tools** (list/find) so the model targets what it needs instead of reading everything and iterating.

## Parallelize independent work

When sub-tasks don't depend on each other, run them concurrently rather than serially. Bulk extraction across documents is embarrassingly parallel: fan out across documents instead of looping one at a time. This doesn't reduce total token cost, but it slashes wall-clock latency, which is often what users feel. (Mind provider rate limits when fanning out; Chapter 13.)

## Cache aggressively

- **Cache external API calls** (Chapter 9): repeated identical lookups become instant and free, and you stay under rate limits.
- **Exploit provider prompt caching** where available: keeping a stable prefix (system prompt, tool definitions) constant lets the provider cache it and charge less for repeated input. Structure your context so the invariant parts come first.

## Stream to mask latency

Streaming (Chapter 8) doesn't reduce real latency but transforms *perceived* latency. A turn that takes fifteen seconds feels responsive when the user sees reasoning, then tool activity, then the answer flowing in. Showing meaningful intermediate events ("reading contract.pdf") turns dead time into visible progress. This is a cost-free latency win and one of the best UX investments you can make.

## Right-size output

Output tokens are expensive and slow. Don't ask for more than needed: cap output length for bounded tasks (a title needs a handful of tokens, not a paragraph), and instruct the model to be concise where verbosity adds no value. For structured extraction, the format constraints (Chapter 6) also keep output tight.

## Measure before optimizing

Don't guess where the cost goes; instrument it (Chapter 15). Track tokens per turn, per task type, and per model; track loop depth and tool latency. Usually a small number of patterns dominate the bill (a heavy tool result re-sent every iteration; a flagship model used for a background task). Find those and fix them, rather than micro-optimizing prompts that barely move the needle.

## Metering and limits

Commercial agents need to *bound* cost per user. Build usage metering into the data model (Chapter 9): per-user counters, reset windows, plan tiers, so you can enforce limits and attribute spend. BYOK (Chapter 12) shifts model cost to users entirely, which is itself a cost strategy for self-hosted products.

## The cost/latency playbook

1. **Tier your models**: cheapest capable model per task. (Biggest lever.)
2. **Reasoning off** for bulk/one-shot work; on for hard interactive tasks.
3. **Shrink context**: reference don't embed, distill tool results, curate history.
4. **Cut iterations**: batch tools, good descriptions, cheap discovery tools.
5. **Parallelize** independent work to cut wall-clock time.
6. **Cache** external calls and exploit prompt caching with a stable prefix.
7. **Stream** to mask the latency that remains.
8. **Right-size output** and cap where bounded.
9. **Measure** to find the real hotspots, then meter to bound per-user spend.

Cost and latency are won the same way: send fewer tokens to cheaper, faster models, fewer times, in parallel, and show progress while it happens.

## Review

**Quick Check**

1. What fundamentally drives LLM cost?
   - A) The number of users
   - B) Tokens — input and output, usually priced separately with output more expensive
   - C) Wall-clock time the request stays open
   - D) The number of tools defined
   <details><summary>Answer</summary>B) Tokens. Input (everything you send) and output (everything generated), priced separately with output typically more expensive.</details>

2. Why does an agent loop multiply cost compared to a single model call?
   - A) Each iteration retrains the model
   - B) Each tool round-trip is another model call that re-sends accumulated context
   - C) Tools are billed per call by the provider
   - D) Streaming duplicates the output tokens
   <details><summary>Answer</summary>B) Each tool round-trip is another model call re-sending the accumulated context, so a 5-iteration turn can cost several times a single call.</details>

3. What is described as "the master lever" for controlling cost and latency?
   - A) Turning off streaming
   - B) Model tiering — routing each task to the cheapest model that can do it well
   - C) Caching every response
   - D) Reducing the number of tools
   <details><summary>Answer</summary>B) Model tiering. Routing each task to the cheapest capable model often cuts cost dramatically and improves perceived speed, since cheap models are also faster.</details>

4. For a bulk extraction job over a thousand documents, what does the chapter say to do about reasoning?
   - A) Leave it on for accuracy
   - B) Turn it off, and explicitly zero the thinking budget where allowed, so you stop paying for it
   - C) Increase the reasoning budget
   - D) Reasoning has no cost impact
   <details><summary>Answer</summary>B) Turn reasoning off for bulk/one-shot jobs and zero the thinking budget where the provider allows. Left on, it can multiply the bill for no benefit.</details>

5. Why is a giant unfiltered tool result especially costly in an agent loop?
   - A) It's expensive to store on disk
   - B) It gets re-sent on every subsequent iteration, so you pay for it repeatedly
   - C) It slows down the tool itself
   - D) It forces the model to use reasoning
   <details><summary>Answer</summary>B) Context is paid for on every loop iteration, so a huge tool result is re-sent — and re-billed — each time. Distill results: cap payloads, return decision-relevant fields, offer a "get more" tool.</details>

**More Questions**

6. What is the point of provider prompt caching, and how do you structure context to exploit it?
   - A) Cache the output; put variable content first
   - B) Keep a stable prefix (system prompt, tool definitions) constant and first, so the provider caches it and charges less for repeated input
   - C) Cache tool results only; order doesn't matter
   - D) Disable caching for interactive tasks
   <details><summary>Answer</summary>B) A stable, invariant prefix (system prompt, tool defs) placed first lets the provider cache it and charge less on repeated input. Structure context so invariant parts come first.</details>

7. Does parallelizing independent sub-tasks reduce token cost?
   - A) Yes, it halves the tokens
   - B) No — it doesn't reduce total token cost, but it slashes wall-clock latency
   - C) Yes, because fewer iterations run
   - D) No, it increases both cost and latency
   <details><summary>Answer</summary>B) Parallelizing (e.g. fanning out bulk extraction across documents) doesn't cut token cost but slashes wall-clock latency, which is often what users feel. Mind provider rate limits when fanning out.</details>

8. How does streaming affect latency?
   - A) It reduces real latency by generating faster
   - B) It doesn't reduce real latency but transforms *perceived* latency, turning dead time into visible progress
   - C) It increases latency due to overhead
   - D) It only helps for short responses
   <details><summary>Answer</summary>B) Streaming doesn't reduce real latency; it transforms perceived latency. Showing reasoning, tool activity ("reading contract.pdf"), then the answer makes a 15-second turn feel responsive — a cost-free UX win.</details>

9. You're generating a chat title, which needs only a handful of tokens. Which levers apply?
   - A) Use the flagship model with reasoning on
   - B) Use a low-tier model, reasoning off, and cap the output length
   - C) Increase context size for better quality
   - D) Parallelize the single call
   <details><summary>Answer</summary>B) A trivial background task belongs on the low tier with reasoning off and a capped, right-sized output. Output tokens are expensive and slow, so don't ask for more than needed.</details>

10. What does the chapter say to do before optimizing cost?
    - A) Rewrite all prompts to be shorter
    - B) Switch every task to the cheapest model
    - C) Measure/instrument it — track tokens per turn, per task, per model, plus loop depth and tool latency — because a few patterns usually dominate the bill
    - D) Turn off streaming to save tokens
    <details><summary>Answer</summary>C) Measure first. Instrument tokens per turn/task/model, loop depth, and tool latency; usually a small number of patterns (a heavy tool result re-sent each iteration, a flagship model on a background task) dominate. Fix those.</details>

**Coding Challenge**

*Route each task to the cheapest capable tier*

Given a task's required capability level, write `pick_model(required_tier, prices)` that returns the name of the cheapest model whose tier is at least the required one. Tiers rank `low < mid < top`. `prices` is a list of `(name, tier, price_per_1k)`. Implement the chapter's "cheapest model that can do it well" rule; return `None` if nothing qualifies.

<details>
<summary>Python Solution</summary>

```python
RANK = {"low": 0, "mid": 1, "top": 2}


def pick_model(required_tier, prices):
    need = RANK[required_tier]
    capable = [(name, price) for name, tier, price in prices
               if RANK[tier] >= need]           # meets the capability bar
    if not capable:
        return None
    return min(capable, key=lambda x: x[1])[0]   # cheapest among the capable


models = [
    ("haiku",  "low", 0.25),
    ("sonnet", "mid", 3.0),
    ("opus",   "top", 15.0),
]

print(pick_model("low", models))  # 'haiku'  -> cheapest overall
print(pick_model("mid", models))  # 'sonnet' -> cheapest that clears 'mid'
print(pick_model("top", models))  # 'opus'   -> only 'top' qualifies
```

</details>

**Think About It**

1. The chapter calls "use the best model everywhere" the costliest mistake, and notes top-tier models can cost 10–50× a small one. If quality is what users care about, why isn't reaching for the most capable model on every task simply the safe default — and what does the fact that cheaper models are *also faster* do to that calculus?
   <details><summary>Show answer</summary>Reaching for the flagship everywhere feels safe, but most tasks in an agent aren't quality-limited — generating a title, classifying a document, a yes/no check — and a capable-enough model does them indistinguishably well at a fraction of the cost. Paying 10–50× per token for a task a small model nails is pure waste, and because an agent loop makes many calls, that waste compounds across every iteration. The kicker is that the cheap models are usually *faster* too, so tiering isn't a quality-versus-cost trade at all on those tasks — you get lower cost *and* lower latency simultaneously. The discipline is to map each task to the cheapest tier that clears its actual quality bar, reserving the flagship for the interactive work where quality genuinely dominates.</details>

2. There's a subtle trap the chapter keeps returning to: the cost of context isn't paid once, it's paid *again on every loop iteration*. Why does this single fact reframe a "harmless" 50KB tool result or an ever-growing chat transcript as one of the biggest line items on your bill?
   <details><summary>Show answer</summary>In a normal request you'd pay for a big payload once and forget it. But an agent re-sends the accumulated context on every model call in the loop, so that 50KB tool result isn't billed once — it's billed on iteration two, three, four, and every one after, quietly multiplying. The same is true of an unpruned transcript: each new turn re-sends the whole growing history. So context bloat doesn't add a fixed cost; it adds a *recurring* cost that scales with loop depth and conversation length. That's why the chapter's remedies all attack re-sending: distill tool results to decision-relevant fields, reference rather than embed documents, and curate history with a recent window or summary. The mental shift is from "how big is this?" to "how many times will I pay for this?"</details>

3. Streaming is presented as one of the best investments you can make — yet the chapter is blunt that it "doesn't reduce real latency" at all. How can something that changes nothing about the actual wait be so valuable, and what does that reveal about what "latency" even means for a user?
   <details><summary>Show answer</summary>Because the wait a user *experiences* is not the same as the wait a stopwatch measures. A 15-second turn where the screen is blank feels broken; the same 15 seconds where you see the model reasoning, then "reading contract.pdf," then the answer flowing in feels responsive and alive. Nothing about the real work changed — the tokens, the tool calls, the total time are identical — but dead time became visible progress, and visible progress reads as fast. This reveals that perceived latency is partly a UX construct: users tolerate long operations they can watch and distrust fast ones that look frozen. That's why the chapter calls it a cost-free latency win — you didn't buy a faster model, you just stopped hiding the work — and pairs it with showing meaningful intermediate events rather than a spinner.</details>

---

Next: [Chapter 15: Observability and evaluation](chapter-15-observability-eval.md)
