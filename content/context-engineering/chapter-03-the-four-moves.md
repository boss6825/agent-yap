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

## Review

**Quick Check**

1. What is the crucial property that makes compaction preferable to summarization?
   - A) It is faster because it does not call the model
   - B) It is reversible, because the full version is still on disk
   - C) It produces a fixed schema
   - D) It preserves the KV cache exactly
   <details><summary>Answer</summary>B) It is reversible - compaction keeps only a reference while the full version stays in the sandbox, so nothing is truly lost and the agent can re-read it later.</details>

2. An agent writes a 500-line code file. According to Part 2's example, what should the chat history contain?
   - A) The full contents of the file, so the model can reason over it
   - B) A model-written summary of what the file does
   - C) Only the path, for example "Output saved to /src/main.py"
   - D) The first and last 50 lines
   <details><summary>Answer</summary>C) Only the path - if the agent needs the contents later it simply re-reads the file.</details>

3. When Manus summarizes, it deliberately keeps the most recent tool calls in raw, full-detail form. Why?
   - A) Recent calls are cheaper to store
   - B) To preserve the model's "rhythm" - its formatting style and momentum - and avoid the quality drop from an all-summary context
   - C) Because summarization cannot process recent tokens
   - D) To keep the KV cache from being invalidated
   <details><summary>Answer</summary>B) To preserve the model's rhythm and momentum - a context made entirely of summaries causes a quality drop.</details>

4. Manus finds information it previously offloaded by using `glob` and `grep` over its filesystem. What does this avoid?
   - A) Needing a sandbox
   - B) Needing to store full tool results at all
   - C) Needing to build and maintain a vector database just to find things again
   - D) Needing an output schema for sub-agents
   <details><summary>Answer</summary>C) Needing a vector database - this is agentic search, and it is simpler than semantic search.</details>

5. In Manus, what is the main purpose of a sub-agent?
   - A) To imitate a human job role such as designer or project manager
   - B) To isolate context by giving a piece of work its own context window
   - C) To run on a separate virtual machine for security
   - D) To allow several models from different providers to vote
   <details><summary>Answer</summary>B) To isolate context - humans split work by role because of our own cognitive limits, and LLMs do not necessarily share those limits, so Manus is pragmatic rather than anthropomorphic.</details>

**More Questions**

6. What is the priority order the chapter tells you to remember for reduction?
   - A) Summarize first, then compact, then keep raw
   - B) Prefer raw context, then compaction, and only summarize when compaction can no longer free enough space
   - C) Always compact and summarize together on every turn
   - D) Compact only after the API throws a limit error
   <details><summary>Answer</summary>B) Raw, then compaction, then summarization as a last resort - summarization is lossy, so it is the second choice, not the first.</details>

7. What did Manus discover about its original `todo.md` approach to tracking tasks?
   - A) The file grew too large to fit on disk
   - B) Roughly one-third of all actions were spent updating the list, wasting tokens
   - C) The model refused to write to it reliably
   - D) It broke constrained decoding for sub-agents
   <details><summary>Answer</summary>B) About one-third of all actions went to rewriting the constantly-updated list - so they replaced it with a dedicated planner agent.</details>

8. Part 2 gives one explicit warning about retrieval. What is it?
   - A) Never retrieve more than 10 documents per step
   - B) Do not use RAG to manage your tool definitions
   - C) Do not retrieve from the filesystem, only from a vector store
   - D) Always re-retrieve at the start of every turn
   <details><summary>Answer</summary>B) Do not use RAG for tool definitions - fetching them dynamically by similarity creates a shifting context that breaks the KV cache and confuses the model, which may hallucinate back a tool that disappeared. Tools should stay stable.</details>

9. How does Manus make MCP tools available without filling the context window with their definitions?
   - A) It summarizes each tool definition down to one line
   - B) It retrieves the relevant ones each step by similarity
   - C) It reaches them through a command-line interface that the agent calls with its Bash tool
   - D) It binds them only to sub-agents, never to the main model
   <details><summary>Answer</summary>C) Through a CLI called via the Bash tool - this offloads actions to the sandbox and keeps the tool definitions out of the window entirely. Claude's "skills" feature uses the same progressive-disclosure idea.</details>

10. You are spinning up a debugging sub-agent that needs to see the previous failed attempts, and it will write to files the planner also uses. How much context should the planner share?
    - A) Only instructions passed through the function call
    - B) Its full context, because the sub-agent must understand the whole trajectory
    - C) Only the output schema
    - D) Nothing; the sub-agent should re-derive everything itself
    <details><summary>Answer</summary>B) Its full context - for complex tasks where the sub-agent needs the whole trajectory, the planner shares everything. Simple, discrete tasks get instructions through the function call instead, resembling the task tool in Claude Code.</details>

**Think About It**

1. Manus gives every single session its own cloud virtual machine. That sounds like enormous overhead just to answer a question. Why is handing the agent a real computer the thing that makes most of context engineering possible?
<details><summary>Show answer</summary>
Because three of the four moves quietly depend on having somewhere else to put things. Compaction only works if the full tool result still exists on disk - otherwise trimming it to a reference is just deletion. Offloading is literally "store it outside the window," which needs a filesystem. Retrieval-by-`grep` needs files to grep. And offloading *actions* needs a shell to run them in, which is what lets Manus expose about 20 general tools instead of hundreds. So the VM isn't overhead bolted onto the agent; it's the external memory and the hands that make a small context window survive a 50-tool-call task. Take the computer away and you're left with only summarization, the lossy option.
</details>

2. RAG is the standard answer to "how do I find the right information at the right time." So why is it the wrong answer for tool definitions specifically?
<details><summary>Show answer</summary>
Because tools aren't information to look up, they're the stable surface the model acts through. If you fetch definitions by similarity each step, the toolset changes between turns: a tool present in turn 1 vanishes in turn 2. Two things break. The KV cache is invalidated, because the early part of the context - where tool definitions live - keeps changing, so you pay full price for every turn. And the model, having just used a tool, may hallucinate it back after it disappears. This is a nice illustration that "retrieve on demand" is a principle about *data*, not about the agent's own action space. Data should flow in and out; the interface should sit still.
</details>

3. Manus was spending roughly a third of its actions maintaining a to-do list it had written for itself. How does something that reasonable go that wrong?
<details><summary>Show answer</summary>
The idea was sound - keep a `todo.md` on the filesystem so the plan lives outside the context window. The flaw was that the file was *constantly rewritten*, and every rewrite is a tool call: tokens spent, a turn burned, nothing accomplished for the user. That overhead compounded until roughly one-third of all actions were bookkeeping. The fix wasn't to abandon offloading, it was to stop making the main loop do the bookkeeping: a dedicated planner agent now owns the plan and returns it as structured output, injected into context only when needed. The general lesson is that offloading has a cost too, and if you're paying it every turn you've moved the work rather than removed it.
</details>

4. When people design multi-agent systems they reach instinctively for an org chart - a designer, an engineer, a project manager. The chapter says don't. What's the actual argument?
<details><summary>Show answer</summary>
That we split work by role because of *our* cognitive limits, and there's no reason to assume an LLM shares them. A human designer can't hold the whole codebase and the brand guidelines and the sprint plan at once, so we specialize; that constraint is biological, not logical. What an LLM actually suffers from is a crowded context window - which means the useful reason to spawn a sub-agent is to give a piece of work its own window, not to give it a job title. Manus reflects this: it has a planner, a knowledge manager, and an executor, which are named after context boundaries rather than professions. Copying the org chart gets you agents chatting with each other, which multiplies context instead of isolating it.
</details>

5. When the window is filling up, summarizing it is the obvious move - just ask the model to condense. Why does the chapter push that to last place?
<details><summary>Show answer</summary>
Because summarization is a one-way door. It throws away real detail permanently, and you don't find out which detail mattered until the agent needs it and can't get it back. Compaction reaches the same goal - a smaller window - without the loss: the full tool result stays in the sandbox and the context keeps a file path, so the agent can re-read it any time. That's why the order is raw, then compaction, then summarization only when compaction can no longer free enough space. And even then Manus hedges: it summarizes at a threshold rather than at the limit, uses a fixed schema so summaries stay consistent, and keeps the most recent tool calls raw so the model doesn't lose its rhythm reading a context made entirely of digests.
</details>

**Coding Challenge**

**Implement compaction with a reversible full/compact pair**

Manus gives every tool result two representations: a "full" one stored in the sandbox and a "compact" one holding only a reference. Build a `ToolResult` store with `add(name, output)`, `compact_stale()` which replaces every result except the most recent `keep_recent` with a path reference, and `restore(path)` which reads the full version back - demonstrating that reduction here is lossless.

<details>
<summary>Python Solution</summary>

```python
class ContextStore:
    def __init__(self, keep_recent=2):
        self.messages = []      # what the model sees
        self.disk = {}          # the sandbox: full versions live here
        self.keep_recent = keep_recent

    def add(self, name, output):
        path = f"/sandbox/{name}_{len(self.disk)}.txt"
        self.disk[path] = output                       # full version, always
        self.messages.append({"name": name, "path": path, "body": output})

    def compact_stale(self):
        """Stale results keep only a reference; recent ones stay full."""
        cutoff = len(self.messages) - self.keep_recent
        for i, m in enumerate(self.messages):
            if i < cutoff and m["body"] is not None:
                m["body"] = None                       # reversible: still on disk
        return self.messages

    def restore(self, path):
        return self.disk[path]                          # nothing was lost

    def render(self):
        lines = []
        for m in self.messages:
            body = m["body"] if m["body"] is not None else "Output saved to " + m["path"]
            lines.append(m["name"] + ": " + body)
        return lines


store = ContextStore(keep_recent=1)
store.add("search", "…2,000 tokens of raw results…")
store.add("file_write", "…500 lines of code…")
store.compact_stale()
print(store.render())
# ['search: Output saved to /sandbox/search_0.txt', 'file_write: …500 lines of code…']
print(store.restore("/sandbox/search_0.txt")[:20])   # reduction was reversible
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
class ContextStore {
  constructor(keepRecent = 2) {
    this.messages = []; // what the model sees
    this.disk = {};     // the sandbox: full versions live here
    this.keepRecent = keepRecent;
  }
  add(name, output) {
    const path = `/sandbox/${name}_${Object.keys(this.disk).length}.txt`;
    this.disk[path] = output; // full version, always
    this.messages.push({ name, path, body: output });
  }
  compactStale() {
    const cutoff = this.messages.length - this.keepRecent;
    this.messages.forEach((m, i) => {
      if (i < cutoff) m.body = null; // reversible: still on disk
    });
    return this.messages;
  }
  restore(path) {
    return this.disk[path]; // nothing was lost
  }
  render() {
    return this.messages.map(
      (m) => `${m.name}: ${m.body ?? `Output saved to ${m.path}`}`,
    );
  }
}

const store = new ContextStore(1);
store.add("search", "…2,000 tokens of raw results…");
store.add("file_write", "…500 lines of code…");
store.compactStale();
console.log(store.render());
// ['search: Output saved to /sandbox/search_0.txt', 'file_write: …500 lines of code…']
console.log(store.restore("/sandbox/search_0.txt")); // reduction was reversible
```

</details>
