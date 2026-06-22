# Chapter 13: Code Review and Security Agents

## Concept explanation

The harness you have built is general. This chapter looks at the first big class of *specialized* agents deployed in the real world: agents that review code. They are interesting for builders because they are simple agents on top of serious infrastructure, and because they teach the single most important lesson about trusting agent output. Two systems anchor the chapter: Cursor's **Bugbot** (a general PR reviewer) and Cursor's four **security agents** (analyzed by Snyk).

### Bugbot: an agent wired into the pull request

Bugbot reviews pull requests and leaves comments with explanations and fix suggestions. The mechanics are a clean example of an agent living inside an existing workflow rather than a chat window:

- It runs automatically on every PR update, or on demand when someone comments `cursor review`.
- It reads existing PR comments as context, so it avoids duplicate suggestions and builds on prior feedback.
- It publishes a CI status (`success`, `neutral`, `failure`) so it can gate merges through branch protection.
- It supports **incremental review** (only the diff since its last review) to save work, and **effort levels** that trade reasoning time for thoroughness.

The configuration design is worth noting because it reuses Chapter 9's memory ideas. Bugbot reads `.cursor/BUGBOT.md` files, including nested ones traversed up from changed files, exactly the "more specific wins" pattern. It also has **learned rules**: it generates rules from your team's activity, and you can teach it inline by commenting `@cursor remember [fact]` on a PR, which it saves and applies to future reviews. That is auto-memory (Chapter 9) aimed at a review agent. Rules can be scoped to glob paths, and rule analytics track how often each rule's findings get accepted, so a noisy rule can be spotted and pruned.

### Cursor's security agents and the 15-line prompt

Snyk's analysis of Cursor's four open-sourced security agents contains the most quietly profound lesson in this whole collection. Cursor's security team built agents that review 3,000-plus PRs per week and catch 200-plus real vulnerabilities. The prompt driving the flagship reviewer is fifteen lines: a role ("you are a security reviewer for pull requests"), a goal, a four-step methodology (inspect the diff, trace attacker-controlled input to a real sink, check whether existing controls already block it, report only medium/high/critical findings with a concrete attack path), and a priority list of vulnerability classes.

No elaborate chain-of-thought scaffolding. No pages of examples. No complex output schema. Why does so little work? Because the model already *knows* what SQL injection and auth bypass look like; it just needs a framework to apply that knowledge systematically. As Snyk puts it, "the prompt is simple *because* the surrounding infrastructure is not." Underneath those fifteen lines sit a custom MCP server for state and deduplication, a Terraform-managed deployment, webhook orchestration deciding which agent to trigger when, and state that lets agents compare findings across runs. This is Chapter 1's thesis proven in the field: the harness is the product, the prompt is the tip of the iceberg.

The four agents map to four jobs:

| Agent | Job |
|---|---|
| Agentic Security Review | Reviews every PR against the team's threat model; posts to Slack, comments on the PR, can block CI |
| Vuln Hunter | Scans the existing codebase (not just new diffs), segment by segment |
| Anybump | Automated dependency patching: reachability analysis, test, open a PR only when confidence is high |
| Invariant Sentinel | Daily drift detection against security and compliance properties, using memory to compare across runs |

### The lesson: an agent cannot mark its own homework

Here is the reliability principle that this chapter exists to deliver, and it generalizes far beyond security. LLM reviewers have two failure modes that are both expensive: **false positives** (confidently flagging a parameterized query as "critical SQL injection" because the model misread the data flow) and **false negatives** (missing a real bug because attention drifted across a large codebase). When your detection layer is entirely probabilistic, you accept both risks.

Snyk's principle: "the agent cannot mark its own homework." You need an *independent* validation layer. The recommended architecture is two-tier: the LLM agent is the researcher (creative, finds novel cross-file logic bugs that rule-based tools miss), and a deterministic engine (static analysis, SAST) is the peer reviewer (catches known patterns with mechanical precision and confirms the LLM's findings are real). You want both, because each catches what the other misses. This is the same idea as Chapter 11's verifier subagent and Chapter 10's deterministic computation, now stated as a law: never let probabilistic reasoning be the *only* check on something that matters.

Two more details reinforce it. First, Cursor's own review agent prompt explicitly ends with "do not push changes or open fix PRs from this workflow." Even Cursor's security team keeps a human in the loop for their own tooling; the agent finds and reports, a human decides. Second, the BaxBench benchmark found that 62% of solutions from even the best models are incorrect or contain vulnerabilities, which is precisely why layered, independent validation is essential rather than optional.

### The agentic supply chain

Snyk raises one more forward-looking risk that Chapter 16 expands: the components agents depend on (MCP servers, skills, automation templates, plugins) form a new **agentic supply chain**, and it is largely unsecured. In January 2026 Snyk found hundreds of malicious skills on a public skills hub. The automation templates Cursor open-sourced run with access to your codebase, CI, Slack, and GitHub. These privileged components deserve the same scrutiny as any npm dependency. Building a review agent is good; remembering that the review agent itself is a dependency is better.

## Why it matters

Review and security agents are the most mature production use of coding agents, and they are the cleanest demonstration that the value is in the harness and the verification, not the prompt. They also deliver the reliability principle you should carry into every agent you build: agent output requires verification proportional to its risk, and that verification must be independent. If you only learn one thing from Part IV, learn that a green result from an agent is necessary, not sufficient.

## How it works: a review agent with an independent check

A review agent is the Chapter 2 loop with a focused prompt and tools to read a diff. The important addition is the *second tier*: after the LLM produces findings, a deterministic checker independently confirms them before anything is reported. The MVP shows both tiers and a human gate.

## Code MVP: a two-tier PR review agent

```python
"""
chapter 13: a two-tier review agent.
Tier 1: an LLM reviewer (here, a focused prompt + fake model) finds candidate
issues. Tier 2: a DETERMINISTIC checker independently confirms them. Only
confirmed findings are reported, and fixes are never auto-pushed.
"""
import re

# The actual 15-line-style security prompt (abbreviated).
SECURITY_PROMPT = """You are a security reviewer for pull requests.
Trace attacker-controlled input to a real sink. Verify existing controls do
not already block it. Report only medium/high/critical findings with a concrete
attack path and code evidence. Do not push changes or open fix PRs."""

def llm_reviewer(diff_lines: list, model_fn) -> list:
    """Tier 1: probabilistic. Returns candidate findings (each with a line)."""
    return model_fn(SECURITY_PROMPT, diff_lines)

# Tier 2: deterministic confirmation, LINE-AWARE. The agent cannot mark its
# own homework, so we independently check the exact line it flagged.
DANGEROUS_PATTERNS = {
    # String-formatted SQL ("...%s..." % var) is injectable; a parameterized
    # query ("... ?", (var,)) is not, so this pattern matches one but not the other.
    "sql_injection": r"\"(SELECT|INSERT|UPDATE|DELETE)[^\"]*%s?[^\"]*\"\s*%",
    "dynamic_exec":  r"\b(eval|exec)\s*\(",
    "hardcoded_secret": r"(api_key|password|secret)\s*=\s*['\"][^'\"]+['\"]",
}

def deterministic_confirm(line: str, finding: dict) -> bool:
    """Independently check whether the claimed issue really appears on its line."""
    pattern = DANGEROUS_PATTERNS.get(finding["type"])
    return bool(pattern and re.search(pattern, line))

def review_pr(diff_lines: list, model_fn) -> dict:
    candidates = llm_reviewer(diff_lines, model_fn)        # tier 1
    confirmed, dismissed = [], []
    for f in candidates:
        line = diff_lines[f["line"]]
        (confirmed if deterministic_confirm(line, f) else dismissed).append(f)
    return {
        "confirmed": confirmed,        # report these (still to a human)
        "dismissed": dismissed,        # likely false positives; suppressed
        "auto_fixed": False,           # never auto-push: human decides
    }

if __name__ == "__main__":
    diff_lines = [
        'query = "SELECT * FROM users WHERE id = %s" % user_input',     # 0: injectable
        'cursor.execute(query)',                                         # 1
        'safe = cursor.execute("SELECT * FROM t WHERE id = ?", (uid,))', # 2: safe
    ]
    def fake_model(prompt, lines):
        # The LLM flags TWO candidates: line 0 (real) and line 2 (false positive).
        return [{"type": "sql_injection", "line": 0, "severity": "critical"},
                {"type": "sql_injection", "line": 2, "severity": "critical"}]
    from pprint import pprint
    pprint(review_pr(diff_lines, fake_model))
```

Run it: the LLM flags two SQL-injection candidates, but the deterministic check confirms only the string-formatted one and dismisses the parameterized query (a false positive). Only the confirmed finding survives, and nothing is auto-fixed. That two-tier structure, probabilistic researcher plus deterministic peer review plus human gate, is the chapter in a nutshell.

## Connecting to the bigger picture

This chapter applies the whole harness to a real job: the loop (Chapter 2), a focused prompt (Chapter 3), tools to read diffs (Chapter 6), memory via `BUGBOT.md` and learned rules (Chapter 9), and the verifier idea (Chapter 11) hardened into an independent deterministic tier (Chapter 10). The reliability principle here, agents cannot mark their own homework, is the bridge to Chapter 16's verification principle and governance. Chapter 14 turns from reviewing code to autonomously writing it.

## Key takeaways

- Review agents like Bugbot live inside the PR workflow: auto-trigger on updates, read existing comments, publish CI status, and use project rule files (`.cursor/BUGBOT.md`) and learned memory.
- Cursor's security agents prove Chapter 1's thesis: a 15-line prompt catches hundreds of bugs because the infrastructure underneath (MCP server, deployment, orchestration, cross-run state) does the heavy lifting.
- The core reliability law: **an agent cannot mark its own homework.** Pair the probabilistic LLM (the researcher) with an independent deterministic check (the peer reviewer); you need both.
- Keep a human in the loop for anything that matters; even Cursor's review agent does not auto-push fixes.
- The components an agent depends on (MCP servers, skills, templates) are a new **agentic supply chain** and a real attack surface.

Original sources: Cursor's [Bugbot docs](https://docs.cursor.com/) and Snyk's analysis "I Read Cursor's Security Agent Prompts, So You Don't Have To."
