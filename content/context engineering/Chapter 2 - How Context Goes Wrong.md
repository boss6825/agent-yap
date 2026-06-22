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
