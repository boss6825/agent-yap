# Chapter 3: The Four Moves: Reduce, Offload, Isolate, Retrieve

Once you accept that the goal is the minimal effective context, the question becomes practical: how do you actually keep the [context window](../glossary/Glossary.md#context-window) small and clean while the agent does a long, multi-step job? The "Context Engineering in Manus" notes group the answer into a few core strategies, and "Part 2" adds detail. This chapter explains each move in depth, using how the Manus agent actually does it.

Manus is worth using as the running example because it is a popular general-purpose consumer [agent](../glossary/Glossary.md#agent), and a typical Manus task uses around 50 tool calls. Each Manus session runs on its own cloud-based virtual machine, which gives the agent a real computer: a filesystem, tools to navigate it, and the ability to run shell commands in a sandbox. That detail matters, because having a computer is what makes most of these moves possible.

## Move 1: Reduce context

Reduction means shrinking what is already in the window. There are two distinct techniques, and the order in which you reach for them matters.

### Compaction (reversible, preferred)

[Compaction](../glossary/Glossary.md#compaction) strips out information that is redundant because it still exists somewhere else, usually on the filesystem. In Manus, every tool call has a "full" representation and a "compact" representation. The full version holds the raw output (for example, a complete search result) and is stored in the sandbox. The compact version keeps only a reference, such as a file path.

The clean example from Part 2: if an agent writes a 500-line code file, the chat history should not contain the file's contents. It should contain only the path, for example "Output saved to /src/main.py." If the agent needs the contents later, it simply re-reads the file.

The crucial property is that compaction is reversible. Nothing is truly lost, because the full version is on disk. Manus applies compaction to older, "stale" tool results (ones the agent has already used to make a decision) while keeping newer results in full so they can still guide the next step.

### Summarization (lossy, used only when needed)

[Summarization](../glossary/Glossary.md#summarization-lossy-compression) uses the model itself to condense the history when compaction is no longer freeing enough space. This is lossy: real detail is thrown away permanently, which is why it is the second choice, not the first.

Two practical details make Manus's summarization work better. First, it is triggered at a chosen threshold (Part 2 gives the example of summarizing once the context passes 128,000 tokens). Second, when it summarizes, Manus keeps the most recent tool calls in their raw, full-detail form. This preserves the model's "rhythm," its formatting style and momentum, and prevents the quality drop that comes from feeding the model a context made entirely of summaries. Manus also uses a fixed schema for its summaries, so every summary has the same fields and is consistent across runs.

The priority order to remember: prefer raw context, then compaction, and only summarize when compaction can no longer free enough space. Lance Martin's notes connect this to Anthropic's "context editing" feature, which automatically clears stale tool calls and results as the window approaches its limit while preserving the conversation flow.

## Move 2: Offload context

[Context offloading](../glossary/Glossary.md#context-offloading) means storing information outside the window and pulling it back only when needed. This is the move that compaction depends on, and the agent's computer is what makes it work. There are two flavors.

### Offload tool results to the filesystem

Because Manus has a filesystem, it saves full tool results to disk and keeps only references in context. When it needs to look something back up, it uses basic utilities like `glob` and `grep` to search the files directly. Notice what this avoids: there is no need to build and maintain a [vector database](../glossary/Glossary.md#vector-database) just to find things again. This is [agentic search](../glossary/Glossary.md#agentic-search), and it is simpler than [semantic search](../glossary/Glossary.md#semantic-search).

### Offload actions to the sandbox

Instead of binding hundreds of tools to the model (which causes [context confusion](../glossary/Glossary.md#context-confusion)), Manus exposes a small set of general tools (a Bash tool, a few filesystem tools, a code execution tool) and lets the model do most things by running commands in the sandbox. Even [MCP](../glossary/Glossary.md#mcp-model-context-protocol) tools are reached through a command-line interface that the agent calls with its Bash tool, which keeps the tool definitions out of the context window. Claude's "skills" feature uses the same idea: skills live on the filesystem and are loaded only when needed, an example of [progressive disclosure](../glossary/Glossary.md#progressive-disclosure), rather than all being bound as tools up front.

## Move 3: Isolate context

[Context isolation](../glossary/Glossary.md#context-offloading) means giving a piece of work its own separate [context window](../glossary/Glossary.md#context-window), usually by handing it to a [sub-agent](../glossary/Glossary.md#sub-agent). This is where context engineering meets the multi-agent topic.

Manus is deliberately pragmatic here. It does not create a cast of human-like roles ("designer," "engineer," "project manager") that chat with each other. The articles point out that humans split work by role because of our own cognitive limits, and LLMs do not necessarily share those limits. So in Manus the main purpose of a sub-agent is to isolate context, not to act out a job title.

In practice, Manus uses a planner agent that assigns tasks, a knowledge manager that decides what should be saved to the filesystem, and an executor sub-agent that performs the assigned tasks. There is a notable bit of history here: Manus originally tracked tasks in a `todo.md` file that was constantly rewritten, and found that roughly one-third of all actions were spent updating that list, which wasted tokens. They replaced it with a dedicated planner agent.

How much context to share with a sub-agent depends on the task, a tension that the multi-agent chapters explore in depth:

- For simple, discrete tasks, where the planner only needs the sub-agent's output, the planner just sends instructions through the function call. This resembles the task tool in Claude Code.
- For complex tasks, where the sub-agent must understand the whole trajectory of the problem (for example, a debugging sub-agent that needs to see previous failed attempts, or one that writes to files the planner also uses), the planner shares its full context.

In both cases the planner defines the sub-agent's output schema, and the sub-agent uses a "submit results" tool with [constrained decoding](../glossary/Glossary.md#constrained-decoding-structured-output-schema) to make sure the returned data matches that schema exactly. Part 2 frames this as a general principle borrowed from Go programming: "Share memory by communicating, don't communicate by sharing memory." Treat shared context as an expensive dependency to be minimized, partly because forking context also breaks the [KV cache](../glossary/Glossary.md#kv-cache-key-value-cache).

## Move 4: Retrieve context

Retrieval means pulling information into the context dynamically, when it is needed, rather than keeping it there permanently. [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation) is the classic example. The agentic-search approach above (using `grep` and `glob` over the filesystem) is another form of retrieval. The key idea shared across these articles is that retrieval should be on-demand: bring the information in for the step that needs it, then let it leave again, rather than letting everything accumulate.

There is one important warning attached to retrieval, from Part 2: do not use RAG to manage your tool definitions. Fetching tool definitions dynamically each step based on similarity tends to fail, because it creates a shifting context that breaks the KV cache and confuses the model (a tool that was present in turn 1 disappears in turn 2, and the model may "hallucinate" it back). Tools should stay stable.

## Putting the four moves together

A useful way to hold all four in your head:

- Reduce: make what is in the window smaller (compaction first, summarization as a last resort).
- Offload: keep the full data outside the window (on the filesystem) and most actions in the sandbox.
- Isolate: give separate work its own context window via sub-agents, sharing context only when truly needed.
- Retrieve: bring information in on demand for the current step.

None of these requires a smarter model. They are all engineering moves around the model, which is exactly what makes them "context engineering."

## Key takeaways

- Reduce with compaction (reversible, keeps a reference to data stored elsewhere) before resorting to summarization (lossy, throws away detail).
- When summarizing, keep recent tool calls raw to preserve the model's rhythm, and use a fixed schema for consistency.
- Offload full tool results to the filesystem and reach them later with simple tools like grep and glob; no vector database required.
- Expose a small set of general tools and push most actions into a sandbox, instead of binding hundreds of tools.
- Use sub-agents mainly to isolate context, not to imitate human job roles; share full context only when the sub-agent genuinely needs the whole picture.
- Retrieve information on demand, but keep tool definitions stable rather than fetching them dynamically.

Continue to Chapter 4 for the higher-level lessons from rebuilding Manus.
