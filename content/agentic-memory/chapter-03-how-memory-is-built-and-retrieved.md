# Chapter 3: How Memory Is Built and Retrieved

Chapter 1 gave the write-manage-read loop; Chapter 2 gave the types of memory. This chapter gets concrete about the mechanisms that implement those phases: how a memory gets created, how the system keeps it coherent, and how the right memory gets pulled back at the right moment. It draws on all four practitioner articles in this folder.

## Five families of memory mechanisms

The "Practical Guide" lays out five families of mechanisms. You can think of these as five different engineering strategies for the write and manage phases, each with its own strengths and its own way of failing.

### Context-resident compression

These are the "stay in context" strategies: sliding windows, rolling summaries, and hierarchical compression. The idea is to keep memory inside the [context window](../glossary/Glossary.md#context-window) by repeatedly shrinking it. The author warns that rolling summaries feel clean but are not, because each round of [summarization](../glossary/Glossary.md#summarization-lossy-compression) throws away detail (the drift problem in Chapter 4). The honest practical note: when a coding assistant compresses a conversation that has grown too large, you are often better off starting a new thread than trusting the compression.

### Retrieval-augmented stores

This is [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation) applied to the agent's own interaction history rather than to static documents. Past observations are turned into [embeddings](../glossary/Glossary.md#embedding) and retrieved by similarity. It is powerful for long-running agents with deep history, but retrieval quality becomes the bottleneck fast. If the embeddings do not capture intent well, you miss relevant memories and surface stale ones. A telling example: questions like "what happened last Monday" tend to retrieve poor results, because similarity search is bad at time-based queries.

### Reflective self-improvement

Here the agent writes verbal post-mortems and stores the conclusions to do better next time. [Reflexion](../glossary/Glossary.md#reflection-and-reflexion) and ExpeL are the named examples, and the author groups "dream"-based reflection systems here too. The idea is compelling (agents learn from mistakes), but the failure mode is severe, which Chapter 4 covers: a wrong lesson, once stored, can be reinforced.

### Hierarchical virtual context

This is the operating-system-inspired approach, exemplified by MemGPT. The main context window acts like RAM, a recall database acts like disk, and archival storage acts like cold storage, with the agent managing its own paging between tiers. The author's blunt verdict: the overhead of maintaining these separate tiers is burdensome and tends to fail, and despite the idea being around for years, he has not seen it used in production.

### Policy-learned management

This is the frontier approach: train the agent, using [reinforcement learning](../glossary/Glossary.md#reinforcement-learning-rl-ppo-grpo), to decide when to store, retrieve, update, summarize, or discard memories. The author sees promise here but notes there are not yet practical, ready-made tools for builders, nor much real production use. The SSGM paper in Chapter 5 discusses this same direction in more formal detail.

The meta-lesson across the five families: there is no single best mechanism. Each trades off differently, and the article's guidance is to choose based on your actual need rather than reaching for the most sophisticated option.

## How memories get written: extraction, not raw logging

The "Building Long-Term Memory" article is the clearest on the write phase, and its central point is that you should not store raw conversation. Raw logs are too verbose to retrieve efficiently. Instead, each interaction is distilled before storage, in three different ways for three different memory types.

Structured summarization (for episodic memory). Each interaction is reduced to a structured summary with fields like intent (what was the user trying to do), execution (what actions were taken, which tools used), and outcome (did it succeed, what was the result). This structure is what makes memories searchable later: you can find all past interactions about "email campaigns" without scanning thousands of raw messages.

Preference extraction (for procedural-style memory). Learning preferences works differently. Instead of storing every interaction, the system maintains a living document of learned behaviors. When a user gives feedback, whether explicit ("I prefer shorter responses") or implicit (consistently editing the agent's output a certain way), this document updates. The key insight is that preferences should be regenerated, not just appended: each new interaction is a chance to refine the understanding, not merely add to a growing list. Preferences can be modified or removed, not just accumulated.

Fact extraction (for semantic memory). The system pulls durable facts from conversation, distinguishing them from transient context. "We're a 50-person company" is worth keeping; "I'm having a busy week" is not. Many systems stage extracted facts for review before promoting them to permanent semantic memory, adding a check for accuracy.

## How a production pipeline does write and manage: AgentCore

The AWS "AgentCore" article shows these phases in a real managed service, and it is the best concrete example of the often-neglected manage phase actually being done well.

Extraction. When new events arrive, an asynchronous process uses LLMs to analyze the conversation and pull out meaningful information into a predefined schema, according to whichever memory strategies you configured (semantic, preference, summary). A nice detail: it distinguishes meaningful content from chatter. "I'm vegetarian" should be remembered; "hmm, let me think" should not. Multiple memories can be extracted from one event, and the strategies run in parallel.

Consolidation. This is the heart of the manage phase, and it is [memory consolidation](../glossary/Glossary.md#memory-consolidation) done explicitly. Rather than blindly appending each new memory, the system:

1. Retrieves the most semantically similar existing memories from the same [namespace](../glossary/Glossary.md#stateful-and-stateless) and strategy.
2. Sends the new memory plus those existing ones to an LLM with a consolidation prompt, which decides on an action: ADD (the information is new), UPDATE (it complements or updates an existing memory), or NO-OP (it is redundant). The prompt is designed so that "loves pizza" and "likes pizza" are treated as the same and do not trigger a needless update.
3. Applies the action while keeping an immutable audit trail: outdated memories are marked INVALID rather than instantly deleted.

The article gives clear examples of the hard cases this handles. Related facts mentioned at different times ("allergic to shellfish" in January, "can't eat shrimp" in March) get recognized as related and merged without creating duplicates or contradictions. Conflicting information is resolved by prioritizing recency while preserving history: if a budget changes from 500 to 750, the new value becomes active and the old one is marked inactive rather than erased. Out-of-order events are handled through careful timestamp tracking. And if consolidation fails for one memory, it does not break the others; the system retries with exponential backoff, and if it ultimately fails, it still stores the memory to avoid losing information.

There is a useful performance result here too. AgentCore was benchmarked against a [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation) baseline that kept the full conversation history. The RAG baseline scored well on factual recall (because it had everything) but poorly on inferring preferences. The memory system gave up a little factual accuracy in exchange for very high compression rates (89 to 95 percent), which means bounded context size, faster inference, and lower cost at scale, and it clearly won on preference inference. The lesson: for tasks that need inference rather than verbatim recall, distilled memory beats raw history, and it scales far better.

## How memories get read: retrieval is more than similarity

The "Building Long-Term Memory" article makes the strongest case that naive retrieval is not enough. The obvious approach is pure [semantic search](../glossary/Glossary.md#semantic-search): embed the query, find the closest memories, return the top matches. This works for simple cases but misses important dimensions for agents:

- Recency: a memory from yesterday is often more relevant than one from six months ago, even if the older one is semantically closer.
- Context match: memories from the same project or workflow should be weighted higher than unrelated ones.
- Outcome quality: memories of successful interactions are usually more useful than failures (unless you are specifically trying to avoid repeating a mistake).

The recommended answer is multi-factor relevance scoring: combine semantic similarity, temporal relevance (with decay for older memories), context alignment, and success weighting into one composite score, with weights tuned to the use case. On top of that, good systems apply diversity and deduplication: remove near-duplicates, avoid returning ten memories from the same day, and cluster similar memories to return representatives. This gives the agent a broad, useful view instead of repetitive noise.

Finally, retrieved memories must be put back into the loop efficiently. Because the context window is limited, the system retrieves only the top relevant subset, summarizes older context to save tokens, and prioritizes recent high-relevance memories. Once injected, these memories act as [grounding](../glossary/Glossary.md#grounding): the agent answers based on what it knows about this user and this project, which reduces [hallucination](../glossary/Glossary.md#hallucination) and improves consistency.

## The agent loop and context tools: the Claude Agent SDK

The "Building agents with the Claude Agent SDK" article approaches memory from a different angle: the overall agent loop and the tools that support it. Its core design principle is "give the agent a computer." By giving the model the same tools a programmer uses (run bash commands, read, write, edit, and search files), it can handle a huge range of work, and the filesystem itself becomes a form of memory and context engineering.

Several features it describes are directly part of the memory picture:

- Agentic search and the filesystem. The file and folder structure becomes context the agent can pull from. When the agent hits a large file, it uses tools like `grep` and `tail` to load only the relevant parts. The article stores past conversations in a folder so the agent can search them, which is episodic memory backed by the filesystem. This is [agentic search](../glossary/Glossary.md#agentic-search).
- Semantic search, used sparingly. The SDK supports [semantic search](../glossary/Glossary.md#semantic-search) (chunk, embed, query by vector) but recommends starting with agentic search and only adding semantic search if you need faster results, because semantic search is less accurate, harder to maintain, and less transparent.
- Subagents. A [sub-agent](../glossary/Glossary.md#sub-agent) runs in its own isolated context window and returns only the relevant result, which both enables parallelism and protects the main agent's context from being clogged by intermediate work. This is the read and manage phases working together.
- Compaction. When an agent runs a long time, the SDK's compact feature automatically summarizes earlier messages as the context limit approaches, so the agent does not run out of room. This is the manage phase built into the harness.

The article also describes the loop these tools serve: gather context, take action, verify work, repeat. The verification step (rules-based checks, visual feedback, or an [LLM-as-a-judge](../glossary/Glossary.md#llm-as-a-judge)) is what keeps errors from compounding, which matters for memory because an unverified bad result can become a bad memory.

## Practical takeaways for builders

The "Practical Guide" ends with builder advice that doubles as a summary of this chapter:

- Start with explicit temporal scopes; build the memory type you need, when you need it.
- Take the manage step seriously; plan for compression, consolidation, and updates rather than accumulating forever.
- Keep raw episodic records; do not rely only on summaries, which can drift. Raw records let you go back to what actually happened.
- Version reflective memory; add timestamps or versions to summaries and long-term memories so the agent can tell what is current.
- Treat procedural memory as code; keep persona and behavior files under source control, especially if the agent can change them based on feedback.

## Key takeaways

- There are five mechanism families (context-resident compression, retrieval stores, reflective self-improvement, hierarchical virtual context, policy-learned management), each with different tradeoffs and no single winner.
- Write by extraction, not raw logging: structured summaries for episodes, regenerated documents for preferences, staged facts for semantics.
- Consolidation (ADD, UPDATE, NO-OP, with recency-based conflict resolution and an audit trail) is how a real system keeps memory coherent; AgentCore is the worked example.
- Distilled memory trades a little factual recall for huge compression and far better preference inference than raw-history RAG.
- Retrieval needs multi-factor scoring (similarity plus recency, context, and success) plus diversity filtering, not just similarity.
- The filesystem plus agentic search, subagents, and compaction give a simple, practical memory and context system, as in the Claude Agent SDK.

Continue to Chapter 4 for how all of this fails.

---

## Review

### Quick Check

1. The recommended way to write memories is:
   * A) Store raw conversation logs verbatim
   * B) Extraction - distill each interaction into structured summaries, regenerated preferences, and staged facts
   * C) Embed every token of every message
   * D) Only store the final answer
   <details><summary>Answer</summary>B) Extraction, not raw logging - raw logs are too verbose to retrieve efficiently, so each interaction is distilled before storage.</details>

2. In AgentCore consolidation, the three actions an LLM can decide are:
   * A) READ, WRITE, DELETE
   * B) KEEP, DROP, MERGE
   * C) ADD, UPDATE, NO-OP
   * D) STORE, INDEX, RETRIEVE
   <details><summary>Answer</summary>C) ADD (new), UPDATE (complements existing), NO-OP (redundant) - applied with an immutable audit trail that marks outdated memories INVALID.</details>

3. A user asks "what happened last Monday." Pure semantic similarity search returns poor results. What does the chapter recommend?
   * A) Increase the embedding dimension
   * B) Store more raw logs
   * C) Use a bigger model
   * D) Multi-factor relevance scoring that adds temporal relevance, context match, and success weighting to similarity
   <details><summary>Answer</summary>D) Multi-factor relevance scoring - similarity search alone is bad at time-based queries, so combine it with recency, context, and success.</details>

4. You want a simple, transparent memory and context system before reaching for embeddings. The Claude Agent SDK recommends:
   * A) Start with agentic search (filesystem plus grep/tail), adding semantic search only if you need faster results
   * B) Always start with semantic search
   * C) Keep the entire history in context
   * D) Disable subagents
   <details><summary>Answer</summary>A) Start with agentic search - semantic search is less accurate, harder to maintain, and less transparent, so add it only when needed.</details>

5. The AgentCore benchmark against a full-history RAG baseline showed:
   * A) RAG won on everything, so distilled memory is pointless
   * B) Distilled memory won on factual recall but lost on preferences
   * C) RAG scored higher on factual recall, but distilled memory won on preference inference with 89 to 95 percent compression
   * D) The two were identical on every metric
   <details><summary>Answer</summary>C) RAG had better verbatim recall, but distilled memory won on preference inference and compressed far better - for inference tasks, distilled memory scales better.</details>

### Coding Challenge

**Score memories with multi-factor relevance**

Write `score(memory, query_ctx, weights)` that combines semantic similarity, recency (decaying with age), context match, and success into one composite score, plus `top_k` that returns the best matches. Show recency and context lifting a less-similar but more relevant memory above an old, similar one.

<details>
<summary>Python Solution</summary>

```python
def score(memory, query_ctx, weights):
    """Composite relevance: similarity + recency + context match + success."""
    return (
        weights["sim"] * memory["similarity"]
        + weights["recency"] * (1.0 / (1 + memory["age_days"]))      # decay with age
        + weights["context"] * (1.0 if memory["context"] == query_ctx else 0.0)
        + weights["success"] * (1.0 if memory["success"] else 0.0)
    )


def top_k(memories, query_ctx, weights, k=2):
    ranked = sorted(memories, key=lambda m: score(m, query_ctx, weights), reverse=True)
    return [m["text"] for m in ranked[:k]]


weights = {"sim": 0.5, "recency": 0.3, "context": 0.1, "success": 0.1}
memories = [
    {"text": "old similar", "similarity": 0.9, "age_days": 180, "context": "x", "success": True},
    {"text": "recent same ctx", "similarity": 0.7, "age_days": 1, "context": "proj", "success": True},
]
print(top_k(memories, "proj", weights))   # ['recent same ctx', 'old similar']
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function score(memory, queryCtx, weights) {
  return (
    weights.sim * memory.similarity +
    weights.recency * (1 / (1 + memory.ageDays)) +        // decay with age
    weights.context * (memory.context === queryCtx ? 1 : 0) +
    weights.success * (memory.success ? 1 : 0)
  );
}

function topK(memories, queryCtx, weights, k = 2) {
  return [...memories]
    .sort((a, b) => score(b, queryCtx, weights) - score(a, queryCtx, weights))
    .slice(0, k)
    .map((m) => m.text);
}

const weights = { sim: 0.5, recency: 0.3, context: 0.1, success: 0.1 };
const memories = [
  { text: "old similar", similarity: 0.9, ageDays: 180, context: "x", success: true },
  { text: "recent same ctx", similarity: 0.7, ageDays: 1, context: "proj", success: true },
];
console.log(topK(memories, "proj", weights)); // ['recent same ctx', 'old similar']
```

</details>
