# 01 — Foundational Modelling

Papers covering the core architectural and training innovations that made modern LLMs possible: self-attention, scaling, fine-tuning, alignment, and efficient inference.

> New to this material? Start with the beginner-friendly walkthrough in [explanations/](./explanations/00-start-here.md), which explains every paper here in plain language with diagrams, examples, and a linked [glossary](./explanations/glossary.md).

---

## Papers

| # | Title | Year | Link | Notes |
|---|-------|------|------|-------|
| 1 | **Attention Is All You Need** (Transformers) ⭐ | 2017 | [arxiv](https://arxiv.org/pdf/1706.03762) | Introduces the Transformer architecture and self-attention — the foundation of every modern LLM |
| 2 | **Scaling Laws for Neural Language Models** | 2020 | [arxiv](https://arxiv.org/pdf/2001.08361) | Quantifies how loss scales with model size, data, and compute — gave teams conviction to scale |
| 3 | **GPT-3: Language Models are Few-Shot Learners** ⭐ | 2020 | [arxiv](https://arxiv.org/pdf/2005.14165) | Demonstrates emergent few-shot ability at scale; blueprint for GPT-3/4 |
| 4 | **LoRA: Low-Rank Adaptation of Large Language Models** | 2021 | [arxiv](https://arxiv.org/abs/2106.09685) | Efficient fine-tuning by injecting trainable low-rank matrices — widely used today |
| 5 | **Training Compute-Optimal Large Language Models** (Chinchilla) | 2022 | [arxiv](https://arxiv.org/pdf/2203.15556) | Shows models are often over-parameterised and under-trained; redefines optimal scaling |
| 6 | **Training Language Models to Follow Instructions with Human Feedback** (RLHF / InstructGPT) ⭐ | 2022 | [arxiv](https://arxiv.org/pdf/2203.02155) | RLHF pipeline that turned GPT-3 → ChatGPT; cornerstone of modern alignment |
| 7 | **Direct Preference Optimization (DPO)** | 2023 | [arxiv](https://arxiv.org/pdf/2305.18290) | Replaces RL + reward model with a simpler supervised objective; cleaner alignment |
| 8 | **Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena** | 2023 | [arxiv](https://arxiv.org/pdf/2306.05685) | Shows LLMs can evaluate other LLMs on par with human raters |
| 9 | **Mixtral of Experts** (MoE) | 2024 | [arxiv](https://arxiv.org/pdf/2401.04088) | Mixture-of-Experts architecture achieving GPT-3.5 quality at lower inference cost |

---

*Read in order 1 → 3 → 6 → 4 → 7 for the clearest narrative arc.*
