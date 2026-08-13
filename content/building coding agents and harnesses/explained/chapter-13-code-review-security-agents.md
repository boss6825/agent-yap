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

---

## Review

**Quick Check**

1. How does Bugbot get triggered on a pull request?
   - A) Only manually, by a maintainer clicking "review" in the Cursor dashboard
   - B) Automatically on every PR update, or on demand when someone comments `cursor review`
   - C) On a nightly schedule that sweeps all open PRs
   - D) Only when the PR touches files listed in `.cursor/BUGBOT.md`
   <details><summary>Answer</summary>B) Automatically on every PR update, or on demand when someone comments `cursor review` - It is a clean example of an agent living inside an existing workflow rather than a chat window. It also publishes a CI status so it can gate merges through branch protection.</details>

2. How many lines is the prompt driving Cursor's flagship security reviewer, and what does it contain?
   - A) About 500 lines, with extensive chain-of-thought scaffolding and worked examples
   - B) About 150 lines, mostly an output schema for structured findings
   - C) Fifteen lines: a role, a goal, a four-step methodology, and a priority list of vulnerability classes
   - D) Three lines, relying entirely on a fine-tuned model for the rest
   <details><summary>Answer</summary>C) Fifteen lines: a role, a goal, a four-step methodology, and a priority list of vulnerability classes - No elaborate scaffolding, no pages of examples, no complex output schema. The model already knows what SQL injection and auth bypass look like; it just needs a framework to apply that knowledge systematically.</details>

3. What is the reliability law this chapter exists to deliver?
   - A) Never let an agent read code it did not write
   - B) An agent cannot mark its own homework
   - C) Every agent finding must be reproduced by a second model
   - D) Security review must happen before implementation, not after
   <details><summary>Answer</summary>B) An agent cannot mark its own homework - Snyk's principle. You need an independent validation layer, because when your detection layer is entirely probabilistic you accept both false positives and false negatives with nothing to catch them.</details>

4. What are the two tiers in the recommended review architecture?
   - A) A fast model for triage and a slow model for deep analysis
   - B) A pre-merge check and a post-merge audit
   - C) The LLM agent as the researcher and a deterministic engine (static analysis, SAST) as the peer reviewer
   - D) An automated tier for known CVEs and a human tier for everything else
   <details><summary>Answer</summary>C) The LLM agent as the researcher and a deterministic engine (static analysis, SAST) as the peer reviewer - The LLM is creative and finds novel cross-file logic bugs that rule-based tools miss; the deterministic engine catches known patterns with mechanical precision and confirms the LLM's findings are real. You want both, because each catches what the other misses.</details>

5. Bugbot reads `.cursor/BUGBOT.md` files, including nested ones traversed up from changed files. Which earlier chapter's pattern is this?
   - A) Chapter 5's caching, because nested files are cached separately
   - B) Chapter 9's memory, specifically the "more specific wins" hierarchy
   - C) Chapter 7's approval policy, because rules gate what the agent may do
   - D) Chapter 11's contracts, because each file is a subagent's input
   <details><summary>Answer</summary>B) Chapter 9's memory, specifically the "more specific wins" hierarchy - Bugbot also has learned rules generated from your team's activity, and you can teach it inline by commenting `@cursor remember [fact]` on a PR. That is auto-memory aimed at a review agent.</details>

**More Questions**

6. What did the BaxBench benchmark find, and why does the chapter cite it?
   - A) That 62% of solutions from even the best models are incorrect or contain vulnerabilities, which is why layered independent validation is essential rather than optional
   - B) That agents catch 62% of the vulnerabilities a human reviewer would catch
   - C) That 62% of agent-flagged findings are false positives
   - D) That models improve 62% when given a longer security prompt
   <details><summary>Answer</summary>A) That 62% of solutions from even the best models are incorrect or contain vulnerabilities, which is why layered independent validation is essential rather than optional - It is the empirical backing for the chapter's argument that a green result from an agent is necessary, not sufficient.</details>

7. Which of Cursor's four security agents scans the existing codebase rather than only new diffs?
   - A) Agentic Security Review
   - B) Anybump
   - C) Invariant Sentinel
   - D) Vuln Hunter
   <details><summary>Answer</summary>D) Vuln Hunter - It works through the existing codebase segment by segment. Agentic Security Review handles PRs, Anybump does automated dependency patching, and Invariant Sentinel does daily drift detection against security and compliance properties using memory to compare across runs.</details>

8. Snyk writes that "the prompt is simple *because* the surrounding infrastructure is not." What sits underneath those fifteen lines?
   - A) A larger hidden prompt injected at runtime by the platform
   - B) A custom MCP server for state and deduplication, Terraform-managed deployment, webhook orchestration, and cross-run state
   - C) A fine-tuned security model trained on Cursor's own vulnerability corpus
   - D) A rules engine that rewrites the prompt per repository
   <details><summary>Answer</summary>B) A custom MCP server for state and deduplication, Terraform-managed deployment, webhook orchestration, and cross-run state - This is Chapter 1's thesis proven in the field: the harness is the product, the prompt is the tip of the iceberg.</details>

9. What is the "agentic supply chain" risk?
   - A) Delays in getting model provider capacity during peak hours
   - B) That agents can be tricked into installing packages from untrusted registries
   - C) That the components agents depend on (MCP servers, skills, automation templates, plugins) are privileged and largely unsecured
   - D) That a compromised agent can propagate its context to other agents in a team
   <details><summary>Answer</summary>C) That the components agents depend on (MCP servers, skills, automation templates, plugins) are privileged and largely unsecured - In January 2026 Snyk found hundreds of malicious skills on a public skills hub, and the automation templates Cursor open-sourced run with access to your codebase, CI, Slack, and GitHub. These deserve the same scrutiny as any npm dependency.</details>

10. Your review agent flags a parameterized query (`cursor.execute("SELECT * FROM t WHERE id = ?", (uid,))`) as critical SQL injection. Which failure mode is this, and what stops it reaching the developer?
    - A) A false negative; only a human reviewer can stop it
    - B) A false positive; the deterministic tier independently checks the flagged line and dismisses it because the injectable pattern is not present
    - C) A false positive; raising the effort level would have prevented it
    - D) A false negative; the incremental review setting would have caught it on the next pass
    <details><summary>Answer</summary>B) A false positive; the deterministic tier independently checks the flagged line and dismisses it because the injectable pattern is not present - The chapter's MVP shows exactly this: the LLM flags two candidates, the line-aware deterministic check confirms only the string-formatted query, and the parameterized one is suppressed as a likely false positive.</details>

**Think About It**

1. A fifteen-line prompt catches over two hundred real vulnerabilities a week across three thousand pull requests. The obvious lesson is "write better prompts." Why is that the wrong takeaway?
   <details><summary>Show answer</summary> Because the fifteen lines are not doing the heavy lifting; they are the only part small enough to read. Underneath sit a custom MCP server holding state and deduplicating findings, Terraform-managed deployment, webhook orchestration deciding which agent fires on which event, and cross-run state that lets the agent compare today's findings to last week's. Snyk's phrasing is the key: the prompt is simple because the surrounding infrastructure is not. If you copied those fifteen lines into a chat window you would get scattered, duplicated, unactionable output, because what makes the system work is everything that decides when it runs, what it sees, and what happens to what it says. This is Chapter 1's thesis showing up in a production system: the harness is the product.</details>

2. Cursor's security team wrote their review agent's prompt to end with "do not push changes or open fix PRs from this workflow." They built it, they trust it, and they still will not let it fix anything. Why?
   <details><summary>Show answer</summary> Because finding and fixing have wildly different blast radii. A wrong finding costs a developer two minutes of reading; a wrong fix, merged automatically into a security-sensitive codebase, is a vulnerability you introduced yourself while believing you were closing one. The team closest to the tool is also the team most familiar with its false-positive rate, and that familiarity is what produces the caution rather than undermining it. There is something worth sitting with here: the strongest evidence about where to put the human gate came from the people with the most reason to remove it. The pattern generalizes as verification proportional to risk, and it is why the chapter says a green result from an agent is necessary, not sufficient.</details>

3. BaxBench found that 62% of solutions from even the best models are incorrect or contain vulnerabilities. If that is true, how are these agents useful at all?
   <details><summary>Show answer</summary> Because the number measures unassisted generation, not the output of a system with verification in it, and the two are very different products. A 62% failure rate is disqualifying for anything auto-merged and perfectly workable for a system where a deterministic engine confirms findings, a CI status gates the merge, and a human makes the call. The benchmark is really an argument about architecture rather than about capability: it tells you how much verification you need to bolt on, not whether to use the model. That is why the chapter cites it right next to the two-tier design, and why "layered independent validation is essential rather than optional" is the conclusion drawn from it.</details>

4. A model that can write an essay on SQL injection will confidently flag a safe parameterized query as critical, while a crude regex gets it right. What is going on?
   <details><summary>Show answer</summary> The model is pattern-matching on surface features, and a line containing `SELECT`, a variable, and `execute` looks like injection whether or not the parameterization is actually doing its job. It is reasoning about resemblance rather than tracing data flow, and under attention pressure across a large diff that resemblance is often all it has. A regex that specifically matches string-formatted SQL and not the placeholder form has no understanding at all but does have exactness, which is the one thing the model lacks. That asymmetry is the entire argument for the two-tier design: the LLM's creativity finds novel cross-file logic bugs a rule could never encode, and the rule's precision catches the cases where the LLM's intuition misfires. Neither is a replacement for the other.</details>

5. You have built a review agent to protect your codebase. Snyk points out that the agent itself is now a dependency. What does that change?
   <details><summary>Show answer</summary> It moves the attack surface from your code to your tooling, which is a place most teams do not yet look. The MCP servers, skills, and automation templates an agent depends on run with access to your codebase, CI, Slack, and GitHub, which is roughly the level of privilege you would scrutinize very carefully in a production service. Snyk found hundreds of malicious skills on a public skills hub in January 2026, so this is not hypothetical. The practical shift is to treat every agent component like an npm dependency: know where it came from, know what it can reach, and remember that a security agent with a compromised skill is a very well-positioned attacker. Building the review agent is good; remembering that the review agent is itself a dependency is better.</details>

**Coding Challenge**

Nested Rule Store with Analytics

Build a `RuleStore` that models Bugbot's configuration behavior. `add_rule(path_prefix, rule_id, text)` registers a rule scoped to a directory prefix. `rules_for(file_path)` returns all rules whose prefix matches the file, ordered from least to most specific so that more specific rules win (the last one applies). Then add analytics: `record(rule_id, accepted: bool)` logs whether a finding from that rule was accepted, `acceptance_rate(rule_id)` returns the ratio, and `noisy_rules(threshold, min_samples)` returns rule IDs whose acceptance rate falls below the threshold once they have enough samples, so they can be pruned.

<details><summary>Python Solution</summary>

```python
from collections import defaultdict


class RuleStore:
    def __init__(self):
        self.rules = []                       # (prefix, rule_id, text)
        self.stats = defaultdict(lambda: {"accepted": 0, "total": 0})

    def add_rule(self, path_prefix: str, rule_id: str, text: str) -> None:
        self.rules.append((path_prefix, rule_id, text))

    def rules_for(self, file_path: str) -> list[tuple[str, str]]:
        """Nested config: every matching prefix applies, most specific last."""
        matches = [(p, rid, t) for p, rid, t in self.rules if file_path.startswith(p)]
        matches.sort(key=lambda m: len(m[0]))      # least -> most specific
        return [(rid, t) for _, rid, t in matches]

    def record(self, rule_id: str, accepted: bool) -> None:
        self.stats[rule_id]["total"] += 1
        if accepted:
            self.stats[rule_id]["accepted"] += 1

    def acceptance_rate(self, rule_id: str) -> float:
        s = self.stats[rule_id]
        return s["accepted"] / s["total"] if s["total"] else 0.0

    def noisy_rules(self, threshold: float = 0.3, min_samples: int = 5) -> list[str]:
        """Rules whose findings keep getting dismissed - candidates for pruning."""
        return sorted(
            rid for rid, s in self.stats.items()
            if s["total"] >= min_samples and self.acceptance_rate(rid) < threshold
        )


# --- demo ---
if __name__ == "__main__":
    store = RuleStore()
    store.add_rule("src/", "R1", "Prefer explicit error types")
    store.add_rule("src/api/", "R2", "All handlers must validate input")
    store.add_rule("src/api/admin/", "R3", "Admin routes require an auth check")
    store.add_rule("tests/", "R4", "No network calls in tests")

    for rid, text in store.rules_for("src/api/admin/users.py"):
        print(f"{rid}: {text}")

    # R2 is useful, R1 keeps getting dismissed.
    for accepted in [True, True, True, False, True, True]:
        store.record("R2", accepted)
    for accepted in [False, False, False, True, False, False]:
        store.record("R1", accepted)

    print("\nR2 acceptance:", round(store.acceptance_rate("R2"), 2))
    print("R1 acceptance:", round(store.acceptance_rate("R1"), 2))
    print("prune these:  ", store.noisy_rules())
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
class RuleStore {
  constructor() {
    this.rules = []; // { prefix, ruleId, text }
    this.stats = new Map(); // ruleId -> { accepted, total }
  }

  addRule(pathPrefix, ruleId, text) {
    this.rules.push({ prefix: pathPrefix, ruleId, text });
  }

  rulesFor(filePath) {
    // Nested config: every matching prefix applies, most specific last.
    return this.rules
      .filter((r) => filePath.startsWith(r.prefix))
      .sort((a, b) => a.prefix.length - b.prefix.length)
      .map((r) => [r.ruleId, r.text]);
  }

  record(ruleId, accepted) {
    const s = this.stats.get(ruleId) ?? { accepted: 0, total: 0 };
    s.total += 1;
    if (accepted) s.accepted += 1;
    this.stats.set(ruleId, s);
  }

  acceptanceRate(ruleId) {
    const s = this.stats.get(ruleId);
    return s && s.total ? s.accepted / s.total : 0;
  }

  noisyRules(threshold = 0.3, minSamples = 5) {
    // Rules whose findings keep getting dismissed - candidates for pruning.
    return [...this.stats.entries()]
      .filter(([id, s]) => s.total >= minSamples && this.acceptanceRate(id) < threshold)
      .map(([id]) => id)
      .sort();
  }
}

// --- demo ---
const store = new RuleStore();
store.addRule("src/", "R1", "Prefer explicit error types");
store.addRule("src/api/", "R2", "All handlers must validate input");
store.addRule("src/api/admin/", "R3", "Admin routes require an auth check");
store.addRule("tests/", "R4", "No network calls in tests");

for (const [ruleId, text] of store.rulesFor("src/api/admin/users.py")) {
  console.log(`${ruleId}: ${text}`);
}

// R2 is useful, R1 keeps getting dismissed.
[true, true, true, false, true, true].forEach((a) => store.record("R2", a));
[false, false, false, true, false, false].forEach((a) => store.record("R1", a));

console.log("\nR2 acceptance:", store.acceptanceRate("R2").toFixed(2));
console.log("R1 acceptance:", store.acceptanceRate("R1").toFixed(2));
console.log("prune these:  ", store.noisyRules());
```

</details>
