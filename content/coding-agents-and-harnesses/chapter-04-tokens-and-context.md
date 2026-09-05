# Chapter 4: Tokens, Context Windows, and the Quadratic Problem

## Concept explanation

Before the model can do anything with your prompt, the prompt is turned into numbers. This step is called **tokenization**: the text is chopped into tokens (chunks roughly the size of a short word or word-piece), and each token is mapped to an integer that indexes the model's vocabulary. A rough rule of thumb the harnesses use is about 4 characters per token. The model then samples output tokens one at a time, and those get decoded back into text. The token-by-token streaming you see in the terminal is literally this sampling process exposed to you.

Two facts about tokens shape the entire economics of agents.

**Fact one: the model must read every input token before it can write a single output token.** A bloated `AGENTS.md`, a huge file you read, a verbose tool result: all of it adds latency and cost to *every* inference call for the rest of the session, not just the next one.

**Fact two: there is a hard ceiling called the context window.** This is the maximum number of tokens the model can use for one inference call, and it counts both input and output. An agent that makes hundreds of tool calls in one turn can run straight into that ceiling. Managing it is one of the harness's core jobs.

## The quadratic problem (the insight most people miss)

Recall from Chapter 2 that every new turn re-sends the entire conversation history. Now combine that with tokens costing money per call, and you get a nasty surprise.

Here is the growth pattern, straight from the Codex deep-dive:

```text
Turn 1:  [system] + [user msg 1]                       -> ~2k tokens
Turn 5:  [system] + 4 turns + tool calls               -> ~15k tokens
Turn 20: [system] + 19 turns + dozens of tool calls    -> ~80k tokens
Turn 50: [system] + 49 turns + hundreds of tool calls  -> potentially millions
```

Each turn re-sends everything before it. So the *total* amount of data sent over the lifetime of a session is **quadratic** in the number of turns. Double the session length and you roughly quadruple the total tokens sent, and therefore the cost.

If that word "quadratic" feels abstract, here is the everyday version. Imagine a meeting where the rule is that before anyone speaks, they must first read the entire transcript of the meeting so far, out loud. The first person reads almost nothing. The tenth person reads nine speeches. The fiftieth person reads forty-nine. The meeting does not get linearly longer; it balloons. That is your agent session.

This is not a bug. The model genuinely needs the history to reason coherently from turn to turn; it has no memory otherwise. But the consequences are real and worth stating plainly:

- **Long sessions are disproportionately expensive.** The cost is not linear in length.
- **Editing-heavy sessions burn context fastest.** Lots of `apply_patch` calls means lots of large diffs piling up in history. A session that does heavy file editing exhausts the window faster than one doing light Q&A.
- **One session should do one focused task.** This is the single most important workflow habit that falls out of understanding the loop. Do not run a marathon session that does everything; start fresh sessions, or delegate to subagents (Chapter 11), for distinct jobs.

## Why it matters

This chapter is the "why" behind half the techniques in the rest of the guide. Prompt caching (Chapter 5) exists to break the quadratic *cost* curve. Compaction (Chapter 5) exists to keep you under the *window ceiling*. Subagents (Chapter 11) exist so a noisy research task can run in its own context and report back a small summary instead of dumping ten thousand tokens into your main thread. Budgets (Chapter 12) exist so a retry loop cannot quietly run the meter to a hundred dollars. Every one of those is a response to the two facts and the quadratic curve above.

It also matters for your wallet directly. The "Everything About Codex" guide reports that a debugging-heavy task that loops ten or twenty times, each lap replaying the full history, is where bills spike. The mitigation it recommends is exactly what this chapter motivates: cap turns, set token limits, keep scope bounded.

## How it works: estimating before you spend

You do not need an exact tokenizer to reason about this; a good estimate is enough to build budgets and warnings. Real harnesses use byte-based heuristics (roughly 4 characters per token) for fast counting, and only fall back to a precise tokenizer when it matters. Here is how to think about the cost of a whole session.

If a turn's prompt has `P` tokens and produces `O` output tokens, that turn's cost is roughly `P * input_rate + O * output_rate`. Because `P` grows each turn, summing over a session gives you that quadratic shape. The estimator below makes this concrete and even shows the difference caching makes (foreshadowing Chapter 5).

## Code MVP: a token and cost estimator

```python
"""
chapter 04: token and cost estimation.
A fast, approximate token counter plus a session cost model that makes
the quadratic growth visible. This becomes the capstone's budget meter.
"""
from dataclasses import dataclass

CHARS_PER_TOKEN = 4  # the standard rough heuristic used by real harnesses

def estimate_tokens(text: str) -> int:
    """Cheap approximation: ~4 characters per token."""
    return max(1, len(text) // CHARS_PER_TOKEN)

def estimate_items_tokens(items: list) -> int:
    """Total tokens across a list of structured history items (Ch 3)."""
    return sum(estimate_tokens(str(item.get("content", ""))) for item in items)

@dataclass
class CostModel:
    input_rate: float = 1.0      # cost per 1k fresh input tokens (arbitrary units)
    output_rate: float = 4.0     # output usually costs more than input
    cached_rate: float = 0.1     # cached input is ~10x cheaper (Chapter 5)

    def turn_cost(self, prompt_tokens: int, output_tokens: int,
                  cached_tokens: int = 0) -> float:
        fresh = prompt_tokens - cached_tokens
        return (fresh / 1000) * self.input_rate \
             + (cached_tokens / 1000) * self.cached_rate \
             + (output_tokens / 1000) * self.output_rate

def simulate_session(turns: int, tokens_added_per_turn: int = 1500,
                     output_per_turn: int = 300, use_cache: bool = False):
    """Show how total cost grows with session length."""
    model = CostModel()
    history_tokens = 0
    total = 0.0
    for t in range(1, turns + 1):
        history_tokens += tokens_added_per_turn      # the prompt keeps growing
        # With caching, everything except this turn's new content is cached.
        cached = history_tokens - tokens_added_per_turn if use_cache else 0
        total += model.turn_cost(history_tokens, output_per_turn, cached)
    return round(total, 2)

if __name__ == "__main__":
    for n in (5, 10, 20, 50):
        no_cache = simulate_session(n, use_cache=False)
        cached = simulate_session(n, use_cache=True)
        print(f"{n:>3} turns | no cache: {no_cache:>8} | with cache: {cached:>7}")
```

Run it and watch the "no cache" column grow far faster than the turn count, while the "with cache" column grows much more gently. That gap is the entire argument for Chapter 5. The numbers are in arbitrary units, but the shape is what matters: without caching, doubling the turns roughly quadruples the cost; with caching, the per-turn marginal cost grows slowly.

## Connecting to the bigger picture

Chapter 3 built the prompt; this chapter measures it and explains why it cannot grow forever. Chapter 5 attacks the problem from both sides: caching to tame the cost curve, and compaction to stay under the window ceiling. The `estimate_tokens` and `CostModel` you wrote here become the capstone's budget meter, the thing Chapter 12 wires into a real kill switch.

## Key takeaways

- Text becomes tokens (about 4 characters each); the model reads all input tokens before producing any output token, so bloat taxes every later call.
- The **context window** is a hard ceiling on input plus output tokens for one inference call.
- Because every turn re-sends the full history, total tokens over a session grow **quadratically** with the number of turns. Doubling length roughly quadruples cost.
- Editing-heavy sessions fill the window fastest. The healthy habit is one focused task per session, with delegation for the rest.
- You can estimate tokens cheaply (4 chars each) and build budgets on top of that estimate, which is exactly what later chapters do.

Original source: the "Inside the Codex Agent Loop" deep-dive based on Michael Bolin's [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/).

---

## Review

**Quick Check**

1. What is the approximate rule of thumb for converting characters to tokens?
   - A) 2 characters per token
   - B) 4 characters per token
   - C) 8 characters per token
   - D) 1 word per token
   <details><summary>Answer</summary>B) 4 characters per token - Real harnesses use about 4 characters per token as a fast heuristic for estimating token counts without running a full tokenizer.</details>

2. Why does the total token cost of a session grow quadratically with the number of turns?
   - A) The model's vocabulary doubles in size each turn
   - B) Output tokens become more expensive as the session progresses
   - C) Every turn re-sends the entire conversation history, so each turn's prompt is larger than the last
   - D) The tokenizer produces more tokens per character as context grows
   <details><summary>Answer</summary>C) Every turn re-sends the entire conversation history, so each turn's prompt is larger than the last - Because the model has no memory between calls, the full history must be re-sent each time. Turn 1 sends a small prompt, turn 2 sends turn 1 plus new content, turn 3 sends turns 1 and 2 plus new content, and so on. Summing these growing prompts produces quadratic total token usage.</details>

3. A developer runs a 20-turn session where each turn adds about 1,500 tokens of new content. They then run a second session that does the same work but takes 40 turns (twice as many, each still adding 1,500 tokens). Roughly how does the total token cost of the second session compare to the first?
   - A) About the same, since the same total work is done
   - B) About twice as expensive
   - C) About four times as expensive
   - D) About eight times as expensive
   <details><summary>Answer</summary>C) About four times as expensive - Doubling the number of turns roughly quadruples the total tokens sent over the session because of the quadratic growth pattern. Each additional turn re-sends all prior history, so the cost relationship is quadratic, not linear.</details>

4. An agent session is running close to the context window limit. Which type of activity is most likely to have caused this?
   - A) Reading short error messages from failed test runs
   - B) Asking the model to explain its reasoning step by step
   - C) Heavy file editing with many apply_patch calls containing large diffs
   - D) Running a single long shell command that produces a one-line result
   <details><summary>Answer</summary>C) Heavy file editing with many apply_patch calls containing large diffs - Editing-heavy sessions burn context fastest because each apply_patch call adds large diffs to the conversation history, and all of those diffs are re-sent on every subsequent turn.</details>

5. A developer claims: "Prompt caching eliminates the quadratic growth problem entirely, making total session cost linear in the number of turns." Is this correct?
   - A) Yes, caching converts quadratic growth to constant cost per turn
   - B) Yes, cached tokens are free so only new tokens are billed
   - C) No, caching reduces cost significantly but the total still grows faster than linearly since the prompt size keeps increasing
   - D) No, caching only helps with output tokens, not input tokens
   <details><summary>Answer</summary>C) No, caching reduces cost significantly but the total still grows faster than linearly since the prompt size keeps increasing - Caching flattens the cost curve because re-sent history is charged at a much lower rate (roughly 10x cheaper), but each turn still re-sends a growing prompt. The per-turn marginal cost grows slowly rather than being eliminated. The simulate_session code demonstrates this: the cached column grows much more gently, but it still grows.</details>

**Coding Challenge**

Session Cost Comparison Report

Write a function that takes a list of turn counts (for example, [5, 10, 20, 50]) and a tokens-per-turn value, then returns a list of dictionaries. Each dictionary should contain the turn count, the total cost without caching, the total cost with caching, and the savings ratio (uncached cost divided by cached cost, rounded to one decimal place). Use input_rate=1.0, output_rate=4.0, cached_rate=0.1, and assume 300 output tokens per turn.

<details><summary>Python Solution</summary>

```python
def session_cost_report(turn_counts, tokens_per_turn=1500):
    input_rate = 1.0
    output_rate = 4.0
    cached_rate = 0.1
    output_per_turn = 300
    results = []

    for turns in turn_counts:
        no_cache_total = 0.0
        cached_total = 0.0
        history = 0

        for t in range(1, turns + 1):
            history += tokens_per_turn
            # No cache: all tokens are fresh
            no_cache_total += (history / 1000) * input_rate + (output_per_turn / 1000) * output_rate
            # With cache: only this turn's tokens are fresh
            fresh = tokens_per_turn
            cached = history - tokens_per_turn
            cached_total += (fresh / 1000) * input_rate + (cached / 1000) * cached_rate + (output_per_turn / 1000) * output_rate

        ratio = round(no_cache_total / cached_total, 1)
        results.append({
            "turns": turns,
            "no_cache": round(no_cache_total, 2),
            "cached": round(cached_total, 2),
            "savings_ratio": ratio,
        })

    return results

# Example usage
for row in session_cost_report([5, 10, 20, 50]):
    print(f"{row['turns']:>3} turns | no cache: {row['no_cache']:>8} | cached: {row['cached']:>7} | {row['savings_ratio']}x cheaper")
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function sessionCostReport(turnCounts, tokensPerTurn = 1500) {
  const inputRate = 1.0;
  const outputRate = 4.0;
  const cachedRate = 0.1;
  const outputPerTurn = 300;
  const results = [];

  for (const turns of turnCounts) {
    let noCacheTotal = 0;
    let cachedTotal = 0;
    let history = 0;

    for (let t = 1; t <= turns; t++) {
      history += tokensPerTurn;
      // No cache: all tokens are fresh
      noCacheTotal += (history / 1000) * inputRate + (outputPerTurn / 1000) * outputRate;
      // With cache: only this turn's tokens are fresh
      const fresh = tokensPerTurn;
      const cached = history - tokensPerTurn;
      cachedTotal += (fresh / 1000) * inputRate + (cached / 1000) * cachedRate + (outputPerTurn / 1000) * outputRate;
    }

    const ratio = Math.round((noCacheTotal / cachedTotal) * 10) / 10;
    results.push({
      turns,
      noCache: Math.round(noCacheTotal * 100) / 100,
      cached: Math.round(cachedTotal * 100) / 100,
      savingsRatio: ratio,
    });
  }

  return results;
}

// Example usage
for (const row of sessionCostReport([5, 10, 20, 50])) {
  console.log(`${String(row.turns).padStart(3)} turns | no cache: ${String(row.noCache).padStart(8)} | cached: ${String(row.cached).padStart(7)} | ${row.savingsRatio}x cheaper`);
}
```

</details>
