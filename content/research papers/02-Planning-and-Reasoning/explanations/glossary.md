# Glossary: Planning and Reasoning

This is your shared reference for folder 02. Every term the chapters link to is explained here from scratch, in plain language, with enough depth to actually understand it rather than just recognize it. Read it straight through as a primer, or jump in whenever a chapter sends you here.

A few foundational terms (like how a Transformer works, or what parameters are) live in the [folder 01 glossary](../../01-Foundational-Modelling/explanations/glossary.md). This glossary focuses on the ideas specific to reasoning and planning.

Terms are grouped by theme so related ideas sit together.

- How models think: [Prompt and prompting](#prompt-and-prompting), [In-context learning](#in-context-learning-zero-shot-and-few-shot), [Chain of thought](#chain-of-thought), [Reasoning](#reasoning-in-language-models), [Reasoning trace](#reasoning-trace), [Self-consistency](#self-consistency), [Token](#token), [Emergent ability](#emergent-ability)
- Acting in the world: [Agent](#agent), [Tool use](#tool-use), [Observation and action](#observation-and-action), [Hallucination](#hallucination), [Grounding](#grounding)
- Checking the work: [Outcome supervision vs process supervision](#outcome-supervision-vs-process-supervision), [Verifier](#verifier), [Process reward model (PRM)](#process-reward-model-prm), [Outcome reward model (ORM)](#outcome-reward-model-orm), [Reward model](#reward-model)
- Learning to reason: [Reinforcement learning](#reinforcement-learning), [Reward and reward signal](#reward-and-reward-signal), [Verifiable rewards](#verifiable-rewards), [Supervised fine-tuning (SFT)](#supervised-fine-tuning-sft), [Cold-start data](#cold-start-data), [Distillation](#distillation)
- Working at scale: [Inference-time compute](#inference-time-compute-test-time-scaling), [Context window and long context](#context-window-and-long-context), [REPL](#repl), [Recursion](#recursion)

---

## How models think

### Prompt and prompting

A prompt is the text you give a model to tell it what you want. Prompting is the craft of writing that text well. This may sound trivial, but folder 02 shows it is not: the *way* you phrase a request can change not only what the model says but *how hard it thinks*. Asking "what is the answer?" and asking "let's work through this step by step" can produce very different results from the exact same model. Much of early reasoning research was the discovery that good prompting unlocks abilities that were already latent in the model.

### In-context learning (zero-shot and few-shot)

In-context learning is a model's ability to pick up a task from the prompt itself, without any change to its internal settings. You demonstrate or describe what you want, and the model adapts on the spot.

Two related terms appear constantly. "Zero-shot" means you give the model only an instruction, with no examples ("Translate this to French."). "Few-shot" means you include a handful of worked examples first, and the model imitates the pattern. Chain-of-thought prompting (Chapter 1) comes in both flavors: few-shot, where you show example problems with their reasoning, and zero-shot, where you simply add a phrase like "let's think step by step."

### Chain of thought

Chain of thought is the technique of having a model write out its intermediate reasoning steps before giving a final answer, instead of jumping straight to the result (Chapter 1). The written steps act as scratch paper: each one becomes part of what the model reads next, giving it room to work through a problem it could not solve in a single leap.

Chain of thought is the seed from which most of modern reasoning grew. The longer, self-checking reasoning of advanced models like DeepSeek-R1 (Chapter 4) is essentially a chain of thought that the model learned to produce and extend on its own.

### Reasoning (in language models)

In this context, reasoning means working through a problem in multiple connected steps to reach a conclusion, rather than recalling a fact or pattern in one shot. A model that can take "all men are mortal" and "Socrates is a man" and conclude "Socrates is mortal" is reasoning, chaining pieces of information toward a new result.

The whole of folder 02 is about strengthening this ability: giving models room to reason (Chapter 1), grounding it with tools (Chapter 2), checking it step by step (Chapter 3), and growing it through practice (Chapter 4).

### Reasoning trace

A reasoning trace is the actual written-out sequence of steps a model produces while working through a problem, the visible record of its thinking. In a chain-of-thought answer, the trace is the "23 minus 20 equals 3, plus 6 equals 9" part that comes before the final answer.

Traces are valuable for two reasons. They help the model itself, by serving as scratch paper, and they help us, because we can read the trace to understand *why* the model reached its answer and where it might have gone wrong.

### Self-consistency

Self-consistency is a reliability trick (Chapter 1): instead of generating a single chain of thought, you generate several different ones and then take the answer that appears most often, a majority vote. The intuition is that a correct answer can be reached by many valid reasoning paths, while mistakes tend to be scattered and disagree with each other. So the most common answer across attempts is usually right. It trades extra computation for extra accuracy.

### Token

A token is the small chunk of text a model reads and writes, usually a word or a piece of a word. It is the basic unit models operate on, and it matters here because a model does a fixed, small amount of computation per token. That is precisely why writing out more tokens of reasoning (chain of thought) gives a model more room to compute. (Covered in more depth in the folder 01 glossary.)

### Emergent ability

An emergent ability is a skill a model lacks when small but suddenly shows once it crosses a certain size. Chain of thought is the classic example (Chapter 1): prompting a small model to reason step by step barely helps or even hurts, but past a scale threshold the same prompting produces a large jump. In Chapter 4, careful reasoning behaviors emerge in a different sense, appearing during reinforcement learning because they earn rewards, without anyone programming them in.

---

## Acting in the world

### Agent

An agent is an AI system that pursues a goal through a series of actions, rather than producing a single response and stopping. An agent might search the web, read the results, run some code, check a file, and only then answer, looping through steps as needed.

The ReAct loop of Chapter 2 (Thought, Action, Observation) is the foundational pattern behind essentially every modern agent. When people talk about AI that can "use a computer" or "complete tasks," they mean agents built on this kind of loop.

### Tool use

Tool use is a model's ability to call external functions or services to get something done: running a web search, executing code, querying a database, checking a calendar. It matters because a model on its own only knows what it absorbed during training; tools let it reach current, real information and perform actions it cannot do internally, like precise calculation. Tool use is the "Action" half of the ReAct loop (Chapter 2).

### Observation and action

These are two of the three moves in the ReAct loop (Chapter 2). An "action" is something the model does in the world, such as running a search. An "observation" is the result that comes back, such as the search results, which the model then reads. The repeating cycle of acting and observing is what lets a model gather real information mid-task instead of reasoning in a sealed box.

### Hallucination

Hallucination is when a model states something false with confidence, essentially making it up. It happens because a model's core skill is producing plausible-sounding text, and plausible is not the same as true. If it does not know a fact, it may generate a convincing-looking invention rather than admit uncertainty.

Hallucination is a central motivation for tool use and grounding (Chapter 2): if the model can look a fact up rather than guess, it has far less need to invent one.

### Grounding

Grounding means anchoring a model's statements to real, retrieved information rather than letting it rely on memory or guesswork. When a ReAct agent searches for a fact and then reasons from the result, its conclusion is grounded in that retrieved evidence. Grounding is the main defense against hallucination: it keeps the model's reasoning tethered to things that are actually true.

---

## Checking the work

### Outcome supervision vs process supervision

This is the central distinction of Chapter 3. Outcome supervision judges a solution only by its final answer: right or wrong. Process supervision judges every individual step of the reasoning along the way.

Process supervision turns out to work better on hard problems, for two reasons. It gives more precise feedback (it pinpoints exactly which step failed, not just that the whole thing failed), and it rewards genuinely sound reasoning rather than lucky answers that were reached through flawed steps. In short, it cares about *how* you got there, not just *where* you ended up.

### Verifier

A verifier is a model whose job is to check work rather than produce it. In Chapter 3, you generate many candidate solutions to a hard problem and use a verifier to score them and pick the best. A good verifier is hard to fool, which is what makes this approach powerful: even if most of a model's attempts are flawed, a strong verifier can reliably find the good ones.

### Process reward model (PRM)

A process reward model is a [verifier](#verifier) that grades a solution step by step, judging each reasoning step as correct or not (Chapter 3). Because it checks the whole path rather than only the final answer, it is much better at catching solutions that look right but contain hidden errors. The "Let's Verify Step by Step" paper showed that selecting solutions with a PRM beats selecting them with an answer-only grader.

### Outcome reward model (ORM)

An outcome reward model is a verifier that grades a solution by its final answer alone (Chapter 3). It is simpler than a [process reward model](#process-reward-model-prm) but weaker on hard problems, because it cannot tell a soundly reasoned correct answer from a lucky one, and it gives no information about *where* a wrong solution went astray.

### Reward model

A reward model is a model trained to score how good an output is, standing in for a human judge so that scoring can be done automatically and at scale. You met it first in folder 01 as part of the alignment pipeline. In folder 02, the [process](#process-reward-model-prm) and [outcome](#outcome-reward-model-orm) reward models are specialized reward models aimed at grading reasoning. (More background in the folder 01 glossary.)

---

## Learning to reason

### Reinforcement learning

Reinforcement learning, or RL, is training by trial and error guided by rewards rather than by copying examples. The model tries something, receives a reward signal indicating how good the result was, and adjusts to earn more reward over time.

RL is the engine behind Chapter 4. Rather than being shown how to reason, DeepSeek-R1 was rewarded for reaching correct answers, and it gradually discovered reasoning strategies on its own because those strategies earned more reward. (The basic mechanics also appear in the folder 01 glossary.)

### Reward and reward signal

The reward (or reward signal) is the number that tells a reinforcement learning model how good an outcome was, the feedback it is trying to maximize. The art of RL is often in choosing a good reward. A reward that is easy to fake leads to a model that games the system; a reward that is honest and hard to fake, like checking whether a math answer is actually correct, leads to genuine improvement. That honesty is exactly what [verifiable rewards](#verifiable-rewards) provide.

### Verifiable rewards

Verifiable rewards are rewards that can be checked automatically and with certainty, such as whether a math answer is correct or whether code passes its tests. They are the key ingredient in Chapter 4. Because they are cheap to compute and impossible to fake, they let a model be trained with reinforcement learning at huge scale without needing a separate, foolable learned judge. The model simply gets rewarded when its answer is genuinely right.

### Supervised fine-tuning (SFT)

Supervised fine-tuning is training a model to imitate labeled example answers, the straightforward "here is the correct response, copy this style" form of training. It contrasts with reinforcement learning, which uses rewards instead of fixed correct answers. In Chapter 4, DeepSeek-R1-Zero deliberately *skipped* SFT to see if reasoning could emerge from pure RL, and the full DeepSeek-R1 added just a little clean example data to tidy up presentation. (See the folder 01 glossary for the role of SFT in alignment.)

### Cold-start data

Cold-start data is a small, curated set of clean, well-formatted examples used to warm up a model before the main training (here, before reinforcement learning) in Chapter 4. Its purpose is to give the model good habits of presentation from the start, so it reasons not only correctly but also readably. It is the fix that turned the rough-around-the-edges R1-Zero into the polished DeepSeek-R1.

### Distillation

Distillation is training a smaller "student" model to imitate the outputs of a larger, more capable "teacher" model, transferring much of the teacher's skill into a more compact and cheaper-to-run package. In Chapter 4, the team distilled DeepSeek-R1's reasoning ability into a family of smaller models, making strong reasoning available on modest hardware.

---

## Working at scale

### Inference-time compute (test-time scaling)

Inference-time compute, also called test-time scaling, means spending more computational effort at the moment of answering a question, as opposed to during training. It is the unifying theme of folder 02. Writing a longer chain of thought (Chapter 1), generating and checking many candidate solutions (Chapter 3), and exploring a huge input recursively (Chapter 5) are all ways of spending more effort at answer time to handle harder problems. The core insight is that you can make a model effectively smarter not only by training it more, but by letting it think harder when it actually faces a tough question.

### Context window and long context

The context window is the maximum amount of text, measured in [tokens](#token), that a model can consider at once, its working memory. "Long context" refers to the challenge of handling very large inputs. The trouble (Chapter 5) is twofold: text beyond the window simply cannot be seen, and even text that fits can overwhelm the model, causing it to miss details as the input grows. Recursive Language Models address this not by enlarging the window but by giving the model tools to navigate inputs larger than its memory.

### REPL

REPL stands for Read-Eval-Print Loop, a small interactive programming environment where you can type a piece of code, have it run immediately, and see the result, then type the next piece. In Chapter 5, the giant input is placed into a REPL as a variable, and the model writes code to peek into it, search it, and slice it. The REPL is what turns a too-large input from "text to read" into "data to explore," which is the heart of the Recursive Language Models idea.

### Recursion

Recursion is when a process solves a problem by calling a fresh copy of itself on a smaller piece of the same kind of problem, then combining the pieces. In Chapter 5, when a chunk of input is still too big to handle directly, the model calls itself on that chunk, and that call may call itself again, until the pieces are small enough to answer. A "root" model coordinates the whole effort and assembles the results. It is the divide-and-conquer instinct, applied so a model can work through inputs it could never hold all at once.
