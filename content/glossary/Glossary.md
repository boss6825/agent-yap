# Glossary of Hard Terms

This glossary explains the tough or unfamiliar terms that show up again and again across the four topics (agentic memory, context engineering, multi-agent, and RAG). The idea is simple: instead of re-explaining the same term in every chapter, it is explained once here, and the chapters link to it.

If you are reading a chapter and hit a term you do not recognize, look for a link that points back to this file. Each entry tries to give you a plain-language definition, why the term matters, and where useful, a quick analogy.

The entries are arranged alphabetically.

---

### Agent

In this material, an AI agent is a system that uses a large language model (LLM) as its reasoning engine to decide what to do next, usually by calling tools in a loop. The key difference from a plain chatbot is that an agent does not just answer once. It can take an action, look at the result, decide on the next action, and keep going until the task is done. A good mental model: a chatbot answers a question, while an agent works on a task.

### Agent harness

The harness is the software wrapper around the model. The LLM provides the thinking and produces a "tool call" (a request to run some action), but the harness is the code that actually runs that action, feeds the result back, manages the message history, and decides when to stop. The model is the brain; the harness is the body and nervous system that lets the brain act on the world. A recurring lesson in these articles is that as models get smarter, you should make the harness simpler, not more complicated. See also [the Bitter Lesson](#the-bitter-lesson).

### Agentic search

A way for an agent to find information by using ordinary computer tools like `grep` (search text in files), `glob` (find files by name pattern), and reading files directly, rather than by converting everything into vectors first. It is slower per step than [semantic search](#semantic-search) but more transparent, easier to maintain, and it does not need a special index to be built and kept up to date. Contrast with [semantic search](#semantic-search).

### Belief state

A term from decision theory. Because an agent cannot see everything about the world at once, it keeps an internal model of "what I currently believe is true." In agent memory discussions, memory is the agent's belief state. If the belief state is wrong, every decision built on top of it is also likely to be wrong. See also [POMDP](#pomdp-partially-observable-markov-decision-process).

### The Bitter Lesson

An influential idea (from researcher Richard Sutton) stating that, over the long run, general methods that scale with more computing power tend to beat clever hand-built structures that encode human knowledge. Applied to agents: the special scaffolding and tricks you build today to prop up a weak model often become dead weight once a stronger model arrives. The practical advice is to keep your system flexible, test it across model strengths, and be willing to delete structure as models improve.

### BM25 and TF-IDF

Classic keyword-based retrieval methods. They score how well a document matches a query based on word overlap and how rare or common those words are. They are simple and fast but do not understand meaning, so a search for "car" will not match a document that only says "automobile." These are examples of "sparse" retrieval. Contrast with [dense retrieval](#dense-retrieval-and-sparse-retrieval).

### Chain-of-thought (and extended / interleaved thinking)

Chain-of-thought means prompting a model to write out its reasoning step by step before giving a final answer, which tends to improve accuracy on hard problems. "Extended thinking" is a controllable version where the model writes out a plan before acting. "Interleaved thinking" is when the model thinks again after receiving a tool result, to evaluate what it got and decide the next step. Think of it as the agent's scratchpad.

### Compaction

A reversible way to shrink the [context window](#context-window). Compaction removes information from the running history when that information still exists somewhere else (for example, on disk). A typical example: after an agent writes a 500-line file, the chat history keeps only the file path, not the full file contents, because the agent can always re-read the file if needed. Because nothing is truly lost, compaction is preferred over [summarization](#summarization-lossy-compression) when possible. See also [context offloading](#context-offloading).

### Constrained decoding (structured output / schema)

Techniques that force a model's output to follow a fixed format, such as a specific JSON shape. A "schema" is the definition of that format (which fields must exist, what type each is). This matters for agents because it makes the output instantly usable by other code, with no fragile parsing or guesswork.

### Context confusion

A failure mode where the model cannot tell apart instructions, data, and structural markers, or is given rules that contradict each other. It often happens when system instructions clash with user instructions, or when there are too many similar instructions. The result is that the model follows the wrong directive or mixes things up.

### Context engineering

The discipline of designing a system that puts the right information and tools, in the right format, at the right time, into the model's [context window](#context-window) so it can accomplish a task. It is broader than prompt engineering. Prompt engineering is about wording a single instruction well; context engineering is about building a dynamic system that automatically assembles everything the model sees before it responds. Many practitioners now call this the single most important job when building agents.

### Context offloading

Storing information outside the [context window](#context-window) (for example, in a file on disk or in a database) and pulling it back in only when needed. The agent keeps a lightweight reference (like a file path) in context instead of the full content. This keeps the working context small while still giving the agent access to everything.

### Context pollution

The presence of too much irrelevant, redundant, or conflicting information in the [context window](#context-window). The clutter distracts the model and lowers the quality of its reasoning, even when the correct information is technically present.

### Context rot

The observation that a model's quality drops as its [context window](#context-window) fills up, even when the total tokens are well within the technical limit. In other words, the "effective" context window where the model still performs well is usually much smaller than the advertised limit. A model rated for 1 million tokens may start degrading well before that. This is why agents actively manage what stays in context rather than just letting it grow.

### Context window

The fixed-size working memory of a language model, measured in [tokens](#token). Everything the model can "see" at once (system instructions, the conversation so far, retrieved documents, tool results) must fit inside this window. It is like a desk of a fixed size: you can only spread out so many papers before you must put some away. The context window is the root cause of most memory and context challenges in these articles.

### Dense retrieval and sparse retrieval

Two families of search. Sparse retrieval (like [BM25](#bm25-and-tf-idf)) matches on exact words. Dense retrieval represents the query and documents as [embeddings](#embedding) (lists of numbers capturing meaning) and finds matches by closeness in that numeric space, so it can match by meaning rather than exact words. DPR (Dense Passage Retrieval) is a well-known dense method. Many strong systems combine both, which is called hybrid retrieval.

### Embedding

A list of numbers (a vector) that represents the meaning of a piece of text, produced by a model. Texts with similar meaning get vectors that sit close together in this numeric space, which lets a system find related content by measuring distance. Embeddings power [semantic search](#semantic-search) and [vector databases](#vector-database). A known weakness: embeddings capture "looks similar" but not "is the cause of," so they can return text that seems related but is not actually relevant.

### Effort scaling

Giving an agent explicit rules about how much work a task deserves, so it does not over-invest in easy questions or under-invest in hard ones. For example: a simple fact check should use one agent and a few tool calls, while a complex research task might justify ten or more sub-agents. Without such rules, agents tend to either spin in circles or quit too early.

### Fine-tuning

Further training of a model on a narrower dataset so it specializes in a task or style. It can boost performance now, but the articles warn it can lock you into a "local optimum": when a better general model arrives, your fine-tuned setup may already be obsolete. See also [the Bitter Lesson](#the-bitter-lesson).

### Grounding

Tying a model's output to verified facts or real sources rather than letting it invent things. Memory and retrieval both provide grounding: the agent answers based on what it actually knows about the user, the project, or the retrieved documents. Good grounding reduces [hallucination](#hallucination).

### Hallucination

When a model states something that is false or made up but presents it confidently as fact. In agent systems this is dangerous because a hallucinated fact can get stored in memory and treated as truth later, or a hallucinated citation can make a report look credible while being wrong.

### KV cache (key-value cache)

A performance optimization inside the model's serving system. As the model processes tokens, it stores intermediate results (the "keys" and "values") so it does not have to recompute them for tokens it has already seen. Reusing this cache makes responses cheaper and faster. The catch: the cache only helps if the start of the context stays stable. If you keep changing earlier parts of the context (for example, by swapping tool definitions around each turn), you "break the cache" and lose the savings. This is a major reason agents try to keep their context stable.

### LLM-as-a-judge

Using one language model to grade the output of another, against a rubric (criteria like accuracy, completeness, and citation quality), often producing a score and a pass or fail label. It is a scalable way to evaluate agents when there is no single exact correct answer, though it is not perfectly reliable and is usually paired with human review.

### MapReduce pattern

A pattern borrowed from data processing. "Map" means splitting a job into independent pieces handled in parallel; "reduce" means combining the pieces into one result. In agents, a main agent maps subtasks to [sub-agents](#sub-agent) and then reduces their outputs into a final answer. It works best when the pieces are truly independent.

### MAST (Multi-Agent System Failure Taxonomy)

A structured catalog of 14 ways multi-agent systems fail, grouped into three stages: specification issues (bad setup and unclear roles), inter-agent misalignment (miscommunication during execution), and task verification failures (weak quality checking). It was built by hand-annotating many real execution traces. Its main point is that most failures come from system design, not from the model being too weak.

### MCP (Model Context Protocol)

An open standard that lets an agent connect to external tools and services (like Slack, GitHub, or Google Drive) through a common interface, instead of writing custom integration code for each one. An MCP "server" exposes a set of tools; the agent calls them and the server handles the authentication and the actual API work. Think of it as a universal adapter between agents and the outside world.

### Memory consolidation

The step where new information is merged into existing memory in a clean way: combining related facts, resolving contradictions, and removing duplicates, so the memory store stays coherent over time. For example, "allergic to shellfish" and "can't eat shrimp" should be recognized as related and merged rather than stored as two separate, possibly conflicting, facts. This is the often-neglected "manage" step of memory.

### Memory poisoning (and prompt injection)

A security risk where malicious or misleading instructions get written into an agent's memory or context, and the agent later treats them as legitimate. "Indirect prompt injection" is when the harmful instruction is hidden in content the agent reads (a web page, a document) rather than typed by the user. Because memory persists, a single poisoned entry can corrupt the agent's behavior for a long time.

### Memory types: working, episodic, semantic, procedural

A four-part framework, borrowed from how human memory is described:

- Working memory: the immediate [context window](#context-window). Fast but small and temporary.
- Episodic memory: a record of specific experiences, what happened, when, and in what order (like a diary or logbook).
- Semantic memory: distilled facts and knowledge that are treated as lasting truths (like "the company uses Salesforce").
- Procedural memory: learned skills, behaviors, and rules for how to act (closer to habits or instructions than to facts).

These appear throughout the agentic memory material and are explained in depth there.

### Multi-hop reasoning

Answering a question that requires chaining several pieces of information together across multiple steps, where each step depends on the previous one. For example: "find this company's CEO, then find where they went to school, then find who else went there." Single-shot retrieval usually fails at this; it needs iterative retrieval and reasoning.

### Orchestrator-worker pattern

A multi-agent design where one "lead" or "orchestrator" agent breaks a goal into subtasks and delegates them to several "worker" [sub-agents](#sub-agent) that run in parallel, then collects and combines their results. It is well suited to broad research ("read") tasks that split into independent parts. It is the architecture behind Anthropic's research system.

### POMDP (Partially Observable Markov Decision Process)

A formal way to describe decision making when you cannot see the whole state of the world. The agent only gets partial observations, so it must maintain a [belief state](#belief-state) (its best guess of what is true) and act on that. The articles use this framing to argue that an agent's memory is its belief state, which is why memory quality matters so much.

### Progressive disclosure

A design principle where an agent loads information only as it becomes relevant, rather than all at once. Like a manual that starts with a table of contents and lets you open a chapter only when you need it. Skills stored on the filesystem use this idea: the agent reads the detailed instructions for a skill only when it decides to use that skill, keeping the context window uncluttered.

### Prompt engineering

The craft of wording an instruction or prompt so a model responds well. It is real and useful, but in agent building it is now seen as a subset of the broader [context engineering](#context-engineering) problem.

### RAG (Retrieval-Augmented Generation)

A technique where, instead of relying only on what a model learned during training, the system retrieves relevant external information (from documents, databases, or the web) and feeds it into the model before it answers. This keeps answers current and grounded. "Naive" RAG retrieves a fixed set of documents once; more advanced and "agentic" versions retrieve repeatedly and adapt. RAG is a whole topic of its own in this material.

### Rainbow deployment

A careful way to update a long-running system without breaking work that is already in progress. Instead of switching everyone to the new version at once, traffic is shifted gradually from the old version to the new one while both run side by side. This matters for agents because an agent may be in the middle of a long task; a normal deploy could break it mid-process, while a rainbow deployment lets in-progress sessions finish on the version they started on.

### Reflection (and Reflexion)

Reflection is an agent pattern where the model critiques its own output and uses that critique to improve on the next try. Reflexion is a specific well-known method where the agent writes a verbal "what went wrong and why" note after a failure and stores it to do better next time. Reflection is one of the core building blocks of agentic behavior.

### Reinforcement learning (RL), PPO, GRPO

Reinforcement learning is a training approach where a system learns by trial and error, guided by rewards for good outcomes. PPO (Proximal Policy Optimization) and GRPO (Group Relative Policy Optimization) are two specific RL algorithms. In agent memory research, RL is used to train an agent to decide when to store, update, retrieve, or delete memories, by rewarding choices that help long-term task success.

### Re-ranking

A second pass in retrieval. After an initial search returns a batch of candidate documents, a re-ranking model reorders them so the most relevant ones come first. It improves precision at the cost of extra computation.

### Semantic drift

The slow corruption of stored knowledge over time, usually caused by repeated [summarization](#summarization-lossy-compression). Each time you compress and rewrite information, small details get lost or exaggerated, and after many rounds the memory no longer matches what actually happened. A classic example: "I like mildly spicy food" becomes "likes spicy food" becomes "loves very spicy food," until the agent recommends something far too hot.

### Semantic search

Finding information by meaning rather than exact words, using [embeddings](#embedding) and a [vector database](#vector-database). It is fast and good at matching related concepts, but it is less transparent, harder to maintain, and can return things that look similar without being truly relevant. Contrast with [agentic search](#agentic-search).

### Stateful and stateless

A stateless system treats each request as brand new, with no memory of what came before (a plain LLM call is stateless). A stateful system carries information forward across steps or sessions. Agents need to be stateful to work on long tasks, which is exactly why memory and context management are such central problems.

### Staleness (temporal obsolescence)

When stored information was correct once but is now out of date because the world changed (an address, a price, who holds an office). The fact is not a [hallucination](#hallucination); it is just old. Long-running agents need ways to detect and refresh stale memories, such as timestamps and time-based decay.

### Sub-agent

A secondary agent that a main agent spins up to handle a specific piece of work. A sub-agent runs in its own [context window](#context-window) and usually returns only a condensed result to the main agent. This serves two purposes: parallelism (many sub-agents at once) and context isolation (the sub-agent's messy intermediate work does not clog the main agent's context). See also [orchestrator-worker pattern](#orchestrator-worker-pattern) and [context isolation](#context-offloading).

### Summarization (lossy compression)

Using a model to condense history into a shorter form to save space in the [context window](#context-window). Unlike [compaction](#compaction), summarization is lossy: detail is permanently thrown away, so it is used only when compaction is no longer enough. Repeated summarization is the main cause of [semantic drift](#semantic-drift).

### Token

The unit a language model reads and writes. A token is roughly a word fragment; a word can be one or several tokens. Both the [context window](#context-window) size and the cost of running a model are measured in tokens. The articles often compare systems by token usage, for example noting that agents use about 4 times the tokens of a chat, and multi-agent systems about 15 times.

### Tool calling (function calling)

The mechanism by which an agent takes action in the world. The model outputs a structured request to run a named function with specific arguments (for example, `search_emails(query="invoice")`), and the [harness](#agent-harness) runs it and returns the result. Tools are how an agent moves beyond text and actually does things: search the web, read a file, send a message, run code.

### Vector database

A specialized store for [embeddings](#embedding) that can quickly find the vectors closest to a query vector. It is the engine behind [semantic search](#semantic-search) and a common backend for both RAG and agent memory. Its strength is fast similarity search at scale; its weakness is that similarity is not the same as true relevance.

### Knowledge graph (and Zettelkasten)

A knowledge graph stores information as nodes (entities or facts) connected by labeled links (relationships), which makes [multi-hop reasoning](#multi-hop-reasoning) easier because you can follow the connections. Zettelkasten is a note-taking method where each idea is an atomic note linked to related notes; some memory systems organize an agent's memory this way, as a living web of linked notes that grows over time. Graph RAG uses these structures for retrieval.
