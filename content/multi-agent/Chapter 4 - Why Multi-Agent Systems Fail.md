# Chapter 4: Why Multi-Agent Systems Fail: The MAST Taxonomy

This chapter explains "Why Do Multi-Agent LLM Systems Fail?" by Anna Alexandra Grigoryan, which summarizes a research paper that set out to study failure systematically. Where Chapter 3 argued from principles that multi-agent systems are fragile, this chapter brings evidence: a careful, data-driven catalog of how they actually break, and a method for diagnosing your own system.

## The motivating puzzle

Multi-agent systems are appealing in theory. They promise modular reasoning, distributed workload, and emergent coordination, with agents specialized in planning, coding, reviewing, tool use, and verification. Yet in practice their performance is inconsistent. Across tasks like code generation, web interaction, and software simulation, many multi-agent systems perform worse than a strong single agent, or even worse than simple best-of-N sampling (just running one model several times and picking the best answer).

The sharpest finding: these failures cannot be blamed on the model. In several cases the very same model in a single-agent setup outperforms the multi-agent version. That tells you the problem is architectural, in communication, coordination, and workflow orchestration, not a matter of the model being too weak. The paper's framing line is that coordination, not capability, is what breaks multi-agent systems.

## The contributions, in plain terms

The paper makes three contributions:

1. MAST, a Multi-Agent System Failure Taxonomy: a careful catalog of 14 failure modes grouped into three categories.
2. An [LLM-as-a-judge](../glossary/Glossary.md#llm-as-a-judge) method that automatically labels failures according to MAST, reaching about 94 percent accuracy and strong agreement with human experts (a Cohen's Kappa of 0.77, which is a statistical measure of agreement beyond chance).
3. Case studies showing that you can improve real systems by fixing the failure modes MAST reveals, rather than just reaching for a bigger model.

The taxonomy itself was not invented from a whiteboard. It came from manually annotating over 200 execution traces, each averaging more than 15,000 tokens, using a careful method (grounded theory) and refining the categories until annotators agreed with each other. That grounding is what makes the taxonomy credible.

## The three categories of failure

MAST sorts its 14 failure modes by the stage of the agent lifecycle where they originate: before execution, during execution, and after execution.

### 1. Specification issues (about 41.8 percent of failures)

These come from a flawed setup: poor prompt design, missing role constraints, or no clear stopping criteria. Representative modes include:

- Disobeying the task specification.
- Repeating steps that were already completed.
- Losing track of the conversation history.
- Failing to recognize when the task is actually done.

This is the largest category, which is a striking result on its own: the single biggest source of failure is how the system was specified and set up, before any agent even starts talking to another.

### 2. Inter-agent misalignment (about 36.9 percent)

These happen during execution, from miscommunication, conflicting assumptions, or context that never gets passed along. Examples include:

- Ignoring what other agents said.
- Proceeding without asking for clarification.
- Resetting conversations unexpectedly.
- A mismatch between what an agent reasons and what it actually does.

This category is essentially the empirical confirmation of Cognition's Principle 2 from Chapter 3: conflicting hidden decisions and unshared context are not just a theoretical worry, they account for over a third of observed failures.

### 3. Task verification failures (about 21.3 percent)

These come from weak quality control at the end:

- Ending the task too early.
- Skipping validation entirely.
- Accepting an incorrect solution because the check was shallow.

The article highlights a recurring pattern here: many systems do include a verifier agent, but its checks are superficial. Code is accepted just because it compiles. A program is assumed correct because its comments look consistent. That is not real verification.

An important note: many traces contain several failure modes at once, which is why the paper argues for structured diagnosis rather than ad hoc inspection.

## A practical fix: layered verification

One of the most actionable recommendations is that verification should be layered and integrated, not a single shallow pass:

- Low level: syntax and execution (does it run?).
- Mid level: behavioral checks and task-specific logic (does it do the right thing?).
- High level: alignment with the user's actual intent or objective success (is it what was wanted?).

Adding these layers requires real architectural changes and sometimes symbolic checks, not just more instructions in a prompt. This connects directly to the "Intern Test" idea from the context-engineering material: prefer hard, computable checks.

## How to use MAST on your own system

The article gives a concrete recipe, which is the practical heart of the piece:

1. Collect execution traces. Instrument your system to save complete conversation histories, including all messages between agents and with the environment, across a variety of task types and difficulty levels.
2. Set up the MAST annotator. Use the published MAST repository as a base, and prompt a capable model with the full list of failure-mode definitions plus a few example traces (this is few-shot prompting).
3. Annotate your traces. Run them through the annotator to label each with the failure modes present, and manually validate a subset to check reliability.
4. Analyze the distribution. Ask which failures are most common, whether they cluster in one phase (coordination versus verification), and which agents propagate the most errors.
5. Design targeted interventions. Focus on the high-frequency failure types: add clarification strategies if agents proceed without asking; add domain-aware test cases if verification is weak; reorder agent responsibilities if specification issues dominate.
6. Re-run and compare. Use the same pipeline after your changes, and compare both the overall success rate and the shift in the failure distribution.

This turns failure analysis from guesswork into a repeatable engineering loop, the same way traditional software is profiled and optimized.

## The big-picture lesson

The most important takeaway is the one stated up front: improving a multi-agent system is mostly about better orchestration, not bigger models or more tokens. Many failures come from agents operating on incorrect assumptions, ignoring peer input, or failing to verify their outputs, all of which are design problems. The article's broader contribution is to move the whole conversation from anecdote ("multi-agent systems are flaky") to diagnosis ("here is exactly which of 14 failure modes is hurting your system, and here is how to measure improvement").

## Key takeaways

- Multi-agent systems often underperform a single agent using the same model, which proves the problem is coordination, not capability.
- MAST catalogs 14 failure modes in three groups: specification issues (about 42 percent), inter-agent misalignment (about 37 percent), and verification failures (about 21 percent).
- Specification issues are the largest single source of failure, meaning setup and role clarity matter enormously.
- Verifier agents often exist but check too shallowly; verification should be layered (syntax, behavior, intent).
- MAST plus an LLM judge gives a repeatable loop: collect traces, annotate, find dominant failures, intervene, re-measure.
- Fixing orchestration beats reaching for a bigger model.

Continue to Chapter 5, which reconciles the for and against arguments into a single coherent view.
