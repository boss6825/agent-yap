# Chapter 15: Deep Research Agents and How They Are Trained

## Concept explanation

A **deep research (DR) agent** is an agent specialized for open-ended information work: you ask a complex question, and it browses, retrieves, reasons across many sources, and writes a structured, cited report. OpenAI's Deep Research, Gemini Deep Research, Perplexity, and Grok DeepSearch are the famous examples. They are built on the exact harness ideas from this guide (loop, tools, planning, memory, multi-agent), so studying them sharpens those ideas, and they add a new dimension we have mostly skipped so far: how you *train* an agent to be good, not just prompt it. This chapter draws on two academic surveys: "Deep Research Agents: A Systematic Examination and Roadmap" and "Deep Research of Deep Research: from transformer to agent."

The formal definition from the survey: DR agents are "AI agents powered by LLMs, integrating dynamic reasoning, adaptive planning, and iterative tool use to acquire, aggregate, and analyse external information, culminating in comprehensive outputs for open-ended informational research tasks." Compared with plain RAG (which boosts factual accuracy but does not sustain reasoning) and plain tool use (which depends on fixed workflows), DR agents add autonomy, deep reasoning, dynamic planning, and real-time adaptation.

### The architecture

The "Deep Research of Deep Research" survey describes a clean architecture, explicitly inspired by Anthropic's research agent. When a query arrives, the system confirms intent, then a **MasterAgent** enters a research loop: it thinks through the approach and saves its plan to memory, spawns specialized **SubAgents** with specific subtasks, each of which searches and evaluates results in its own context and returns findings, and the MasterAgent synthesizes and decides whether more research is needed. When enough is gathered, a **ReviewAgent** checks that every claim is properly attributed to a source before the cited report goes back to the user. That is the orchestrator pattern (Chapter 11) plus the verifier (the ReviewAgent), specialized for research.

### A taxonomy worth knowing

The DR survey offers a taxonomy that is genuinely useful for any agent designer, not just research ones.

**Static vs dynamic workflows.** A *static* workflow runs a predefined pipeline (ideate, then experiment, then report). It is easy to build and predictable, but each new task needs a hand-tailored pipeline, so it generalizes poorly. A *dynamic* workflow lets the agent reconfigure its plan on the fly based on what it learns. More flexible, more general, more demanding on the model. This is the same "workflow vs agent" tradeoff Anthropic's "building effective agents" guidance raises: use a fixed workflow when the steps are known, a full agent loop when exploration is needed.

**Planning strategies** (how the agent involves the user before acting):

| Strategy | Behavior | Example |
|---|---|---|
| Planning-only | Plan straight from the prompt, no clarification | Grok, Manus |
| Intent-to-planning | Ask clarifying questions first, then plan | OpenAI DR |
| Unified intent-planning | Draft a plan, then ask the user to confirm or edit it | Gemini DR |

**Single-agent vs multi-agent.** A single agent folds planning, tool use, and execution into one cognitive loop (the ReAct pattern: reason, act, observe). It is coherent and, crucially, easy to optimize end to end with reinforcement learning. A multi-agent system splits work across specialists with a coordinator, which scales to parallel, complex tasks but is much harder to train end to end. That training difficulty is a recurring theme: multi-agent systems are powerful but hard to optimize as a whole.

**Memory mechanisms** for long research (the same three moves from Chapter 5, confirmed across the literature): extend the context window (Gemini's million tokens), compress intermediate steps (summarize as you go, like Search-o1's "Reason-in-Documents"), or use external structured storage (files, vector databases, even knowledge graphs). Manus's file memory from Chapter 14 is the external-storage option.

### Fact-checking: the research version of "do not trust yourself"

DR agents add an explicit verification loop, which is Chapter 13's reliability law applied to facts. After drafting an answer, a good DR agent does not deliver it immediately. It cross-checks: it looks for independent sources that confirm a fact and searches for contradictions. Grok DeepSearch rates the credibility of every source and verifies key claims across multiple origins. Some systems (Zhipu's Rumination model) pause after concluding and keep searching to test whether the conclusion holds, then finalize. This multi-source cross-validation plus self-reflection is how DR agents drive down hallucination, and it is encouraged during training by correctness-oriented rewards.

### How they are trained

This is the genuinely new material. Earlier chapters improved agents by engineering the harness; here you improve the *model itself*. The DR survey lays out three families.

**Supervised fine-tuning (SFT).** Train the model on curated examples of good agent behavior: how to formulate search queries, how to structure a report, how to call tools. It improves retrieval quality and reduces hallucination, but it is confined to offline, static data and generalizes only so far.

**Reinforcement learning (RL).** Let the agent learn from reward signals on real tasks: did the retrieval help, was the answer correct, was the tool call appropriate? RL adapts better to open-ended environments than SFT. The survey highlights **GRPO** (Group Relative Policy Optimization) as the workhorse for DR systems, contrasting it with the older **PPO** (Proximal Policy Optimization). The key idea: GRPO drops PPO's separate value network and instead computes advantages *relative to a group* of responses, which gives richer gradient signal, faster convergence, and fewer conflicting objectives. You do not need the math to take the lesson: RL is how you teach an agent to search and use tools well, and GRPO is the currently favored recipe. Industrial systems (Gemini DR, Grok) use proprietary RL; academic ones favor transparent GRPO-based designs.

**Non-parametric continual learning.** The newest and most relevant to harness builders. Instead of updating model weights (expensive, slow), the agent improves at *runtime* by optimizing its external memory, workflows, and tools. The main technique is **case-based reasoning (CBR)**: the agent retrieves, adapts, and reuses past problem-solving trajectories from a "case bank." Unlike RAG (which retrieves static text), CBR retrieves whole reasoning trajectories and adapts them to the new task. This is genuine self-improvement without retraining, and it is well-suited to complex agents precisely because it sidesteps the cost of parameter updates. It is the training-side cousin of the auto-memory and shared-rules ideas from Chapter 9: the agent gets better by accumulating and reusing experience, stored outside the weights.

### Levels of automation and where agents still fall short

The "Deep Research of Deep Research" survey frames progress in levels of automation and notes current DR agents sit around level three; they search and review well but their genuine *research* capability is still comparatively weak. It also draws a useful map of environments: the **IDE** (internet/digital environment), the **SEE** (simulation experimental environment), and the **REE** (real experimental environment). Today's agents operate mostly in the IDE; reaching the REE (running real experiments) needs better physical perception, more tools, and sometimes embodiment. And it names a failure mode worth remembering: **jagged intelligence**, the way these systems do some hard things brilliantly while failing at simpler, closely related ones. That unevenness is exactly why the verification habits from Chapter 13 matter so much.

The survey's most quotable line for harness builders: "Harness is an agentic architecture that allows multiple agents to work with shared context across different sessions and context windows. Building reliable harnesses for DR sometimes matters more than the LLMs." After fifteen chapters, that should feel like a homecoming.

## Why it matters

DR agents are where the harness patterns meet the training methods, and they preview where coding agents are heading: planned, multi-agent, self-verifying, and increasingly *trained* rather than only prompted. Even if you never train a model, knowing the vocabulary (SFT, RL, GRPO, CBR) lets you read the field and understand why an agent behaves as it does. And the architecture (MasterAgent, SubAgents, ReviewAgent) plus the fact-checking loop are directly reusable in any agent that must produce trustworthy, sourced output.

## How it works: a research loop with planning, retrieval, and a review pass

The MVP is a dynamic single-agent research loop: plan subtasks, run each as a (simulated) retrieval, then a review pass that cross-checks claims against sources before producing a cited answer. It reuses the orchestration shape from Chapter 11 and the fact-checking idea above.

## Code MVP: a deep research loop

```python
"""
chapter 15: a deep research loop with planning, retrieval, and review.
Plan subtasks -> retrieve for each (with sources) -> review: keep only claims
backed by >= 2 independent sources -> produce a cited answer.
The review step is the fact-checking / anti-hallucination contract for facts.
"""
from collections import defaultdict

# --- fake retrieval: returns (claim, source) pairs for a subquery ---
FAKE_WEB = {
    "100m final time": [("final at 21:50", "olympics.com"),
                        ("final at 21:50", "bbc.com")],
    "eurostar last train": [("last Eurostar 21:13", "eurostar.com")],
    "west end show time": [("show at 19:30", "lwtheatres.co.uk"),
                          ("show at 19:30", "westend.com")],
}

def plan_subqueries(question: str) -> list:
    """Planning-only strategy (Chapter 15 taxonomy): decompose directly."""
    return ["100m final time", "eurostar last train", "west end show time"]

def retrieve(subquery: str) -> list:
    return FAKE_WEB.get(subquery, [])

def review(findings: list, min_sources: int = 2) -> dict:
    """ReviewAgent / fact-check: keep claims confirmed by >= min_sources
    independent sources; flag single-source claims as unverified."""
    by_claim = defaultdict(set)
    for claim, source in findings:
        by_claim[claim].add(source)
    verified = {c: sorted(s) for c, s in by_claim.items() if len(s) >= min_sources}
    unverified = {c: sorted(s) for c, s in by_claim.items() if len(s) < min_sources}
    return {"verified": verified, "unverified": unverified}

def deep_research(question: str) -> dict:
    findings = []
    for sub in plan_subqueries(question):          # MasterAgent plans
        findings.extend(retrieve(sub))             # SubAgents retrieve
    reviewed = review(findings)                     # ReviewAgent cross-checks
    answer = "; ".join(f"{c} [{', '.join(srcs)}]"
                       for c, srcs in reviewed["verified"].items())
    return {"answer": answer,
            "needs_more_research": list(reviewed["unverified"].keys())}

if __name__ == "__main__":
    from pprint import pprint
    pprint(deep_research("Can I watch the 100m final and still catch the West End show?"))
```

Run it: the loop plans three subqueries, retrieves claims with sources, and the review step keeps only the claims backed by at least two independent sources while flagging the single-source Eurostar time as needing more research. Every kept claim ships with its citations. That structure, plan then retrieve then cross-check then cite, is the spine of every production DR agent.

## Connecting to the bigger picture

Deep research agents are the multi-agent orchestration of Chapter 11 (MasterAgent, SubAgents, ReviewAgent), the memory mechanisms of Chapter 5, and the anti-hallucination contract of Chapters 10 and 13, all specialized for sourced output, plus a new training axis (SFT, RL/GRPO, CBR) that improves the model rather than the harness. The "harness matters more than the LLM" conclusion ties the whole guide together. The capstone borrows the review-pass idea as an optional fact-checking step.

## Key takeaways

- A **deep research agent** browses, retrieves, reasons, and writes cited reports. Architecture: a **MasterAgent** plans and spawns **SubAgents**, and a **ReviewAgent** verifies citations before delivery.
- Useful taxonomy: static vs dynamic workflows; planning strategies (planning-only, intent-to-planning, unified); single-agent (easy to train end to end) vs multi-agent (scales but hard to train); and three memory mechanisms (bigger window, compression, external storage).
- **Fact-checking** is the research form of "an agent cannot mark its own homework": cross-check claims across independent sources and reflect before finalizing.
- Agents are improved by training, not just prompting: **SFT** (curated examples), **RL** (reward signals, with **GRPO** the favored recipe over PPO), and **non-parametric continual learning** via **case-based reasoning** (reuse past trajectories without updating weights).
- Today's DR agents show **jagged intelligence** and operate mostly in digital environments; the surveys conclude that building a reliable **harness** often matters more than the underlying LLM.

Original sources: "Deep Research Agents: A Systematic Examination and Roadmap" ([arXiv:2506.18096](https://arxiv.org/abs/2506.18096)) and "Deep Research of Deep Research: from transformer to agent."

## Review

**Quick Check**

1. In the deep research architecture described by the survey, what is the ReviewAgent's job?
   - A) Summarize the SubAgents' findings into a single narrative before the MasterAgent sees them
   - B) Check that every claim is properly attributed to a source before the cited report goes back to the user
   - C) Decide whether the original query was clear enough to research
   - D) Rank sources by credibility so the MasterAgent can weight them
   <details><summary>Answer</summary>B) Check that every claim is properly attributed to a source before the cited report goes back to the user - The ReviewAgent is the verifier from Chapter 11 specialized for research. It is the structural expression of "an agent cannot mark its own homework."</details>

2. What distinguishes a dynamic workflow from a static one?
   - A) A dynamic workflow runs its steps in parallel; a static workflow runs them in sequence
   - B) A dynamic workflow uses a larger model; a static workflow uses a cheaper one
   - C) A static workflow runs a predefined pipeline and is predictable but generalizes poorly; a dynamic workflow lets the agent reconfigure its plan on the fly based on what it learns
   - D) A static workflow cannot call tools; a dynamic workflow can
   <details><summary>Answer</summary>C) A static workflow runs a predefined pipeline and is predictable but generalizes poorly; a dynamic workflow lets the agent reconfigure its plan on the fly based on what it learns - This is the same workflow-versus-agent tradeoff Anthropic's guidance raises: a fixed workflow when the steps are known, a full agent loop when exploration is needed.</details>

3. Which planning strategy drafts a plan and then asks the user to confirm or edit it?
   - A) Planning-only
   - B) Intent-to-planning
   - C) Unified intent-planning
   - D) Reason-in-Documents
   <details><summary>Answer</summary>C) Unified intent-planning - The survey's taxonomy has three: planning-only plans straight from the prompt with no clarification (Grok, Manus), intent-to-planning asks clarifying questions first then plans (OpenAI DR), and unified intent-planning drafts a plan then asks the user to confirm or edit it (Gemini DR).</details>

4. You need to improve an agent's research quality but cannot retrain the model. Which of the survey's three training families still applies?
   - A) Supervised fine-tuning, because curated examples can be added without a training run
   - B) Reinforcement learning with GRPO, because it drops the separate value network
   - C) Non-parametric continual learning, because the agent improves at runtime by optimizing external memory, workflows, and tools rather than updating weights
   - D) None; without weight updates an agent's capability is fixed
   <details><summary>Answer</summary>C) Non-parametric continual learning, because the agent improves at runtime by optimizing external memory, workflows, and tools rather than updating weights - Its main technique is case-based reasoning: retrieve, adapt, and reuse past problem-solving trajectories from a case bank. This is genuine self-improvement without retraining.</details>

5. A colleague says: "Multi-agent is obviously the better design, so we should always split research across specialists." What does the survey's tradeoff say?
   - A) Multi-agent systems produce lower-quality output because each specialist sees less context
   - B) Multi-agent scales to parallel, complex tasks but is much harder to optimize end to end, whereas a single agent folds everything into one loop and is easy to train end to end with RL
   - C) Multi-agent is always cheaper because each subagent uses a smaller context window
   - D) Single-agent designs cannot use tools, so multi-agent is required for research
   <details><summary>Answer</summary>B) Multi-agent scales to parallel, complex tasks but is much harder to optimize end to end, whereas a single agent folds everything into one loop and is easy to train end to end with RL - That training difficulty is a recurring theme in the survey: multi-agent systems are powerful but hard to optimize as a whole.</details>

**More Questions**

6. According to the survey, what is the key difference between GRPO and the older PPO?
   - A) GRPO uses a larger batch size, which stabilizes training on long trajectories
   - B) GRPO drops PPO's separate value network and computes advantages relative to a group of responses, giving richer gradient signal, faster convergence, and fewer conflicting objectives
   - C) GRPO trains on offline curated data while PPO trains on live rollouts
   - D) GRPO optimizes retrieval quality only; PPO optimizes the final answer
   <details><summary>Answer</summary>B) GRPO drops PPO's separate value network and computes advantages relative to a group of responses, giving richer gradient signal, faster convergence, and fewer conflicting objectives - You do not need the math to take the lesson: RL is how you teach an agent to search and use tools well, and GRPO is the currently favored recipe.</details>

7. How does case-based reasoning (CBR) differ from retrieval-augmented generation (RAG)?
   - A) CBR retrieves from a vector database while RAG retrieves from the open web
   - B) CBR retrieves whole reasoning trajectories and adapts them to the new task, while RAG retrieves static text
   - C) CBR updates model weights after each case; RAG does not
   - D) CBR only works for single-agent systems; RAG works for both
   <details><summary>Answer</summary>B) CBR retrieves whole reasoning trajectories and adapts them to the new task, while RAG retrieves static text - The agent retrieves, adapts, and reuses past problem-solving trajectories from a case bank. It is the training-side cousin of Chapter 9's auto-memory and shared rules: the agent gets better by accumulating and reusing experience stored outside the weights.</details>

8. The survey names **jagged intelligence** as a failure mode of current DR agents. What is it?
   - A) Output quality that degrades steadily as a research session gets longer
   - B) The tendency to produce well-cited but shallow reports on unfamiliar topics
   - C) The way these systems do some hard things brilliantly while failing at simpler, closely related ones
   - D) Uneven performance across languages, with English far ahead of everything else
   <details><summary>Answer</summary>C) The way these systems do some hard things brilliantly while failing at simpler, closely related ones - That unevenness is exactly why the verification habits from Chapter 13 matter so much: you cannot infer from one impressive result that the adjacent easy case is safe.</details>

9. A DR agent has drafted an answer and is confident in it. Following the chapter's fact-checking practice, what should happen next?
   - A) Deliver it immediately, since additional searching wastes tokens once the agent is confident
   - B) Cross-check by looking for independent sources that confirm each fact and searching for contradictions before finalizing
   - C) Hand it to a second model to rewrite it more persuasively
   - D) Store it in the case bank so future queries can reuse it directly
   <details><summary>Answer</summary>B) Cross-check by looking for independent sources that confirm each fact and searching for contradictions before finalizing - Grok DeepSearch rates the credibility of every source and verifies key claims across multiple origins, and Zhipu's Rumination model pauses after concluding and keeps searching to test whether the conclusion holds. Multi-source cross-validation plus self-reflection is how DR agents drive down hallucination.</details>

10. The "Deep Research of Deep Research" survey maps three environments: the IDE, the SEE, and the REE. Where do today's agents mostly operate, and what is missing to go further?
    - A) They operate in the REE; what is missing is faster inference
    - B) They operate in the SEE; what is missing is larger context windows
    - C) They operate mostly in the IDE (internet/digital environment); reaching the REE (real experimental environment) needs better physical perception, more tools, and sometimes embodiment
    - D) They operate across all three already; what is missing is standardized benchmarks
    <details><summary>Answer</summary>C) They operate mostly in the IDE (internet/digital environment); reaching the REE (real experimental environment) needs better physical perception, more tools, and sometimes embodiment - The survey places current DR agents at roughly level three of automation: they search and review well, but genuine research capability is still comparatively weak.</details>

**Coding Challenge**

Cross-Validating ReviewAgent

Implement the review pass that decides what a research agent is allowed to say. Write `review(findings, min_sources=2)` where `findings` is a list of `(claim, source)` pairs. It must group by claim, count *distinct* sources, and return a dict with three buckets: `verified` (claims backed by at least `min_sources` distinct sources, each mapped to its sorted source list), `unverified` (claims below the threshold), and `contradicted` (any pair of claims that share a `topic` prefix before a colon but differ after it, e.g. `"train time: 21:13"` versus `"train time: 22:40"`). A contradicted topic must never appear in `verified`, no matter how many sources back one side.

<details><summary>Python Solution</summary>

```python
from collections import defaultdict


def review(findings: list[tuple[str, str]], min_sources: int = 2) -> dict:
    """Cross-validate claims: distinct sources confirm, disagreement vetoes."""
    by_claim: dict[str, set[str]] = defaultdict(set)
    for claim, source in findings:
        by_claim[claim].add(source)

    # Group claims by topic so we can spot direct disagreement.
    by_topic: dict[str, set[str]] = defaultdict(set)
    for claim in by_claim:
        topic = claim.split(":", 1)[0].strip() if ":" in claim else claim
        by_topic[topic].add(claim)

    contradicted = {t: sorted(cs) for t, cs in by_topic.items() if len(cs) > 1}
    conflicted_claims = {c for cs in contradicted.values() for c in cs}

    verified, unverified = {}, {}
    for claim, sources in by_claim.items():
        if claim in conflicted_claims:
            continue                                  # disagreement vetoes both sides
        bucket = verified if len(sources) >= min_sources else unverified
        bucket[claim] = sorted(sources)

    return {"verified": verified, "unverified": unverified,
            "contradicted": contradicted}


# --- demo ---
if __name__ == "__main__":
    findings = [
        ("final time: 21:50", "olympics.com"),
        ("final time: 21:50", "bbc.com"),          # two distinct sources agree
        ("eurostar: 21:13", "eurostar.com"),        # single source only
        ("show time: 19:30", "lwtheatres.co.uk"),
        ("show time: 20:00", "westend.com"),        # direct disagreement
    ]
    result = review(findings)
    print("verified:   ", result["verified"])
    print("unverified: ", result["unverified"])
    print("contradicted:", result["contradicted"])
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function review(findings, minSources = 2) {
  // Cross-validate claims: distinct sources confirm, disagreement vetoes.
  const byClaim = new Map();
  for (const [claim, source] of findings) {
    if (!byClaim.has(claim)) byClaim.set(claim, new Set());
    byClaim.get(claim).add(source);
  }

  // Group claims by topic so we can spot direct disagreement.
  const byTopic = new Map();
  for (const claim of byClaim.keys()) {
    const topic = claim.includes(":") ? claim.split(":")[0].trim() : claim;
    if (!byTopic.has(topic)) byTopic.set(topic, new Set());
    byTopic.get(topic).add(claim);
  }

  const contradicted = {};
  const conflicted = new Set();
  for (const [topic, claims] of byTopic) {
    if (claims.size > 1) {
      contradicted[topic] = [...claims].sort();
      for (const c of claims) conflicted.add(c);
    }
  }

  const verified = {};
  const unverified = {};
  for (const [claim, sources] of byClaim) {
    if (conflicted.has(claim)) continue; // disagreement vetoes both sides
    const target = sources.size >= minSources ? verified : unverified;
    target[claim] = [...sources].sort();
  }

  return { verified, unverified, contradicted };
}

// --- demo ---
const findings = [
  ["final time: 21:50", "olympics.com"],
  ["final time: 21:50", "bbc.com"], // two distinct sources agree
  ["eurostar: 21:13", "eurostar.com"], // single source only
  ["show time: 19:30", "lwtheatres.co.uk"],
  ["show time: 20:00", "westend.com"], // direct disagreement
];
const result = review(findings);
console.log("verified:   ", result.verified);
console.log("unverified: ", result.unverified);
console.log("contradicted:", result.contradicted);
```

</details>

**Think About It**

1. After fifteen chapters of harness engineering, the survey lands on a line the chapter calls a homecoming: "Building reliable harnesses for DR sometimes matters more than the LLMs." That is an odd conclusion for a research literature obsessed with model capability. Why would people who train models end up saying the scaffolding matters more?
   <details><summary>Show answer</summary>Because they kept running the experiment that separates the two. Swap in a stronger model behind a weak harness and the failures barely move: the agent still loops, still loses the thread on a long task, still delivers a fluent claim with no source behind it. Fix the harness - give it a planner, isolate each subagent's context, add a review pass that refuses unattributed claims - and the same model starts producing work you can hand to someone. The survey's own architecture is almost entirely harness: MasterAgent, SubAgents, ReviewAgent, memory mechanisms, and not one of those is a model property. Model capability sets a ceiling, but most deployed agents are nowhere near their model's ceiling; they are limited by how the work around the model is organized. That is the whole thesis of this guide, arrived at independently by people whose day job is making the models better.</details>

2. Fixing hallucination sounds like it should be a model problem - the model made something up, so make the model more truthful. Yet the DR agents that reduce it most do so with an architectural move instead: a separate ReviewAgent that inspects the draft before anyone sees it. Why does splitting the work across two agents beat asking one agent to be more careful?
   <details><summary>Show answer</summary>Because a model checking its own output is not really checking anything - it is re-reading text it already found plausible, in the same context that produced it, with every reason to agree with itself. The failure is not carelessness; it is that a fabricated claim looks identical from the inside to a remembered one. A separate ReviewAgent breaks that loop by changing the question. It is not asked "is this right?" but "which source says this?" - a mechanical check with a mechanical answer, run by an agent that has no attachment to the draft. Grok DeepSearch goes further and rates each source's credibility and verifies key claims across multiple origins, so agreement has to come from independent places rather than one page quoted twice. The general shape recurs throughout the guide: when self-assessment is unreliable, restructure the work so something other than the author does the assessing.</details>

3. Zhipu's Rumination model does something that looks like a bug: it reaches a conclusion, and then keeps searching anyway. Every instinct in engineering says stop when you have the answer. Why is refusing to stop the right behavior here?
   <details><summary>Show answer</summary>Because of how an agent arrives at confidence. It searches, finds sources that fit, and builds an answer out of them - which means the evidence it has seen is, by construction, the evidence that supports the conclusion it reached. Contradicting evidence does not announce itself; it sits in the pages the agent never opened because it stopped looking. Rumination attacks exactly that: after concluding, it keeps searching specifically to test whether the conclusion survives, so the retrieval that could break the answer happens *after* the answer exists rather than never. It costs real tokens and real time to look for something you hope not to find, which is why most systems skip it - but on research output, where a confident wrong answer is worse than a slow one, that is a good trade.</details>

4. Non-parametric continual learning is the strange one of the three training families: the model's weights never change, and yet the agent measurably gets better at its job. Where does that improvement actually live?
   <details><summary>Show answer</summary>In the case bank, and in what the agent does with it. Case-based reasoning stores whole problem-solving trajectories - not facts, but the shape of how a task was worked through - and when a similar task arrives the agent retrieves that trajectory and adapts it. So the capability being reused is procedural rather than factual, which is what makes it different from RAG's static text retrieval. The model is exactly as smart as it was; what changed is that it no longer has to rediscover an approach it has already found once. That is why the survey calls it well-suited to complex agents: parameter updates are slow and expensive, but appending a solved trajectory to a case bank costs almost nothing and pays off immediately. It is Chapter 9's memory idea pushed one level up - from remembering facts about a project to remembering how a problem was solved.</details>
