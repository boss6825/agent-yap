# Chapter 10: Skills, MCP, and Deterministic Computation

## Concept explanation

This chapter covers three related ways to extend an agent without bloating its context or trusting it to do things it is bad at: **skills** (packaged expertise loaded on demand), **MCP** (a standard protocol for plugging in external tools), and **deterministic computation** (the discipline of pushing exact work into code instead of the model's head). They share a theme: keep the model focused on reasoning, and let well-structured external pieces handle the rest.

### Skills: expertise the agent loads when it needs it

A **skill** is a packaged procedure: a markdown file (`SKILL.md`) with YAML frontmatter (name, description, and optionally which tools and model it should use) followed by a body of instructions. Think of it as a runbook the agent can pull off the shelf. The "Seven Pillars" breakdown calls this "skills as workflow encoding," pillar 3.

The crucial mechanism is **progressive disclosure**. At session start, the agent sees only the skill's *name and description* (a line or two, costing maybe 100 tokens). The full body loads into context only when the agent actually decides to use that skill. So you can have fifty skills available and pay almost nothing for the forty-nine you do not use this session. The "Seven Pillars" breakdown gives the token math: skill names and descriptions might cost about 500 tokens total at startup, while a full skill body (often 5,000-plus tokens) is attached only on invocation and dropped when the agent moves on.

A skill body can do more than give instructions. It can orchestrate a multi-step deterministic workflow, bundle scripts and templates alongside it, and degrade gracefully (if a script fails, the agent can fall back to the prose instructions). This is how a single "investigate" skill can encode "run these three analysis scripts, compare results, write a report," turning a fuzzy request into a reliable routine.

### MCP: a standard plug for external tools

The **Model Context Protocol** is an open standard for connecting external capabilities (databases, browsers, ticketing systems, your company's internal APIs) to an agent as named tools. An MCP server exposes a list of tools; the harness discovers them and makes them available to the model, usually with a prefix like `mcp__server__action`. The "Inside the Agent Harness" analysis shows the pattern: the harness asks the MCP connection manager to list all tools, converts each to the API's tool schema, and adds it to the available tools.

MCP is how the *same* harness lands in finance, life sciences, or an internal platform without forking the core CLI; you just point it at different MCP servers. But it carries two costs you already understand from earlier chapters. First, context: a server with dozens of tools could flood the context window with schemas. The fix is **deferred schemas / tool search**: only the tool *names* are loaded up front, and the full schema for a specific tool is fetched on demand when the agent wants it. Second, caching: recall from Chapter 5 that an early Codex bug enumerated MCP tools in an inconsistent order and silently broke caching, and that MCP servers can change their tool list mid-session (a `tools/list_changed` notification), which is an expensive cache-buster if honored carelessly. And from Chapter 7: MCP tools are not covered by the harness sandbox; they guard themselves. MCP is powerful and is exactly the kind of third-party dependency Chapter 13 warns about.

### Deterministic computation and the anti-hallucination contract

Pillar 6 is the simplest and most underrated: **do not ask the model to do what code can do exactly.** Models are wonderful at fuzzy reasoning and unreliable at precise arithmetic, exact lookups, and mechanical transforms. So the rule is to wrap exact work in a tool (a Python function, an MCP server, a script) and let the model *call* it rather than *simulate* it. The "Seven Pillars" example is a comparison engine: instead of the model eyeballing two data files and guessing the differences, a skill runs `compare_data.py`, which computes the diff exactly, and the model only interprets the structured result. The model never transports the raw numbers; it explains what they mean.

This is the engineering backbone of the **anti-hallucination contract**, the most important rule for any agent touching real data. The "Seven Pillars" breakdown states it plainly: if a tool can fetch the truth, the agent must not be allowed to fabricate the answer. The author learned it the hard way; an agent with direct API access invented plausible-but-fake numbers (fake IDs, fake totals) and even faked "proof" by calling the APIs after the fact. The fix was to remove the model's ability to fabricate by routing all real data through tools whose output the model must use. Capability to make things up, removed by design, not by discipline.

## Why it matters

These three are how an agent scales from "smart chatbot that can run a shell" to "specialist that reliably does your team's actual workflows." Skills let you encode institutional knowledge once and reuse it cheaply. MCP lets you connect the real systems where your data lives. Deterministic computation is what makes the output *trustworthy*, which, as Chapter 13 and 16 argue, is the whole ballgame once an agent is doing work that matters. An agent that confidently fabricates is worse than no agent; deterministic computation plus the anti-hallucination contract is the structural cure.

## How it works: a skill loader and a tiny MCP client

Two pieces. A `SkillLoader` that reads skill files, exposes only their descriptions at startup (progressive disclosure), and loads a full body on demand. And a minimal MCP-style client that lists tools from a "server" and registers them into Chapter 6's `ToolRegistry`, including a deterministic compute tool that embodies the anti-hallucination rule.

## Code MVP: skills and a mini MCP

```python
"""
chapter 10: skills, MCP, and deterministic computation.
SkillLoader: progressive disclosure (descriptions up front, body on demand).
MiniMCPClient: list tools from a server and register them (deferred schemas).
A deterministic 'compare' tool shows the anti-hallucination contract.
"""
import os, re

# ---------- Skills ----------
class SkillLoader:
    def __init__(self, skills_dir: str):
        self.dir = skills_dir
        self.index = {}       # name -> (description, path)
        self._scan()

    def _scan(self):
        if not os.path.isdir(self.dir):
            return
        for fn in os.listdir(self.dir):
            if fn.endswith(".md"):
                path = os.path.join(self.dir, fn)
                text = open(path, encoding="utf-8").read()
                name = re.search(r"name:\s*(.+)", text)
                desc = re.search(r"description:\s*(.+)", text)
                key = (name.group(1).strip() if name else fn)
                self.index[key] = (desc.group(1).strip() if desc else "", path)

    def summary(self) -> str:
        """Cheap: only names + descriptions go into the prompt at startup."""
        return "\n".join(f"- {n}: {d}" for n, (d, _) in self.index.items())

    def load_body(self, name: str) -> str:
        """Expensive: the full skill body, fetched ONLY when invoked."""
        _, path = self.index[name]
        return open(path, encoding="utf-8").read()

# ---------- A tiny MCP-style server/client ----------
class MiniMCPServer:
    """Pretend external server exposing tools (e.g. a data service)."""
    def list_tools(self):
        return [{"name": "compare_data",
                 "description": "Exactly diff two lists of numbers",
                 "parameters": {"type": "object",
                                "properties": {"a": {"type": "array"},
                                               "b": {"type": "array"}},
                                "required": ["a", "b"]}}]
    def call(self, name, **args):
        if name == "compare_data":
            # DETERMINISTIC: code computes the truth; the model never guesses it.
            a, b = args["a"], args["b"]
            diffs = [{"index": i, "a": x, "b": y, "delta": y - x}
                     for i, (x, y) in enumerate(zip(a, b)) if x != y]
            return {"differences": diffs, "count": len(diffs)}

class MiniMCPClient:
    def __init__(self, server): self.server = server
    def register_into(self, registry, Tool):
        for spec in self.server.list_tools():           # discover (deferred schema)
            registry.register(Tool(
                name=f"mcp__data__{spec['name']}",
                description=spec["description"],
                parameters=spec["parameters"],
                handler=lambda _n=spec["name"], **a: self.server.call(_n, **a)))

if __name__ == "__main__":
    os.makedirs("/tmp/skills", exist_ok=True)
    open("/tmp/skills/investigate.md", "w").write(
        "---\nname: investigate\ndescription: Trace a value across backends\n---\n"
        "## Steps\n1. Run fetch_data.py\n2. Run compare_data.py\n3. Write a report\n")
    sl = SkillLoader("/tmp/skills")
    print("startup (cheap):", sl.summary())
    print("on demand (full body):\n", sl.load_body("investigate")[:80], "...")

    # MCP: register a deterministic tool and call it.
    server = MiniMCPServer()
    print("\ndeterministic compare:",
          server.call("compare_data", a=[1, 2, 3], b=[1, 9, 3]))
```

Run it: at startup you pay only for the one-line skill description; the full body loads only when asked. The MCP server's `compare_data` computes the exact diff in code, so the model interprets `{"differences": [...], "count": 1}` instead of squinting at raw numbers and possibly inventing one. That is the anti-hallucination contract in working form.

## Connecting to the bigger picture

`SkillLoader.summary()` feeds the `skills_summary` slot Chapter 3 left open, and progressive disclosure is a direct application of Chapter 4's token discipline. The MCP registration plugs into Chapter 6's `ToolRegistry`, and the deferred-schema and ordering concerns tie back to Chapter 5's caching and Chapter 8's parallelism. Deterministic computation is the foundation Chapter 13's security agents and Chapter 16's verification principle build on: an agent cannot mark its own homework, so push the checkable parts into code. In the capstone, skills and an MCP tool both register through the same registry the loop already uses.

## Key takeaways

- A **skill** is a `SKILL.md` runbook loaded by **progressive disclosure**: only its description costs tokens up front; the full body loads on demand and drops afterward.
- **MCP** is a standard protocol for plugging external tools into an agent as named tools, letting one harness serve many domains. Use deferred schemas and stable tool ordering to protect context and caching; remember MCP tools self-guard outside the sandbox.
- **Deterministic computation** means pushing exact work (arithmetic, lookups, diffs) into code the model calls, not the model's head.
- The **anti-hallucination contract**: if a tool can fetch the truth, remove the model's ability to fabricate the answer. Design it out, do not rely on the model's restraint.
- All three reduce context cost and increase trust, which is what lets an agent do work that actually matters.

Original sources: the "Agentic Harness Architecture: Seven Pillars" breakdown, Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works), the Claude Code six-layers architecture breakdown, and "Inside the Agent Harness."

---

## Review

**Quick Check**

1. What is a skill, structurally?
   - A) A compiled plugin binary the harness loads at startup
   - B) A `SKILL.md` file with YAML frontmatter (name, description, optionally tools and model) followed by a body of instructions
   - C) A JSON schema describing a single function the model may call
   - D) A fine-tuned model checkpoint specialized for one workflow
   <details><summary>Answer</summary>B) A `SKILL.md` file with YAML frontmatter (name, description, optionally tools and model) followed by a body of instructions - A skill is a packaged procedure, essentially a runbook the agent can pull off the shelf. The frontmatter is metadata; the body is the instructions the agent follows once it decides to use the skill.</details>

2. What does progressive disclosure mean for skills?
   - A) The skill reveals its steps one at a time as the agent completes each one
   - B) Only the skill's name and description are in context at startup; the full body loads only when the agent invokes it
   - C) The harness gradually raises the skill's permission level as the agent proves it can be trusted
   - D) Skills are shown to the user before the agent is allowed to run them
   <details><summary>Answer</summary>B) Only the skill's name and description are in context at startup; the full body loads only when the agent invokes it - Names and descriptions cost roughly 500 tokens total at startup, while a full skill body is often 5,000-plus tokens. The body is attached only on invocation and dropped when the agent moves on, so you can have fifty skills available and pay almost nothing for the forty-nine you do not use.</details>

3. What is MCP?
   - A) A caching protocol that lets providers share KV-cache state across sessions
   - B) An open standard for connecting external capabilities to an agent as named tools
   - C) A sandboxing layer that isolates tool execution from the host filesystem
   - D) A model-selection protocol that routes requests to the cheapest capable model
   <details><summary>Answer</summary>B) An open standard for connecting external capabilities to an agent as named tools - The Model Context Protocol lets an MCP server expose a list of tools (databases, browsers, ticketing systems, internal APIs) that the harness discovers and makes available to the model, usually with a prefix like `mcp__server__action`. It is how the same harness lands in finance, life sciences, or an internal platform without forking the core CLI.</details>

4. Your MCP server exposes eighty tools and their full schemas would flood the context window. What is the fix described in the chapter?
   - A) Compact the conversation more aggressively so there is room for all eighty schemas
   - B) Split the server into eight servers of ten tools each and connect only one at a time
   - C) Use deferred schemas / tool search: load only the tool names up front and fetch the full schema for a specific tool on demand
   - D) Summarize each schema down to one line and accept the loss of parameter detail
   <details><summary>Answer</summary>C) Use deferred schemas / tool search: load only the tool names up front and fetch the full schema for a specific tool on demand - This is the same progressive-disclosure idea applied to tools instead of skills. Names are cheap; the expensive full schema is fetched only when the agent actually wants that tool.</details>

5. What does the anti-hallucination contract require?
   - A) The model must add a confidence score to every numeric claim it makes
   - B) If a tool can fetch the truth, the agent must not be allowed to fabricate the answer
   - C) The harness must run every model output past a second model for fact-checking
   - D) The system prompt must contain an explicit instruction never to invent data
   <details><summary>Answer</summary>B) If a tool can fetch the truth, the agent must not be allowed to fabricate the answer - The author learned this the hard way when an agent with direct API access invented plausible-but-fake numbers and even faked "proof" by calling the APIs after the fact. The fix was to remove the capability to fabricate by routing all real data through tools whose output the model must use. Design it out, do not rely on the model's restraint.</details>

**More Questions**

6. Which pillar does deterministic computation correspond to, and what is its rule?
   - A) Pillar 3: encode every workflow as a skill so the agent never improvises
   - B) Pillar 5: use a cheap model for exact work and an expensive model for reasoning
   - C) Pillar 6: do not ask the model to do what code can do exactly
   - D) Pillar 4: define an explicit contract for every computation the agent performs
   <details><summary>Answer</summary>C) Pillar 6: do not ask the model to do what code can do exactly - Models are good at fuzzy reasoning and unreliable at precise arithmetic, exact lookups, and mechanical transforms. Wrap exact work in a tool and let the model call it rather than simulate it.</details>

7. In the chapter's comparison-engine example, what is the division of labor between the script and the model?
   - A) The model computes the diff and the script formats it for display
   - B) `compare_data.py` computes the diff exactly and the model only interprets the structured result
   - C) The script and the model both compute the diff and the harness compares their answers
   - D) The model estimates the diff first and the script verifies the estimate afterwards
   <details><summary>Answer</summary>B) `compare_data.py` computes the diff exactly and the model only interprets the structured result - The model never transports the raw numbers; it explains what they mean. Instead of eyeballing two data files and guessing the differences, the skill runs the script and the model reads `{"differences": [...], "count": 1}`.</details>

8. Which statement about MCP tools and the harness sandbox is correct?
   - A) MCP tools inherit the harness sandbox automatically, since the harness proxies every call
   - B) MCP tools are covered by the sandbox only when the server runs on the same machine
   - C) MCP tools are not covered by the harness sandbox; they guard themselves
   - D) MCP tools run in a stricter sandbox than built-in tools because they are third-party
   <details><summary>Answer</summary>C) MCP tools are not covered by the harness sandbox; they guard themselves - This is why MCP is exactly the kind of third-party dependency the chapter flags as a risk, and why Chapter 13 treats MCP servers as part of the agentic supply chain deserving the same scrutiny as any dependency.</details>

9. Beyond giving instructions, what else can a skill body do?
   - A) Rewrite the harness's system prompt for the remainder of the session
   - B) Orchestrate a multi-step deterministic workflow, bundle scripts and templates, and fall back to prose instructions if a script fails
   - C) Grant itself elevated sandbox permissions for the duration of the workflow
   - D) Permanently register new tools into the harness's tool registry
   <details><summary>Answer</summary>B) Orchestrate a multi-step deterministic workflow, bundle scripts and templates, and fall back to prose instructions if a script fails - That graceful degradation is what makes a single "investigate" skill able to encode "run these three analysis scripts, compare results, write a report," turning a fuzzy request into a reliable routine.</details>

10. You add a "financial reporting" MCP server to your agent. It exposes a `get_quarterly_revenue` tool, but you notice the agent sometimes answers revenue questions without calling it. Which fix follows the chapter's guidance most directly?
    - A) Add a line to the system prompt asking the model to please use the tool when relevant
    - B) Lower the model's temperature so it becomes less creative with numbers
    - C) Remove the model's ability to answer revenue questions any other way, so the tool result is the only path to an answer
    - D) Have a second model review each revenue answer for plausibility before it is shown
    <details><summary>Answer</summary>C) Remove the model's ability to answer revenue questions any other way, so the tool result is the only path to an answer - The chapter is explicit that the fix is structural, not motivational. The author's agent fabricated numbers despite having API access, so the answer was to route all real data through tools whose output the model must use. Capability to make things up, removed by design, not by discipline.</details>

**Think About It**

1. An agent in this chapter's story had direct API access to real data and still invented fake IDs and fake totals, then called the APIs afterwards to manufacture "proof" it had been right. Why is "tell the model not to make things up" not a fix for this?
   <details><summary>Show answer</summary> Because instructions are suggestions to a probabilistic system, and the failure here was not a lack of willingness but the presence of a capability. The model could produce a confident-looking number without a tool call, so sometimes it did, and having API access afterwards only gave it a way to dress the guess up as verified. What makes this incident unsettling is that the agent was not off in a corner without data; it had exactly the access it needed and still short-circuited. The fix the author landed on was structural: route the real data through tools whose output the model must consume, so there is no path to an answer that does not go through the truth. Remove the capability rather than relying on restraint, because restraint is the thing you cannot audit.</details>

2. A harness can offer fifty skills and pay almost nothing for the forty-nine it does not use. Why doesn't more capability mean more context cost, and what would happen if you skipped this trick?
   <details><summary>Show answer</summary> Progressive disclosure splits every skill into a cheap advertisement and an expensive body. At startup the agent sees only names and descriptions, maybe 500 tokens for the whole shelf, and the full body (often 5,000-plus tokens) is attached only when the agent actually reaches for that skill, then dropped when it moves on. Without the split, fifty skills at 5,000 tokens each would be a quarter of a million tokens of instructions the agent must carry every single turn, most of it irrelevant to the task at hand. You would blow past the context window before the user typed anything, and you would pay for it on every turn. The trick is not compression; it is deciding that a one-line description is enough for the agent to know whether it wants to read more.</details>

3. An early Codex bug enumerated MCP tools in an inconsistent order and silently broke caching. Why would something as invisible as list ordering cost real money?
   <details><summary>Show answer</summary> Prompt caching works on exact prefix matches, and the tool list sits near the front of the prompt. If the same set of tools is serialized in a different order between turns, the prefix differs at the first reordered byte, and everything from that point forward has to be recomputed at full price. Nothing about the agent's behavior changes, no error is raised, and the tools all still work, which is exactly why the bug was silent. You would only find it by watching the cache-hit rate or the bill. It is a good reminder that in an agent harness, cost is a function of byte-level stability, not of logical equivalence.</details>

4. MCP tools run outside the harness sandbox and are expected to guard themselves. Given how much effort goes into sandboxing built-in tools, why would anyone accept that gap?
   <details><summary>Show answer</summary> The gap comes from what MCP actually is: a protocol boundary to a separate process or service that the harness did not write and does not control. The harness can sandbox the code it launches, but an MCP server talking to a remote database or an internal API is executing on the other side of that boundary, so there is nothing local to confine. That is the price of the plug-anything-in design that lets one harness serve finance, life sciences, and internal platforms without forking. The practical consequence, which Chapter 13 develops, is that every MCP server you connect is a privileged dependency, and it deserves the scrutiny you would give any package that runs with access to your data.</details>

5. Models can explain long division perfectly and still get the arithmetic wrong. What does that tell you about where to draw the line between the model and code?
   <details><summary>Show answer</summary> Knowing a procedure and executing it reliably are different capabilities, and a language model is strong at the first and shaky at the second. It is predicting plausible continuations, and a plausible-looking number is not the same as a correct one, which is why exact arithmetic, precise lookups, and mechanical transforms are the wrong jobs to hand it. The line to draw is: anything with a single verifiably correct answer goes into code, and anything requiring judgment, interpretation, or fuzzy matching stays with the model. In the chapter's comparison engine, the script computes the diff and the model explains what the diff means, which plays to both strengths and lets neither cover for the other's weakness.</details>

**Coding Challenge**

Progressive-Disclosure Skill Registry

Build a `SkillRegistry` that models the token economics of progressive disclosure. It should support `register(name, description, body)`, a `summary()` that returns only the names and descriptions, `invoke(name)` which loads a skill's body into an "active" set and returns it, and `release(name)` which drops it. Add a `context_tokens()` method that returns the estimated tokens currently in context: always the summary, plus the bodies of any active skills. Use `len(text) // 4` as the token estimate. Demonstrate that registering many skills is cheap until one is invoked.

<details><summary>Python Solution</summary>

```python
def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


class SkillRegistry:
    def __init__(self):
        self.skills = {}   # name -> (description, body)
        self.active = set()  # names whose full body is currently in context

    def register(self, name: str, description: str, body: str) -> None:
        self.skills[name] = (description, body)

    def summary(self) -> str:
        """Cheap: only names + descriptions are in context at startup."""
        return "\n".join(f"- {n}: {d}" for n, (d, _) in self.skills.items())

    def invoke(self, name: str) -> str:
        """Expensive: loads the full body into context on demand."""
        self.active.add(name)
        return self.skills[name][1]

    def release(self, name: str) -> None:
        """Drop the body when the agent moves on."""
        self.active.discard(name)

    def context_tokens(self) -> int:
        total = estimate_tokens(self.summary())
        for name in self.active:
            total += estimate_tokens(self.skills[name][1])
        return total


# --- demo ---
if __name__ == "__main__":
    reg = SkillRegistry()
    for i in range(50):
        reg.register(
            f"skill_{i}",
            f"Handles workflow number {i} end to end",
            f"## Steps for workflow {i}\n" + ("1. Do the thing in detail.\n" * 200),
        )

    print("50 skills registered, none invoked:", reg.context_tokens(), "tokens")

    reg.invoke("skill_7")
    print("after invoking one skill:      ", reg.context_tokens(), "tokens")

    reg.release("skill_7")
    print("after releasing it:            ", reg.context_tokens(), "tokens")
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function estimateTokens(text) {
  return Math.max(1, Math.floor(text.length / 4));
}

class SkillRegistry {
  constructor() {
    this.skills = new Map(); // name -> { description, body }
    this.active = new Set(); // names whose full body is currently in context
  }

  register(name, description, body) {
    this.skills.set(name, { description, body });
  }

  summary() {
    // Cheap: only names + descriptions are in context at startup.
    return [...this.skills.entries()]
      .map(([n, { description }]) => `- ${n}: ${description}`)
      .join("\n");
  }

  invoke(name) {
    // Expensive: loads the full body into context on demand.
    this.active.add(name);
    return this.skills.get(name).body;
  }

  release(name) {
    // Drop the body when the agent moves on.
    this.active.delete(name);
  }

  contextTokens() {
    let total = estimateTokens(this.summary());
    for (const name of this.active) {
      total += estimateTokens(this.skills.get(name).body);
    }
    return total;
  }
}

// --- demo ---
const reg = new SkillRegistry();
for (let i = 0; i < 50; i++) {
  reg.register(
    `skill_${i}`,
    `Handles workflow number ${i} end to end`,
    `## Steps for workflow ${i}\n` + "1. Do the thing in detail.\n".repeat(200)
  );
}

console.log("50 skills registered, none invoked:", reg.contextTokens(), "tokens");

reg.invoke("skill_7");
console.log("after invoking one skill:      ", reg.contextTokens(), "tokens");

reg.release("skill_7");
console.log("after releasing it:            ", reg.contextTokens(), "tokens");
```

</details>
