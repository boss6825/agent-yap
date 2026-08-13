# Chapter 7: Sandboxing, Approvals, and Checkpoints

## Concept explanation

An agent that can run arbitrary shell commands is, by definition, an agent that can do real damage: delete files, leak secrets, hit the network, push to production. Safety is not a nice-to-have here; the "Inside the Agent Harness" analysis calls it "table stakes." This chapter covers the three controls that make running a tool-using agent sane: **sandboxing** (limit what a command physically can do), **approvals** (decide what runs without asking), and **checkpoints** (undo what went wrong). Together they are the "input" layer (layer 1) and a big part of why delegation feels safe rather than terrifying.

### Sandboxing: a fence around execution

A sandbox restricts what an executed command can touch (which files, whether it can reach the network) at the operating-system level, so even if the model asks for something destructive, the OS refuses. Codex uses the platform's native mechanism on each OS:

| Platform | Mechanism |
|---|---|
| macOS | `sandbox-exec` (Seatbelt) |
| Linux | Landlock |
| Windows | A purpose-built sandbox |

One subtle but important detail from the Codex write-up: the sandbox description applies only to Codex's *own* shell tool. Tools that come from MCP servers are **not** sandboxed by Codex; they are responsible for enforcing their own guardrails. That asymmetry is a real security consideration. When you add a third-party tool, you are trusting its author's safety practices, not your harness's sandbox. Codex also launched deliberately without general internet access, adding optional network access later under user control, on the principle that the smallest blast radius is the safest default.

### Approvals: deciding what needs a human

You do not want to approve every `ls`. You also do not want a silent `rm -rf` or an unreviewed network call. So harnesses use a **layered approval system**. The "Inside the Agent Harness" piece describes Codex's tiers:

- **Safe commands** (`ls`, `cat`, `git status`): auto-approved.
- **Pattern-matched** commands: approved if they match a configured allowlist.
- **Sandbox violations** (network access, writes outside the workspace): require explicit approval.
- **Granular policies**: rules like "trust file writes but always prompt for network."

A module Codex calls the `Guardian` intercepts every tool call before execution, evaluates it against the policy, and either proceeds, prompts, or blocks. Claude Code exposes a similar idea as **permission modes** you cycle through:

| Mode | Behavior |
|---|---|
| Default | Ask before file edits and shell commands |
| Auto-accept edits | Edit files and run safe filesystem commands without asking; still prompt for the rest |
| Plan mode | Explore and propose a plan without editing source files |
| Auto mode | Evaluate all actions with background safety checks |

There is also **project trust**: whether project-local hooks and configs are even allowed to run, which protects you from a malicious repo you just cloned.

### Smart approvals: removing the human bottleneck

A pure "ask the human every time" model breaks down for unattended runs (think CI, or a `full-auto` overnight task). The Codex deep-dive describes **Smart Approvals**: instead of interrupting a person, risky actions are routed through a **guardian subagent** that applies the policy rules and returns approve, deny, or escalate. The main agent keeps moving. Key properties: approvals can run in parallel, permissions persist across turns (granted once, honored for the session), and a spawned subagent inherits the parent's sandbox and network rules. This is the bridge between "safe but needs babysitting" and "safe enough to run on its own."

### Checkpoints: undo for file changes

Even with sandboxing and approvals, the agent will sometimes make a change you do not want. **Checkpoints** are the undo button. Before Claude Code edits any file, it snapshots the current contents; press Escape twice (or ask) to rewind. Checkpoints are local to the session and separate from git. The important limitation: they only cover *file* changes. Actions that hit remote systems (databases, APIs, deployments) cannot be checkpointed, which is exactly why the harness asks before running commands with external side effects. You can undo a bad edit; you cannot un-send a deploy.

## Why it matters

Safety is what makes delegation possible. The whole promise of an agent is that you can hand it a task and walk away, and you can only do that if you trust the controls. The "Everything About Codex" guide frames the principle bluntly: treat a coding agent as a **privileged identity**. Scope its access, isolate secrets, and never let its output reach production without review. The 2026 security incidents (Chapter 16) are what happens when these controls are missing. Sandboxing, approvals, and checkpoints are not bureaucracy; they are the seatbelt that lets the agent go fast inside the workspace while asking before it does something that matters outside it.

## How it works: a policy engine in front of execution

The cleanest design puts a single decision point in front of every tool call. Recall from Chapter 6 that `ToolRegistry.call` had a marked spot for "step 3: permissions." Here we build the `ApprovalPolicy` that goes there. It classifies a command into a tier and returns allow, deny, or ask. For unattended runs, "ask" can be delegated to a guardian function instead of a human.

## Code MVP: an approval policy engine

```python
"""
chapter 07: approvals and a tiny checkpoint mechanism.
ApprovalPolicy classifies each command into a tier (allow / ask / deny).
It plugs into Chapter 6's ToolRegistry.call right before execution.
Checkpointer snapshots files so edits can be undone.
"""
import re, shutil, os
from enum import Enum

class Decision(Enum):
    ALLOW = "allow"
    ASK = "ask"
    DENY = "deny"

class ApprovalPolicy:
    SAFE = {"ls", "cat", "pwd", "echo", "git status", "git diff", "head", "tail"}
    # Things we never run automatically; they need a human or a guardian.
    DANGEROUS = [r"\brm\s+-rf\b", r"\bcurl\b", r"\bwget\b",
                 r"\bgit\s+push\b", r":\(\)\{", r"\bsudo\b"]

    def __init__(self, allowlist=None, mode="default"):
        # allowlist: regexes the user pre-approved, e.g. r"^pytest".
        self.allowlist = [re.compile(p) for p in (allowlist or [])]
        self.mode = mode   # "default", "auto-accept", "plan", "full-auto"

    def classify(self, command: str) -> Decision:
        cmd = command.strip()
        # plan mode never executes anything.
        if self.mode == "plan":
            return Decision.DENY
        # Hard deny on dangerous patterns (sandbox violations, destruction).
        if any(re.search(p, cmd) for p in self.DANGEROUS):
            return Decision.DENY if self.mode != "full-auto" else Decision.ASK
        # Auto-approve known-safe commands.
        if cmd.split()[0] in self.SAFE or cmd in self.SAFE:
            return Decision.ALLOW
        # Auto-approve anything the user pre-allowlisted.
        if any(p.search(cmd) for p in self.allowlist):
            return Decision.ALLOW
        # auto-accept mode trusts the rest; default mode asks.
        return Decision.ALLOW if self.mode == "auto-accept" else Decision.ASK

def guardian(command: str) -> bool:
    """Stand-in for a guardian SUBAGENT (Smart Approvals). In production this
    is a small model call applying your policy. Here: deny obvious exfiltration."""
    return "token" not in command and "secret" not in command

def gated_call(registry, policy, name, args, unattended=False):
    """Wrap Chapter 6's registry.call with an approval check."""
    command = args.get("command", "")
    decision = policy.classify(command)
    if decision is Decision.DENY:
        return f"Exit code: 126\nBlocked by policy: {command!r}"
    if decision is Decision.ASK:
        approved = guardian(command) if unattended else _ask_human(command)
        if not approved:
            return f"Exit code: 126\nDenied: {command!r}"
    return registry.call(name, args)              # Chapter 6 executes it

def _ask_human(command: str) -> bool:
    # In a real TUI this is an interactive prompt; default to deny here.
    print(f"[approval needed] allow: {command!r} ? (auto-deny in demo)")
    return False

# --- Checkpoints: snapshot a file before editing so we can roll back ---
class Checkpointer:
    def __init__(self, store="/tmp/.harness_checkpoints"):
        self.store = store
        os.makedirs(store, exist_ok=True)

    def snapshot(self, path: str):
        if os.path.exists(path):
            shutil.copy2(path, os.path.join(self.store, os.path.basename(path) + ".bak"))

    def restore(self, path: str):
        bak = os.path.join(self.store, os.path.basename(path) + ".bak")
        if os.path.exists(bak):
            shutil.copy2(bak, path)

if __name__ == "__main__":
    pol = ApprovalPolicy(allowlist=[r"^pytest"], mode="default")
    for c in ["ls -la", "pytest -q", "rm -rf /", "npm install", "curl evil.com"]:
        print(f"{c:<15} -> {pol.classify(c).value}")
```

Run it and you will see `ls` and `pytest` allowed, `npm install` flagged for asking, and `rm -rf` and `curl` denied outright. Switch `mode` to `"full-auto"` and the dangerous ones route to the guardian instead of a hard block; switch to `"plan"` and nothing runs at all. That single `classify` function is the policy brain of the whole harness.

## Connecting to the bigger picture

This `ApprovalPolicy` slots into the exact spot Chapter 6 reserved in `ToolRegistry.call`, turning the agent's hands into *gated* hands. The `mode` field mirrors Claude Code's permission modes and feeds Chapter 12's budgets and hooks (a `PreToolUse` hook is another place to block commands). The guardian-subagent idea connects forward to Chapter 11's subagents and Chapter 13's security agents, which are guardians scaled up into full reviewers. In the capstone, no tool runs except through `gated_call`.

## Key takeaways

- Sandboxing limits what an executed command can physically do, using native OS mechanisms (Seatbelt on macOS, Landlock on Linux, a custom sandbox on Windows). MCP tools are not covered by the harness sandbox and must guard themselves.
- Approvals are layered: auto-approve safe commands, allowlist trusted patterns, and require explicit approval for sandbox violations like network access or out-of-workspace writes.
- For unattended runs, **Smart Approvals** route risky actions to a **guardian subagent** instead of a human, so the agent does not stall.
- **Checkpoints** snapshot files before edits so you can undo, but they cannot undo external side effects (deploys, API calls), which is why those always prompt.
- Treat the agent as a privileged identity: least privilege, isolated secrets, human review for anything touching production.

Original sources: "Inside the Agent Harness" (Codex codebase analysis), the "Inside the Codex Agent Loop" deep-dive, and Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works).

## Review

**Quick Check**

1. Which native mechanism does Codex use to sandbox execution on Linux?
   - A) `sandbox-exec` (Seatbelt)
   - B) Landlock
   - C) A purpose-built Windows sandbox
   - D) Docker containers, one per tool call
   <details><summary>Answer</summary>B) Landlock - Codex uses each platform's native mechanism: Seatbelt (`sandbox-exec`) on macOS, Landlock on Linux, and a purpose-built sandbox on Windows.</details>

2. What is the security asymmetry the chapter highlights about MCP tools?
   - A) MCP tools run with fewer privileges than the harness's own shell tool
   - B) MCP tools are not covered by the harness sandbox and must enforce their own guardrails, so you are trusting their author's safety practices
   - C) MCP tools cannot access the network at all
   - D) MCP tools are always routed through the guardian subagent
   <details><summary>Answer</summary>B) MCP tools are not covered by the harness sandbox and must enforce their own guardrails, so you are trusting their author's safety practices - Codex's sandbox description applies only to its own shell tool. Adding a third-party tool means extending trust outside your sandbox.</details>

3. In Codex's layered approval system, which category requires explicit approval?
   - A) Safe commands like `ls`, `cat`, and `git status`
   - B) Commands matching a configured allowlist
   - C) Sandbox violations such as network access or writes outside the workspace
   - D) Any command that produces more than 100 lines of output
   <details><summary>Answer</summary>C) Sandbox violations such as network access or writes outside the workspace - Safe commands are auto-approved and allowlisted patterns are pre-approved; it is the sandbox violations that need a human (or a guardian) to say yes.</details>

4. What is the important limitation of checkpoints?
   - A) They expire after ten minutes
   - B) They only cover file changes and cannot undo external side effects like deploys or API calls
   - C) They require a clean git working tree
   - D) They only work in plan mode
   <details><summary>Answer</summary>B) They only cover file changes and cannot undo external side effects like deploys or API calls - Claude Code snapshots file contents before editing so you can rewind, but it is local to the session and separate from git. You can undo a bad edit; you cannot un-send a deploy, which is exactly why commands with external side effects still prompt.</details>

5. You want an agent to run an overnight `full-auto` task with nobody watching. How do Smart Approvals keep it moving without dropping safety?
   - A) All approvals are auto-granted after the first human approval of the session
   - B) Risky actions are routed to a guardian subagent that applies the policy and returns approve, deny, or escalate, so the main agent does not stall
   - C) The sandbox is disabled so no approvals are ever triggered
   - D) Risky actions are queued and replayed the next morning when a human is available
   <details><summary>Answer</summary>B) Risky actions are routed to a guardian subagent that applies the policy and returns approve, deny, or escalate, so the main agent does not stall - Approvals can run in parallel, granted permissions persist across turns for the session, and a spawned subagent inherits the parent's sandbox and network rules.</details>

**More Questions**

6. In the MVP's `ApprovalPolicy`, what does `classify` return for any command when `mode` is `"plan"`?
   - A) `Decision.ALLOW`, because plan mode is read-only and reads are safe
   - B) `Decision.ASK`, so the human can opt in per command
   - C) `Decision.DENY`, because plan mode never executes anything
   - D) It depends on whether the command matches the allowlist
   <details><summary>Answer</summary>C) `Decision.DENY`, because plan mode never executes anything - Plan mode exists to explore and propose a plan without editing source files, so the policy short-circuits to deny before any other rule is evaluated.</details>

7. What does **project trust** protect you from?
   - A) A teammate pushing an unreviewed commit
   - B) A malicious repo you just cloned, by controlling whether project-local hooks and configs are allowed to run at all
   - C) Tool outputs that exceed the context budget
   - D) An expired API key in the environment
   <details><summary>Answer</summary>B) A malicious repo you just cloned, by controlling whether project-local hooks and configs are allowed to run at all - Project-local configuration is executable influence over your agent, so trust is a separate gate from per-command approvals.</details>

8. Which Claude Code permission mode edits files and runs safe filesystem commands without asking, while still prompting for everything else?
   - A) Default
   - B) Auto-accept edits
   - C) Plan mode
   - D) Auto mode
   <details><summary>Answer</summary>B) Auto-accept edits - Default asks before file edits and shell commands; plan mode proposes without editing; auto mode evaluates all actions with background safety checks.</details>

9. You construct `ApprovalPolicy(allowlist=[r"^pytest"], mode="default")` and call `classify("pytest -q")`. What comes back, and why?
   - A) `ASK`, because default mode asks about everything not in `SAFE`
   - B) `DENY`, because `pytest` can execute arbitrary project code
   - C) `ALLOW`, because the command matches a user-provided allowlist pattern
   - D) `ALLOW`, because `pytest` is in the built-in `SAFE` set
   <details><summary>Answer</summary>C) `ALLOW`, because the command matches a user-provided allowlist pattern - `pytest` is not in the built-in `SAFE` set, so the allowlist check is what approves it. That is the point of the allowlist: pre-approving the project-specific commands you run constantly.</details>

10. The "Everything About Codex" guide says to treat a coding agent as a **privileged identity**. What does that imply in practice?
    - A) Give it admin rights so it never gets blocked mid-task
    - B) Scope its access, isolate secrets, and require human review before its output reaches production
    - C) Run it under your personal user account so its actions are attributable
    - D) Grant it network access only during business hours
    <details><summary>Answer</summary>B) Scope its access, isolate secrets, and require human review before its output reaches production - The agent is an actor with credentials, so it gets the same least-privilege treatment you would give any privileged account. The 2026 security incidents in Chapter 16 are what happens when these controls are missing.</details>

**Think About It**

Codex deliberately launched with **no** general internet access, then added it later as an option. For a coding agent that constantly needs docs and packages, that sounds crippling. Why was it the right call?

<details><summary>Show answer</summary>
The design principle is that the smallest blast radius is the safest default. Network access is the one capability that turns a local mistake into an external one: it lets an agent exfiltrate secrets it happened to read, fetch and execute untrusted code, or hit a production API it was never meant to touch. Everything else the agent does is contained by the filesystem sandbox and undoable by checkpoints, but a network call cannot be recalled. Shipping without it meant the first wave of users could not be harmed in the ways that matter most, and adding it later under explicit user control meant the capability arrived alongside the policy machinery to govern it. It is the same reasoning as checkpoints: build the undo before you build the risk.
</details>

Your harness carefully sandboxes its own shell tool with OS-level mechanisms, and then you install a third-party MCP server that can do whatever it likes. Why does the sandbox not cover it, and what should that change about how you evaluate tools?

<details><summary>Show answer</summary>
The sandbox is applied at the point where the harness spawns a process, so it protects the executions the harness itself performs. An MCP server is a separate program with its own lifecycle, often talking to remote services, so the harness has no process boundary to wrap around it; Codex's write-up is explicit that MCP tools are responsible for their own guardrails. The practical consequence is that your effective security posture is the weakest of your own sandbox and every tool author's practices. So installing an MCP server is not like enabling a feature, it is like adding a dependency with your credentials attached, and it deserves the same scrutiny you would give any dependency: who wrote it, what does it reach, and what secrets does it see?
</details>

"Ask the human before every action" sounds like the safest possible policy. Why does it end up making agents *less* safe in practice?

<details><summary>Show answer</summary>
A policy that interrupts constantly gets defeated by the person it is protecting. Approving every `ls` trains you to click yes without reading, so the one prompt that mattered slides through with the rest, and it makes unattended runs (CI, an overnight full-auto task) impossible, which pushes people toward disabling approvals entirely. Layering is what preserves the signal: auto-approve the genuinely safe commands, let users allowlist the project-specific ones they run constantly, and reserve the interrupt for sandbox violations like network access or out-of-workspace writes. Smart Approvals go one step further by routing those remaining decisions to a guardian subagent, so the rare risky action still gets evaluated even when no human is awake.
</details>

If checkpoints let you rewind any file change, why does the harness still stop and ask before running a command?

<details><summary>Show answer</summary>
Because undo has a boundary and the interesting damage lives on the other side of it. Checkpoints snapshot file contents before an edit, so anything inside the workspace is recoverable. But a `git push`, a database migration, a `curl` that posts your token somewhere, or a deploy has already changed the state of a system your harness does not own, and no local snapshot can reach it. That asymmetry is precisely why the approval tiers key on external side effects: the policy asks about exactly the actions checkpoints cannot rescue you from. Sandboxing, approvals, and checkpoints are three different controls because each one covers a failure the others miss.
</details>

**Coding Challenge**

Session-Persistent Command Gate

Build a `CommandGate` class that decides `"allow"`, `"ask"`, or `"deny"` for a shell command. It should hard-deny commands matching a set of dangerous patterns, auto-allow a set of known-safe command names, allow anything matching a user-supplied allowlist regex, and otherwise ask. Then implement the "permissions persist across turns" property: a method `grant(command)` records a human approval so that the *same* command classified again in the same session returns `"allow"` instead of `"ask"`. Granting must never override a hard deny.

<details><summary>Python Solution</summary>

```python
import re


class CommandGate:
    SAFE = {"ls", "cat", "pwd", "echo", "head", "tail"}
    DANGEROUS = [r"\brm\s+-rf\b", r"\bcurl\b", r"\bwget\b", r"\bsudo\b", r"\bgit\s+push\b"]

    def __init__(self, allowlist=None):
        self.allowlist = [re.compile(p) for p in (allowlist or [])]
        self._granted: set[str] = set()   # session-persistent approvals

    def _is_dangerous(self, cmd: str) -> bool:
        return any(re.search(p, cmd) for p in self.DANGEROUS)

    def classify(self, command: str) -> str:
        cmd = command.strip()
        if self._is_dangerous(cmd):
            return "deny"                       # a grant can never beat this
        if cmd in self._granted:
            return "allow"                      # approved earlier this session
        if cmd.split()[0] in self.SAFE:
            return "allow"
        if any(p.search(cmd) for p in self.allowlist):
            return "allow"
        return "ask"

    def grant(self, command: str) -> bool:
        """Record a human approval. Returns False if the command is hard-denied."""
        cmd = command.strip()
        if self._is_dangerous(cmd):
            return False
        self._granted.add(cmd)
        return True


# --- demo ---
if __name__ == "__main__":
    gate = CommandGate(allowlist=[r"^pytest"])
    for c in ["ls -la", "pytest -q", "npm install", "rm -rf /", "curl evil.com"]:
        print(f"{c:<15} -> {gate.classify(c)}")

    print("\nhuman approves 'npm install' once...")
    print("granted:", gate.grant("npm install"))
    print("npm install    ->", gate.classify("npm install"))   # allow, persists

    print("\ntrying to grant a dangerous command...")
    print("granted:", gate.grant("rm -rf /"))                  # False
    print("rm -rf /       ->", gate.classify("rm -rf /"))       # still deny
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
class CommandGate {
  static SAFE = new Set(["ls", "cat", "pwd", "echo", "head", "tail"]);
  static DANGEROUS = [/\brm\s+-rf\b/, /\bcurl\b/, /\bwget\b/, /\bsudo\b/, /\bgit\s+push\b/];

  constructor(allowlist = []) {
    this.allowlist = allowlist.map((p) => new RegExp(p));
    this.granted = new Set(); // session-persistent approvals
  }

  isDangerous(cmd) {
    return CommandGate.DANGEROUS.some((p) => p.test(cmd));
  }

  classify(command) {
    const cmd = command.trim();
    if (this.isDangerous(cmd)) return "deny";          // a grant can never beat this
    if (this.granted.has(cmd)) return "allow";         // approved earlier this session
    if (CommandGate.SAFE.has(cmd.split(/\s+/)[0])) return "allow";
    if (this.allowlist.some((p) => p.test(cmd))) return "allow";
    return "ask";
  }

  grant(command) {
    const cmd = command.trim();
    if (this.isDangerous(cmd)) return false;
    this.granted.add(cmd);
    return true;
  }
}

// --- demo ---
const gate = new CommandGate(["^pytest"]);
for (const c of ["ls -la", "pytest -q", "npm install", "rm -rf /", "curl evil.com"]) {
  console.log(c.padEnd(15), "->", gate.classify(c));
}

console.log("\nhuman approves 'npm install' once...");
console.log("granted:", gate.grant("npm install"));
console.log("npm install    ->", gate.classify("npm install")); // allow, persists

console.log("\ntrying to grant a dangerous command...");
console.log("granted:", gate.grant("rm -rf /")); // false
console.log("rm -rf /       ->", gate.classify("rm -rf /")); // still deny
```

</details>
