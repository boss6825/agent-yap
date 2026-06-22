# Chapter 3: Building the Prompt

## Concept explanation

In Chapter 2 we hand-waved "the harness builds a prompt and calls the model." This chapter opens that step up, because what goes into the prompt, and in what order, is one of the most consequential design decisions in the whole harness. The "Seven Pillars" breakdown calls this **context engineering**, and it lists it as pillar number one for a reason.

When you query a modern agent API (OpenAI's Responses API, Anthropic's Messages API), you do not hand it one big string. You hand it a structured request with a few distinct fields. Codex's request, for example, has three you really need to understand:

- `instructions`: the system and developer guidance, the model's "personality" and rules.
- `tools`: a list of tool definitions, each one a JSON schema describing what the tool does and what arguments it takes.
- `input`: the conversation itself, as a list of typed items (user messages, assistant messages, tool calls, tool results).

The server then assembles these into the actual token sequence the model sees. Conceptually, think of the final prompt as a single ordered list of items, each tagged with a **role** that signals how much authority it carries. In decreasing order of priority: `system`, `developer`, `user`, `assistant`. System rules outrank user requests, which outrank the assistant's own past words.

### Layered instructions

The `instructions` are not one block of text written by one person. They are layered, and the layering is deliberate. Reading across the Codex write-up and the "Inside the Agent Harness" deep-dive, a typical stack looks like this:

| Layer | Source | Purpose |
|---|---|---|
| Base instructions | Bundled with the model (e.g. `gpt-5.2-codex_prompt.md`) | The model's core behavior and "personality" |
| Developer instructions | The user's config file | Project- or developer-level overrides |
| User instructions | `AGENTS.md` / `CLAUDE.md`, aggregated from several files | Conventions, test commands, house style |
| Skills metadata | Configured skills | Short descriptions of available procedures (Chapter 10) |
| Environment context | Computed at runtime | Current working directory, shell, sandbox rules |

The rule for aggregating user instructions is "more specific wins." Codex walks from the project root down to your current working directory, and instructions closer to where you are working take precedence, up to a size limit (32 KiB by default). This is layering you will rebuild in Chapter 9.

### The conversation as structured items, not a transcript

Here is a detail that separates a toy from a real harness. The history is not stored as a flat string like "User said X, then I ran Y, then I saw Z." It is stored as **typed, structured items**, and crucially, a tool call and its output are linked by a shared `call_id`.

Why does that linkage matter? Because the model needs to understand cause and effect. If you ran three shell commands in parallel and dumped three blobs of output, the model would not know which output came from which command. The `call_id` ties result to request, so the model reads the causal relationship correctly. The "Inside the Agent Harness" analysis flags this as one of the things that makes structured tool outputs critical: the model needs to know *what happened*, not just *what text appeared*.

### Tool definitions as JSON schemas

The `tools` field is a list of JSON schemas. Here is Codex's `shell` tool, lightly trimmed:

```json
{
  "type": "function",
  "name": "shell",
  "description": "Run a shell command and return its output",
  "parameters": {
    "type": "object",
    "properties": {
      "command":    {"type": "array", "items": {"type": "string"},
                     "description": "The command to execute"},
      "workdir":    {"type": "string", "description": "Working directory"},
      "timeout_ms": {"type": "number", "description": "Timeout in milliseconds"}
    },
    "required": ["command"]
  }
}
```

The model reads these schemas to know what it is allowed to ask for and how to format the request. The harness dynamically decides which tools to include based on permissions, sandbox mode, and context. For example, Codex only adds a `view_image` tool when an image is actually present. Fewer, well-described tools beat a giant undifferentiated pile.

## Why it matters

Three reasons, each of which becomes a whole chapter later.

First, **everything the model knows comes from this prompt.** It has no other window into your world. The "Inside the Agent Harness" piece phrases the design rule memorably: "if you would be lost with only the last screenshot and tool output, the model will be too." Build the prompt as if you were briefing a competent colleague who just walked in.

First-cousin to that: **order matters for cost.** Static content (instructions, tools) goes at the front; variable content (the latest user message) goes at the end. That ordering is what makes prompt caching work, and caching is the difference between an affordable agent and a ruinous one. Chapter 5 is devoted to it; for now, just internalize "stable stuff first."

Second, **structure matters for correctness.** Linking tool calls to results, tagging roles, separating instructions from history: these let the model reason about authority and causality instead of guessing.

## How it works: assembling one request

Putting the pieces together, here is the order Codex inserts items into `input` before adding your actual message:

1. A `developer` message describing the sandbox and permission rules (applies to the built-in shell tool).
2. Optional `developer` instructions from config.
3. A `user` message with the aggregated `AGENTS.md` / skills instructions.
4. A `user` message describing the environment (`<environment_context>` with cwd and shell).
5. Finally, your actual user message.

Then on later turns, the previous turns' items (assistant messages, tool calls, tool results) are appended, and the old prompt stays an exact prefix of the new one. That prefix property is not an accident; it is engineered, again for caching.

## Code MVP: a prompt builder

This `PromptBuilder` assembles the three fields the way a real harness does. It is intentionally close to what the capstone uses.

```python
"""
chapter 03: building the prompt.
Assemble layered instructions, tool schemas, and a structured history
into a single request dict. Stable content goes first (for caching, Ch 5).
"""
from dataclasses import dataclass, field

@dataclass
class PromptBuilder:
    base_instructions: str = "You are a careful coding agent."
    project_instructions: str = ""        # from AGENTS.md / CLAUDE.md (Ch 9)
    skills_summary: str = ""              # short skill descriptions (Ch 10)
    cwd: str = "."
    shell: str = "bash"
    tools: list = field(default_factory=list)   # JSON schemas (Ch 6)

    def build_instructions(self) -> str:
        # Layered, most-general first, most-specific last.
        layers = [self.base_instructions]
        if self.project_instructions:
            layers.append(f"<project_instructions>\n{self.project_instructions}\n</project_instructions>")
        if self.skills_summary:
            layers.append(f"<skills>\n{self.skills_summary}\n</skills>")
        return "\n\n".join(layers)

    def environment_item(self) -> dict:
        # A user-role item describing where the agent is running.
        return {"role": "user", "type": "message",
                "content": f"<environment_context><cwd>{self.cwd}</cwd>"
                           f"<shell>{self.shell}</shell></environment_context>"}

    def build_request(self, history: list) -> dict:
        """history is a list of structured items (see add_* helpers below)."""
        return {
            # STABLE prefix first: instructions and tools rarely change.
            "instructions": self.build_instructions(),
            "tools": self.tools,
            # VARIABLE content last: environment, then the live conversation.
            "input": [self.environment_item()] + history,
        }

# --- helpers that keep the history STRUCTURED, not a flat string ---
def user_msg(text):
    return {"role": "user", "type": "message", "content": text}

def assistant_msg(text):
    return {"role": "assistant", "type": "message", "content": text}

def tool_call(call_id, name, args):
    return {"role": "assistant", "type": "tool_call",
            "call_id": call_id, "name": name, "args": args}

def tool_result(call_id, output):
    # SAME call_id links this result to the call above, so the model
    # understands which output belongs to which command.
    return {"role": "tool", "type": "tool_result",
            "call_id": call_id, "content": output}

if __name__ == "__main__":
    pb = PromptBuilder(
        project_instructions="Run tests with `pytest -q`. Use 4-space indents.",
        tools=[{"type": "function", "name": "shell",
                "description": "Run a shell command",
                "parameters": {"type": "object",
                               "properties": {"command": {"type": "string"}},
                               "required": ["command"]}}],
        cwd="/repo", shell="zsh",
    )
    history = [
        user_msg("fix the failing test"),
        tool_call("c1", "shell", {"command": "pytest -q"}),
        tool_result("c1", "1 failed, 3 passed"),
    ]
    request = pb.build_request(history)
    import json
    print(json.dumps(request, indent=2))
```

The output is the exact structure a real API expects: an `instructions` string, a `tools` list, and an `input` list of typed items with `call_id` linkage. Swap in a real client and this request goes straight to the model.

## Connecting to the bigger picture

Chapter 2 called the model with a vague `history`; this chapter makes that call precise and well-ordered. The "stable content first" rule we followed sets up Chapter 5's caching. The `project_instructions` slot is filled by Chapter 9's memory loader. The `skills_summary` slot is filled by Chapter 10. The `tools` list is built by Chapter 6's registry. In other words, this `PromptBuilder` is the socket that almost every later component plugs into.

## Key takeaways

- A model request has three parts worth knowing: layered `instructions`, a list of `tools` (JSON schemas), and an `input` list of structured conversation items.
- Roles carry authority, in order: system, developer, user, assistant.
- Store history as typed items, and link each tool call to its result with a shared `call_id` so the model understands cause and effect.
- Put stable content (instructions, tools) first and variable content (the latest message) last. This is what makes caching possible.
- The model only knows what is in the prompt. Brief it like a sharp colleague who just walked into the room.

Original sources: OpenAI's [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) and Jonathan Fulton's "Inside the Agent Harness" analysis of the Codex codebase.

---

## Review

**Quick Check**

1. What is the correct authority ordering for roles in a model request?
   - A) user > developer > system > assistant
   - B) system > developer > user > assistant
   - C) developer > system > assistant > user
   - D) system > user > developer > assistant
   <details><summary>Answer</summary>B) system > developer > user > assistant - Roles carry authority in decreasing order: system rules outrank developer instructions, which outrank user requests, which outrank the assistant's own past words.</details>

2. Why are tool calls and tool results linked by a shared `call_id`?
   - A) To enforce rate limits on how many tools the model can call per turn
   - B) So the model understands which output came from which command (cause and effect)
   - C) To allow the harness to retry failed tool calls automatically
   - D) To enable the frontend to display tool calls in a collapsible UI
   <details><summary>Answer</summary>B) So the model understands which output came from which command (cause and effect) - Without call_id linkage, if three shell commands ran in parallel, the model would not know which output belonged to which command. The shared call_id ties each result to its request so the model reads the causal relationship correctly.</details>

3. A harness dynamically adds a `view_image` tool only when an image is present in context. You are building a new harness and considering always including all 20 of your tools in every request. What problem does this create?
   - A) The model will error out if tools exceed a fixed limit of 10
   - B) Including irrelevant tools wastes token budget and can confuse the model, since fewer well-described tools beat a giant undifferentiated pile
   - C) The API will reject requests that include tools the model never calls
   - D) Extra tool schemas cause prompt caching to fail entirely
   <details><summary>Answer</summary>B) Including irrelevant tools wastes token budget and can confuse the model, since fewer well-described tools beat a giant undifferentiated pile - The chapter emphasizes that tools should be dynamically included based on permissions, sandbox mode, and context. The design principle is that fewer, well-described tools are better than including everything at once.</details>

4. Your harness appends a new user message to the conversation but also reorganizes the instruction block each turn. After several turns, you notice prompt caching never activates. What is the most likely cause?
   - A) The model does not support caching for conversations longer than 5 turns
   - B) Prompt caching requires a paid tier and is not available by default
   - C) Reorganizing instructions each turn breaks the exact-prefix property that caching depends on
   - D) Caching only works when the tools list is empty
   <details><summary>Answer</summary>C) Reorganizing instructions each turn breaks the exact-prefix property that caching depends on - The chapter explains that previous turns are appended so the old prompt stays an exact prefix of the new one. Stable content (instructions, tools) goes at the front and variable content (latest message) goes at the end. If you reorganize the instruction block, the prefix changes and cached tokens cannot be reused.</details>

5. A developer argues: "Storing history as a flat string like 'User: fix the bug / Assistant: running tests / Tool output: 2 failed' is equivalent to using structured items, since the model sees text either way." Why is this reasoning incorrect?
   - A) Flat strings exceed the context window faster than structured items
   - B) Flat strings cannot represent tool calls at all
   - C) Structured items with typed roles and call_id linkage let the model reason about authority and causality, which a flat string loses
   - D) The API only accepts structured items and will reject flat strings
   <details><summary>Answer</summary>C) Structured items with typed roles and call_id linkage let the model reason about authority and causality, which a flat string loses - The chapter draws a clear distinction: "Here is a detail that separates a toy from a real harness." Typed items carry role tags (so the model knows who said what and with what authority) and call_id linkage (so the model traces which result came from which tool call). A flat string discards both of these structural cues.</details>

**Coding Challenge**

Prompt Layer Assembler

Write a function `assemble_instructions` that takes a list of instruction layers, where each layer is a dict with keys `source` (string) and `text` (string). The function should: (1) join all layer texts with double newlines, wrapping each non-base layer in XML-style tags using the source name (e.g., `<project>...</project>`), and (2) the first layer (index 0) is always the "base" layer and should be included as plain text without tags. Return the assembled string. Then write a function `build_input` that takes an `environment` dict (with keys `cwd` and `shell`) and a list of `history` items (each a dict with `role` and `content`), and returns a list where the first element is an environment context message (role "user", content formatted as `<env><cwd>VALUE</cwd><shell>VALUE</shell></env>`) followed by all history items.

<details><summary>Python Solution</summary>

```python
def assemble_instructions(layers):
    parts = []
    for i, layer in enumerate(layers):
        if i == 0:
            parts.append(layer["text"])
        else:
            tag = layer["source"]
            parts.append(f"<{tag}>\n{layer['text']}\n</{tag}>")
    return "\n\n".join(parts)


def build_input(environment, history):
    env_item = {
        "role": "user",
        "content": (
            f"<env><cwd>{environment['cwd']}</cwd>"
            f"<shell>{environment['shell']}</shell></env>"
        ),
    }
    return [env_item] + list(history)


if __name__ == "__main__":
    layers = [
        {"source": "base", "text": "You are a coding agent."},
        {"source": "project", "text": "Use 4-space indents."},
        {"source": "skills", "text": "Available: shell, file_edit"},
    ]
    print(assemble_instructions(layers))

    env = {"cwd": "/repo", "shell": "bash"}
    hist = [
        {"role": "user", "content": "fix the test"},
        {"role": "assistant", "content": "Running pytest..."},
    ]
    for item in build_input(env, hist):
        print(item)
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function assembleInstructions(layers) {
  const parts = layers.map((layer, i) => {
    if (i === 0) return layer.text;
    const tag = layer.source;
    return `<${tag}>\n${layer.text}\n</${tag}>`;
  });
  return parts.join("\n\n");
}

function buildInput(environment, history) {
  const envItem = {
    role: "user",
    content:
      `<env><cwd>${environment.cwd}</cwd>` +
      `<shell>${environment.shell}</shell></env>`,
  };
  return [envItem, ...history];
}

const layers = [
  { source: "base", text: "You are a coding agent." },
  { source: "project", text: "Use 4-space indents." },
  { source: "skills", text: "Available: shell, file_edit" },
];
console.log(assembleInstructions(layers));

const env = { cwd: "/repo", shell: "bash" };
const hist = [
  { role: "user", content: "fix the test" },
  { role: "assistant", content: "Running pytest..." },
];
buildInput(env, hist).forEach((item) => console.log(item));
```

</details>
