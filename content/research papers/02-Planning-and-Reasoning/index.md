# 02 — Planning & Reasoning

Papers on how models plan, reason step-by-step, verify their work, and learn from reinforcement signals — from game-playing RL to chain-of-thought prompting and o1-style reasoning.

> New to this material? Start with the beginner-friendly walkthrough in [explanations/](./explanations/00-start-here.md), which explains every paper here in plain language with diagrams, examples, and a linked [glossary](./explanations/glossary.md).

---

## Papers

| # | Title | Year | Link | Notes |
|---|-------|------|------|-------|
| 1 | **Mastering Chess and Shogi by Self-Play with a General Reinforcement Learning Algorithm** (AlphaZero) | 2017 | [arxiv](https://arxiv.org/pdf/1712.01815) | RL without human knowledge; precursor to reasoning models |
| 2 | **Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model** (MuZero) ⭐ | 2019 | [arxiv](https://arxiv.org/pdf/1911.08265) | Learns the rules of the game itself; extends AlphaZero to model-based RL |
| 3 | **Chain-of-Thought Prompting Elicits Reasoning in Large Language Models** (CoT) ⭐ | 2022 | [arxiv](https://arxiv.org/pdf/2201.11903) | Simple "think step by step" dramatically improves multi-step reasoning |
| 4 | **ReAct: Synergizing Reasoning and Acting in Language Models** | 2022 | [arxiv](https://arxiv.org/pdf/2210.03629) | Interleaves reasoning traces with tool-use actions — basis of agentic loops |
| 5 | **Let's Verify Step by Step** (Process Reward Models) | 2023 | [arxiv](https://arxiv.org/pdf/2305.20050) | Process supervision (reward each step) beats outcome supervision |
| 6 | **Tree of Thoughts: Deliberate Problem Solving with Large Language Models** (ToT) | 2023 | [arxiv](https://arxiv.org/pdf/2305.10601) | Explores a tree of reasoning paths and backtracks — beats CoT on hard tasks |
| 7 | **Graph of Thoughts: Solving Elaborate Problems with Large Language Models** (GoT) | 2023 | [arxiv](https://arxiv.org/pdf/2308.09687) | Generalises ToT to arbitrary DAG reasoning graphs |
| 8 | **ARC Prize: Technical Report** ⭐ | 2024 | [arxiv](https://arxiv.org/pdf/2412.04604) | State-of-the-art methods for solving ARC-AGI — best proxy for general reasoning |
| 9 | **DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning** ⭐ | 2025 | [arxiv](https://arxiv.org/pdf/2501.12948v1) | Builds o1-level OSS reasoning model with pure RL, no SFT, no reward model |
| 10 | **Meta Chain-of-Thought** (Meta CoT) | 2025 | [arxiv](https://arxiv.org/pdf/2501.04682) | Meta-reasoning: models learn *when* and *how* to chain thoughts |
| 11 | **Recursive Language Models** | 2026 | [arxiv](https://arxiv.org/pdf/2512.24601v1) | Simple REPL + basic tools → models emergently learn adaptive strategies without explicit prompting |

---

*Start with CoT (3), then ReAct (4), then DeepSeek-R1 (9) for the fastest path to understanding modern reasoning.*
