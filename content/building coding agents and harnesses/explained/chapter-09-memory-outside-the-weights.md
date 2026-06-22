# Chapter 9: Memory Outside the Weights

## Concept explanation

The model is stateless. Each new session starts with a blank context window and no memory of yesterday (Chapter 2). Yet a good coding agent seems to *know* your project: that you use `pytest`, that you indent with four spaces, that the auth module is fragile. Where does that knowledge live, if not in the model? Outside the weights, in files the harness loads. This is the "knowledge" layer (layer 2) and "memory management" (pillar 2), and it is one of the highest-leverage parts of the whole harness.

The "Seven Pillars" breakdown frames the core idea well: harness intelligence lives largely in memory. There are a few distinct kinds, and mixing them up is a common mistake.

### The building blocks

| Mechanism | What it is | Loads when |
|---|---|---|
| `CLAUDE.md` / `AGENTS.md` | Project instructions you write: conventions, test commands, architecture notes | Every session, near the front of the prompt |
| Auto memory | Notes the agent writes itself as it works (project patterns, your preferences) | At session start (a capped amount, e.g. first 200 lines or 25KB) |
| Rules (`.claude/rules/`) | Path-scoped instructions that apply only when matching files are touched | When relevant files are in play |
| File-based scratchpad | Intermediate results the agent writes to disk during a task | On demand, when the agent reads them back |

`CLAUDE.md` (Anthropic) and `AGENTS.md` (Codex) are the same idea under different names: a markdown file in your repo that gets injected into the prompt every session. It is where you put the things you would tell a new teammate on day one. Critically, Claude Code **reloads `CLAUDE.md` after compaction**, so your conventions survive even when the conversation gets summarized. The lesson the docs repeat: put persistent rules in `CLAUDE.md`, not in chat, because chat gets compacted away.

There is an empirical reason to care. The "Everything About Codex" guide cites research (an arXiv paper on the impact of `AGENTS.md` files) that a well-crafted instruction file measurably improves agent efficiency. And from Chapter 5, remember the cost angle: `AGENTS.md` sits in the cached prefix, so a stable one is also a cheap one. Editing it mid-session throws away your biggest cache discount.

### The two-tier pattern

The "Seven Pillars" breakdown describes a sharp pattern for memory that is worth adopting: split it into two tiers.

- **Tier 1, shared knowledge** (`.claude/rules/`, committed to git): facts the whole team should have. Confirmed error patterns and their meaning, known performance traps, API quirks, anti-hallucination constraints. A new teammate gets 80% of the value on day one just by cloning the repo.
- **Tier 2, personal memory** (`~/.claude/...`, per user): your own accumulated investigation outcomes and preferences.

The promotion workflow is the elegant bit. The agent discovers something, saves it to *personal* memory, you validate it, and then it gets promoted to the *shared* tier with a commit. Memory becomes a real, reviewable team practice instead of a magic black box that silently changes behavior. This connects to pillar 7, **portability**: because all of this lives in the repo, a colleague who clones it gets the whole configured agent, not just the code.

### Why files, not a giant prompt

You might ask why not just stuff everything into one huge system prompt. Two reasons from earlier chapters. First, tokens: everything loaded costs you on every call (Chapter 4), so you load instructions always but defer bulky reference material until needed. Second, external storage is the third context-management move (Chapter 5): writing intermediate work to files and reading it back keeps the live context small. The Deep Research survey notes that frameworks like Manus, OWL, and OpenManus all use external file systems to store intermediate outcomes precisely because the context window cannot hold everything.

## Why it matters

Memory is how an agent gets better at *your* project specifically without anyone retraining the model. It is the difference between an agent that re-learns your test command every session and one that just knows it. It is also where reliability comes from: an anti-hallucination constraint written into shared rules ("never invent API names; grep the codebase first") applies to every session forever. And because it is all plain files in the repo, it is portable, reviewable, and version-controlled, which is exactly what you want for something that shapes how an agent behaves on your code.

## How it works: a layered memory loader

The mechanism is a loader that gathers the right files and produces the `project_instructions` string that Chapter 3's `PromptBuilder` expects. It mirrors Codex's "more specific wins" aggregation: walk from the project root down to the working directory, concatenate the instruction files found along the way, respect a size cap, and load path-scoped rules only when relevant.

## Code MVP: a memory loader

```python
"""
chapter 09: memory outside the weights.
Load layered project memory (AGENTS.md / CLAUDE.md up the tree, plus
path-scoped rules) into the project_instructions slot of Chapter 3's
PromptBuilder. 'More specific wins': files closer to cwd come last.
"""
import os

MAX_BYTES = 32 * 1024   # Codex's default AGENTS.md size cap

class MemoryLoader:
    def __init__(self, project_root: str, instruction_names=("AGENTS.md", "CLAUDE.md")):
        self.root = os.path.abspath(project_root)
        self.names = instruction_names

    def _dirs_from_root_to(self, cwd: str) -> list:
        """Every directory from project root down to cwd, root first."""
        cwd = os.path.abspath(cwd)
        parts, cur, chain = os.path.relpath(cwd, self.root).split(os.sep), self.root, [self.root]
        for p in parts:
            if p in (".", ""):
                continue
            cur = os.path.join(cur, p)
            chain.append(cur)
        return chain

    def load_instructions(self, cwd: str = None) -> str:
        cwd = cwd or self.root
        chunks, budget = [], MAX_BYTES
        # General first (root), specific last (cwd): later overrides earlier.
        for d in self._dirs_from_root_to(cwd):
            for name in self.names:
                path = os.path.join(d, name)
                if os.path.exists(path):
                    text = open(path, encoding="utf-8").read()[:budget]
                    budget -= len(text)
                    rel = os.path.relpath(path, self.root)
                    chunks.append(f"# from {rel}\n{text}")
        return "\n\n".join(chunks)

    def load_rules(self, touched_paths: list) -> str:
        """Path-scoped rules: include a rule only if a touched file matches."""
        rules_dir = os.path.join(self.root, ".rules")
        if not os.path.isdir(rules_dir):
            return ""
        active = []
        for fn in sorted(os.listdir(rules_dir)):
            # Convention: a rule file named 'backend.md' applies to backend/*.
            scope = fn.rsplit(".", 1)[0]
            if any(scope in p for p in touched_paths):
                active.append(open(os.path.join(rules_dir, fn), encoding="utf-8").read())
        return "\n\n".join(active)

if __name__ == "__main__":
    # Build a tiny demo project tree.
    os.makedirs("/tmp/demo_proj/backend", exist_ok=True)
    open("/tmp/demo_proj/AGENTS.md", "w").write("Run tests with `pytest -q`.")
    open("/tmp/demo_proj/backend/AGENTS.md", "w").write("Backend uses async SQLAlchemy.")
    os.makedirs("/tmp/demo_proj/.rules", exist_ok=True)
    open("/tmp/demo_proj/.rules/backend.md", "w").write("Never log raw SQL with secrets.")

    loader = MemoryLoader("/tmp/demo_proj")
    print("--- instructions for backend/ ---")
    print(loader.load_instructions("/tmp/demo_proj/backend"))
    print("--- active rules when editing backend/api.py ---")
    print(loader.load_rules(["backend/api.py"]))
```

Run it and you will see the root instruction and the backend-specific instruction concatenated (general first, specific last), plus the backend rule activated only because a backend file was touched. Feed `load_instructions()` into `PromptBuilder(project_instructions=...)` and your agent now knows your project.

## Connecting to the bigger picture

This loader fills the `project_instructions` slot Chapter 3 left open, and because that slot sits in the cached prefix, Chapter 5's caching rules apply (keep it stable). The file-based scratchpad idea is the same external-storage move Chapter 5 listed, and it is exactly how Manus's `todo.md` and file memory work (Chapter 14). The two-tier, git-committed pattern is the portability pillar that Chapter 16 leans on for team rollouts. In the capstone, `MemoryLoader` runs once at startup and its output rides in every prompt.

## Key takeaways

- The model is stateless; project knowledge lives **outside the weights** in files the harness loads.
- `CLAUDE.md` / `AGENTS.md` are injected every session and reloaded after compaction. Put persistent rules there, not in chat.
- Aggregate instructions "more specific wins": root first, working directory last; respect a size cap; load path-scoped rules only when relevant.
- The **two-tier** pattern (shared rules in git, personal memory per user, with a promotion workflow) makes memory a reviewable team practice and keeps the whole setup portable.
- Memory sits in the cached prefix, so a stable instruction file is both more effective and cheaper.

Original sources: Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works), the "Agentic Harness Architecture: Seven Pillars" breakdown, and OpenAI's [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/).
