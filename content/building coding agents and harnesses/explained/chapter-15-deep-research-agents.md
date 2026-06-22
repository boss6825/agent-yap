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
