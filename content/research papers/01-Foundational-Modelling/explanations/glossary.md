# Glossary: Foundational Modelling

This is your shared reference for folder 01. Every term that the chapters link to is explained here from scratch, in plain language. Unlike a normal glossary that gives one-line definitions, this one takes the time to make each idea actually click. You can read it straight through as a primer, or jump in whenever a chapter sends you here.

Terms are grouped by theme so related ideas sit together.

- The basic building blocks: [Neural network](#neural-network), [Parameters (weights)](#parameters-weights), [Layers and depth](#layers-and-depth), [Vector](#vector), [Token](#token), [Tokenization](#tokenization), [Embedding](#embedding)
- Inside the Transformer: [Self-attention](#self-attention), [Multi-head attention](#multi-head-attention), [Feed-forward network](#feed-forward-network), [Positional encoding](#positional-encoding), [Softmax](#softmax), [Encoder and decoder](#encoder-and-decoder), [Transformer](#transformer), [Context window](#context-window)
- Training the model: [Pre-training](#pre-training), [Fine-tuning](#fine-tuning), [Loss function](#loss-function), [Gradient descent and backpropagation](#gradient-descent-and-backpropagation), [Overfitting](#overfitting), [Hyperparameter](#hyperparameter), [Perplexity](#perplexity)
- Scale and cost: [Compute and FLOPs](#compute-and-flops), [Scaling law](#scaling-law), [Emergent ability](#emergent-ability), [In-context learning](#in-context-learning), [Inference](#inference)
- Alignment: [Supervised fine-tuning (SFT)](#supervised-fine-tuning-sft), [Reinforcement learning](#reinforcement-learning), [RLHF](#rlhf), [Reward model](#reward-model), [PPO](#ppo), [KL divergence](#kl-divergence), [Preference data](#preference-data), [DPO](#dpo)
- Efficiency tricks: [Matrix rank (low-rank)](#matrix-rank-low-rank), [LoRA](#lora), [Mixture of Experts (MoE)](#mixture-of-experts-moe), [Router (gating network)](#router-gating-network), [Sparse and dense models](#sparse-and-dense-models)
- Measuring quality: [Benchmark](#benchmark), [Elo rating](#elo-rating)

---

## The basic building blocks

### Neural network

A neural network is the basic kind of program that all modern AI models are built from. The name comes from a loose inspiration by the brain, but you do not need biology to understand it. Picture a huge set of simple math operations arranged in layers. Numbers flow in at one end (for example, a sentence turned into numbers), pass through layer after layer of multiplications and additions, and a result comes out the other end (for example, a prediction of the next word).

What makes it powerful is that the network has millions or billions of adjustable knobs (see [parameters](#parameters-weights)). During training, those knobs are tuned automatically until the network produces good outputs. A "recurrent neural network," mentioned in Chapter 1, is an older style that processed text one word at a time while carrying a memory; the Transformer replaced it.

### Parameters (weights)

Parameters, also called weights, are the adjustable numbers inside a neural network. They are the heart of what a model "knows." Think of a giant mixing board with billions of sliders. Each slider controls how strongly one piece of information influences another. Training is the process of setting all those sliders to good positions.

When you hear that a model "has 70 billion parameters," it means it has 70 billion of these tunable numbers. More parameters means more capacity to store patterns and knowledge, but also more memory and more cost to run.

### Layers and depth

A neural network is organized into layers stacked on top of each other. Information enters the first layer, gets transformed, passes to the next, and so on. The number of layers is the model's depth, which is why people say "deep learning."

Why stack them? Each layer can build on the previous one's work. In a language model, early layers tend to catch simple patterns (basic grammar), while deeper layers capture abstract ones (the overall intent of a sentence). Depth lets the model understand things in stages rather than all at once.

### Vector

A vector is simply an ordered list of numbers, like [0.2, -1.3, 0.8]. That is the whole definition. Vectors matter because they are how AI represents everything: words, images, sounds, all become vectors so a neural network can do math on them.

A helpful mental image: a vector is a set of coordinates that places something at a location on a map. A vector with three numbers is a point in 3D space. AI uses vectors with hundreds or thousands of numbers, placing each item in a vast space of meaning where similar things sit close together.

### Token

A token is the small chunk of text that a language model actually reads and writes. It is usually a word or a piece of a word. For example, "cat" might be one token, while "unbelievable" might split into "un," "believ," and "able." Common words are often single tokens; rare or long words get broken into pieces.

Tokens are the unit of measurement for almost everything in language models. Data size is counted in tokens, context length is counted in tokens, and you are typically billed per token when using a commercial model. A rough rule of thumb in English: one token is about three quarters of a word.

### Tokenization

Tokenization is the step that chops raw text into [tokens](#token) before the model sees it. A model cannot read letters directly; it needs a fixed vocabulary of tokens, each mapped to a number. The tokenizer is the tool that performs this split consistently. It is a small but important detail, because how text is split affects how efficiently a model can process different languages and symbols.

### Embedding

An embedding is the [vector](#vector) of numbers that represents a [token](#token) inside the model. When the word "dog" enters a model, it is first converted into its embedding, a long list of numbers that encodes its meaning.

The magic of embeddings is that meaning becomes geometry. Words with similar meanings end up with similar embeddings, sitting close together in the space of numbers. "Dog" and "puppy" land near each other; "dog" and "spreadsheet" land far apart. The model learns these positions during training. Embeddings are the bridge that turns language into math.

---

## Inside the Transformer

### Self-attention

Self-attention is the core mechanism of the Transformer and arguably the most important idea in this whole folder. It lets every word in a sentence look at every other word and decide how much each one matters for understanding it.

Here is the intuition. Each word forms a question (a Query) about what it needs, and every word also advertises what it offers (a Key) and what it will contribute (a Value). A word's new meaning is built by blending in the Values of the words whose Keys best match its Query. So in "the trophy did not fit because it was too big," the word "it" can attend strongly to "trophy" and absorb that meaning.

The power of self-attention is that it connects distant words directly, in a single step, no matter how far apart they sit. This solved the long-range memory problem that older models struggled with. Chapter 1 walks through it in detail.

### Multi-head attention

A single round of [self-attention](#self-attention) captures one type of relationship between words. But words relate in many ways at once: grammar, meaning, tone, cause and effect. Multi-head attention runs several attention operations in parallel, each called a head, and each free to focus on a different pattern.

One head might learn to link pronouns to the nouns they stand for, another might track verb tense, another might connect adjectives to their nouns. Their findings are then combined. Think of it as a committee of specialists all reading the same sentence and pooling their notes. The original Transformer used eight heads.

### Feed-forward network

Inside each Transformer layer, after attention has gathered context from other words, the feed-forward network processes each word on its own. If attention is "gather information from your neighbors," the feed-forward step is "now sit and think about what you gathered."

It is a small, standard neural network applied separately to each position. It gives the model room to transform and refine the information attention collected. In a Mixture of Experts model (Chapter 5), it is this feed-forward part that gets split into multiple experts.

### Positional encoding

Because [self-attention](#self-attention) looks at all words at the same time, it has no natural sense of order. Without help, "dog bites man" and "man bites dog" would look the same to it. Positional encoding fixes this by adding a small signal to each word's [embedding](#embedding) that marks its position in the sequence: first, second, third, and so on.

With positional encoding, the model knows not just which words are present, but in what order, which is essential for meaning.

### Softmax

Softmax is a small mathematical function that turns a list of raw scores into percentages that add up to 100. If a word's attention scores for three neighbors are something like 5, 2, and 1, softmax converts them into proportions such as 70 percent, 20 percent, 10 percent.

It shows up wherever a model needs to turn "how much of each" into clean weights, most notably in [self-attention](#self-attention) (how much to attend to each word) and in producing the final probabilities over possible next words. You can think of softmax as the step that says "given these scores, here is how to split your attention or your bet."

### Encoder and decoder

These are the two halves of the original Transformer. The encoder reads and builds an understanding of an input (helpful for tasks like translation, where you must fully digest the source sentence). The decoder generates output one [token](#token) at a time.

Most chat models today, such as the GPT family, use only the decoder half, because their primary job is to generate text. You will still hear "encoder" and "decoder" constantly, so it is worth knowing that encoder means "understand the input" and decoder means "produce the output."

### Transformer

The Transformer is the neural network architecture introduced in *Attention Is All You Need* (Chapter 1), built around [self-attention](#self-attention). It processes all words in parallel and lets any word attend to any other, which made it fast to train and good at long-range understanding.

It is the foundation of essentially every modern large language model. When people say GPT, Claude, Llama, or Gemini, they are referring to very large Transformers trained on huge amounts of text.

### Context window

The context window is the maximum amount of text, measured in [tokens](#token), that a model can consider at once. It is the model's working memory. If a model has a context window of 8,000 tokens, it can "see" roughly 6,000 words of conversation or document at a time; anything beyond that has to be dropped or summarized.

Larger context windows let a model handle longer documents and remember more of a conversation. Expanding the context window is a major area of research, and it is exactly the problem that the Recursive Language Models paper in folder 02 tackles.

---

## Training the model

### Pre-training

Pre-training is the first and most expensive stage of building a language model. The model is shown enormous amounts of text from the internet and books and trained on one simple task: predict the next [token](#token). By doing this billions of times, it gradually absorbs grammar, facts, reasoning patterns, and styles.

A pre-trained model is knowledgeable but raw. It is a powerful autocomplete, not yet a helpful assistant. Turning it into an assistant is the job of [fine-tuning](#fine-tuning) and alignment (Chapter 3).

### Fine-tuning

Fine-tuning means taking an already pre-trained model and training it a bit more on a narrower dataset to specialize it. Pre-training gives broad general ability; fine-tuning shapes that ability toward a specific goal, such as following instructions, writing in a company's voice, or answering medical questions.

Fine-tuning is far cheaper than pre-training because the model already knows language; you are only nudging it. Chapter 4 ([LoRA](#lora)) is about making fine-tuning cheaper still.

### Loss function

The loss function is the number that measures how wrong the model is. During training, the model makes a prediction, the loss function compares it to the correct answer, and produces a score where lower means better. The entire goal of training is to make this number as small as possible.

For language models, the loss is essentially a measure of how surprised the model was by the true next word. Confident and correct gives low loss; confident and wrong gives high loss. The scaling-law curves in Chapter 2 are plots of this loss shrinking as models get bigger.

### Gradient descent and backpropagation

These two together are how a model actually learns. The model makes a prediction and computes its [loss](#loss-function). Backpropagation is the process of working backward through the network to figure out, for every [parameter](#parameters-weights), which direction it should move to reduce the loss. Gradient descent is then the act of nudging each parameter a small step in that helpful direction.

Repeat this billions of times and the model gradually improves. A simple image: you are in fog on a hillside trying to reach the valley. Backpropagation tells you which way is downhill; gradient descent takes a small step that way. Do it over and over and you reach the bottom.

### Overfitting

Overfitting is when a model memorizes its training data instead of learning general patterns. An overfit model performs great on examples it has seen but fails on new ones, like a student who memorized last year's exam answers but cannot solve a fresh problem.

The goal is always generalization: doing well on data the model has never seen. Much of the craft of training is about getting strong performance without overfitting.

### Hyperparameter

A hyperparameter is a setting chosen by the people training the model, as opposed to a [parameter](#parameters-weights), which the model learns on its own. Examples include how many layers to use, how big to make the model, and how large a step to take during [gradient descent](#gradient-descent-and-backpropagation).

Hyperparameters are the dials the humans set before and during training. Choosing them well is part science, part experience. The scaling laws in Chapter 2 are partly about choosing two of the most important ones: model size and data size.

### Perplexity

Perplexity is a common way to report how well a language model predicts text. It is closely tied to the [loss function](#loss-function): low perplexity means the model is rarely surprised by the next word, which means it models the language well. You can read perplexity loosely as "on average, how many words is the model torn between when guessing the next one." Lower is better.

---

## Scale and cost

### Compute and FLOPs

Compute is the total amount of calculation used to train or run a model, and it translates directly into time and money. It is often measured in FLOPs, which stands for floating-point operations, basically a count of how many individual arithmetic steps were performed.

Training a frontier model can take an astronomical number of FLOPs, which is why it costs millions of dollars and requires thousands of specialized chips. Chapter 2 is all about spending a fixed compute budget wisely.

### Scaling law

A scaling law is a predictable mathematical relationship showing how a model's performance improves as you increase its size, its training data, or its compute. The surprising discovery (Chapter 2) is that this improvement is smooth and forecastable across a huge range, often appearing as a straight line on the right kind of graph.

Scaling laws matter because they remove guesswork. A small experiment can predict how a much larger model will perform before you spend the money to build it.

### Emergent ability

An emergent ability is a skill that a model does not have when small but suddenly displays once it crosses a certain size. Below the threshold the ability is essentially absent; above it, the ability appears. Examples historically included certain kinds of arithmetic and multi-step reasoning.

Emergence is part of what made scaling so exciting: simply making models bigger sometimes unlocked qualitatively new capabilities, not just smoother improvements.

### In-context learning

In-context learning is a model's ability to learn a task from examples placed directly in the prompt, without any change to its [parameters](#parameters-weights). You show it a few examples of what you want, and it picks up the pattern on the spot.

Two related terms: "zero-shot" means you give the model a task with no examples, just the instruction. "Few-shot" means you include a handful of examples first. The discovery that large models are strong few-shot learners (from the GPT-3 work) was a major moment, because it meant one general model could handle countless tasks just by being shown examples in the prompt.

### Inference

Inference is the act of actually using a trained model to produce an output, as opposed to training it. Every time you send a prompt to a model and get a response, that is one inference.

Inference cost is hugely important in practice because it is paid every single time anyone uses the model, across millions of users. This is why a smaller or more efficient model (Chapters 2, 4, and 5) is so valuable: it lowers the cost of every interaction.

---

## Alignment

### Supervised fine-tuning (SFT)

Supervised fine-tuning is the first step of alignment (Chapter 3). Humans write high-quality example answers to many prompts, and the model is trained to imitate them. "Supervised" means the model learns from labeled examples of the correct behavior.

SFT teaches the model the basic shape of being helpful: when asked a question, give an answer. It is the foundation that later steps ([RLHF](#rlhf) or [DPO](#dpo)) build on.

### Reinforcement learning

Reinforcement learning, or RL, is a style of training where a model learns by trial and error guided by rewards, rather than by copying labeled examples. The model tries an action, receives a reward signal indicating how good the outcome was, and adjusts to earn more reward over time. It is how you train an agent to play a game: not by showing it the perfect moves, but by rewarding it when it wins.

In language models, RL is used to push a model toward responses that score well according to human preferences (see [RLHF](#rlhf)). It also powers the reasoning models in folder 02, such as DeepSeek-R1.

### RLHF

RLHF stands for Reinforcement Learning from Human Feedback. It is the three-step recipe (Chapter 3) that turns a raw pre-trained model into a helpful assistant: first [supervised fine-tuning](#supervised-fine-tuning-sft) on human-written answers, then training a [reward model](#reward-model) from human rankings, then using [reinforcement learning](#reinforcement-learning) (specifically [PPO](#ppo)) to optimize the model against that reward.

RLHF was the breakthrough that made ChatGPT possible. Its central trick is learning human taste from comparisons rather than trying to write down rules for good behavior.

### Reward model

A reward model is a separate model trained to predict how much a human would like a given answer. It is built from [preference data](#preference-data): humans rank several answers, and the reward model learns to reproduce those judgments, outputting a score for any answer it sees.

Its purpose is to bottle human judgment into automatic software, so that during [reinforcement learning](#reinforcement-learning) the main model can be graded on millions of its own attempts without needing a human in the loop each time.

### PPO

PPO, short for Proximal Policy Optimization, is the specific [reinforcement learning](#reinforcement-learning) algorithm used in the RLHF recipe. You do not need its math, only its role: it is the method that adjusts the model to earn higher scores from the [reward model](#reward-model), while taking care not to change the model too drastically in any one step. The "proximal" in the name refers to that caution, staying close to the previous version to keep training stable.

### KL divergence

KL divergence is a measure of how different two probability distributions are. In alignment it is used as a leash. During [RLHF](#rlhf), the model is rewarded for pleasing the [reward model](#reward-model), but it is also penalized, via a KL term, for drifting too far from its sensible pre-RL self.

Why the leash? Without it, a model chasing reward might discover bizarre tricks that fool the reward model while producing gibberish. The KL penalty keeps the model anchored to fluent, reasonable behavior. The same idea appears, baked in, inside [DPO](#dpo).

### Preference data

Preference data is the fuel of modern alignment. It consists of comparisons: for a given prompt, a human is shown two or more answers and indicates which is better. A single item is often a triple of (prompt, preferred answer, rejected answer).

Comparisons are used because humans are far better and more consistent at judging "which of these two is better" than at writing perfect answers from scratch or assigning absolute scores. Both [RLHF](#rlhf) and [DPO](#dpo) run on this kind of data.

### DPO

DPO stands for Direct Preference Optimization (Chapter 3). It achieves the same goal as [RLHF](#rlhf), aligning a model to human preferences, but without a separate [reward model](#reward-model) or a [reinforcement learning](#reinforcement-learning) loop. Instead, it trains the model directly on [preference data](#preference-data) with a single, stable objective: make preferred answers more likely and rejected ones less likely, while staying close to the original model.

Its guiding insight is that "your language model is secretly a reward model," meaning the reward step can be folded mathematically into the model's own training. DPO is simpler, cheaper, and more stable than full RLHF, which is why it became so widely used.

---

## Efficiency tricks

### Matrix rank (low-rank)

A matrix is just a grid of numbers, and the weights inside a neural network are stored in such grids. The rank of a matrix is a measure of how much genuinely independent information it contains. A "low-rank" matrix, despite possibly being large, can be reconstructed from a much smaller amount of information.

The practical payoff (Chapter 4): a big grid of numbers can sometimes be approximated by multiplying two much skinnier grids together, storing nearly the same information with a tiny fraction of the numbers. This is the mathematical foundation that makes [LoRA](#lora) possible.

### LoRA

LoRA stands for Low-Rank Adaptation (Chapter 4). It is a cheap way to [fine-tune](#fine-tuning) a giant model. Instead of adjusting all of the model's [parameters](#parameters-weights), LoRA freezes the original model and trains only a tiny pair of skinny [low-rank](#matrix-rank-low-rank) matrices that capture the adjustment a new task needs.

This cuts memory and storage dramatically, lets one frozen base model carry many small swappable adapters for different tasks, and adds no slowdown when the model runs, because the adapter can be merged back in. LoRA is what made fine-tuning accessible to people without giant compute budgets.

### Mixture of Experts (MoE)

A Mixture of Experts is a model design (Chapter 5) where each layer contains many sub-networks called experts, but only a few of them activate for any given [token](#token). A small [router](#router-gating-network) picks which experts handle each word.

The benefit is that the model can hold a very large amount of knowledge across all its experts, while only doing a small amount of work per word. You get the quality of a big model at the running cost of a much smaller one. The trade-off is higher memory, because all experts must be kept loaded even though only a few are used at a time. Mixtral (Chapter 5) is the well-known open example.

### Router (gating network)

The router, sometimes called the gating network, is the small, fast component inside a [Mixture of Experts](#mixture-of-experts-moe) model that decides which experts should handle each [token](#token). Continuing the hospital analogy from Chapter 5, the router is the receptionist who glances at a patient and sends them to the right specialists.

The router is learned during training, not hand-coded. The model figures out on its own how to divide work among the experts.

### Sparse and dense models

A dense model uses all of its [parameters](#parameters-weights) for every [token](#token) it processes. A sparse model, like a [Mixture of Experts](#mixture-of-experts-moe), uses only a fraction of its parameters for each token, activating just the relevant parts.

The distinction matters for cost: dense models pay their full size on every word, while sparse models can hold far more total parameters while only paying for a slice each time. "Sparse" essentially means "most of the model stays asleep for any given word."

---

## Measuring quality

### Benchmark

A benchmark is a standardized test used to measure and compare model capabilities. Older benchmarks often used questions with a single correct answer, which made scoring easy but did not capture open-ended skills like helpfulness or writing quality.

Chapter 6 is about the harder problem of benchmarking open-ended chat ability, where there is no single right answer, and introduces tools like MT-Bench, Chatbot Arena, and using a strong model as an automatic judge.

### Elo rating

Elo is a rating system originally designed to rank chess players, repurposed in Chapter 6 to rank chat models. Each model has a numeric rating. When two models compete and humans vote for the winner, the winner's rating goes up and the loser's goes down. Crucially, beating a strong opponent raises your rating more than beating a weak one, and losing to a weak opponent costs you more.

In Chatbot Arena, thousands of blind head-to-head human votes feed an Elo leaderboard, producing a ranking grounded directly in human preference. It is considered one of the most trustworthy ways to compare models, precisely because it is built on real human choices.
