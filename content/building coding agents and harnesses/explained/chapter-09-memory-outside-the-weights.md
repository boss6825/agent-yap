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

## Review

**Quick Check**

1. The model is stateless, yet a good coding agent seems to know your project. Where does that knowledge actually live?
   - A) Fine-tuned into the model's weights during onboarding
   - B) In files outside the weights that the harness loads into the prompt
   - C) In the provider's server-side conversation store
   - D) In the prompt cache, which persists between sessions
   <details><summary>Answer</summary>B) In files outside the weights that the harness loads into the prompt - This is the "knowledge" layer and the memory-management pillar: instruction files, auto memory, path-scoped rules, and file-based scratchpads.</details>

2. Why does the chapter insist you put persistent rules in `CLAUDE.md` rather than telling the agent in chat?
   - A) Chat messages are not tokenized the same way as file contents
   - B) Chat gets compacted away, while `CLAUDE.md` is injected every session and reloaded after compaction
   - C) Chat messages cannot contain markdown formatting
   - D) Chat messages are never cached, so they cost more
   <details><summary>Answer</summary>B) Chat gets compacted away, while `CLAUDE.md` is injected every session and reloaded after compaction - Your conventions survive summarization precisely because the harness reloads the instruction file, which a chat message cannot rely on.</details>

3. When aggregating instruction files up the directory tree, what does "more specific wins" mean in practice?
   - A) Only the file closest to the working directory is loaded
   - B) Files are concatenated root first and working directory last, so later content overrides earlier content
   - C) Files are sorted by size, largest first
   - D) The working-directory file is loaded first so it establishes context
   <details><summary>Answer</summary>B) Files are concatenated root first and working directory last, so later content overrides earlier content - The loader walks from the project root down to the working directory, respects a size cap, and puts the general guidance before the specific.</details>

4. In the two-tier memory pattern, what distinguishes tier 1 from tier 2?
   - A) Tier 1 is loaded at session start, tier 2 only after compaction
   - B) Tier 1 is shared knowledge committed to git for the whole team; tier 2 is personal, per-user memory
   - C) Tier 1 holds file contents, tier 2 holds tool outputs
   - D) Tier 1 is written by the agent, tier 2 is written by the human
   <details><summary>Answer</summary>B) Tier 1 is shared knowledge committed to git for the whole team; tier 2 is personal, per-user memory - Shared rules cover confirmed error patterns, performance traps, API quirks, and anti-hallucination constraints, so a new teammate gets most of the value on day one just by cloning the repo.</details>

5. Mid-session, you tell the agent in chat: "always use four-space indentation in this repo." Two hours later it starts using two spaces. What most likely happened, and what should you have done?
   - A) The model's weights drifted; restart the session
   - B) The instruction was compacted away with the older conversation; it belonged in `CLAUDE.md`, which is reloaded after compaction
   - C) The instruction busted the prompt cache and was dropped
   - D) Chat instructions only apply to the current turn by design
   <details><summary>Answer</summary>B) The instruction was compacted away with the older conversation; it belonged in `CLAUDE.md`, which is reloaded after compaction - This is the exact failure the chapter warns about: persistent rules go in the instruction file, not in chat.</details>

**More Questions**

6. What makes `.claude/rules/` different from `CLAUDE.md`?
   - A) Rules are path-scoped and load only when matching files are in play
   - B) Rules are written by the agent, never by the human
   - C) Rules are stored outside the repo so they are not shared
   - D) Rules replace `CLAUDE.md` entirely once present
   <details><summary>Answer</summary>A) Rules are path-scoped and load only when matching files are in play - Instruction files load every session; rules are conditional, which keeps bulky domain-specific guidance out of the prompt until it is relevant.</details>

7. Which caps does the chapter mention for loaded memory?
   - A) No caps; instruction files are loaded in full
   - B) Auto memory is capped at session start (for example the first 200 lines or 25KB), and the loader respects a size cap for instruction files (32KB in the MVP)
   - C) A single 4KB cap shared across all memory types
   - D) Caps apply only to path-scoped rules
   <details><summary>Answer</summary>B) Auto memory is capped at session start (for example the first 200 lines or 25KB), and the loader respects a size cap for instruction files (32KB in the MVP) - Memory is not free: everything loaded costs tokens on every call, so the caps are a budget guard.</details>

8. Why not stuff every piece of project knowledge into one enormous system prompt?
   - A) Providers reject system prompts above a fixed length
   - B) Everything loaded costs tokens on every call, and external storage keeps live context small by writing intermediate work to files and reading it back
   - C) Large system prompts cannot be cached
   - D) The model ignores instructions after the first few hundred tokens
   <details><summary>Answer</summary>B) Everything loaded costs tokens on every call, and external storage keeps live context small by writing intermediate work to files and reading it back - So you load instructions always but defer bulky reference material until needed. The Deep Research survey notes Manus, OWL, and OpenManus all use external file systems for the same reason.</details>

9. What is the promotion workflow in the two-tier pattern?
   - A) The agent writes directly to shared rules, and the team reviews them at the next retro
   - B) The agent saves a discovery to personal memory, the human validates it, and it is then promoted to the shared tier with a commit
   - C) Shared rules are demoted to personal memory when they become stale
   - D) Personal memory is synced to the shared tier automatically at session end
   <details><summary>Answer</summary>B) The agent saves a discovery to personal memory, the human validates it, and it is then promoted to the shared tier with a commit - This makes memory a reviewable team practice instead of a black box that silently changes behavior.</details>

10. Two developers debate whether to keep polishing `AGENTS.md` mid-session as they notice gaps. What does the chapter say about the cost side of that habit?
    - A) It is free, since instruction files are loaded outside the billed prompt
    - B) `AGENTS.md` sits in the cached prefix, so editing it mid-session throws away your biggest cache discount; a stable file is both more effective and cheaper
    - C) Each edit triggers compaction, which loses conversation history
    - D) Edits are ignored until the next process restart, so it has no effect either way
    <details><summary>Answer</summary>B) `AGENTS.md` sits in the cached prefix, so editing it mid-session throws away your biggest cache discount; a stable file is both more effective and cheaper - Better to collect the gaps and edit between sessions than to churn the prefix while the agent is running.</details>

**Think About It**

You open a fresh session with a model that provably remembers nothing, and within seconds it is running your project's exact test command and respecting conventions nobody mentioned. If the weights did not change and there is no server-side memory, how is the illusion produced?

<details><summary>Show answer</summary>
Every "memory" you observe is a file the harness read and pasted into the prompt before your first message arrived. `CLAUDE.md` or `AGENTS.md` gets injected at session start, auto-memory notes from previous sessions are loaded up to a cap, and path-scoped rules stand by to load when a matching file is touched. The agent is not recalling; it is being re-briefed, silently, every single time. That reframing is what makes the layer controllable: because the memory is plain files in your repo, you can read exactly what your agent "knows," diff it, review it in a pull request, and delete a belief you disagree with, none of which is possible with knowledge baked into weights.
</details>

A markdown file with a few conventions in it sounds too trivial to matter, yet the chapter cites research that a well-crafted `AGENTS.md` measurably improves agent efficiency. Why would that be true?

<details><summary>Show answer</summary>
Most agent waste is rediscovery. Without an instruction file, the agent burns turns and tokens figuring out how to run the tests, which package manager the repo uses, where the module boundaries are, and which parts are fragile, and it sometimes guesses wrong and produces work you have to reject. The file replaces that whole exploration phase with a handful of tokens that arrive before the first turn. There is a compounding effect too: because the file sits in the cached prefix, it is one of the cheapest things in the prompt, so the guidance that saves the most work also costs the least to carry. The best test of a good instruction file is the one the chapter suggests: write what you would tell a new teammate on day one.
</details>

The agent discovers something genuinely useful about your codebase. Why does it write that to *personal* memory instead of straight into the shared team rules?

<details><summary>Show answer</summary>
Because a discovery is a hypothesis until a human confirms it, and shared memory changes how the agent behaves for everyone on the team, forever. An unvalidated note about an "API quirk" that was actually a local misconfiguration would silently steer every future session in the wrong direction, and nobody would know where the belief came from. Routing discoveries through personal memory first, then promoting them with a commit, means every shared rule has a reviewer and a diff attached, exactly like code. The result is memory as a team practice rather than a magic black box, and it is also what makes the setup portable: a colleague who clones the repo gets the whole configured agent, reviewed rules included.
</details>

Manus, OWL, and OpenManus independently ended up storing intermediate results in ordinary files on disk. Why does an advanced agent framework reach for something as unglamorous as the filesystem?

<details><summary>Show answer</summary>
Because the context window is a hard ceiling and intermediate work is unbounded. A research or coding task can generate far more material than any window holds, so the agent needs somewhere to put results it might need later without paying for them on every subsequent call. A file is close to ideal for that: it is addressable, cheap to write, survives compaction, and costs nothing until the agent chooses to read it back. This is the third context-management move from Chapter 5 (external storage), and it is the same mechanism behind Manus's `todo.md`. The pattern to notice is that agents get more capable not by holding more in mind but by getting better at deciding what to page out and when to page it back in.
</details>

**Coding Challenge**

Layered Memory Aggregator

Build a function `aggregate_memory(files, max_bytes)` where `files` is an ordered list of `(relative_path, contents)` pairs already sorted general-to-specific (project root first, working directory last). Concatenate them with a `# from <path>` header before each block, enforcing a total byte budget: truncate the block that crosses the cap and skip anything after it. Then build `active_rules(rules, touched_paths)` where `rules` is a dict of `{scope_name: contents}`; return only the rule bodies whose scope name appears in at least one touched path, sorted by scope name for determinism.

<details><summary>Python Solution</summary>

```python
def aggregate_memory(files: list[tuple[str, str]], max_bytes: int = 32 * 1024) -> str:
    """General first, specific last. Later blocks override earlier ones."""
    chunks, budget = [], max_bytes
    for path, contents in files:
        if budget <= 0:
            break
        text = contents[:budget]
        budget -= len(text)
        chunks.append(f"# from {path}\n{text}")
    return "\n\n".join(chunks)


def active_rules(rules: dict[str, str], touched_paths: list[str]) -> list[str]:
    """A rule loads only if its scope appears in a path currently in play."""
    return [rules[scope] for scope in sorted(rules)
            if any(scope in p for p in touched_paths)]


# --- demo ---
if __name__ == "__main__":
    files = [
        ("AGENTS.md", "Run tests with `pytest -q`."),
        ("backend/AGENTS.md", "Backend uses async SQLAlchemy."),
    ]
    print(aggregate_memory(files))
    print("--- capped at 40 bytes ---")
    print(aggregate_memory(files, max_bytes=40))

    rules = {
        "backend": "Never log raw SQL with secrets.",
        "frontend": "Prefer server components.",
    }
    print("--- editing backend/api.py ---")
    print(active_rules(rules, ["backend/api.py"]))
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function aggregateMemory(files, maxBytes = 32 * 1024) {
  // General first, specific last. Later blocks override earlier ones.
  const chunks = [];
  let budget = maxBytes;
  for (const [path, contents] of files) {
    if (budget <= 0) break;
    const text = contents.slice(0, budget);
    budget -= text.length;
    chunks.push(`# from ${path}\n${text}`);
  }
  return chunks.join("\n\n");
}

function activeRules(rules, touchedPaths) {
  // A rule loads only if its scope appears in a path currently in play.
  return Object.keys(rules)
    .sort()
    .filter((scope) => touchedPaths.some((p) => p.includes(scope)))
    .map((scope) => rules[scope]);
}

// --- demo ---
const files = [
  ["AGENTS.md", "Run tests with `pytest -q`."],
  ["backend/AGENTS.md", "Backend uses async SQLAlchemy."],
];
console.log(aggregateMemory(files));
console.log("--- capped at 40 bytes ---");
console.log(aggregateMemory(files, 40));

const rules = {
  backend: "Never log raw SQL with secrets.",
  frontend: "Prefer server components.",
};
console.log("--- editing backend/api.py ---");
console.log(activeRules(rules, ["backend/api.py"]));
```

</details>
