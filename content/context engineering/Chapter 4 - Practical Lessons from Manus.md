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
