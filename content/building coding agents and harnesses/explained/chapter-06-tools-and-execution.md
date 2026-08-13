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

## Review

**Quick Check**

1. In the six-step tool execution pipeline, what happens immediately after the harness parses the model's JSON arguments?
   - A) It executes the command, since parsing implies the arguments are already correct
   - B) It validates the arguments against the tool's schema, rejecting or repairing bad input
   - C) It truncates the arguments so they fit the context budget
   - D) It captures stdout, stderr, and the exit code
   <details><summary>Answer</summary>B) It validates the arguments against the tool's schema, rejecting or repairing bad input - The pipeline is parse, validate, check permissions, execute, capture output, then truncate and format. Validation comes second so malformed model output produces a clean error instead of a crash or a wrong command.</details>

2. Why is forwarding raw stdout to the model not good enough?
   - A) stdout is usually too short for the model to reason about
   - B) The model cannot parse plain text, only JSON
   - C) A command that prints nothing and exits 0 succeeded while one that prints nothing and exits 1 failed, and stdout alone cannot distinguish them
   - D) stdout is not cacheable, so it busts the prompt cache
   <details><summary>Answer</summary>C) A command that prints nothing and exits 0 succeeded while one that prints nothing and exits 1 failed, and stdout alone cannot distinguish them - The model needs to understand what happened, not just see text. Structured results carry the exit code, timing, and a truncation indicator so success and failure are unambiguous.</details>

3. Token-aware truncation keeps the head and the tail of a long output. Why those two ends?
   - A) They are the cheapest lines to tokenize
   - B) The start usually shows what was attempted and the end usually shows the result or error, while the middle is repetitive noise
   - C) The model reads text from both ends inward
   - D) Providers only cache the first and last lines of a tool result
   <details><summary>Answer</summary>B) The start usually shows what was attempted and the end usually shows the result or error, while the middle is repetitive noise - The chapter's voice-memo analogy makes the point: you want the first sentence ("here's what I tried") and the last ("here's what broke"). The 38 minutes in between rarely change your reply.</details>

4. Codex only exposes its `view_image` tool when an image is actually in play. What general principle does this illustrate?
   - A) Image tools are more expensive to run than text tools
   - B) The available tool list is not fixed; the harness adds and removes tools based on permissions, sandbox mode, and what is present
   - C) Multimodal tools must be registered separately from text tools
   - D) Tools with binary input cannot be described by a JSON schema
   <details><summary>Answer</summary>B) The available tool list is not fixed; the harness adds and removes tools based on permissions, sandbox mode, and what is present - Keeping the tool list small and context-appropriate helps the model choose well and keeps the prompt lean.</details>

5. You are adding twelve new MCP tools to your harness so the model "has more options." Based on this chapter, what are the two costs you should weigh?
   - A) Slower JSON parsing and a larger binary size
   - B) The model has a harder time choosing well, and changing the tool list mid-session busts the prompt cache
   - C) More tools require more sandboxes, and each sandbox needs its own approval policy
   - D) Tool schemas cannot be validated once there are more than ten tools
   <details><summary>Answer</summary>B) The model has a harder time choosing well, and changing the tool list mid-session busts the prompt cache - The chapter's takeaway is to keep the tool list as small and relevant as you can, for both decision quality and cache stability (Chapter 5).</details>

**More Questions**

6. Who actually runs a tool when the model emits a tool call?
   - A) The model, using its own sandboxed interpreter
   - B) The harness, which executes the function the model asked for
   - C) The provider's API, which returns the tool result inline
   - D) The MCP server, in every case
   <details><summary>Answer</summary>B) The harness, which executes the function the model asked for - A tool is just a function the model can *ask* the harness to run, described by a JSON schema. The model never executes anything itself; it only requests.</details>

7. Which steps of the six-step pipeline does this chapter defer to Chapter 7?
   - A) Parsing and validating
   - B) Capturing output and formatting
   - C) Checking permissions, and the safety half of execution (sandboxing)
   - D) Registering tools and emitting their schemas
   <details><summary>Answer</summary>C) Checking permissions, and the safety half of execution (sandboxing) - Chapter 6 covers steps 1, 2, 5, and 6. Step 3 and the sandbox aspect of step 4 belong to the safety chapter, which slots a policy check into the spot `ToolRegistry.call` leaves marked.</details>

8. In the MVP, what does `ToolRegistry.call` return when a required argument is missing?
   - A) It raises a `TypeError` from the handler
   - B) It returns `None` and logs a warning
   - C) It returns a structured error string beginning with `Exit code: 1`
   - D) It retries the call with default arguments filled in
   <details><summary>Answer</summary>C) It returns a structured error string beginning with `Exit code: 1` - Validation happens before dispatch, so a bad call produces a clean, model-readable error rather than a crash. That robustness is the whole point of routing everything through the registry.</details>

9. Which fields appear in the structured result shape the chapter shows for a long command?
   - A) Exit code, wall time, total output lines, and the truncated output
   - B) Only stdout and stderr, concatenated
   - C) A JSON schema plus the raw argument payload
   - D) Token count, cache hit rate, and the model's confidence
   <details><summary>Answer</summary>A) Exit code, wall time, total output lines, and the truncated output - The total-lines field doubles as the truncation indicator: the model can see that 5,000 lines existed even though it only received 200 of them.</details>

10. Your harness connects to four MCP servers, but a session usually touches only one of them. Which technique from the chapter addresses the context cost?
    - A) Truncating each tool's description to one sentence
    - B) Deferring MCP tool schemas and loading them on demand, so idle servers do not eat context
    - C) Registering all four servers under a single tool name
    - D) Running each server in its own sandbox
    <details><summary>Answer</summary>B) Deferring MCP tool schemas and loading them on demand, so idle servers do not eat context - This is what Claude Code does, and it is the same "keep the tool list small and relevant" principle applied to schemas rather than to tools themselves.</details>

**Think About It**

Imagine an agent that runs `pytest -q`, gets back an empty string, and confidently reports "all tests pass." What went wrong, and why is this failure mode almost inevitable if you forward raw stdout?

<details><summary>Show answer</summary>
Quiet-on-success is a Unix convention, so an empty result genuinely can mean "everything worked." But a crashed test runner, a missing binary, or a syntax error can also produce nothing on stdout while writing to stderr or simply exiting non-zero. If your tool result is just stdout, both cases arrive at the model as the identical empty string, and the model has no evidence to distinguish them, so it picks the optimistic reading. The fix is not a smarter model but a better message: attach the exit code, the wall time, and the line count so the two situations look different. This is why the chapter insists that structured results, not raw text, are what make an agent look smarter.
</details>

You throw away 96% of a 5,000-line log before showing it to the model, and the agent gets *better* at diagnosing failures. Why does deleting most of the evidence help?

<details><summary>Show answer</summary>
Context is a fixed budget (Chapter 4), so a giant log does not just cost money, it crowds out the conversation, the instructions, and the model's own reasoning space. The middle of a log is also where the least information lives: it is usually repetition, progress ticks, or the same warning a thousand times. The head tells you what was attempted and the tail tells you how it ended, which is nearly all of the diagnostic signal. Keeping head and tail while marking how many lines were omitted preserves the signal, preserves the model's awareness that something was cut, and returns the budget to the work that needs it.
</details>

More tools should mean a more capable agent, yet the chapter tells you to keep the tool list small. Why would adding a useful tool ever make your agent worse?

<details><summary>Show answer</summary>
Two costs compete with capability. First, every tool's schema sits in the prompt, so an unused tool is a permanent tax on context and on the choice the model has to make each turn; more near-duplicate options mean more chances to pick the wrong one. Second, the tool list lives in the cached prefix, so adding or removing a tool mid-session invalidates the cache and makes the next turn dramatically more expensive (Chapter 5). That is why harnesses do something cleverer than "register everything": Codex exposes `view_image` only when an image exists, and Claude Code defers MCP schemas until a server is actually used. The goal is not fewer capabilities but fewer capabilities *loaded at once*.
</details>

**Coding Challenge**

Structured Tool Result

Build a function `truncate_middle(text, head, tail)` that keeps the first `head` and last `tail` lines of a multi-line string and replaces the middle with a marker naming how many lines were omitted (returning the text unchanged when it is short enough). Then build `format_tool_result(exit_code, stdout, stderr, seconds)` that returns a structured, model-readable string containing the exit code, a `status` line of `success` or `failure` derived from the exit code, the wall time, the total line count of the combined output, and the truncated output. The point is that an empty output with a non-zero exit code must still read unambiguously as a failure.

<details><summary>Python Solution</summary>

```python
def truncate_middle(text: str, head: int = 3, tail: int = 3) -> str:
    lines = text.splitlines()
    if len(lines) <= head + tail:
        return text
    omitted = len(lines) - head - tail
    return "\n".join(lines[:head] + [f"... ({omitted} lines omitted) ..."] + lines[-tail:])


def format_tool_result(exit_code: int, stdout: str, stderr: str, seconds: float) -> str:
    combined = (stdout or "") + (stderr or "")
    total_lines = len(combined.splitlines())
    status = "success" if exit_code == 0 else "failure"
    body = truncate_middle(combined) if combined else "(no output)"
    return (f"Exit code: {exit_code}\n"
            f"Status: {status}\n"
            f"Wall time: {seconds:.2f} seconds\n"
            f"Total output lines: {total_lines}\n"
            f"Output:\n{body}")


# --- demo ---
if __name__ == "__main__":
    long_log = "\n".join(f"line {i}" for i in range(1, 21))
    print(format_tool_result(0, long_log, "", 1.234))
    print("---")
    # The dangerous case: nothing printed, but it failed.
    print(format_tool_result(1, "", "", 0.02))
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function truncateMiddle(text, head = 3, tail = 3) {
  const lines = text.split("\n");
  if (lines.length <= head + tail) return text;
  const omitted = lines.length - head - tail;
  return [
    ...lines.slice(0, head),
    `... (${omitted} lines omitted) ...`,
    ...lines.slice(-tail),
  ].join("\n");
}

function formatToolResult(exitCode, stdout, stderr, seconds) {
  const combined = (stdout || "") + (stderr || "");
  const totalLines = combined ? combined.split("\n").length : 0;
  const status = exitCode === 0 ? "success" : "failure";
  const body = combined ? truncateMiddle(combined) : "(no output)";
  return [
    `Exit code: ${exitCode}`,
    `Status: ${status}`,
    `Wall time: ${seconds.toFixed(2)} seconds`,
    `Total output lines: ${totalLines}`,
    `Output:\n${body}`,
  ].join("\n");
}

// --- demo ---
const longLog = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join("\n");
console.log(formatToolResult(0, longLog, "", 1.234));
console.log("---");
// The dangerous case: nothing printed, but it failed.
console.log(formatToolResult(1, "", "", 0.02));
```

</details>
