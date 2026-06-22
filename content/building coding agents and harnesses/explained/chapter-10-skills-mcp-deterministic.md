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
