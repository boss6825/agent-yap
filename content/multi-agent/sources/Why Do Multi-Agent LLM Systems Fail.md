# Why Do Multi-Agent LLM Systems Fail? | by Anna Alexandra Grigoryan | Medium

# **Why Do Multi-Agent LLM Systems Fail?**

[

![Anna Alexandra Grigoryan](https://miro.medium.com/v2/resize:fill:64:64/1*tuprc6SjRmyzab0Z8KzZ-A@2x.jpeg)

](/?source=post_page---byline--14dc34e0f3cb---------------------------------------)

[Anna Alexandra Grigoryan](/?source=post_page---byline--14dc34e0f3cb---------------------------------------)

Follow

5 min read

·

Apr 30, 2025

32

[

Listen

](https://medium.com/plans?dimension=post_audio_button&postId=14dc34e0f3cb&source=upgrade_membership---post_audio_button-----------------------------------------)

Share

More

Multi-agent systems built on top of large language models are becoming increasingly popular in research and prototyping environments. These systems **emulate organizational behavior through agents specialized in planning, coding, reviewing, tool use, and verification**. Their promise lies in modular reasoning, workload distribution, and emergent coordination.

Despite this theoretical appeal, **empirical performance remains inconsistent**. Across tasks such as code generation, web interaction, and software simulation, **many multi-agent systems perform worse than strong single-agent baselines or simple best-of-N sampling**.

Crucially, these failures cannot be fully attributed to LLM limitations. **In several cases, using the same model in a single-agent setup outperforms the multi-agent version.** This points to systemic breakdowns in communication, coordination, and workflow orchestration. The core problem is architectural, not model-level.

> The Problem: Coordination, not Capability, is Breaking MAS

[This paper](https://arxiv.org/abs/2503.13657) sets out to answer a foundational question:

**_Why do multi-agent LLM systems fail, and how can we systematically detect, classify, and fix those failures?_**

![](https://miro.medium.com/v2/resize:fit:875/0*r-aIp0FIOFJgTsop)
Photo by CHUTTERSNAP on Unsplash

## **Contributions of the Paper**

The authors introduce a framework for diagnosing multi-agent system failures. Their contributions fall into three main areas:

### **1\. MAST: Multi-Agent System Failure Taxonomy**

A rigorously defined taxonomy of 14 failure modes grouped into three high-level categories:

-   **Specification Issues**
-   **Inter-Agent Misalignment**
-   **Task Verification Failures**

### **2\. LLM-as-a-Judge: Scalable Failure Classification**

A few-shot prompting approach that enables LLMs to label MAS failure types according to the MAST taxonomy. This pipeline reaches 94 percent accuracy and 0.77 Cohen’s Kappa agreement with expert human annotations.

### **3\. Intervention Case Studies on Real Systems**

The taxonomy and automated evaluator are used to analyze and improve existing multi-agent systems, demonstrating that performance gains can be achieved by refining system design, rather than relying solely on better models or prompts.

## **Understanding MAST: A Structured View of Failure**

The MAST taxonomy was derived from the manual annotation of over 200 execution traces, each averaging more than 15,000 tokens. Human annotators used **grounded theory** methods and iteratively refined the categories through inter-annotator agreement studies. This process resulted in 14 failure modes spanning three categories.

### **1\. Specification Issues (41.8 percent of failures)**

These failures originate from flawed setup, including poor prompt design, missing role constraints, or lack of termination criteria. Representative modes:

-   Disobeying task specification
-   Repeating previously completed steps
-   Losing conversation history
-   Failing to recognize when a task is complete

### **2\. Inter-Agent Misalignment (36.9 percent)**

These failures occur during execution due to miscommunication, conflicting assumptions, or missing context propagation. Examples include:

-   Ignoring other agents’ input
-   Proceeding without clarification
-   Resetting conversations
-   Mismatches between reasoning and action

### **3\. Task Verification Failures (21.3 percent)**

Failures in this group arise from inadequate quality control. This includes:

-   Ending tasks too early
-   Skipping validation
-   Accepting incorrect solutions due to shallow checks

Each failure mode is precisely defined and assigned to the relevant stage in the agent lifecycle (pre-execution, execution, or post-execution).

Importantly, many traces contain multiple failure types, emphasizing the need for structured diagnostics rather than ad hoc inspection.

## **Evaluation with LLM-as-a-Judge**

To scale failure classification, the authors created an LLM annotator using OpenAI’s o1 model. It is prompted with definitions of the MAST taxonomy and few-shot examples.

Results show that this setup performs reliably:

-   Accuracy: 94 percent
-   Precision: 83.3 percent
-   F1 Score: 80 percent
-   Cohen’s Kappa: 0.77

This tool enables practical, scalable diagnosis of MAS failures and allows developers to track failure distributions over time or across interventions.

## **Insights for MAS Engineering**

### **1\. LLM Capability Is Not the Bottleneck**

**Many failures stem from poor system design, not model performance.** Agents operate with incorrect assumptions, ignore peer input, or fail to verify their outputs.

[](https://medium.com/write?source=promotion_paragraph---post_body_banner_better_place_scribble--14dc34e0f3cb---------------------------------------)

Improving MAS robustness will require better orchestration strategies, not just larger models or more tokens.

### **2\. Verification Needs to Be Layered and Integrated**

Current MAS implementations often include **a verifier agent, but its checks are superficial**. Code is accepted if it compiles. Programs are assumed correct if comments appear consistent. The paper advocates for layered verification:

-   **Low-level**: syntax and execution
-   **Mid-level**: behavioral checks and task-specific logic
-   **High-level**: alignment with user intent or objective success

Adding these layers requires architectural changes and integration of symbolic checks, not just additional prompt instructions.

### **3\. Failure Mode Classification Enables Systematic Debugging**

MAST allows developers to understand **_why_** their systems fail. Rather than chasing improvements via intuition or aggregate scores, **teams can identify dominant failure modes and track how design changes affect them**.

This creates a reproducible engineering loop:

1\. Run MAS traces

2\. Annotate failures using the LLM-as-a-Judge

3\. Identify frequent failure modes

4\. Redesign prompts, workflows, or agent roles

5\. Re-evaluate and repeat

This process mirrors how traditional systems are debugged and optimized.

## **How to Evaluate Your Multi-Agent System Using MAST**

If you are building a multi-agent LLM system and want to understand how and why it fails, here is a recipe to apply MAST to your setup.

### **Step 1: Collect Execution Traces**

Instrument your MAS to save complete conversation histories. Each trace should include all messages between agents and with the environment. Aim for a wide variety of task types and difficulty levels.

### **Step 2: Install or Reproduce the MAST LLM Annotator**

Use the [MAST GitHub repository](https://github.com/multi-agent-systems-failure-taxonomy/MAST) as a base. Prompt an LLM (e.g. GPT-4o) with:

-   The full list of MAST failure mode definitions
-   Example traces for few-shot guidance
-   A request to identify failure modes in each trace

### **Step 3: Annotate Your Corpus**

Run your traces through the annotator. Label each with the set of failure modes observed. If feasible, validate a subset of the results manually to check reliability.

### **Step 4: Analyze Failure Distribution**

Aggregate failure modes across your traces. Use this distribution to answer:

-   Which failures are most common?
-   Are they concentrated in one phase (e.g., coordination vs verification)
-   Which agents are most prone to error propagation?

### **Step 5: Design Interventions**

**Focus on high-frequency failure types**. Redesign agent roles, prompts, or workflows accordingly. For instance:

-   Add clarification strategies if FM-2.2 is dominant.
-   Introduce domain-aware test cases if FM-3.3 is frequent
-   Reorder agent responsibilities if FM-1.5 is common

### **Step 6: Re-run and Compare**

Use the same evaluation pipeline after changes. Compare both overall success rates and the shift in failure modes to validate progress.

This process helps MAS developers move from anecdotal failure analysis to a repeatable debugging pipeline.

## Wrapping Up

This paper makes a significant contribution by **moving the discussion around multi-agent systems from anecdote to diagnosis**. Rather than attributing poor performance to vague prompt limitations or model errors, it introduces a precise framework for understanding and addressing failure at the system level.

**MAST**, combined with automated trace analysis, provides the foundation for building multi-agent systems that are not only more capable, but more reliable. As agent-based architectures scale in complexity and ambition, tools like this will be essential to make their development tractable.

## Embedded Content

---