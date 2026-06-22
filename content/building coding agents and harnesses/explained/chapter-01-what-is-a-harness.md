# Chapter 1: What Is an Agent Harness?

## The one-sentence version

A coding agent is not a smarter language model. It is an ordinary language model wrapped in a thick layer of regular software that feeds it context, runs the tools it asks for, and keeps it on the rails. That wrapping layer is called the **harness**, and it is the real product.

## Concept explanation

When you use Claude Code or OpenAI's Codex in your terminal, it feels like one thing: a clever program that understands your code. It is actually two very separate things glued together.

The first thing is the **model**. It runs on Anthropic's or OpenAI's servers. It takes in a big blob of text and produces more text. It cannot touch your files. It cannot run a command. It has no memory of yesterday. Left alone, it can only talk.

The second thing is the **harness**. It runs on your machine (or in a managed sandbox). It is the CLI you launched. Every turn, the harness gathers up your instructions, your project's files, the conversation so far, and the list of tools the model is allowed to use, then sends all of that to the model. When the model says "run `npm test`," the harness is what actually runs `npm test`, captures the output, and hands it back. The model reasons; the harness acts.

A good analogy: the model is a brilliant consultant on the phone who has never seen your office. The harness is the assistant in the room who reads documents aloud to the consultant, writes down what the consultant says to do, walks over and does it, and reports back what happened. The consultant is smart, but without the assistant, nothing in the room actually changes. And a careless assistant (one who reads the wrong documents, or does dangerous things without checking) makes even a brilliant consultant useless.

This split is why the Mervin Praison breakdown of Claude Code insists that "Claude Code is not a CLI that calls Claude. It is an agentic harness." The model reasons; the harness mediates every action. That separation is exactly what makes the system feel magical while staying debuggable, because once you can name the layers, you can reason about where things go wrong.

## Why it matters

Here is the practical punchline, and it shows up in nearly every source in this collection: **investing in the harness usually beats tweaking the prompt.** 

If your agent keeps doing the wrong thing, your instinct is to rewrite the system prompt. Sometimes that helps. But the engineers who build these systems consistently find that the bigger wins come from better tool descriptions, better permission rules, better memory files, and better context management. The Snyk team that studied Cursor's security agents found the prompt driving a system that catches hundreds of real vulnerabilities was a mere fifteen lines. The prompt was simple precisely *because* the infrastructure underneath it (state tracking, deduplication, deployment, orchestration) was not. The harness was carrying the weight.

So if you want to build a capable agent, most of your effort is not going to be prompt wording. It is going to be plumbing. This guide is mostly about that plumbing.

## How it works: two mental maps

Different sources slice the harness in different ways. Two slicings are worth keeping in your head as a map for the rest of the guide.

### Map A: the six layers (from the Claude Code architecture breakdown)

This view puts a simple loop in the middle and wraps six concentric layers around it.

| Layer | What it does | Where in this guide |
|---|---|---|
| 1. Input | Session boundary, trust, what the agent is allowed to do | Ch 7 |
| 2. Knowledge | Persistent instructions and context that survive long sessions | Ch 9 |
| 3. Execution | Dispatching tools and running the loop | Ch 2, 6 |
| 4. Integration | External systems and packaged extensions (MCP, plugins) | Ch 10 |
| 5. Multi-agent | Delegated work that does not blow up the main context | Ch 11 |
| 6. Observability | Deterministic control and audit points (hooks, checkpoints) | Ch 12 |

The key phrase from that breakdown is that the loop in the center is "the dumb part on purpose." The intelligence is not in some clever orchestration engine. It is in the model's reasoning plus the quality of the layers around it.

### Map B: the seven pillars (from the "Agentic Harness Architecture" breakdown)

This view is more opinionated and more builder-focused. It lists seven things a production harness gets right, and for each one it separates what the platform gives you for free from what you have to architect yourself.

| Pillar | The core idea | Where in this guide |
|---|---|---|
| 1. Context engineering | Decide what enters the context window, and what stays out | Ch 3, 4, 5 |
| 2. Memory management | Knowledge that lives outside the model's weights | Ch 9 |
| 3. Skills as workflow encoding | Package a repeatable procedure the agent loads on demand | Ch 10 |
| 4. Agent contracts and orchestration | Give each subagent a clear input/output contract | Ch 11 |
| 5. Tiered execution | Answer cheaply when you can, escalate only when you must | Ch 5, 11 |
| 6. Deterministic computation | Push exact work into code, not the model's head | Ch 10 |
| 7. Portability and shareability | The whole setup lives in the repo, so a teammate can clone it | Ch 9, 16 |

The seven pillars breakdown adds one more idea that deserves a spot of its own: the **anti-hallucination contract**. The most important rule for any agent handling real data is that if a tool can fetch the truth, the agent must not be allowed to make the answer up. We will return to this in Chapters 10 and 13.

Do not memorize either table. The point is that "harness" is not one blob. It is a set of distinct problems (context, memory, tools, safety, delegation, observability) that you can attack one at a time. That is exactly how the rest of this guide is organized.

## A tiny illustration

There is no real MVP for this chapter, because the harness is the thing we spend the whole book building. But here is the shape of the split in code, just to make it concrete. Notice how little the "agent" knows how to do on its own.

```python
# The model is just a function: text in, text (or a tool request) out.
# It cannot do anything else. Everything else is the harness's job.

def call_model(prompt: str, tools: list) -> dict:
    """Stand-in for an API call to Claude or GPT.
    Returns either {"type": "text", ...} or {"type": "tool_call", ...}.
    The model NEVER runs the tool itself; it only asks."""
    ...

# The harness is everything around that function: it owns the files,
# the shell, the permissions, the memory, and the loop.

class Harness:
    def __init__(self):
        self.tools = {}        # Ch 6: what the model is allowed to ask for
        self.history = []      # Ch 3: the conversation so far
        self.memory = ""       # Ch 9: persistent project knowledge
        self.permissions = {}  # Ch 7: what may run without asking

    def run(self, user_request: str):
        # Ch 2 turns this comment into a real loop. For now, just note
        # that the harness, not the model, is in the driver's seat.
        ...
```

The model is a single stateless function. The `Harness` class is where all the chapters live. Every later chapter fills in one of those attributes or methods.

## Connecting to the bigger picture

This chapter is the frame. Chapter 2 starts filling it in with the most important moving part, the loop that drives `call_model` over and over until the work is done. Keep the two maps nearby: when a later chapter talks about compaction, you will know it belongs to "context engineering" (pillar 1) and the "knowledge" layer (layer 2). When it talks about guardian subagents, you will place it in "input" and "multi-agent." The maps turn a pile of techniques into a structure.

## Key takeaways

- A coding agent is a stateless **model** plus a stateful **harness**. The model reasons and asks; the harness gathers context, runs tools, and enforces rules.
- The famous rule of thumb: building an agent is roughly 5% calling the model in a loop and 95% harness work (context, tools, sandboxing, error handling).
- Improving the harness (tool descriptions, permissions, memory, context management) usually beats fiddling with the prompt.
- Two useful maps: the **six layers** (input, knowledge, execution, integration, multi-agent, observability) and the **seven pillars** (context, memory, skills, contracts, tiered execution, deterministic computation, portability).
- The central loop is "dumb on purpose." Intelligence comes from the model plus the quality of the surrounding layers.

---

## Review

**Quick Check**

1. According to the chapter, why was the Snyk/Cursor security agent prompt only fifteen lines long?
   - A) The team used a highly compressed prompt format to save tokens
   - B) The model was fine-tuned specifically for security tasks, so it needed fewer instructions
   - C) The infrastructure underneath (state tracking, deduplication, orchestration) carried the weight
   - D) The prompt was a placeholder and the real instructions were injected at runtime
   <details><summary>Answer</summary>C) The infrastructure underneath (state tracking, deduplication, orchestration) carried the weight - The chapter explains that the prompt was simple precisely because the harness beneath it handled state tracking, deduplication, deployment, and orchestration. The harness was doing the heavy lifting, not the prompt.</details>

2. In the chapter's breakdown, the central agent loop is described as "dumb on purpose." Where does the intelligence actually come from?
   - A) A specialized orchestration engine that plans multi-step strategies
   - B) The model's reasoning combined with the quality of the surrounding layers
   - C) A separate planner module that preprocesses each request before the loop starts
   - D) Hard-coded decision trees embedded in the loop logic
   <details><summary>Answer</summary>B) The model's reasoning combined with the quality of the surrounding layers - The chapter states explicitly that intelligence is not in some clever orchestration engine but in "the model's reasoning plus the quality of the layers around it."</details>

3. A team notices their coding agent frequently invents file paths that do not exist instead of searching for them. Which harness improvement from this chapter most directly addresses the problem?
   - A) Adding a multi-agent layer so a subagent can double-check paths
   - B) Rewriting the system prompt to say "do not hallucinate file paths"
   - C) Enforcing the anti-hallucination contract: if a tool can fetch the truth, the agent must not make it up
   - D) Compressing the conversation history so the model has more room to reason
   <details><summary>Answer</summary>C) Enforcing the anti-hallucination contract: if a tool can fetch the truth, the agent must not make it up - The chapter introduces the anti-hallucination contract as the most important rule for agents handling real data. Since a file-search tool can find valid paths, the agent should be required to use it rather than guessing.</details>

4. You are building a coding agent and have spent three weeks perfecting a detailed 200-line system prompt, yet the agent still performs poorly. Based on this chapter's central argument, what should you try next?
   - A) Switch to a larger model with more parameters
   - B) Invest in harness improvements such as better tool descriptions, permissions, memory, and context management
   - C) Add more few-shot examples to the prompt to cover edge cases
   - D) Reduce the prompt to under fifteen lines to match the Snyk/Cursor approach
   <details><summary>Answer</summary>B) Invest in harness improvements such as better tool descriptions, permissions, memory, and context management - The chapter repeatedly emphasizes that improving the harness usually beats tweaking the prompt. The 5%/95% split (5% calling the model, 95% harness work) underlines that most gains come from infrastructure, not prompt wording.</details>

5. A developer claims: "Our agent is stateful because it remembers the conversation from yesterday." Based on this chapter's definitions, what is wrong with that statement?
   - A) Nothing is wrong; if the agent remembers yesterday, the model itself is stateful
   - B) The model is always stateful, but the harness is stateless
   - C) The model is stateless; it is the harness that persists memory across sessions, not the model itself
   - D) Statefulness only applies to tool execution, not to conversation history
   <details><summary>Answer</summary>C) The model is stateless; it is the harness that persists memory across sessions, not the model itself - The chapter is explicit that the model "has no memory of yesterday" and is "a single stateless function." Any persistence (conversation history, memory files) is managed by the Harness class, not the model.</details>

**Coding Challenge**

Minimal Harness Skeleton

Build a minimal harness that maintains a conversation history and a tool registry. Implement a `Harness` class with: (1) a method `register_tool(name, func)` that adds a callable tool, (2) a method `execute_tool(name, args)` that runs a registered tool and appends the call and its result to the history, raising an error for unregistered tools, and (3) a `get_history()` method that returns the full history list. Each history entry should be a dictionary with keys `"role"` (either `"tool_call"` or `"tool_result"`), `"tool"`, and either `"args"` or `"result"`. This mirrors the chapter's point that the harness owns tools, history, and execution while the model only reasons.

<details><summary>Python Solution</summary>

```python
class Harness:
    def __init__(self):
        self.tools = {}
        self.history = []

    def register_tool(self, name, func):
        self.tools[name] = func

    def execute_tool(self, name, args):
        if name not in self.tools:
            raise ValueError(f"Tool '{name}' is not registered")
        self.history.append({"role": "tool_call", "tool": name, "args": args})
        result = self.tools[name](**args)
        self.history.append({"role": "tool_result", "tool": name, "result": result})
        return result

    def get_history(self):
        return list(self.history)


# Demo
harness = Harness()
harness.register_tool("add", lambda x, y: x + y)
harness.register_tool("read_file", lambda path: f"contents of {path}")

print(harness.execute_tool("add", {"x": 2, "y": 3}))
print(harness.execute_tool("read_file", {"path": "main.py"}))
print(harness.get_history())
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
class Harness {
  constructor() {
    this.tools = {};
    this.history = [];
  }

  registerTool(name, func) {
    this.tools[name] = func;
  }

  executeTool(name, args) {
    if (!(name in this.tools)) {
      throw new Error(`Tool '${name}' is not registered`);
    }
    this.history.push({ role: "tool_call", tool: name, args });
    const result = this.tools[name](args);
    this.history.push({ role: "tool_result", tool: name, result });
    return result;
  }

  getHistory() {
    return [...this.history];
  }
}

// Demo
const harness = new Harness();
harness.registerTool("add", ({ x, y }) => x + y);
harness.registerTool("readFile", ({ path }) => `contents of ${path}`);

console.log(harness.executeTool("add", { x: 2, y: 3 }));
console.log(harness.executeTool("readFile", { path: "main.py" }));
console.log(harness.getHistory());
```

</details>
