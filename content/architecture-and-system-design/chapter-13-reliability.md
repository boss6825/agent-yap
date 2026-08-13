# Chapter 13: Reliability: Retries, Idempotency, and Failure Handling

Agents are built on components that fail routinely: model APIs time out or rate-limit, tools hit flaky external services, the model itself produces malformed output. A reliable agent isn't one where nothing fails; it's one that *expects* failure and degrades gracefully. This chapter covers the patterns that make agents dependable.

## Assume everything fails

Adopt this stance up front. In a single agent turn, any of these can go wrong:

- The model API returns an error, times out, or rate-limits.
- The model returns malformed tool arguments, or asks for a tool that doesn't exist.
- A tool throws (an external API is down, a file is corrupt).
- The stream connection drops mid-turn.
- A downstream store (database, object storage) is briefly unavailable.

A naive agent crashes the whole turn on any of these. A reliable one has a defined response to each. Reliability is the sum of these defined responses.

## Defensive parsing of model output

The model is a probabilistic component; its output will sometimes be malformed. Guard every place you consume it:

- **Tool arguments**: parse defensively; if the JSON is malformed, default to empty arguments rather than throwing, and let the tool report a useful error.
- **Unknown tool names**: if the model calls a tool you don't have, return a "that tool isn't available" result so the model can recover, rather than erroring out.
- **Emitted protocols**: if the citation/structured block is missing or malformed, proceed without it; don't make a missing trailer fatal.
- **Missing tool results**: guarantee that every tool call the model made gets *some* result back (a real one or a synthesized error). Providers require this pairing; a missing result breaks the next call (Chapter 2).

The principle: **the model's mistakes should become recoverable signals, not crashes.** Often the best recovery is to feed the error back to the model as a tool result; it will frequently adjust and try again.

## Retries with backoff

For transient failures (timeouts, rate limits, 5xx from a provider or external API), retry, but correctly:

- **Only retry idempotent or safe operations.** A read is safe to retry; an action with side effects needs idempotency first (below).
- **Exponential backoff with jitter.** Wait progressively longer between attempts, with randomization, so you don't synchronize retries into a thundering herd against a recovering service.
- **Cap attempts.** A few retries, then surface a clear failure. Infinite retries just move the hang.
- **Respect rate-limit signals.** If a provider returns a retry-after, honor it rather than guessing.

Distinguish *retryable* errors (transient) from *terminal* ones (bad request, auth failure); retrying a terminal error just wastes time.

## Idempotency for actions with side effects

Retries are only safe if repeating an operation doesn't duplicate its effect. Design side-effecting operations to be **idempotent**: safe to run more than once with the same result:

- **Use deterministic keys / upserts.** "Create or update by this key" instead of "insert," so a retried create doesn't make duplicates.
- **Make processing steps re-runnable.** A reprocessed document shouldn't spawn duplicate versions or orphaned files; check-then-act, or key derived work so re-running converges.
- **Guard at natural unique constraints.** Let the database reject a duplicate (unique constraint) rather than relying solely on application checks.

Idempotency is what turns "retrying might double-charge / double-create" into "retrying is safe," which is what makes retries usable at all.

## Persist progress for resumability

For multi-step or long-running work, **persist each unit as it completes** so a failure doesn't lose finished work:

- Save the user's input before starting (a failed turn doesn't lose their message).
- In a bulk job, write each result as it's produced, with a status field. A dropped connection or crash leaves completed units saved; a retry resumes from where it stopped by finding the still-`pending` units.

This makes long jobs robust and is the same status-field discipline from Chapter 9, used here for recovery.

## Graceful degradation

Not every failure should fail the request. Decide, per dependency, whether its failure is fatal or degradable:

- **Optional enhancement fails → degrade.** If a document's preview rendering fails, keep the document usable for text and reading; don't reject the upload.
- **Core dependency fails → fail clearly.** If the model API is down, there's no answer to give; return an honest error.
- **External enrichment fails → continue without it.** If a research API is unavailable, answer from what you have and say what's missing, rather than crashing the turn.

Map each dependency to "fatal" or "degradable" deliberately, and wrap accordingly.

## Failing within a stream

Because agent responses are streamed (Chapter 8), failures often occur *after* you've started responding. Handle it:

- Wrap the orchestration so that on error you can still emit an `error` event and a terminating sentinel, so the client shows a clean failure rather than hanging.
- Don't lose persisted progress: the pre-saved user message and any incrementally-saved results survive.
- Clean up server-side resources (abort the in-flight model call) when the client disconnects, so abandoned turns stop burning tokens.

## Timeouts and circuit breakers

- **Set timeouts** on every external call (model and tools). A call without a timeout can hang a request indefinitely. Choose timeouts appropriate to each dependency.
- **Consider circuit breakers** for dependencies that fail in waves: after repeated failures, stop calling for a cooling-off period and fail fast, rather than piling requests onto a struggling service. This protects both you and the dependency.

## Caching as reliability

Caching slow or rate-limited external calls (Chapter 9) is also a reliability tactic: a cached response means a momentary upstream outage or rate-limit doesn't break a repeat request, and you stay under provider limits that would otherwise cause failures.

## Bound the agent's own runaway behavior

Some failures come from the agent, not its dependencies. The hard iteration cap (Chapter 2) prevents an infinite tool-calling loop; repetition detection catches a stuck agent; rate limits (Chapter 11) bound abuse. These are reliability mechanisms too: they keep a confused agent from consuming unbounded resources.

## Observability closes the loop

You can't improve reliability you can't see. Log failures with enough context (which turn, which tool, which document, the error) to diagnose them, and track failure rates so you know which dependency is the weak link (Chapter 15). Reliability work is iterative: instrument, find the top failure mode, fix it, repeat.

## The reliability checklist

- Parse all model output defensively; turn its mistakes into recoverable signals.
- Guarantee one result per tool call.
- Retry transient failures with capped exponential backoff and jitter; don't retry terminal errors.
- Make side-effecting operations idempotent so retries are safe.
- Persist progress so long work is resumable and input is never lost.
- Classify each dependency as fatal or degradable, and handle accordingly.
- Emit a clean error (not a hang) when a stream fails mid-flight.
- Set timeouts on every external call; consider circuit breakers.
- Cap iterations and detect stuck loops.
- Log and measure failures so you can drive them down.

A reliable agent feels calm: when something underneath it breaks, the user gets a clear message or a degraded-but-useful result, finished work is preserved, and nothing hangs or duplicates. That calm is entirely the product of expecting failure and designing for it.

## Review

**Quick Check**

1. What stance does the chapter say to adopt about failure?
   - A) Failures are rare and can be handled reactively
   - B) Assume everything fails; a reliable agent expects failure and has a defined response to each mode
   - C) Only the model API ever fails
   - D) Failures should always crash the turn so they're visible
   <details><summary>Answer</summary>B) Assume everything fails. Reliability is the sum of defined responses to each failure mode, not the absence of failure.</details>

2. The model returns malformed JSON for a tool call's arguments. What's the recommended defensive handling?
   - A) Crash the turn with a parse error
   - B) Default to empty arguments rather than throwing, and let the tool report a useful error
   - C) Silently skip the tool call
   - D) Retry the model call immediately
   <details><summary>Answer</summary>B) Parse defensively — default to empty arguments and let the tool report a useful error. The model's mistakes should become recoverable signals, not crashes.</details>

3. Why does the chapter recommend exponential backoff *with jitter* for retries?
   - A) To retry faster each time
   - B) So retries stay perfectly synchronized
   - C) So you don't synchronize retries into a thundering herd against a recovering service
   - D) To respect the provider's cache
   <details><summary>Answer</summary>C) Jitter randomizes the wait so many clients don't retry in lockstep and hammer a recovering service (a thundering herd).</details>

4. What makes a side-effecting operation safe to retry?
   - A) Making it idempotent — safe to run more than once with the same result (deterministic keys/upserts)
   - B) Wrapping it in a longer timeout
   - C) Running it inside the stream
   - D) Logging it before running
   <details><summary>Answer</summary>A) Idempotency. Use deterministic keys/upserts and natural unique constraints so a retried create doesn't duplicate its effect.</details>

5. Every tool call the model made must get back what, per the chapter?
   - A) A cached result if available
   - B) Some result — a real one or a synthesized error — because providers require the pairing
   - C) Nothing, if the tool failed
   - D) A retry instruction
   <details><summary>Answer</summary>B) Some result for every tool call — real or a synthesized error. Providers require the call/result pairing; a missing result breaks the next call.</details>

**More Questions**

6. How should you treat a *terminal* error (bad request, auth failure) versus a transient one?
   - A) Retry both with backoff
   - B) Retry transient errors; don't retry terminal ones, since retrying just wastes time
   - C) Retry terminal errors more aggressively
   - D) Ignore both
   <details><summary>Answer</summary>B) Retry transient failures (timeouts, rate limits, 5xx); don't retry terminal errors like bad requests or auth failures — retrying them only wastes time.</details>

7. A document's preview rendering fails, but its text extracted fine. What does "graceful degradation" prescribe?
   - A) Reject the upload
   - B) Fail the whole request clearly
   - C) Degrade: keep the document usable for text and reading rather than rejecting it
   - D) Retry rendering until it succeeds
   <details><summary>Answer</summary>C) Degrade. An optional enhancement failing (the preview) shouldn't fail the request; keep the document usable for text. A core dependency failing (the model API) is different — fail clearly.</details>

8. Because responses are streamed, failures often happen after you've started responding. What should you do?
   - A) Silently stop the stream
   - B) Emit an `error` event and a terminating sentinel so the client shows a clean failure rather than hanging, and preserve persisted progress
   - C) Restart the whole turn from scratch
   - D) Buffer the entire response and only send on success
   <details><summary>Answer</summary>B) Wrap orchestration so on error you emit an error event and terminating sentinel — a clean failure, not a hang — while pre-saved input and incremental results survive.</details>

9. A bulk job over hundreds of documents crashes halfway. Why does persisting each result as it completes matter?
   - A) It reduces token cost
   - B) Completed units are saved, so a retry resumes from the still-`pending` units instead of redoing finished work
   - C) It makes the model faster
   - D) It avoids the need for idempotency
   <details><summary>Answer</summary>B) Persisting each unit with a status field means a crash leaves completed work saved; a retry finds the still-`pending` units and resumes from there rather than losing progress.</details>

10. What is a circuit breaker good for?
    - A) Encrypting outbound calls
    - B) After repeated failures, stop calling a struggling dependency for a cooling-off period and fail fast, protecting both you and the dependency
    - C) Guaranteeing one result per tool call
    - D) Randomizing retry timing
    <details><summary>Answer</summary>B) For dependencies that fail in waves: after repeated failures, stop calling for a cooling-off period and fail fast rather than piling requests onto a struggling service.</details>

**Coding Challenge**

*Retry with capped exponential backoff, jitter, and terminal-error awareness*

Write `retry(fn, is_retryable, max_attempts=4, base=0.5)` that calls `fn()` and returns its result. On exception, if `is_retryable(exc)` is False, re-raise immediately (terminal error). Otherwise wait `base * 2**attempt` seconds plus a small random jitter and try again, up to `max_attempts`; if all attempts fail, re-raise the last exception. (Use a `sleep` you can stub in tests.)

<details>
<summary>Python Solution</summary>

```python
import random
import time


def retry(fn, is_retryable, max_attempts=4, base=0.5, sleep=time.sleep):
    last = None
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as exc:
            last = exc
            if not is_retryable(exc):        # terminal: don't waste time
                raise
            if attempt == max_attempts - 1:  # cap attempts
                raise
            delay = base * (2 ** attempt) + random.uniform(0, base)  # backoff + jitter
            sleep(delay)
    raise last  # unreachable, but explicit


# Example: retry timeouts, never retry a ValueError (bad request)
def is_retryable(e):
    return isinstance(e, TimeoutError)

calls = {"n": 0}
def flaky():
    calls["n"] += 1
    if calls["n"] < 3:
        raise TimeoutError("provider slow")
    return "ok"

print(retry(flaky, is_retryable, sleep=lambda s: None))  # "ok" on 3rd try
```

</details>

**Think About It**

1. It feels obvious that a good system should retry when something fails. But the chapter is emphatic that you must make operations idempotent *first* — otherwise retrying is dangerous. What's the specific disaster that turns a well-meaning retry into a bug, and why does that flip the usual intuition that "trying again can't hurt"?
   <details><summary>Show answer</summary>The disaster is duplicated side effects: if a "create" or a payment succeeds but the *response* is lost to a timeout, a naive retry runs the operation again — now you've charged the card twice or created two records. "Trying again can't hurt" is only true for reads; for anything with side effects, the retry can double the effect precisely when the first attempt actually worked but looked like it failed. That's why the chapter orders it deliberately: idempotency (deterministic keys, upserts, unique constraints) is what converts "retrying might double-charge" into "retrying is safe," and only *then* are retries usable at all. Without it, your reliability mechanism becomes a corruption mechanism.</details>

2. Adding random jitter to your retry delays sounds like sloppiness — why would you deliberately make timing *less* precise? Yet the chapter treats it as essential. What real incident is jitter preventing, and why does a fleet of perfectly-behaved clients backing off in lockstep make an outage worse?
   <details><summary>Show answer</summary>Jitter prevents a "thundering herd." Picture a service that briefly goes down: every client hits an error at nearly the same instant, and if they all back off by exactly the same schedule, they all retry at exactly the same later instant — slamming the recovering service with a synchronized wave that knocks it back over, repeating forever. The individually "correct" behavior (identical exponential backoff) becomes collectively catastrophic. Randomizing each client's wait spreads the retries across time so the recovering service sees a smooth trickle instead of a spike. It's a case where a little deliberate disorder at the individual level produces stability at the system level — the precision you gave up was precision you didn't want everyone sharing.</details>

3. The chapter says a reliable agent "feels calm," and frames the model's own mistakes as "recoverable signals, not crashes" — often best handled by feeding the error back to the model as a tool result. That's counterintuitive: normally we treat an error as a stop condition. Why is handing the model its own failure often the *most* reliable move, rather than aborting the turn?
   <details><summary>Show answer</summary>Because the model is a probabilistic component that can *recover* when given feedback — much like a person who mistypes a command, reads the error, and fixes it. If it calls a tool that doesn't exist, or passes malformed arguments, returning "that tool isn't available" or a clear error lets it adjust and try again within the same turn, often succeeding on the next step. Aborting instead throws away a turn that was one nudge from working, and pushes the failure onto the user. The reliability mindset here is to keep the loop alive and self-correcting: turn the model's mistakes into inputs it can act on, so the system bends instead of breaking. The "calm" comes from every failure mode having a defined, non-fatal response — including the model's own.</details>

---

Next: [Chapter 14: Cost, latency, and model tiering](chapter-14-cost-latency.md)
