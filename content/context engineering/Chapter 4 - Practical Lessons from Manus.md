# Chapter 4: Practical Lessons from Building Manus

The first three chapters covered the what and the how of context engineering. This final chapter collects the harder-won, higher-level lessons that the Manus team and others arrived at after building and rebuilding their systems. These are the kind of insights that only show up after real production experience, and they push against some common instincts.

## Keep the toolset small: the hierarchical action space

A natural instinct is to give the agent every tool it might possibly need. Both Manus articles argue against this. Providing an LLM with 100 or more tools leads to [context confusion](../glossary/Glossary.md#context-confusion): the model starts hallucinating parameters or calling the wrong tool. Tool descriptions also consume valuable [tokens](../glossary/Glossary.md#token).

Manus solves this with what Part 2 calls a hierarchical action space, organized into three levels:

- Level 1, atomic functions: the model sees a small set of around 20 core tools, such as `file_write`, `browser_navigate`, `bash`, and `search`. These are stable, which keeps them [cache](../glossary/Glossary.md#kv-cache-key-value-cache)-friendly.
- Level 2, sandbox utilities: rather than adding a dedicated tool for every utility, the model is instructed to call command-line programs through the Bash tool. For example, to use `ffmpeg`, it runs it on the command line instead of having a special `ffmpeg` tool. Manus exposes [MCP](../glossary/Glossary.md#mcp-model-context-protocol) tools through a CLI the agent calls the same way, which keeps those tool definitions out of the context window.
- Level 3, code and packages: for a chain of dependent steps (for example, "fetch a city, get its ID, then get its weather"), do not make three separate model round-trips. Provide a library or function that handles the chain, and let the agent write a short script that calls it.

The thread running through all three levels is the same: keep the number of definitions the model has to reason over small, and push complexity down into the sandbox and into code.

## Treat "agent as a tool," not as an org chart

When people first build multi-agent systems, they often imagine a little company: a manager agent, a designer agent, a coder agent, all chatting with each other. Part 2 calls this over-anthropomorphizing, and advises against it.

The recommended pattern is to treat an [agent as a tool](../glossary/Glossary.md#sub-agent). From the main model's point of view, "Deep Research" or "Plan Task" is just a tool call. The main agent calls something like `call_planner(goal="...")`, the harness quietly spins up a temporary sub-agent loop, and a structured result comes back. This is the [MapReduce pattern](../glossary/Glossary.md#mapreduce-pattern): the main agent treats the sub-agent like a deterministic function with a defined goal, set of tools, and output schema. The benefit is that the returned data is instantly usable, with no further parsing or back-and-forth conversation, and the overall design stays flat and modular instead of becoming a tangle of agents talking to each other.

The earlier `todo.md` story is the concrete payoff of this thinking. Manus replaced a constantly rewritten to-do file (which wasted around 30 percent of tokens in earlier versions) with a dedicated planner sub-agent that returns a structured Plan object, injected into the context only when needed rather than consuming tokens every turn.

## Do not train your own model yet, and respect the Bitter Lesson

This is one of the most important strategic lessons, and it ties back to [the Bitter Lesson](../glossary/Glossary.md#the-bitter-lesson). The harness you build today will probably be made obsolete by the next frontier model. If you spend weeks [fine-tuning](../glossary/Glossary.md#fine-tuning) a model or training a reinforcement learning policy for a specific action space, you risk locking yourself into a "local optimum": a setup that is good now but cannot ride the wave of improving general models.

The advice is to use context engineering as a flexible interface that adapts to rapidly improving models, rather than baking your current assumptions into trained weights. Boris Cherny, the creator of Claude Code, has said the Bitter Lesson influenced his decision to keep Claude Code unopinionated so it could adapt easily as models improved.

There is a practical test that comes from this. Run your agent's evaluations across models of different strengths. If a stronger model does not make your agent better, your harness may be holding the agent back ("hobbling" it). This is how you check whether your design is "future proof," in the language of the article. Hyung Won Chung's framing captures the mindset: add structure for the level of compute available today, then be willing to remove it later, because those shortcuts will eventually bottleneck further improvement.

## Verify with computable, binary checks: the Intern Test

The articles are skeptical of soft, subjective evaluation. Static benchmarks like GAIA saturated quickly and did not match real user satisfaction. The recommendation is to focus on tasks that are computationally verifiable, with clear yes-or-no outcomes:

- Did the code compile?
- Did the file exist after the command ran?
- Can the sub-agent verify the output of the parent?

Part 2 calls this the "Intern Test": prefer binary success or failure metrics on real environments over subjective [LLM-as-a-judge](../glossary/Glossary.md#llm-as-a-judge) scores. The point is not that LLM-as-a-judge is useless, but that hard, checkable signals are more trustworthy when you can get them.

## Expect to rebuild, and watch for over-engineering

Perhaps the most freeing lesson is that constant change is normal. Manus was rewritten five times in roughly six months. LangChain re-architected its Open Deep Research project four times. This is not a sign of failure; it is the natural consequence of building on top of models that keep getting stronger.

The article gives a sharp diagnostic: if your harness is getting more complex while the models are getting better, you are probably over-engineering. The biggest performance gains the Manus team saw in their last six months did not come from adding complex RAG pipelines or fancy routing. They came from removing things. They removed complex tool definitions in favor of general shell execution. They removed "management agents" in favor of simple structured handoffs.

## The closing thought

All of these lessons point in one direction, captured in the conclusion of Part 2: as models get stronger, you should not be building more scaffolding, you should be getting out of the model's way. Context engineering is not about adding more context. It is about finding the minimal effective context required for the next step, and trusting the model to do the rest.

There is one more safety note worth carrying forward. When you give an agent browser or shell access, sandbox isolation alone is not enough. Manus enforces rules so that sensitive tokens do not leave the sandbox, and uses human-in-the-loop confirmation before the agent takes certain actions. Capability and caution go together.

## Key takeaways

- Keep the toolset small with a hierarchical action space: a few atomic tools, sandbox utilities reached through Bash, and code for multi-step logic.
- Treat sub-agents as tools (define a goal, tools, and output schema) rather than as a chatty org chart.
- Do not fine-tune or train your own policy prematurely; the Bitter Lesson says a better general model will likely make that work obsolete.
- Test your agent across model strengths; if a stronger model does not help, your harness is the bottleneck.
- Prefer binary, computable verification (the Intern Test) over subjective scoring.
- Expect to rebuild often, and treat growing harness complexity as a warning sign of over-engineering.
- Get out of the model's way: minimal effective context, plus sensible safety guards on shell and browser access.

This completes the Context Engineering chapters. For the multi-agent ideas referenced here (sharing context, sub-agents, orchestration), see the multi-agent folder.

## Review

**Quick Check**

1. At Level 1 of the hierarchical action space, roughly how many tools does the model actually see?
   - A) Around 5
   - B) Around 20 core atomic tools such as `file_write`, `browser_navigate`, `bash`, and `search`
   - C) Around 100, retrieved by similarity each turn
   - D) As many as the provider allows
   <details><summary>Answer</summary>B) Around 20 core atomic tools - and they are kept stable, which keeps them cache-friendly.</details>

2. How does Manus let the agent use a utility like `ffmpeg`?
   - A) A dedicated `ffmpeg` tool is bound to the model
   - B) The model is instructed to call it as a command-line program through the Bash tool
   - C) It is wrapped as an MCP server bound directly to the model
   - D) It is not available; video work is out of scope
   <details><summary>Answer</summary>B) As a command-line program through the Bash tool - this is Level 2, sandbox utilities, and it avoids adding a tool definition for every utility.</details>

3. Your agent needs to fetch a city, get its ID, then get its weather. What does Level 3 advise?
   - A) Make three separate model round-trips, one per step
   - B) Bind three separate tools and let the model chain them
   - C) Provide a library or function that handles the chain, and let the agent write a short script that calls it
   - D) Retrieve the three tool definitions dynamically by similarity
   <details><summary>Answer</summary>C) Provide a library and let the agent write a short script - for a chain of dependent steps, push the complexity into code rather than paying for three round-trips.</details>

4. What does the Bitter Lesson imply about fine-tuning a model for your specific action space?
   - A) It is the fastest path to a reliable agent
   - B) It risks locking you into a local optimum that a better general model will make obsolete
   - C) It only matters for models under a certain size
   - D) It is required before you can build a harness
   <details><summary>Answer</summary>B) It risks a local optimum - a setup that is good now but cannot ride the wave of improving general models. Use context engineering as a flexible interface instead of baking assumptions into weights.</details>

5. What is the "Intern Test"?
   - A) Having a junior engineer review every agent trajectory
   - B) Asking an LLM judge to score the agent's output out of ten
   - C) Preferring binary success or failure metrics on real environments over subjective LLM-as-a-judge scores
   - D) Running the agent on the GAIA benchmark before release
   <details><summary>Answer</summary>C) Preferring binary, computationally verifiable outcomes on real environments - did the code compile, did the file exist after the command ran, can the sub-agent verify the parent's output.</details>

**More Questions**

6. In the recommended "agent as a tool" pattern, what does the main model see when it delegates?
   - A) A conversation thread with another agent it must interpret
   - B) A tool call such as `call_planner(goal="...")` that returns a structured result
   - C) A shared context window it writes into jointly
   - D) A manager agent that assigns it work
   <details><summary>Answer</summary>B) Just a tool call returning a structured result - the harness quietly spins up a temporary sub-agent loop. This is the MapReduce pattern: the sub-agent is treated as a deterministic function with a defined goal, tools, and output schema, so the returned data is instantly usable.</details>

7. What does the chapter offer as evidence that constant rebuilding is normal?
   - A) Manus was rewritten five times in roughly six months, and LangChain re-architected Open Deep Research four times
   - B) Every major lab publishes a new harness quarterly
   - C) The GAIA benchmark is updated twice a year
   - D) Anthropic rewrote Claude Code three times
   <details><summary>Answer</summary>A) Five Manus rewrites in about six months, and four re-architectures of LangChain's Open Deep Research - a natural consequence of building on models that keep getting stronger, not a sign of failure.</details>

8. Six months in, your harness has grown steadily more complex while the models you run on have gotten noticeably better. What does the chapter's diagnostic say?
   - A) You are on track; complexity is the cost of capability
   - B) You are probably over-engineering
   - C) You should now consider fine-tuning
   - D) You need a larger context window
   <details><summary>Answer</summary>B) You are probably over-engineering - the sharp diagnostic is that harness complexity rising while models improve is a warning sign. Manus's biggest gains came from *removing* things: complex tool definitions in favor of general shell execution, management agents in favor of structured handoffs.</details>

9. You run your evaluations across models of different strengths and the strongest model performs no better than a weaker one. What does that indicate?
   - A) Your evaluations are too easy
   - B) The models are functionally equivalent
   - C) Your harness may be hobbling the agent and is the bottleneck
   - D) You need to fine-tune the stronger model
   <details><summary>Answer</summary>C) Your harness is holding the agent back - this is the practical test for whether your design is "future proof." Hyung Won Chung's framing: add structure for today's compute, then be willing to remove it later.</details>

10. Beyond sandbox isolation, what safety measures does Manus apply once an agent has browser or shell access?
    - A) None; the sandbox is sufficient by design
    - B) Rules so sensitive tokens do not leave the sandbox, plus human-in-the-loop confirmation before certain actions
    - C) A read-only filesystem for all sessions
    - D) An LLM judge that reviews every command before execution
    <details><summary>Answer</summary>B) Token egress rules plus human-in-the-loop confirmation - sandbox isolation alone is not enough; capability and caution go together.</details>

**Think About It**

1. The Manus team's biggest performance gains over six months came from *deleting* their own work. How does removing engineering make a product better?
<details><summary>Show answer</summary>
Because a lot of scaffolding exists to compensate for weaknesses the model no longer has. Complex tool definitions were there to spell out exactly what the agent could do - but a stronger model can figure out the same thing from general shell execution, and the definitions were costing tokens and causing confusion. "Management agents" existed to coordinate work - but a simple structured handoff does it without the chatter. Each removal took away something that was actively getting in the model's way. That's the sense of the closing line: as models get stronger you shouldn't be building more scaffolding, you should be getting out of the model's way. It also reframes what to be proud of, since the win here was a smaller system, not a bigger one.
</details>

2. Fine-tuning a model on your own action space sounds like exactly the kind of investment that would give you a moat. The chapter says don't do it yet. Why is the obvious competitive advantage a trap?
<details><summary>Show answer</summary>
Because you'd be optimizing hard against a target that's about to move. The Bitter Lesson observes that general methods riding increasing compute tend to beat hand-crafted, specialized ones - so weeks spent fine-tuning or training an RL policy for today's specific tool set buys you a local optimum: better than your current baseline, but unable to ride the next frontier model's improvements. Worse, the assumptions are now frozen in weights rather than sitting in code you can edit. Context engineering is recommended precisely because it's a *flexible interface* - cheap to change when the model underneath changes. Boris Cherny cites the same reasoning for keeping Claude Code unopinionated, and Hyung Won Chung frames it as adding structure for today's compute while staying willing to remove it, because those shortcuts eventually become the bottleneck.
</details>

3. Benchmarks like GAIA got saturated - agents scored well - and yet real users weren't correspondingly happy. What broke, and what does the chapter suggest instead?
<details><summary>Show answer</summary>
What broke is that a saturated benchmark stops carrying information. Once everyone scores near the top, the number can't distinguish a good agent from a mediocre one, and it never measured the thing users care about in the first place. The chapter's alternative is to be suspicious of soft, subjective evaluation and lean on tasks that are computationally verifiable with clear yes-or-no outcomes: did the code compile, did the file exist after the command ran, can the sub-agent verify the parent's output. That's the Intern Test - not that LLM-as-a-judge is useless, but that a hard checkable signal is more trustworthy whenever you can get one, because it's much harder to accidentally optimize into meaninglessness.
</details>

4. Rewriting your core system five times in six months would be a screaming red flag in almost any other engineering context. Why is it treated as healthy here?
<details><summary>Show answer</summary>
Because the ground is genuinely moving underneath you. Normally a rewrite means you misjudged the requirements; here it usually means the model got better and made part of your harness unnecessary. Manus's five rewrites and LangChain's four re-architectures of Open Deep Research are described as the natural consequence of building on rapidly improving models. The important nuance is that this isn't a licence to churn aimlessly - the chapter pairs it with a specific diagnostic. If your rewrites are making the harness simpler as models improve, you're tracking the frontier. If complexity is climbing while the models get better, you're over-engineering, and that's the actual red flag.
</details>

**Coding Challenge**

**Build the future-proofing check**

The chapter's practical test is to run your evaluations across models of different strengths: if a stronger model does not make your agent better, the harness is hobbling it. Write `diagnose_harness(scores)` that takes eval scores keyed by model strength and reports whether the harness scales with the model or is the bottleneck.

<details>
<summary>Python Solution</summary>

```python
STRENGTH_ORDER = ["weak", "medium", "strong"]


def diagnose_harness(scores, min_gain=0.03):
    """If a stronger model doesn't help, the harness is the bottleneck."""
    ladder = [(s, scores[s]) for s in STRENGTH_ORDER if s in scores]
    if len(ladder) < 2:
        return "inconclusive: test across at least two model strengths"

    gains = [b - a for (_, a), (_, b) in zip(ladder, ladder[1:])]
    if all(g < min_gain for g in gains):
        return "hobbled: harness is the bottleneck - try removing structure"
    if any(g < min_gain for g in gains):
        return "partially hobbled: gains flatten at the top of the ladder"
    return "future proof: the agent improves as the model improves"


print(diagnose_harness({"weak": 0.61, "medium": 0.62, "strong": 0.62}))
# hobbled: harness is the bottleneck - try removing structure
print(diagnose_harness({"weak": 0.48, "medium": 0.64, "strong": 0.79}))
# future proof: the agent improves as the model improves
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
const STRENGTH_ORDER = ["weak", "medium", "strong"];

function diagnoseHarness(scores, minGain = 0.03) {
  const ladder = STRENGTH_ORDER.filter((s) => s in scores).map((s) => scores[s]);
  if (ladder.length < 2)
    return "inconclusive: test across at least two model strengths";

  const gains = ladder.slice(1).map((v, i) => v - ladder[i]);
  if (gains.every((g) => g < minGain))
    return "hobbled: harness is the bottleneck - try removing structure";
  if (gains.some((g) => g < minGain))
    return "partially hobbled: gains flatten at the top of the ladder";
  return "future proof: the agent improves as the model improves";
}

console.log(diagnoseHarness({ weak: 0.61, medium: 0.62, strong: 0.62 }));
// hobbled: harness is the bottleneck - try removing structure
console.log(diagnoseHarness({ weak: 0.48, medium: 0.64, strong: 0.79 }));
// future proof: the agent improves as the model improves
```

</details>
