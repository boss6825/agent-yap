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
