# Chapter 6: Tools and Tool Execution

## Concept explanation

Tools are what make an agent agentic. Without them, the model can only talk. With them, it can read your code, edit files, run commands, search the web, and call external services. Anthropic groups the built-in tools into five families: file operations, search, execution, web, and code intelligence. But the families matter less than the mechanism: a tool is just a function the model can *ask* the harness to run, described to the model by a JSON schema (Chapter 3), and executed by the harness (never by the model itself).

In Chapter 2 we ran a tool with a single line: `output = TOOLS[name](**args)`. That is fine for a demo and dangerous for anything real. A production tool call goes through a pipeline. The "Inside the Agent Harness" analysis lays out the six steps the harness performs when the model returns a tool call:

1. **Parse the arguments.** The model returns JSON; the harness must parse it.
2. **Validate against the schema.** Does the JSON match what the tool expects? Reject or repair if not.
3. **Check permissions.** Is this allowed, or does it need approval? (Chapter 7.)
4. **Execute.** Run it, ideally in a sandbox (Chapter 7).
5. **Capture output.** Standard output, standard error, exit code, and timing.
6. **Truncate if needed, then format** the result so the model can read success or failure clearly.

Steps 1, 2, 5, and 6 are this chapter. Steps 3 and 4's safety half is Chapter 7.

### Structured outputs, not raw stdout

A theme worth hammering: the model needs to understand *what happened*, not just see a wall of text. Raw stdout is not enough. The "Inside the Agent Harness" piece is explicit that structured tool outputs are critical: you want the exit code, the timing, a truncation indicator, and clear success or failure signals. A command that prints nothing and exits 0 succeeded; a command that prints nothing and exits 1 failed. If you only forward stdout, the model cannot tell those apart. So wrap results in a small structure.

Here is the shape Codex uses for a long command's result:

```text
Exit code: 0
Wall time: 1.23 seconds
Total output lines: 5000
Output:
[first 100 lines...]
... (4800 lines omitted) ...
[last 100 lines...]
```

### Truncation: keep the head and the tail

Tool outputs can be enormous, and a 5,000-line log would blow the context budget (Chapter 4) all by itself. The clever move, which Codex calls token-aware truncation, is to preserve the **beginning and the end** while eliding the middle. Why those ends? Because the start of a log usually shows what was attempted and the end usually shows the result or the error. The middle is repetitive noise. A real-life analogy: if a friend sends you a 40-minute voice memo, you mostly want the first sentence ("here's what I tried") and the last ("and here's what broke"). The 38 minutes in the middle rarely change your reply.

### Tools change with context

The available tools are not fixed. The harness adds and removes them based on permissions, sandbox mode, and what is present. Codex only exposes a `view_image` tool when an image is in play. Claude Code defers MCP tool schemas and loads them on demand (Chapter 10) so idle servers do not eat context. The takeaway for a builder: keep the tool list as small and relevant as you can, both to help the model choose well and to protect your cache (changing the tool list mid-session is a cache-buster, per Chapter 5).

## Why it matters

Tools are the single biggest lever on what an agent can accomplish, and the tool *execution pipeline* is where a toy quietly becomes a product. The difference between an agent that flails and one that works is rarely the model; it is usually whether tool results are structured, truncated, and clearly signal success or failure. Get this layer right and the model suddenly looks much smarter, because it can finally tell what its own actions did.

## How it works: a registry plus a disciplined runner

Two pieces. A **registry** holds the tools and their schemas, validates arguments, and dispatches calls. A **runner** for the shell tool executes the command and packages a structured, truncated result. Everything routes through the registry so that Chapter 7 can slip a permission check in front of execution with a one-line change.

## Code MVP: a tool registry and a shell tool

```python
"""
chapter 06: tools and tool execution.
A tool registry with schema validation, plus a shell tool that returns a
STRUCTURED, TRUNCATED result (exit code, timing, head+tail of output).
This is the agent's hands; the capstone plugs Chapter 7's approvals in front.
"""
import subprocess, time
from dataclasses import dataclass
from typing import Callable

# --- Truncation: keep the head and tail, elide the noisy middle ---
def truncate_output(text: str, head: int = 50, tail: int = 50) -> str:
    lines = text.splitlines()
    if len(lines) <= head + tail:
        return text
    omitted = len(lines) - head - tail
    return "\n".join(lines[:head] + [f"... ({omitted} lines omitted) ..."] + lines[-tail:])

# --- A structured result the model can actually reason about ---
def format_result(exit_code: int, output: str, seconds: float) -> str:
    total_lines = len(output.splitlines())
    return (f"Exit code: {exit_code}\n"
            f"Wall time: {seconds:.2f} seconds\n"
            f"Total output lines: {total_lines}\n"
            f"Output:\n{truncate_output(output)}")

@dataclass
class Tool:
    name: str
    description: str
    parameters: dict          # JSON schema (Chapter 3)
    handler: Callable         # the function that does the work

class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def schemas(self) -> list:
        """The 'tools' field for the prompt (Chapter 3)."""
        return [{"type": "function", "name": t.name,
                 "description": t.description, "parameters": t.parameters}
                for t in self._tools.values()]

    def validate(self, name: str, args: dict) -> str | None:
        """Cheap schema check: required keys present? Returns an error or None."""
        tool = self._tools.get(name)
        if tool is None:
            return f"Unknown tool: {name}"
        required = tool.parameters.get("required", [])
        missing = [k for k in required if k not in args]
        return f"Missing required args: {missing}" if missing else None

    def call(self, name: str, args: dict) -> str:
        error = self.validate(name, args)           # step 1 & 2: parse + validate
        if error:
            return f"Exit code: 1\nError: {error}"
        # step 3 (permissions) is inserted here by Chapter 7.
        return self._tools[name].handler(**args)    # step 4: execute

# --- The shell tool itself: execute, capture, time, format ---
def shell_handler(command: str, timeout_ms: int = 10000) -> str:
    start = time.time()
    try:
        proc = subprocess.run(command, shell=True, capture_output=True,
                              text=True, timeout=timeout_ms / 1000)
        combined = proc.stdout + proc.stderr            # step 5: capture
        return format_result(proc.returncode, combined, time.time() - start)
    except subprocess.TimeoutExpired:
        return format_result(124, "Command timed out", time.time() - start)

if __name__ == "__main__":
    registry = ToolRegistry()
    registry.register(Tool(
        name="shell", description="Run a shell command",
        parameters={"type": "object",
                    "properties": {"command": {"type": "string"},
                                   "timeout_ms": {"type": "number"}},
                    "required": ["command"]},
        handler=shell_handler))

    print(registry.call("shell", {"command": "echo hi && seq 1 200"}))
    print("---")
    print(registry.call("shell", {}))   # missing required arg -> clean error
```

Run it and you will see a structured result with an exit code, a wall time, and the 200-line output neatly truncated to its head and tail. Call it with bad arguments and you get a clean validation error instead of a crash. That robustness is the whole point.

## Connecting to the bigger picture

This registry is the same one Chapter 3's `PromptBuilder` reads schemas from (`registry.schemas()`), and the same one Chapter 2's loop calls into. Chapter 7 inserts a permission check at the marked spot, turning `call` into a safe gate. Chapter 8 runs several `call`s in parallel. Chapter 10's MCP tools register themselves into this exact registry. In the capstone, this file barely changes; it is the agent's hands, and most other chapters either add tools to it or wrap it.

## Key takeaways

- A tool is a harness-run function described to the model by a JSON schema. The model asks; the harness executes.
- The execution pipeline is parse, validate, check permissions, execute, capture, truncate and format. Skipping the middle steps is what makes toy agents brittle.
- Return **structured** results: exit code, timing, and a clear success or failure signal, not just raw stdout.
- **Truncate** huge outputs by keeping the head and the tail and eliding the middle, where the signal usually lives at the ends.
- Keep the tool list small and context-appropriate; it helps the model choose and protects your prompt cache.

Original source: Jonathan Fulton's "Inside the Agent Harness" analysis of the Codex codebase, plus Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works).
