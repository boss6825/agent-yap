# Glossary: Benchmarks

This is your shared reference for folder 04. Every term the chapters link to is explained here from scratch, in plain language, with enough depth to actually understand it rather than just recognize it. Read it straight through as a primer, or jump in whenever a chapter sends you here.

A few foundational terms live in the earlier folders and are linked across rather than repeated: what a [benchmark](../foundational-modelling/chapter-07-glossary.md#benchmark) is at heart, the [Elo rating](../foundational-modelling/chapter-07-glossary.md#elo-rating) system, [emergent ability](../foundational-modelling/chapter-07-glossary.md#emergent-ability), [sparse and dense models](../foundational-modelling/chapter-07-glossary.md#sparse-and-dense-models), [long context](../planning-and-reasoning/chapter-06-glossary.md#context-window-and-long-context), and [agent](../planning-and-reasoning/chapter-06-glossary.md#agent). This glossary focuses on the ideas specific to evaluation.

Terms are grouped by theme so related ideas sit together.

- Benchmark basics: [Benchmark](#benchmark), [Static vs live benchmark](#static-vs-live-benchmark), [Ground truth](#ground-truth), [Human preference](#human-preference), [Task and task suite](#task-and-task-suite), [Metric](#metric), [Saturation](#saturation), [Contamination](#contamination), [Canary string](#canary-string)
- Scoring and scaling behavior: [Calibration](#calibration), [Aggregate score](#aggregate-score), [Breakthrough behavior](#breakthrough-behavior), [Brittleness](#brittleness), [BIG-Bench Lite](#big-bench-lite)
- Measuring real coding: [Repository and codebase](#repository-and-codebase), [Issue and pull request](#issue-and-pull-request), [Patch and diff](#patch-and-diff), [Unit test](#unit-test), [Execution-based evaluation](#execution-based-evaluation), [HumanEval](#humaneval), [SWE-Llama](#swe-llama)
- Ranking by human votes: [Pairwise comparison](#pairwise-comparison), [Crowdsourcing](#crowdsourcing), [Leaderboard](#leaderboard), [Elo rating](#elo-rating), [Bradley-Terry model](#bradley-terry-model), [Confidence interval](#confidence-interval), [Active sampling](#active-sampling)

---

## Benchmark basics

### Benchmark

A benchmark is a shared, standardized test that many different models are run through so their results can be compared on equal footing. Think of it as a common exam: if everyone sits the same paper under the same rules, the scores mean something relative to each other. The deeper idea is explained in the [folder 01 glossary](../foundational-modelling/chapter-07-glossary.md#benchmark); this whole folder is about what separates a good benchmark from a misleading one. The short version is that a benchmark is only useful if it is hard to fake, broad enough to be representative, and resistant to going stale.

### Static vs live benchmark

This is the single most useful distinction in the folder. A static benchmark is a fixed list of questions written down in advance, the same set every time, like a printed exam. A live benchmark draws a fresh stream of questions from the real world as it runs, so no two runs use exactly the same inputs. Static benchmarks are cheap, repeatable, and easy to share, which is why most benchmarks are static (BIG-Bench and the core of SWE-bench are static). Their weakness is that a fixed question set can leak into training data and can fail to capture how people really use a model. Live benchmarks, like Chatbot Arena, stay fresh and are much harder to memorize in advance, but they are harder to run and to make reproducible. Neither is simply better; they answer different questions.

### Ground truth

Ground truth is a known, agreed-upon correct answer that you can score against. If the question is "what is 12 times 8?" the ground truth is 96, and grading is mechanical. Many benchmarks rely on ground truth because it makes scoring objective and automatic. The catch is that for open-ended requests, such as "rewrite this paragraph to sound friendlier," there often is no single correct answer, so ground-truth scoring cannot apply. That gap is exactly why human-preference evaluation exists.

### Human preference

Human preference is a way of scoring answers not against a correct solution but by asking people which answer they like better. It is the natural metric for open-ended tasks where quality is a matter of judgment rather than correctness. Its strength is that it captures what users actually value; its difficulty is that human opinions are noisy and can disagree, so you need many judgments and careful statistics to turn them into a reliable signal. Chatbot Arena is built entirely on human preference.

### Task and task suite

A task is one specific kind of problem you ask a model to solve, for example translating a sentence or answering a multiple-choice science question. A task suite is a bundle of many such tasks gathered into one benchmark. The reason large models are tested with suites rather than single tasks is that a generalist model can be strong in one area and surprisingly weak in another, and only a wide spread of tasks reveals the full shape of its abilities. BIG-Bench is a task suite of 204 tasks, deliberately spanning many different domains.

### Metric

A metric is the specific rule you use to turn a model's output into a number. Accuracy (the fraction of questions answered correctly) is the most common, but there are many others, and the choice of metric quietly shapes what a benchmark rewards. A poorly chosen metric can make a weak model look strong or vice versa, which is why the BIG-Bench authors warned that even automatic, programmatic metrics can be surprisingly subjective. Whenever you read a benchmark score, it is worth asking exactly what was measured.

### Saturation

Saturation is what happens when a benchmark becomes too easy: nearly every model scores near the top, so the test can no longer tell strong models apart. A saturated benchmark has outlived its usefulness, like an exam where everyone gets full marks. The rapid saturation of older benchmarks was a major motivation for BIG-Bench, which deliberately included tasks believed to be beyond current models so that there would be plenty of room left to measure improvement.

### Contamination

Contamination is when the questions or answers from a benchmark accidentally end up in a model's training data. The model can then score well by having effectively seen the test in advance, which is memorization, not skill. Because most benchmarks are published openly on the internet, contamination is a constant threat to honest evaluation, and it gets worse as training datasets scrape ever more of the web. Defenses include keeping a hidden test set, refreshing questions over time, and the canary-string trick described next.

### Canary string

A canary string is a unique, distinctive identifier embedded in every document of a benchmark so that the benchmark can be detected later. The idea, introduced by BIG-Bench, is twofold. Model builders can search their training data for the string and remove the benchmark before training, preventing contamination. And researchers can test whether a model has secretly memorized the benchmark by checking whether it reproduces the string. The name comes from the canary in a coal mine: a simple early-warning device.

---

## Scoring and scaling behavior

### Calibration

Calibration measures whether a model's confidence matches its accuracy. A well-calibrated model that says it is 70 percent sure is right about 70 percent of the time. A badly calibrated model might be wrong half the time while sounding completely certain. Calibration matters because a confident wrong answer is far more dangerous than a hesitant one. BIG-Bench found that calibration improves as models grow larger, but was still poor in absolute terms for the models of its day.

### Aggregate score

An aggregate score is a single number that summarizes performance across many tasks, usually by averaging. It is convenient, because it lets you rank models at a glance, but it can hide a lot: a strong average can mask total failure on a few important tasks, and the way you combine tasks affects the result. This is why broad benchmarks report not just one aggregate but also breakdowns by task and comparisons to a human baseline.

### Breakthrough behavior

Breakthrough behavior describes a skill that barely improves as a model grows, then jumps sharply once the model crosses some critical size. Plotted against scale, the curve stays flat and then suddenly climbs, rather than rising smoothly. BIG-Bench found that tasks with breakthrough behavior tend to require several reasoning steps chained together, while tasks that improve smoothly tend to lean on knowledge or memorization. This is the same phenomenon as [emergent ability](../foundational-modelling/chapter-07-glossary.md#emergent-ability), observed across hundreds of tasks at once. A practical warning attached to it: whether a task looks like a breakthrough can depend on the exact metric used, so these curves should be read with care.

### Brittleness

Brittleness is the tendency of a model's score to swing on small, meaningless changes, such as rewording a question, reordering options, or changing formatting. A brittle model has not really mastered a task; it has latched onto surface cues. BIG-Bench documented that even very large models are brittle in this way, which is a key reason no single benchmark number should be trusted on its own.

### BIG-Bench Lite

BIG-Bench Lite is a smaller, curated subset of the full BIG-Bench suite, chosen to be representative so that researchers can get a quick read on a model without the expense of running all 204 tasks. It reflects a common pattern in evaluation: pair a large, thorough benchmark with a cheaper proxy version for fast iteration, then run the full suite less often.

---

## Measuring real coding

### Repository and codebase

A repository (often shortened to repo) is the complete collection of files that make up a software project, together with its history of changes. Codebase is a near-synonym for the body of code itself. Real software work happens inside large repositories where a single feature is spread across many files, and understanding how those files interact is most of the job. SWE-bench is built on real repositories precisely so that it tests this skill, rather than the much easier skill of writing one isolated function.

### Issue and pull request

On platforms like GitHub, an issue is a written report describing a bug or requesting a feature, in plain language. A pull request (PR) is a proposed bundle of code changes submitted to fix an issue or add something, usually reviewed and then merged into the project. The pair is the natural unit of software work: a problem stated as an issue, and a solution delivered as a pull request, often with tests proving the solution works. SWE-bench harvests exactly these issue-and-pull-request pairs from real projects to build its tasks.

### Patch and diff

A patch (also called a diff) is a precise description of changes to make to code: which lines to remove and which to add, in which files. Rather than rewriting whole files, developers and models express edits as patches, which are compact and easy to apply automatically. In SWE-bench, the model's answer is a patch, and the benchmark grades it by applying that patch to the codebase and running the tests.

### Unit test

A unit test is a small piece of code that automatically checks whether some part of a program behaves correctly, by running it on a known input and confirming the output is as expected. Projects accumulate many unit tests so they can catch mistakes automatically. Unit tests are what make software such a clean thing to grade: a fix either makes the relevant tests pass or it does not, no human judgment required.

### Execution-based evaluation

Execution-based evaluation means scoring a model by actually running its output and observing the result, rather than comparing its text to a reference answer. In SWE-bench, the model's patch is applied and the project's real tests are run; the score is simply whether the tests pass. This is far stronger than checking whether the code looks similar to a human solution, because there are many valid ways to fix a bug, and the only thing that truly matters is whether the fix works.

### HumanEval

HumanEval is an earlier and very popular coding benchmark in which a model is asked to write a small, self-contained function from a short description, checked by running a few tests. It was valuable but limited: its problems can typically be solved in a handful of lines and involve no surrounding codebase. SWE-bench was designed largely in contrast to HumanEval, replacing tidy isolated puzzles with messy real-world repository work.

### SWE-Llama

SWE-Llama is a pair of open models (7 billion and 13 billion parameters) that the SWE-bench authors created by fine-tuning Meta's CodeLlama on their training set, SWE-bench-train. The point was to show that open models could be specialized for real software-engineering tasks; SWE-Llama had to handle very [long contexts](../planning-and-reasoning/chapter-06-glossary.md#context-window-and-long-context) of over 100,000 tokens to read enough of a codebase, and in some settings it was competitive with much larger proprietary models.

---

## Ranking by human votes

### Pairwise comparison

A pairwise comparison is a judgment between exactly two options: shown answer A and answer B, which is better? It is much easier and more reliable for people to compare two things than to score one thing on an absolute scale, because "is this a 7 or an 8 out of 10?" is hard while "is A better than B?" is natural. Chatbot Arena is built entirely on pairwise comparisons, one vote per head-to-head matchup.

### Crowdsourcing

Crowdsourcing means collecting many small contributions from a large, open group of ordinary people rather than from a handful of experts. Chatbot Arena crowdsources both its questions (real users type whatever they want) and its judgments (those same users vote). The benefit is scale and diversity that no expert panel could match; the challenge is noise, since individual votes are inconsistent, which is why heavy statistics are needed to extract a reliable signal.

### Leaderboard

A leaderboard is a public ranking of models from best to worst according to some benchmark. Leaderboards focus attention and drive competition, for better and worse: they make progress visible, but they also create pressure to optimize for the specific benchmark. Chatbot Arena's leaderboard became one of the most referenced in the field because its live, human-preference design is hard to game by memorization.

### Elo rating

Elo is a rating system, originally from chess, that estimates each player's strength from the outcomes of head-to-head matches. The full mechanics are explained in the [folder 01 glossary](../foundational-modelling/chapter-07-glossary.md#elo-rating). The key intuition for this folder is that beating a strong opponent raises your rating more than beating a weak one, and losing to a weak opponent costs you more. Chatbot Arena uses Elo-style ratings as an intuitive way to rank models from pairwise votes.

### Bradley-Terry model

The Bradley-Terry model is a statistical method, dating to 1952, for estimating each competitor's underlying strength from a record of pairwise wins and losses. It is closely related to Elo but is a cleaner, more principled way to fit all the data at once and to attach confidence to the result. Chatbot Arena uses it to convert hundreds of thousands of noisy, lopsided votes into a stable ranking, along with a confidence interval around each model's score.

### Confidence interval

A confidence interval is a range that expresses how uncertain an estimate is. Instead of saying a model's rating is exactly 1200, you say it is 1200 give or take 15, meaning the true value is very likely within that band. Confidence intervals are essential for honest leaderboards: if two models' intervals overlap heavily, the data cannot really tell them apart, and claiming one is better would be overreaching. Chatbot Arena reports these intervals so readers can see which ranking gaps are real and which are noise.

### Active sampling

Active sampling is choosing which comparisons to run based on what would be most informative, rather than comparing everything at random. In Chatbot Arena, it means preferentially matching up models whose relative strength is still uncertain, the way a tournament scheduler arranges the games that will best clarify the standings. This makes the rankings converge faster and wastes fewer votes, while keeping the statistics valid.
