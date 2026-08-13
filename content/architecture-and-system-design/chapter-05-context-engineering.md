# Chapter 5: Context Engineering and Memory

If you remember one chapter from this folder, make it this one. **Context engineering** (deciding exactly what goes into the model on each call) is the discipline that most determines whether an agent feels sharp or scattered. The model can only reason about what's in its context window; everything else may as well not exist. This chapter is about constructing that context well, and about the memory system that feeds it.

## Context is constructed, not stored

The most important reframing: context is not a thing you keep; it's a thing you **build fresh for every model call**. Each call, your orchestrator assembles:

- the system prompt (identity, rules, output protocols),
- the relevant slice of conversation history,
- the available tools,
- and injected information (what's available to act on, retrieved snippets, prior-turn summaries).

The model is stateless between calls. "Memory" is your database; "context" is the carefully-chosen subset of that memory you load into a given call. The skill is in the *choosing*.

## The context window is a budget

Every token you put in context costs money and latency, and crowds out other tokens. So treat the window as a **budget to allocate**, not a bucket to fill. The instinct to "give the model everything just in case" is wrong: it's expensive, it's slow, and, counterintuitively, it often *degrades* quality, because important details get diluted among irrelevant ones (the "lost in the middle" effect). Curate ruthlessly.

## Reference, don't embed

A powerful pattern for document- or data-heavy agents: **don't dump content into context; reference it and let the model pull what it needs via tools.** Instead of pasting five documents into the prompt, give the model short handles ("doc-0", "doc-1") and a `read_document` tool. The model reads only what the task requires.

This has three benefits:

1. **Smaller prompts**: you pay for content only when it's actually used.
2. **Forced grounding**: the model must explicitly fetch content, which makes it engage with the real text rather than half-remembered training data.
3. **Freshness**: referencing always pulls the *current* version, avoiding stale content (see below).

Use short, stable, human-meaningless-but-model-friendly labels for the handles, assigned deterministically, so the model can reference them reliably and can only reference things that actually exist.

## Distill external and tool data before it lands

When a tool returns a large payload (an API response, a long document, a database result), don't pour the raw firehose into context. **Distill it:** keep the decision-relevant fields, cap the long ones with a "there's more" flag, and offer a separate tool to fetch detail on demand. A giant unfiltered payload buries the signal and blows the budget. This is context engineering applied at the tool boundary, and it's where many agents quietly go wrong.

## The stale-content problem

A specific trap for agents that work with mutable data: if the model is allowed to "remember" content it read several turns ago, it will reason about a *stale* version after that content has changed. The fix is a discipline: require the model to re-fetch content each turn it needs it, and *tell it explicitly* that it does not retain content between turns. Yes, this costs a re-read. But for anything where correctness matters, and especially where the data can be edited, fresh-every-turn beats remembered-and-wrong. Reinforce the rule in both the system prompt and the tool descriptions.

## Prior-turn memory: lightweight continuity

The model needs to remember *what it did*, even if not the full content. A cheap, effective technique: after each turn, summarise the turn's actions into a short note ("generated draft.docx → doc-1; read source.docx → doc-0") and inject that summary into the next call. This gives the model continuity, it knows the handles for things it produced and won't redo work, without re-sending everything. It's a tiny amount of context for a large coherence gain.

## Managing long histories

Conversations grow past the context budget. Strategies, in rough order of preference:

- **Recent-window**: include the last N turns verbatim. Simple, and often enough.
- **Summarise-and-prepend**: periodically compress older turns into a running summary, keep recent turns verbatim. Preserves the gist while bounding tokens.
- **Selective recall**: store all history in the database and retrieve only the turns relevant to the current message (semantic search over history). More complex; useful for very long-lived conversations.
- **Event-log replay with selective inclusion**: store rich turn events durably, but include in context only what the current turn needs.

Whatever you choose, the principle holds: history lives in durable storage; you load a *curated slice* into context.

## Layering the context

Think of context as layers assembled in order:

1. **Standing instructions**: the system prompt: identity, universal rules, output protocols. Stable across calls.
2. **Task instructions**: anything specific to this task (a selected workflow/template, loaded on demand rather than baked into the system prompt).
3. **Situational injection**: what's available right now: the list of accessible documents, the user's current focus, retrieved snippets.
4. **History**: the curated conversation slice, plus the prior-turn summary.
5. **The current user message**: possibly annotated (e.g. mapping attachments to their handles).

Keeping these as distinct layers makes the assembly logic clear and lets you tune each independently. In particular, *loading task instructions on demand* (rather than concatenating every possible instruction into the system prompt) keeps every layer focused: the system prompt stays about universal behaviour, and task-specific detail arrives only when relevant.

## Map user references to model handles

A small but high-impact detail: when the user attaches or references something, annotate the message so the model is handed the *same handle it would use to act on it*. If the user attaches a file, prefix the message with "the user attached: doc-2 (contract.pdf)". Now the model knows that "the contract the user just mentioned" is `doc-2` and can read it directly. Without this mapping, the model has to guess which handle corresponds to the user's intent, a needless source of error.

## Memory beyond the conversation

"Memory" also includes things that persist across conversations: user preferences, organisation settings, reusable templates, and generated artifacts. These live in your data model (Chapter 9) and are loaded into context when relevant: a user's saved templates appear as available tools/workflows; their generated documents become referenceable handles. Design memory as durable state that you *selectively surface*, never as an ever-growing prompt.

## The quiet truth about agent quality

Teams obsess over model choice and prompt wording, but in practice the biggest quality wins come from context engineering: giving the model short stable handles, sweeping the right artifacts into reach, injecting a prior-turn summary, distilling tool outputs, and forcing fresh reads of mutable data. None of it is glamorous. All of it is where "it just works" actually comes from. Spend your effort here.

## Review

**Quick Check**

1. How does the chapter distinguish "context" from "memory"?
   - A) Memory is your database; context is the curated subset loaded into a given call
   - B) Context is durable storage; memory is rebuilt per call
   - C) They are two names for the same thing
   - D) Context persists across sessions; memory does not
   <details><summary>Answer</summary>A) Memory is your database; context is the curated subset loaded into a given call - the skill is in choosing that subset.</details>

2. The "reference, don't embed" pattern hands the model:
   - A) The full text of every document inline
   - B) Short stable handles plus a tool to read content on demand
   - C) A larger context window
   - D) A fresh summary of all documents on every call
   <details><summary>Answer</summary>B) Short stable handles plus a tool to read content on demand - the model reads only what the task actually requires.</details>

3. Your agent edits a document, then reasons about a version it read three turns ago. Which discipline fixes this?
   - A) Increase the context window
   - B) Cache the old version for reuse
   - C) Require re-fetching content each turn and tell the model it does not retain content between turns
   - D) Embed every version in the prompt
   <details><summary>Answer</summary>C) Require re-fetching content each turn and tell the model it does not retain content between turns - fresh-every-turn beats remembered-and-wrong for mutable data.</details>

4. A conversation has grown past the token budget, but you want to bound tokens while preserving the gist. Which strategy fits?
   - A) Send the full history on every call
   - B) Summarise older turns and prepend them, keeping recent turns verbatim
   - C) Drop the system prompt
   - D) Stop responding
   <details><summary>Answer</summary>B) Summarise older turns and prepend them, keeping recent turns verbatim - this compresses the gist while bounding tokens.</details>

5. Why does the chapter discourage "give the model everything just in case"?
   - A) It is always cheaper
   - B) It improves quality by adding detail
   - C) It costs more, is slower, and can degrade quality through the lost-in-the-middle effect
   - D) Providers forbid large prompts
   <details><summary>Answer</summary>C) It costs more, is slower, and can degrade quality through the lost-in-the-middle effect - important details get diluted among irrelevant ones.</details>

**More Questions**

6. What is the "prior-turn memory" technique the chapter describes?
   - A) Re-sending the full previous turn verbatim
   - B) Summarising each turn's actions into a short note and injecting it into the next call
   - C) Storing turns in a vector database and always retrieving the top ten
   - D) Asking the model to restate what it did at the start of every reply
   <details><summary>Answer</summary>B) Summarising each turn's actions into a short note and injecting it into the next call - for example "generated draft.docx → doc-1; read source.docx → doc-0". A tiny amount of context for a large coherence gain, so the model knows its handles and won't redo work.</details>

7. Of the five context layers, which one does the chapter say should be loaded on demand rather than baked into the system prompt?
   - A) Standing instructions
   - B) Task instructions
   - C) The current user message
   - D) History
   <details><summary>Answer</summary>B) Task instructions - loading a selected workflow or template on demand keeps the system prompt about universal behaviour, and task-specific detail arrives only when relevant.</details>

8. The user attaches contract.pdf to their message. What high-impact detail does the chapter recommend?
   - A) Paste the document's full text into the message
   - B) Annotate the message with the handle, e.g. "the user attached: doc-2 (contract.pdf)"
   - C) Ask the model which document the user probably means
   - D) Rename the file to something the model will recognise
   <details><summary>Answer</summary>B) Annotate the message with the handle - hand the model the same handle it would use to act on the file, so "the contract the user just mentioned" resolves to doc-2 directly instead of being guessed at.</details>

9. A conversation has run for months and you want only the past turns relevant to the current message. Which strategy is that, and what is the trade-off?
   - A) Recent-window; simple but may miss older relevant turns
   - B) Selective recall via semantic search over history; more complex, useful for very long-lived conversations
   - C) Summarise-and-prepend; lossy but cheap
   - D) Full history; accurate but expensive
   <details><summary>Answer</summary>B) Selective recall - store all history in the database and retrieve only the turns relevant to the current message. The chapter ranks it below recent-window and summarise-and-prepend in preference because of the added complexity.</details>

10. A user has accumulated hundreds of saved templates and generated documents. How should that memory reach the model?
    - A) Concatenated into the system prompt so nothing is missed
    - B) As durable state you selectively surface - saved templates appear as available tools/workflows, documents as referenceable handles
    - C) Re-embedded in full on every call to guarantee freshness
    - D) Discarded at the end of each conversation
    <details><summary>Answer</summary>B) As durable state you selectively surface - memory beyond the conversation lives in your data model and is loaded into context only when relevant, never as an ever-growing prompt.</details>

**Coding Challenge**

**Build a recent-window context within a token budget**

Write `build_context(system_prompt, history, budget)` that always keeps the system prompt and then adds the most recent turns (newest first) until the next turn would exceed the budget. Return the kept turns in chronological order. Use a simple word count as the token estimate.

<details>
<summary>Python Solution</summary>

```python
def build_context(system_prompt, history, budget):
    """Keep the system prompt plus the most recent turns within a token budget."""
    tokens = lambda s: len(s.split())
    used, kept = tokens(system_prompt), []
    for turn in reversed(history):             # newest first
        if used + tokens(turn) > budget:
            break
        kept.append(turn)
        used += tokens(turn)
    return [system_prompt] + list(reversed(kept))   # restore chronological order


history = ["turn one", "turn two", "turn three", "turn four"]
print(build_context("system", history, budget=5))
# ['system', 'turn three', 'turn four']
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function buildContext(systemPrompt, history, budget) {
  const tokens = (s) => s.split(/\s+/).length;
  const kept = [];
  let used = tokens(systemPrompt);
  for (let i = history.length - 1; i >= 0; i--) {  // newest first
    if (used + tokens(history[i]) > budget) break;
    kept.unshift(history[i]);                       // restore chronological order
    used += tokens(history[i]);
  }
  return [systemPrompt, ...kept];
}

const history = ["turn one", "turn two", "turn three", "turn four"];
console.log(buildContext("system", history, 5));
// ['system', 'turn three', 'turn four']
```

</details>

**Think About It**

1. Context windows keep getting bigger, which should make context engineering less important every year. Why does filling that window often make your agent measurably dumber?
   <details><summary>Show answer</summary>Because attention is a finite resource even when the window isn't. The instinct to give the model everything just in case fails on three counts at once: every token costs money, every token costs latency, and - the counterintuitive one - important details get diluted among irrelevant ones, the "lost in the middle" effect. So a bigger window doesn't remove the problem, it just raises the ceiling on how badly you can shoot yourself in the foot. The reframing that helps is to treat the window as a budget to allocate rather than a bucket to fill, and to curate ruthlessly regardless of how much room you technically have.</details>

2. A well-designed agent may read the same document again on every single turn. That looks like textbook waste. Why is it the right call?
   <details><summary>Show answer</summary>Because the alternative is being confidently wrong. If the model is allowed to "remember" content it read a few turns ago, and that content has since been edited - possibly by the agent itself - it will reason carefully about a version that no longer exists. The discipline is to require a re-fetch each turn the content is needed, and to tell the model explicitly that it does not retain content between turns, reinforcing that rule in both the system prompt and the tool descriptions. Yes, you pay for the re-read. For anything where correctness matters, and especially for data that can change, fresh-every-turn beats remembered-and-wrong.</details>

3. Handing the model a meaningless label like "doc-1" instead of the document's actual text sounds like giving it less to work with. Why does it usually make the agent more accurate?
   <details><summary>Show answer</summary>Three reasons stack up. Prompts get smaller, because you pay for content only when it's actually used rather than pasting five documents in on the chance one matters. Grounding gets forced: the model has to explicitly fetch the text, which makes it engage with the real words instead of a half-remembered impression from training data. And freshness comes free, because a reference always resolves to the current version. The handles should be short, stable, and assigned deterministically - which has a nice side effect: the model can only reference things that actually exist.</details>

4. Teams spend enormous energy on model choice and prompt wording. The chapter says the biggest quality wins come from somewhere else entirely. Where, and why does that work go unnoticed?
   <details><summary>Show answer</summary>The wins come from context engineering: short stable handles, sweeping the right artifacts into reach, injecting a prior-turn summary, distilling tool outputs instead of dumping them, forcing fresh reads of mutable data. It goes unnoticed because none of it is glamorous - there's no announcement in "we now cap long API fields and add a one-line summary of what happened last turn," and it doesn't look like intelligence. But it's the difference between an agent that feels sharp and one that feels scattered, because the model can only reason about what's in its context window; everything else may as well not exist. That's where the "it just works" feeling actually comes from.</details>

---

Next: [Chapter 6: Prompt architecture](chapter-06-prompt-architecture.md)
