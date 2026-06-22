# Chapter 5: Prompt Caching and Context Management

## Concept explanation

Chapter 4 left us with a problem: the prompt grows every turn, cost grows quadratically, and eventually the context window fills up. This chapter covers the two families of fixes that every serious harness uses. One attacks the *cost* curve (prompt caching). The other attacks the *window ceiling* (compaction and friends). They are different problems with different solutions, so keep them separate in your head.

### Prompt caching: paying once for the stable part

When the model processes a prompt, it builds up an internal state (the key-value cache, or KV cache) for those tokens. **Prompt caching** means the provider saves that computed state for a prefix of your prompt the first time it sees it, and reuses it on later calls that share the exact same prefix. You skip recomputing the cached part.

The critical rule, and it is unforgiving: **cache hits only work for exact prefix matches.** The provider can reuse the work only up to the first token that differs. So the structural advice from Chapter 3 pays off here:

- Put static content (instructions, tool definitions, examples) at the **front**.
- Put variable content (the latest user message, the newest tool result) at the **end**.

What caches well in an agent session: the system prompt (identical every turn) and the bulk of the conversation history (unchanged from the previous turn). What never caches: the latest user message and the most recent tool result, because they are always new.

The payoff is large. Cached prefix tokens cost roughly a tenth of fresh input tokens. This is why the quadratic growth in tokens *sent* does not become quadratic growth in *cost*: most of what you send each turn is a cached prefix you are billed a tenth for. Codex's lead engineer puts it precisely: with cache hits, sampling the model is **linear rather than quadratic.** That one optimization is the difference between a usable agent and an unaffordable one.

### What breaks the cache

Because hits need exact prefix matches, a handful of innocent-looking actions cause expensive cache *misses*:

- Changing the `tools` list mid-conversation.
- Switching the model (this changes the model-specific instructions near the front of the prompt).
- Changing the sandbox configuration, approval mode, or working directory.
- Editing your `AGENTS.md` mid-session (it invalidates the largest cached prefix).

The Codex team learned this the hard way: an early bug enumerated MCP tools in an inconsistent order, which silently broke caching on every turn. The fix for *necessary* mid-session changes is clever and worth stealing: instead of editing an earlier message (which would change the prefix and bust the cache), **append a new message at the end** describing the change. For example, if the working directory changes, Codex inserts a fresh `<environment_context>` message at the tail rather than rewriting the original. The prefix stays intact; the cache survives.

A practical habit falls right out of this: **lock your `AGENTS.md` before a long session.** Changing it mid-run throws away your biggest cache discount.

### Context management: staying under the ceiling

Caching saves money but does not shrink the prompt. To stay under the context window, harnesses use three moves, listed in the Deep Research survey as the standard menu:

1. **Extend the window.** The blunt approach: use a model with a bigger window (Gemini offers up to a million tokens). Simple, but expensive and not always available.
2. **Compress intermediate steps.** Summarize older parts of the conversation so they take fewer tokens.
3. **Use external storage.** Write intermediate results to files or a database and pull them back only when needed (Chapter 9's file-based memory).

The workhorse is move 2, called **compaction**. When the token count crosses a threshold, the harness replaces the long history with a shorter representative summary, freeing space while keeping the agent's understanding of what happened. Anthropic's harness clears the oldest tool outputs first (those are the bulkiest and least likely to matter later), then summarizes the conversation if needed; your requests and key code snippets are preserved.

Codex started with a manual `/compact` command and later moved to automatic compaction when an `auto_compact_limit` is exceeded. The newest Responses API even has a dedicated compaction endpoint that returns a special `compaction` item carrying an opaque encrypted blob that preserves the model's latent understanding, more faithful than a plain text summary.

Two related techniques round out the toolkit:

- **Truncation.** Individual tool outputs can be huge (a 5,000-line test log). Rather than dropping them, harnesses keep the head and tail and elide the middle, with a marker like `... (4,800 lines omitted) ...`. The beginning and end usually carry the signal; the middle is noise. (We build this in Chapter 6.)
- **Context diffing.** Codex tracks a reference context and, when little has changed between turns, avoids re-injecting the full context. Less to send, better cache hit rates.

One honest caveat the sources raise: compaction can lose detail. A summary is lossy by definition, and on a long, intricate task that loss can hurt later reasoning. So compaction is a necessary evil, not a free lunch; it is one more reason to keep sessions focused.

## Why it matters

Caching and compaction are what make agents practical. Without caching, the Chapter 4 cost curve makes any non-trivial session painfully expensive. Without compaction, the agent simply hits a wall mid-task and cannot continue. Together they turn the agent loop from a neat demo into something you can run all day. They are also where a lot of the "why is my agent slow or expensive?" answers live, so understanding them pays off the moment you operate a real agent.

## How it works: ordering and compacting

Two small mechanisms. First, a builder that guarantees the stable prefix never changes so the cache keeps hitting. Second, a compactor that summarizes old turns when the history gets too big, while always preserving the original request and the most recent exchanges.

## Code MVP: cache-aware ordering and a compactor

```python
"""
chapter 05: caching-aware ordering and compaction.
Two tools: keep the prompt prefix stable (so caching keeps hitting), and
compact old history when it grows past a token budget.
Reuses estimate_items_tokens from Chapter 4.
"""

def estimate_tokens(text: str) -> int:
    return max(1, len(str(text)) // 4)

def estimate_items_tokens(items: list) -> int:
    return sum(estimate_tokens(item.get("content", "")) for item in items)

# --- 1. Keep mid-session changes cache-friendly by APPENDING, not editing ---
def apply_change_cache_safely(history: list, change_description: str) -> list:
    """A config change (new cwd, new sandbox mode) is added as a NEW item at
    the end, so the existing prefix is untouched and stays cached."""
    history.append({"role": "developer", "type": "message",
                    "content": f"<context_update>{change_description}</context_update>"})
    return history

# --- 2. Compaction: summarize old turns once we cross a token budget ---
class Compactor:
    def __init__(self, max_tokens: int = 4000, keep_recent: int = 4):
        self.max_tokens = max_tokens      # window budget (toy value)
        self.keep_recent = keep_recent    # always keep the last N items verbatim

    def summarize(self, items: list) -> str:
        """Stand-in for a real summarization model call. A production harness
        would ask the model to compress these items; here we just sketch it."""
        kinds = {}
        for it in items:
            kinds[it.get("type", "message")] = kinds.get(it.get("type", "message"), 0) + 1
        breakdown = ", ".join(f"{n} {k}" for k, n in kinds.items())
        return f"[summary of {len(items)} earlier items: {breakdown}]"

    def compact(self, history: list) -> list:
        if estimate_items_tokens(history) <= self.max_tokens:
            return history                       # under budget: nothing to do

        # ALWAYS preserve the very first item (the original user request)...
        first = history[:1]
        # ...and the most recent items (freshest, least safe to summarize).
        recent = history[-self.keep_recent:]
        middle = history[1:-self.keep_recent] if len(history) > self.keep_recent + 1 else []

        if not middle:
            return history
        summary_item = {"role": "developer", "type": "message",
                        "content": self.summarize(middle)}
        # Oldest tool outputs are the bulk; replacing them frees the most space.
        return first + [summary_item] + recent

if __name__ == "__main__":
    history = [{"role": "user", "type": "message", "content": "fix the build"}]
    # Simulate a long session: many bulky tool results pile up.
    for i in range(30):
        history.append({"role": "assistant", "type": "tool_call",
                        "content": f"run step {i}"})
        history.append({"role": "tool", "type": "tool_result",
                        "content": "X" * 800})  # a big log (~200 tokens each)

    print("before:", estimate_items_tokens(history), "tokens,", len(history), "items")
    compacted = Compactor(max_tokens=4000, keep_recent=4).compact(history)
    print("after :", estimate_items_tokens(compacted), "tokens,", len(compacted), "items")
    print("first item preserved:", compacted[0]["content"])
```

Run it and the history collapses from thousands of tokens to a few hundred, while the original request ("fix the build") and the last few exchanges survive intact. That is compaction in miniature: throw away the bulky middle, keep the bookends.

## Connecting to the bigger picture

Chapter 4 measured the problem; this chapter solves it. The `apply_change_cache_safely` pattern protects the prefix that Chapter 3's `PromptBuilder` carefully put first. The `Compactor` keeps the loop from Chapter 2 from ever hitting the window ceiling. Chapter 9's file-based memory is the third context-management move (external storage). And Chapter 11's subagents are arguably the best context tool of all: a subagent does noisy work in its own window and returns a tiny summary, so the main context never sees the mess.

## Key takeaways

- **Prompt caching** reuses computed state for an exact prompt *prefix*, at roughly a tenth the cost. It turns the quadratic cost curve back into a linear one.
- Cache hits need exact prefix matches, so put stable content first and variable content last, and never edit earlier messages mid-session; append new ones instead.
- Common cache-busters: changing tools, switching models, changing sandbox or working directory, editing `AGENTS.md` mid-run. Lock instructions before long sessions.
- **Compaction** keeps you under the context window by summarizing old turns (oldest tool outputs first), while preserving the original request and recent exchanges.
- **Truncation** (head plus tail) tames giant tool outputs, and **context diffing** avoids re-sending unchanged context. Compaction is lossy, so keep sessions focused.

Original sources: OpenAI's [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/), Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works), and the Deep Research Agents survey ([arXiv:2506.18096](https://arxiv.org/abs/2506.18096)).

---

## Review

**Quick Check**

1. Why does prompt caching turn a quadratic cost curve back into a linear one?
   - A) The provider compresses tokens before billing, reducing each turn's cost by a fixed percentage
   - B) Cached prefix tokens cost roughly a tenth of fresh input tokens, so the growing prefix is cheap to resend
   - C) The provider skips billing entirely for any turn that shares a prefix with the previous one
   - D) Caching eliminates the need to send conversation history after the first turn
   <details><summary>Answer</summary>B) Cached prefix tokens cost roughly a tenth of fresh input tokens, so the growing prefix is cheap to resend - Even though the number of tokens sent grows each turn, most of those tokens are a cached prefix billed at about one-tenth the normal rate. This prevents the cost from scaling quadratically with conversation length.</details>

2. During compaction, which part of the conversation history is cleared first to free the most space?
   - A) The original user request, since it was set long ago and the agent already understands the goal
   - B) The most recent tool results, since they can be re-fetched if needed
   - C) The oldest tool outputs, since they are the bulkiest and least likely to matter later
   - D) All assistant messages older than a configurable age threshold
   <details><summary>Answer</summary>C) The oldest tool outputs, since they are the bulkiest and least likely to matter later - Tool outputs (like long test logs or file contents) take far more tokens than regular messages, and older ones are least relevant. Clearing them first frees the most space with the least impact on the agent's reasoning.</details>

3. You are building an agent that uses five MCP tools. Midway through a session, the user connects a sixth tool. What is the cache-safest way to handle this?
   - A) Re-enumerate all six tools at the front of the prompt so the model sees the complete set
   - B) Append a new message at the end of the conversation describing the added tool, leaving the original tools list unchanged
   - C) Remove the original tools block entirely and replace it with a fresh block listing all six tools
   - D) Start a new session since there is no way to add a tool without busting the cache
   <details><summary>Answer</summary>B) Append a new message at the end of the conversation describing the added tool, leaving the original tools list unchanged - Editing the tools list at the front of the prompt changes the prefix and busts the cache. The chapter's recommended pattern is to append changes as new messages at the end so the cached prefix stays intact.</details>

4. Your agent session has been running for 200 turns with excellent cache hit rates. You notice the agent is giving slightly outdated responses because your AGENTS.md has a stale instruction. You edit AGENTS.md and the next turn suddenly costs 10x more. What happened?
   - A) The model switched to a more expensive tier after detecting the edit
   - B) Editing AGENTS.md changed the prompt prefix, invalidating the entire cached state and forcing a full recompute
   - C) The edit triggered automatic compaction, which doubled the prompt size before summarizing
   - D) The provider rate-limits sessions that modify system instructions, charging a penalty multiplier
   <details><summary>Answer</summary>B) Editing AGENTS.md changed the prompt prefix, invalidating the entire cached state and forcing a full recompute - AGENTS.md content sits near the front of the prompt. Changing it alters the prefix, so the provider cannot reuse any of the previously cached KV-cache state. Every token must be recomputed from scratch on the next turn, causing a dramatic cost spike.</details>

5. A developer claims: "Prompt caching means I only pay for new tokens each turn. The provider stores the entire conversation and replays it for free." What is wrong with this understanding?
   - A) The provider does not store anything; caching happens entirely on the client side
   - B) Cached tokens are not free, they cost roughly a tenth of the normal rate, and the cache only works for exact prefix matches, not arbitrary substrings of the conversation
   - C) Caching only applies to the system prompt, not to conversation history
   - D) The provider replays tokens for free, but only for the first 100 turns of a session
   <details><summary>Answer</summary>B) Cached tokens are not free, they cost roughly a tenth of the normal rate, and the cache only works for exact prefix matches, not arbitrary substrings of the conversation - Two misconceptions are corrected here: cached tokens still have a cost (about 1/10th), and caching only applies to the exact prefix of the prompt. If any token in the prefix differs, the cache is invalidated from that point forward. It is not a general-purpose replay of arbitrary conversation segments.</details>

**Coding Challenge**

Cache-Friendly Prompt Assembler

Build a function `assemble_prompt` that takes a list of static blocks (system instructions, tool definitions) and a list of dynamic messages (conversation history). It must return the assembled prompt as a list of items where all static blocks come first (preserving their original order) and all dynamic messages come after. Then build a function `detect_cache_bust` that takes two successive assembled prompts and returns the index of the first item where they differ, or -1 if the prefixes are identical up to the length of the shorter one. This simulates checking whether a cache hit is possible.

<details><summary>Python Solution</summary>

```python
def assemble_prompt(static_blocks: list[str], dynamic_messages: list[str]) -> list[str]:
    """Place static content first for cache-friendly ordering."""
    return list(static_blocks) + list(dynamic_messages)


def detect_cache_bust(prev_prompt: list[str], curr_prompt: list[str]) -> int:
    """Return index of first difference in the prefix, or -1 if prefix is intact."""
    min_len = min(len(prev_prompt), len(curr_prompt))
    for i in range(min_len):
        if prev_prompt[i] != curr_prompt[i]:
            return i
    return -1


# --- demo ---
if __name__ == "__main__":
    static = ["You are a coding assistant.", "Tools: [read_file, write_file, run_tests]"]

    # Turn 1
    turn1 = assemble_prompt(static, ["User: fix the build", "Assistant: reading files..."])
    print("Turn 1:", turn1)

    # Turn 2 - good: static prefix unchanged, new message appended
    turn2 = assemble_prompt(static, ["User: fix the build", "Assistant: reading files...", "User: now run tests"])
    bust_index = detect_cache_bust(turn1, turn2)
    print(f"Turn 2 cache bust at index: {bust_index}")  # -1, prefix intact

    # Turn 3 - bad: someone changed the tools list
    static_changed = ["You are a coding assistant.", "Tools: [read_file, write_file, run_tests, deploy]"]
    turn3 = assemble_prompt(static_changed, ["User: fix the build", "Assistant: reading files...", "User: now run tests"])
    bust_index = detect_cache_bust(turn2, turn3)
    print(f"Turn 3 cache bust at index: {bust_index}")  # 1, tools block changed
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function assemblePrompt(staticBlocks, dynamicMessages) {
  // Place static content first for cache-friendly ordering.
  return [...staticBlocks, ...dynamicMessages];
}

function detectCacheBust(prevPrompt, currPrompt) {
  // Return index of first difference in the prefix, or -1 if prefix is intact.
  const minLen = Math.min(prevPrompt.length, currPrompt.length);
  for (let i = 0; i < minLen; i++) {
    if (prevPrompt[i] !== currPrompt[i]) {
      return i;
    }
  }
  return -1;
}

// --- demo ---
const static_ = ["You are a coding assistant.", "Tools: [read_file, write_file, run_tests]"];

// Turn 1
const turn1 = assemblePrompt(static_, ["User: fix the build", "Assistant: reading files..."]);
console.log("Turn 1:", turn1);

// Turn 2 - good: static prefix unchanged, new message appended
const turn2 = assemblePrompt(static_, ["User: fix the build", "Assistant: reading files...", "User: now run tests"]);
let bustIndex = detectCacheBust(turn1, turn2);
console.log(`Turn 2 cache bust at index: ${bustIndex}`);  // -1, prefix intact

// Turn 3 - bad: someone changed the tools list
const staticChanged = ["You are a coding assistant.", "Tools: [read_file, write_file, run_tests, deploy]"];
const turn3 = assemblePrompt(staticChanged, ["User: fix the build", "Assistant: reading files...", "User: now run tests"]);
bustIndex = detectCacheBust(turn2, turn3);
console.log(`Turn 3 cache bust at index: ${bustIndex}`);  // 1, tools block changed
```

</details>
