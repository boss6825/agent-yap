# Chapter 4: How Memory Fails

Memory makes agents more capable, but it also introduces a whole new class of bugs that do not exist in stateless systems. This chapter catalogs them, drawing on the failure modes in the "Practical Guide" and the more formal taxonomy in the SSGM paper. Almost all of these are failures of the manage phase from Chapter 1: things go wrong not when memory is written or read, but in how it is maintained over time.

A theme to hold onto: in a stateless system, a mistake affects one response and then disappears. In a system with evolving memory, a mistake can be stored, reinforced, and acted on for a long time. The SSGM paper puts it crisply: unlike static [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation), where an error is isolated to a single retrieval, errors in evolving memory are cumulative and persistent.

## A map of the failure modes

The SSGM paper organizes memory failures into four dimensions, which is a clean way to hold the whole landscape in mind:

- Stability failures: the knowledge slowly deviates from the truth (drift).
- Validity failures: the stored content is wrong or out of date (hallucination, obsolescence).
- Efficiency failures: the memory becomes too big or too slow.
- Safety failures: the memory is attacked or leaks (poisoning, privacy).

The "Practical Guide" groups its examples slightly differently (context-resident, retrieval, knowledge-integrity, and environmental), but the underlying failures line up. The sections below walk through them by theme.

## Drift: knowledge slowly deviating from the truth

[Semantic drift](../glossary/Glossary.md#semantic-drift) is the headline failure of evolving memory, and both sources describe it. It is caused by lossy compression, especially repeated [summarization](../glossary/Glossary.md#summarization-lossy-compression). Each time information is re-encoded (raw text to summary to higher-level reflection), nuance is stripped away, and over many rounds the memory gradually distorts.

The SSGM paper gives a memorable concrete example: a mild user preference, "I like mild spicy food," gets rewritten over time to "likes spicy food," then "loves very spicy food," until the agent commits a real violation by recommending ghost pepper wings. The drift was slow and each step looked reasonable, which is exactly why it is dangerous.

The "Practical Guide" calls this summarization drift and adds a practical defense: keep raw memories linked to their summarized versions, so you can always reconcile against what actually happened. The SSGM paper formalizes the same defense as anchoring against an immutable ledger, which Chapter 5 covers.

The paper notes two cousins of semantic drift:

- Procedural drift: the agent reinforces a suboptimal or outdated workflow. For example, it "learns" a convoluted workaround for a simple API call and rigidifies it, blocking future improvement.
- Goal drift: the agent's behavior slowly shifts away from its original instructions because of accumulated biases in its memory.

The "Practical Guide" describes the closely related attention dilution: even when you can fit everything in context (as with very large windows), large prompts "lose" information in the middle, so the agent has the memories but cannot focus on the right parts. This is the same "lost in the middle" effect from Chapter 2.

## Retrieval failures: getting the wrong memories back

The "Practical Guide" details several ways the read phase goes wrong:

- Semantic versus causal mismatch. Similarity search returns memories that look related but are not. [Embeddings](../glossary/Glossary.md#embedding) are good at "this text looks like that text" but bad at "this is the cause of that." The author sees this when debugging through coding assistants: they spot a similar-looking error and miss the real underlying cause, leading to thrashing, many changes that never fix the actual problem.
- Memory blindness. In tiered systems, an important fact never resurfaces. The data exists, but the agent never sees it again, perhaps because a sliding window moved past it, or because the system retrieves only the top 10 memories and the one it needed was the 11th.
- Silent orchestration failures. The author calls these the most dangerous. The paging, eviction, or archival logic does the wrong thing, but no error is thrown. The only symptom is that responses slowly get worse, more generic, and less grounded. His real example: his system silently failed to write daily memory files, so the daily summaries had nothing to work from, and he only noticed because the agent kept forgetting recent work.

## Validity failures: wrong or outdated facts

The SSGM paper separates two validity problems that are easy to confuse:

- Memory hallucination: the agent stores a fabricated fact as if it were true. Because it is now in memory, it gets retrieved and acted on later.
- Temporal obsolescence ([staleness](../glossary/Glossary.md#staleness-temporal-obsolescence)): the stored fact was correct once but the world has changed. This is not a hallucination; it is just old.

The "Practical Guide" calls staleness probably the most common failure. The outside world changes (addresses, device states, user preferences) but the stored memory does not. Long-lived agents will happily act on data from 2024 in 2026. The classic symptom is an agent insisting on an outdated fact about the current date or who holds an office.

## Self-reinforcing errors and over-generalization

Two subtler integrity failures from the "Practical Guide" deserve their own mention, because they are where memory turns actively harmful:

- Self-reinforcing errors (confirmation loops). The system treats a memory as ground truth, but that memory is wrong, and then it interprets everything through that wrong belief. The author's real example is striking: his system decided a smart-home integration was faulty, so it ignored all data from those devices as erroneous, when in reality there were just a few dead batteries. The agent built a wrong belief and then defended it.
- Over-generalization. The agent learns a lesson in a narrow context and then applies it everywhere. A workaround for one customer, or a fix for one specific error, becomes a default pattern applied where it does not belong.

## Environmental failure: contradiction handling

The "Practical Guide" describes contradiction as especially frustrating. When new information conflicts with existing memory, the system cannot always tell which is actually true. The author's example: he asked his system to create some workflows; they were created correctly, but the action timed out, so the agent concluded it had failed. Even after he verified the workflows existed and told the agent to remember that, the agent oscillated for several interactions between believing the workflows existed and believing they had failed. The agent could not stably resolve the contradiction.

## Safety failures: poisoning and privacy

The SSGM paper adds the safety dimension, which the practitioner article touches less:

- [Memory poisoning](../glossary/Glossary.md#memory-poisoning-and-prompt-injection): malicious instructions get injected into storage and the agent later treats them as legitimate knowledge. Because memory persists, one poisoned entry can corrupt behavior for a long time.
- Privacy leakage: in multi-user or multi-agent settings, an agent retrieves memories it should not, leaking sensitive data across sessions or users. The paper cites a striking finding from related work ("Topology Matters"): the network structure of a multi-agent system itself governs how much leaks, and fully connected memory networks maximize the vulnerability.

## The design tensions underneath

The "Practical Guide" frames why these failures are hard to eliminate: they come from genuine tradeoffs that pull against each other.

- Utility versus efficiency: better memory usually means more tokens, latency, storage, and systems.
- Utility versus adaptivity: memory useful now will be stale later, and updating is expensive and risky.
- Adaptivity versus faithfulness: the more you update, revise, and compress, the more you risk distorting what actually happened.
- Faithfulness versus governance: accurate memory may contain sensitive data you are legally required to delete or protect.

You cannot maximize all of these at once. Every memory system is a particular compromise among them, which is exactly why Chapter 5's governance framework exists: to make those compromises deliberate and safe rather than accidental.

## Key takeaways

- Memory failures are mostly manage-phase failures, and unlike stateless errors, they persist and compound.
- Drift (semantic, procedural, goal) comes from repeated lossy summarization; the defense is keeping raw records to reconcile against.
- Retrieval fails through semantic-versus-causal mismatch, memory blindness (the fact never resurfaces), and silent orchestration failures (no error, just slow decay).
- Validity fails through hallucinated facts and through staleness (correct once, now outdated); staleness is the most common.
- Self-reinforcing errors and over-generalization are where wrong memories become actively harmful.
- Safety failures include memory poisoning and cross-user privacy leakage; multi-agent topology affects how much leaks.
- These failures stem from real tensions (utility, efficiency, adaptivity, faithfulness, governance) that cannot all be maximized at once.

Continue to Chapter 5 for a framework that governs evolving memory to contain these failures.

---

## Review

### Quick Check

1. How do memory errors differ from errors in a stateless system?
   * A) They are identical
   * B) Stateless errors persist while memory errors vanish
   * C) In evolving memory, errors are cumulative and persistent rather than isolated to one response
   * D) Memory errors only affect retrieval speed
   <details><summary>Answer</summary>C) They compound - unlike static RAG where an error is isolated to a single retrieval, evolving-memory errors are stored, reinforced, and acted on over time.</details>

2. Semantic drift is primarily caused by:
   * A) Network latency
   * B) Repeated lossy summarization that strips nuance over many re-encodings
   * C) Using too small a model
   * D) Storing raw records
   <details><summary>Answer</summary>B) Repeated lossy summarization - each re-encoding strips nuance, as in "mild spicy" drifting to "loves very spicy" over time.</details>

3. An agent decided a smart-home integration was faulty and then ignored all its data, when really a few batteries were dead. Which failure mode is this?
   * A) Staleness
   * B) Memory blindness
   * C) Privacy leakage
   * D) A self-reinforcing error (confirmation loop)
   <details><summary>Answer</summary>D) A self-reinforcing error - the agent built a wrong belief and then interpreted everything through it.</details>

4. A long-lived agent keeps acting on a user's address from two years ago. Which failure is this, and is it a hallucination?
   * A) Temporal obsolescence (staleness); not a hallucination, since the fact was once correct
   * B) Memory poisoning; yes, it is a hallucination
   * C) Semantic-versus-causal mismatch; not a hallucination
   * D) Over-generalization; yes, it is a hallucination
   <details><summary>Answer</summary>A) Staleness - the fact was correct once but the world changed; it is not a fabricated fact, just an old one.</details>

5. The chapter calls one retrieval failure "the most dangerous." Which is it, and why?
   * A) Semantic-versus-causal mismatch, because it is loud and obvious
   * B) Memory blindness, because it throws an error
   * C) Silent orchestration failures, because no error is thrown and responses just slowly decay
   * D) Staleness, because it is rare
   <details><summary>Answer</summary>C) Silent orchestration failures - the paging or eviction logic misfires with no error, and the only symptom is responses slowly getting worse.</details>
