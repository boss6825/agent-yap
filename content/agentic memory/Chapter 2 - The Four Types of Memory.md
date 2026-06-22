# Chapter 2: The Four Types of Memory

Both the "Practical Guide" and the "Building Long-Term Memory" article borrow a framework from cognitive science: human memory is not one thing but several specialized systems working together, and the same split is useful for agents. The "Practical Guide" describes four temporal scopes, organized by how long the memory lasts. This chapter walks through all four, using the [glossary entry](../glossary/Glossary.md#memory-types-working-episodic-semantic-procedural) as the quick reference and going deeper here.

A helpful way to keep them straight before we start: working memory is what you are thinking about right now, episodic memory is your diary, semantic memory is your encyclopedia of facts, and procedural memory is your set of habits and skills.

## Working memory

Working memory is the [context window](../glossary/Glossary.md#context-window) itself. It is ephemeral, high-bandwidth, and limited. Everything the agent is actively reasoning over lives here, briefly.

Its characteristic failure mode is attentional dilution, also called the "lost in the middle" effect: when the window gets too crowded, relevant content gets ignored even though it is technically present. The "Practical Guide" notes this is hard to debug precisely because the model "has" the information but is not using it, which is the same phenomenon as [context rot](../glossary/Glossary.md#context-rot) from the context-engineering material.

The practical workaround that practitioners (and the author) reach for is mundane but effective: start a new thread for a new chunk of work. The advice is vivid: you do not keep a coding assistant open all day across 20 different tasks, because its working memory degrades and its performance drops. Fresh context beats a stuffed one.

## Episodic memory

Episodic memory captures concrete experiences: what happened, when, and in what sequence. It is the agent's logbook or diary.

For an agent, episodic memory might record what the user requested, which tools or integrations were used, whether the task succeeded or failed, how long it took, and any errors encountered. The "Building Long-Term Memory" article stresses that this is not raw conversation logs. Effective episodic memory is structured and summarized: you want the essence of what happened, not every token exchanged.

The "Practical Guide" gives a real example: in the author's system, episodic memory is the daily standup logs, where each agent writes a brief summary of what it did, what it found, and what it escalated. These accumulate into a searchable timeline. The practical value is large: agents can look back at yesterday's work, spot patterns, and avoid repeating failures. The article also notes that some tools struggle with episodic memory unless you explicitly force the behavior with instructions.

Two uses make episodic memory worth the effort. First, it lets the agent reference the past naturally ("Last time you asked about quarterly reports, I pulled data from your CRM and made a PDF. Same again?"). Second, it enables debugging: when an agent forgets context or makes an error, you can trace back through the history to see what happened.

## Semantic memory

Semantic memory stores abstracted, distilled knowledge: facts, heuristics, and learned conclusions. It is the "what is true" layer.

These facts come in two flavors. General facts include industry knowledge, tool capabilities, and domain terminology. User-specific facts include things like company size, tech stack, key contacts, and project deadlines. In the author's system, semantic memory is a curated `MEMORY.md` file in each agent's workspace.

The defining challenge of semantic memory is curation. Not everything should become a permanent fact. The "Building Long-Term Memory" article draws the line clearly: "We use Salesforce" is a durable fact worth storing, while "I'm having a busy week" is transient context that is not. The "Practical Guide" puts it bluntly: without curation, semantic memory becomes a junk drawer. This is why many systems use a staging step where candidate facts are held for review before being promoted to permanent memory, which adds a human or automated check for accuracy. Semantic memory is also where [grounding](../glossary/Glossary.md#grounding) comes from: instead of guessing, the agent can reference verified facts about the user's situation.

## Procedural memory

Procedural memory encodes executable skills, behavioral patterns, and learned behavior. It is closer to habits and instructions than to facts.

In the author's system, procedural memory maps to files like `AGENTS.md` and `SOUL.md`, which hold persona instructions, behavioral constraints, and escalation rules. When the agent reads these at the start of a session, it is loading procedural memory. The "Practical Guide" makes the point that these are not just system prompts; they are a form of long-term learned behavior that shapes every action, which is why the survey treats procedural memory as its own distinct tier.

The author is candid that procedural memory is the most neglected tier in practice, including in his own work. People spend effort tuning a prompt, but the feedback loops that should update procedural memory over time often get left out. Ideally these files would be updated based on user feedback, or even through reflective "dream" processes that analyze past interactions and refine the agent's behavior. A practical recommendation appears later (Chapter 3 and the takeaways): treat procedural memory as code, and keep it under version control.

## How AgentCore maps to these types

The AWS "AgentCore" article shows how a production service implements three of these. It offers three built-in memory strategies you can configure:

- Semantic memory: extracts facts and knowledge, for example "The customer's company has 500 employees across Seattle, Austin, and Boston."
- User preferences: captures explicit and implicit preferences with context, for example a preference for Python for development work. This is a practical slice of procedural and semantic memory aimed at personalization.
- Summary memory: creates running narratives of a conversation under different topics, scoped to a session, stored in a structured format.

The mapping is not perfectly one-to-one with the four-scope framework, but it shows the same instinct: separate the kinds of memory by purpose, because facts, preferences, and conversation summaries each need different handling.

## Why splitting memory by type matters

The unifying lesson, stated directly in the "Practical Guide," is to start with explicit temporal scopes. Do not build a vague, all-purpose "memory." When you need episodic memory, build episodic memory. When the use case grows to need semantic memory, build that. Do not try to find one system that does everything, and do not build every form of memory before you actually need it. Each type has a different lifespan, a different curation rule, and a different failure mode, so treating them separately is what keeps the whole system manageable.

## Key takeaways

- Working memory is the context window: fast, small, temporary; its failure is "lost in the middle." The cure is often a fresh thread.
- Episodic memory is the structured logbook of what happened and when; it enables recall and debugging.
- Semantic memory is the curated store of durable facts; its main challenge is curation, or it becomes a junk drawer.
- Procedural memory is learned skills and behavioral rules (persona and constraint files); it is the most neglected tier and should be treated as code.
- AgentCore implements semantic, preference, and summary strategies, echoing the same "separate by purpose" instinct.
- Build memory types explicitly and only as you need them.

Continue to Chapter 3 for how these memories are actually created, consolidated, and retrieved.

---

## Review

### Quick Check

1. Which memory type is the context window itself?
   * A) Episodic
   * B) Semantic
   * C) Working
   * D) Procedural
   <details><summary>Answer</summary>C) Working memory - it is the ephemeral, high-bandwidth, limited space the agent actively reasons over.</details>

2. Procedural memory holds:
   * A) Concrete experiences of what happened and when
   * B) Distilled facts about the world
   * C) The current reasoning buffer
   * D) Executable skills, behavioral patterns, and persona/constraint rules
   <details><summary>Answer</summary>D) Executable skills and behavioral rules - persona and constraint files like AGENTS.md and SOUL.md are procedural memory.</details>

3. A user says "I'm having a busy week" and also "We use Salesforce." Which belongs in semantic memory?
   * A) Both
   * B) "We use Salesforce," because it is a durable fact, not transient context
   * C) "I'm having a busy week," because it is recent
   * D) Neither belongs in any memory
   <details><summary>Answer</summary>B) "We use Salesforce" - durable facts are worth storing; transient context is not, or semantic memory becomes a junk drawer.</details>

4. Your coding assistant's answers degrade after staying open across 20 different tasks. What is the recommended fix?
   * A) Start a new thread for the new chunk of work
   * B) Switch to a bigger model
   * C) Add more facts to semantic memory
   * D) Increase the summarization frequency
   <details><summary>Answer</summary>A) Start a fresh thread - working memory degrades when crowded ("lost in the middle"), and fresh context beats a stuffed one.</details>

5. The chapter calls one tier "the most neglected." Which is it, and what is the recommended discipline?
   * A) Working memory; keep it as large as possible
   * B) Episodic memory; store raw logs verbatim
   * C) Procedural memory; treat it as code under version control
   * D) Semantic memory; never curate it
   <details><summary>Answer</summary>C) Procedural memory; treat it as code under version control - its feedback loops are the ones most often left out.</details>
