# Chapter 2: How Context Goes Wrong: Rot, Pollution, and Confusion

Before you can manage context well, you need to know exactly how it breaks. "Context Engineering for AI Agents: Part 2" introduces a small vocabulary of failure modes. Learning these names is useful, because once you can name a problem you can choose the right fix for it. This chapter walks through each one.

## A quick word on the agent harness

Two of the articles use the term [agent harness](../glossary/Glossary.md#agent-harness), so it is worth pinning down. The harness is the software that wraps the model. The model does the reasoning and produces a [tool call](../glossary/Glossary.md#tool-calling-function-calling) (a structured request to run some action). The harness is the code that actually executes that action, feeds the result back, manages the message history, and applies all the context engineering logic. When the articles talk about "managing context," they mean work the harness does, not something the model does on its own.

## Context rot: the most important failure to understand

[Context rot](../glossary/Glossary.md#context-rot) is the phenomenon where a model's performance degrades as the context window fills up, even when the total [token](../glossary/Glossary.md#token) count is well within the technical limit.

This is a subtle and counterintuitive point, so it is worth slowing down. A model might be advertised as supporting a 1 million token [context window](../glossary/Glossary.md#context-window). You might reasonably assume that as long as you stay under 1 million tokens, the model performs at full strength. The articles say this is false. The "effective context window," the region where the model actually reasons well, is often far smaller, frequently under 256,000 tokens for current models. Past that, quality quietly drops even though no error is thrown.

The article points to outside evidence for this. Chroma published a study on context rot, and Anthropic has explained that a growing context depletes the model's "attention budget." A helpful way to picture it: attention is a limited resource that gets spread across everything in the window. The more you cram in, the thinner that attention is spread, and the easier it becomes for the model to miss the part that actually mattered.

The practical consequence is a rule the article calls the "Pre-Rot Threshold." Do not wait for the API to throw an error at the hard limit. Instead, monitor your token count and start cleaning up the context well before the rot zone, for example by triggering compaction or summarization at a chosen threshold. The cleanup techniques are covered in Chapter 3.

## Context pollution: clutter that distracts

[Context pollution](../glossary/Glossary.md#context-pollution) is the presence of too much irrelevant, redundant, or conflicting information inside the context. Where context rot is about sheer volume, pollution is about quality. Even a context that is not enormous can be polluted if it is full of stale tool results, near-duplicate snippets, or details that have nothing to do with the current step.

The danger is that pollution actively pulls the model's reasoning off course. The model treats everything in its window as potentially relevant, so noise can drown the signal. This idea returns in the multi-agent discussion: when several sub-agents all dump their full context into a shared space, you get pollution at scale, plus a large [KV cache](../glossary/Glossary.md#kv-cache-key-value-cache) cost.

## Context confusion: contradictory or indistinguishable instructions

[Context confusion](../glossary/Glossary.md#context-confusion) is the failure mode where the model cannot tell apart instructions, data, and structural markers, or where it is handed directives that contradict each other.

The article notes this frequently happens with the system instructions themselves. If the global rules clash internally, or if there are too many similar-sounding instructions, or if the system rules conflict with what the user just asked, the model gets confused about which directive to follow. A common real-world trigger, discussed more in Chapter 4, is giving the model too many tools: with 100 or more tools available, the model starts hallucinating tool parameters or calling the wrong tool entirely. That is context confusion caused by an overloaded toolset.

## How these three relate

It helps to see these as three different diseases with three different cures:

- Context rot is a volume problem. The window is too full. The cure is reduction (compaction and summarization).
- Context pollution is a relevance problem. The window holds the wrong things. The cure is being selective about what enters and isolating work into separate contexts.
- Context confusion is a clarity problem. The instructions or tools clash. The cure is fewer, clearer tools and non-conflicting instructions.

The reason the articles bother to separate these is that the wrong cure does not help. Summarizing your history (a fix for rot) does nothing for a toolset that is too large (a confusion problem). Naming the failure points you at the right move.

## The deeper principle

There is a quiet theme running under all three failure modes. More context is not better. The instinct of many builders is to give the model as much as possible "just in case." These failure modes show why that instinct backfires: extra context dilutes attention (rot), introduces noise (pollution), and creates contradictions (confusion). The last article in this folder states the conclusion directly: context engineering "is not about adding more context. It is about finding the minimal effective context required for the next step."

## Key takeaways

- The harness, not the model, is where context management happens.
- Context rot: quality drops as the window fills, well before the technical token limit. Monitor tokens and clean up early.
- Context pollution: irrelevant or conflicting content distracts the model even when the window is not full.
- Context confusion: clashing instructions or too many tools make the model pick the wrong action.
- Each failure has a different cure, which is why naming them matters.
- The overarching lesson: aim for the minimal effective context, not the maximum.

Continue to Chapter 3 for the techniques that fix these problems.

## Review

**Quick Check**

1. Context rot is best defined as:
   - A) An error the API throws once you exceed the context window limit
   - B) Performance degrading as the window fills up, even well within the technical token limit
   - C) Model weights decaying over time as a model ages
   - D) Conflicting instructions inside the system prompt
   <details><summary>Answer</summary>B) Performance degrading as the window fills, even when the total token count is well within the technical limit - quality drops quietly and no error is thrown.</details>

2. A model advertises a 1 million token context window. What does the chapter say about the region where it actually reasons well?
   - A) The full 1 million tokens, as advertised
   - B) Roughly half, around 500,000 tokens
   - C) Often far smaller, frequently under 256,000 tokens for current models
   - D) It varies randomly and cannot be estimated
   <details><summary>Answer</summary>C) Often far smaller, frequently under 256,000 tokens - the "effective context window" is much narrower than the advertised one.</details>

3. Your agent has 100+ tools bound to it and starts hallucinating tool parameters and calling the wrong tool. Which failure mode is this?
   - A) Context rot
   - B) Context pollution
   - C) Context confusion
   - D) KV cache invalidation
   <details><summary>Answer</summary>C) Context confusion - an overloaded toolset means the model cannot cleanly distinguish between similar options, so it picks wrong or invents parameters.</details>

4. What does the "Pre-Rot Threshold" rule tell you to do?
   - A) Wait for the API to error at the hard limit, then truncate
   - B) Monitor your token count and start cleaning up well before the rot zone
   - C) Always summarize after every single tool call
   - D) Choose the model with the largest advertised window
   <details><summary>Answer</summary>B) Monitor your token count and clean up early - trigger compaction or summarization at a chosen threshold rather than waiting for the hard limit.</details>

5. According to the chapter's disease-and-cure mapping, the cure for context pollution is:
   - A) Reduction through compaction and summarization
   - B) Fewer, clearer tools and non-conflicting instructions
   - C) Being selective about what enters, and isolating work into separate contexts
   - D) Switching to a model with a larger window
   <details><summary>Answer</summary>C) Being selective about what enters and isolating work into separate contexts - pollution is a relevance problem, so the cure is about what gets in, not how much.</details>

**More Questions**

6. Where does context management actually happen?
   - A) Inside the model, which prunes its own window
   - B) In the agent harness: the code that executes tool calls, feeds results back, and manages message history
   - C) At the API gateway, automatically
   - D) In the vector database
   <details><summary>Answer</summary>B) In the agent harness - the model reasons and emits tool calls; the harness executes them, manages history, and applies all context engineering logic. Managing context is harness work, not something the model does on its own.</details>

7. What outside evidence does the chapter cite for context rot?
   - A) A Chroma study on context rot, plus Anthropic's explanation of a depleted "attention budget"
   - B) The GAIA benchmark results
   - C) OpenAI's published scaling laws
   - D) The Manus rewrite history
   <details><summary>Answer</summary>A) A Chroma study on context rot and Anthropic's account of a growing context depleting the model's attention budget - attention is a limited resource spread thinner the more you cram in.</details>

8. Your agent has 120 tools and keeps calling the wrong one. A teammate proposes summarizing the conversation history to fix it. Why won't that work?
   - A) Summarization is lossy and would delete the tool definitions
   - B) Summarization cures a volume problem (rot); an oversized toolset is a clarity problem (confusion)
   - C) Summarization would break the structured output schema
   - D) It would work, but only above 256,000 tokens
   <details><summary>Answer</summary>B) Summarization cures rot, not confusion - "the wrong cure does not help," which is precisely why the chapter bothers to name the three failures separately.</details>

9. What distinguishes context pollution from context rot?
   - A) Pollution only occurs in multi-agent systems
   - B) Rot is about the quality of what's in the window; pollution is about its volume
   - C) Rot is about sheer volume; pollution is about quality, and can hit a window that isn't even full
   - D) Pollution throws an API error while rot does not
   <details><summary>Answer</summary>C) Rot is about volume and pollution is about quality - a modest-sized context can still be polluted by stale tool results, near-duplicate snippets, or details irrelevant to the current step.</details>

10. What is the overarching lesson the chapter draws from all three failure modes?
    - A) Give the model as much context as possible, just in case
    - B) Aim for the minimal effective context required for the next step, not the maximum
    - C) Prefer models with the largest advertised context windows
    - D) Route every request through a vector database first
    <details><summary>Answer</summary>B) Aim for the minimal effective context - "It is not about adding more context. It is about finding the minimal effective context required for the next step."</details>

**Think About It**

1. A provider sells you a 1 million token context window. You stay under it. Nothing errors. And yet the answers get worse the more you put in. What kind of limit is that?
<details><summary>Show answer</summary>
It's a soft limit that nobody advertises, and that's exactly what makes it dangerous. The 1 million figure is the point at which the API refuses your request - a hard, mechanical boundary. The number that actually governs quality is the "effective context window," the region where the model still reasons well, and the chapter puts that frequently under 256,000 tokens for current models. The mechanism, as Anthropic frames it, is an attention budget: attention is a finite resource spread across everything in the window, so the more you cram in, the thinner it spreads and the easier it is for the model to miss the one line that mattered. Because you cross this boundary silently, you can't wait for an error to tell you - hence the Pre-Rot Threshold, where you watch your own token count and start cleaning up long before the vendor's limit.
</details>

2. Multi-agent architectures sound like a clean fix for a crowded context window - just split the work up. So why does the chapter describe sub-agents dumping into a shared space as pollution *at scale*?
<details><summary>Show answer</summary>
Because splitting the work only helps if you also split the context. If several sub-agents each run their own trajectory and then pour their full context into one shared space, the shared window ends up holding every intermediate step from every branch - most of which is irrelevant to any single next decision. That's the definition of pollution, just multiplied by the number of agents, and it comes with a large KV cache cost on top. The lesson is that isolation is the point of a sub-agent, not the mere existence of one: the benefit comes from what you *don't* merge back.
</details>

3. Rot, pollution, confusion - three names for what looks like the same complaint that there's too much junk in the window. Why is the vocabulary worth memorizing?
<details><summary>Show answer</summary>
Because each one has a different cure, and applying the wrong one wastes your time while the problem persists. Rot is a volume problem, so you reduce - compact and summarize. Pollution is a relevance problem, so you get selective about what enters and isolate work into separate contexts. Confusion is a clarity problem, so you cut down to fewer, clearer tools and remove contradictory instructions. The chapter's sharp example: summarizing your history does nothing whatsoever for a toolset that is too large. Naming the failure is what points you at the right move, which is the entire practical payoff of the taxonomy.
</details>

4. Almost every builder's first instinct is to hand the model everything available "just in case." All three failure modes are, in a sense, punishments for that instinct. How does each one punish it?
<details><summary>Show answer</summary>
Each extra piece of context you add on spec extracts a different tax. It dilutes the attention budget across more material, which is rot. It introduces noise the model treats as potentially relevant, pulling its reasoning off course, which is pollution. And if it happens to be an instruction or a tool definition, it can clash with something already there, which is confusion. The instinct feels safe because the cost is invisible - nothing errors, nothing warns you. But that's what makes it a trap rather than a trade-off, and it's why the conclusion lands as a hard reversal: not maximum context, minimal effective context.
</details>

**Coding Challenge**

**Implement a Pre-Rot Threshold monitor**

The chapter's rule is not to wait for the API's hard limit but to act at a threshold well before the rot zone. Write `check_context(tokens, hard_limit, effective_limit)` that returns which action the harness should take - `"ok"`, `"compact"` once you cross the pre-rot threshold (say 80% of the effective limit), `"summarize"` once you're past the effective limit, or `"error"` at the hard limit - so cleanup is triggered by your own monitoring rather than by a failed request.

<details>
<summary>Python Solution</summary>

```python
def check_context(tokens, hard_limit=1_000_000, effective_limit=256_000):
    """Decide the harness's next move from the token count alone."""
    pre_rot = int(effective_limit * 0.8)      # act BEFORE the rot zone
    if tokens >= hard_limit:
        return "error"                        # too late; the API refuses
    if tokens >= effective_limit:
        return "summarize"                    # lossy, last resort
    if tokens >= pre_rot:
        return "compact"                      # reversible, preferred
    return "ok"


for n in (50_000, 210_000, 300_000, 1_050_000):
    print(f"{n:>9,} -> {check_context(n)}")
# 50,000 -> ok  |  210,000 -> compact  |  300,000 -> summarize  |  1,050,000 -> error
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function checkContext(tokens, hardLimit = 1_000_000, effectiveLimit = 256_000) {
  const preRot = Math.floor(effectiveLimit * 0.8); // act BEFORE the rot zone
  if (tokens >= hardLimit) return "error";         // too late; the API refuses
  if (tokens >= effectiveLimit) return "summarize"; // lossy, last resort
  if (tokens >= preRot) return "compact";          // reversible, preferred
  return "ok";
}

for (const n of [50_000, 210_000, 300_000, 1_050_000]) {
  console.log(n, "->", checkContext(n));
}
// 50000 -> ok | 210000 -> compact | 300000 -> summarize | 1050000 -> error
```

</details>
