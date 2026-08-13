# Chapter 1: Anatomy of an AI Agent

Before you can design an agent, you need a clear mental model of its parts. This chapter lays out that anatomy and the vocabulary the rest of the folder uses. Every term here recurs throughout, so it's worth getting precise.

## The spectrum: prompt → chatbot → agent

It helps to place "agent" on a spectrum:

- **A single prompt** takes input and returns output once. No memory, no actions. (A summariser, a classifier.)
- **A chatbot** holds a conversation: it has history, but it still only *talks*. It can't do anything in the world.
- **An agent** is a model in a loop that can *take actions* through tools, observe their results, and decide its next step, repeating until a task is done. It can read a file, call an API, write a document, and chain these together.

The defining feature of an agent is the **loop with tools**. Everything else in this folder elaborates on the pieces that make that loop useful, safe, and reliable.

## The six parts

A production agent has six conceptual parts. Hold all six in your head and most design questions become "which part does this belong to?"

### 1. The model

The LLM itself, the reasoning engine. You usually don't build this; you call it via a provider API. Key properties you'll design around: its context window (how much it can read at once), whether it supports tool/function calling, whether it can stream, and whether it exposes a reasoning/thinking mode. Treat the model as a powerful but stateless, occasionally-unreliable component you orchestrate, not as the system itself.

### 2. The loop (orchestrator)

The control structure that drives the model: call the model, see if it asked for tools, run them, feed results back, repeat until it produces a final answer. This is the agent's "main function." It owns iteration limits, streaming, and the bridge between the model's requests and your code's actions. (Chapter 2.)

### 3. The tools

The actions the agent can take, each described to the model by a schema (name, description, parameters). A tool might read a document, search a database, send an email, or generate a file. Tools are how the agent affects the world and gathers information beyond its training. The set of tools defines the agent's *capabilities*. (Chapter 3.)

### 4. The context

Everything assembled and sent to the model on a given call: the system prompt, the conversation history, the available tools, and any injected information (available documents, retrieved snippets, prior-turn summaries). Context is *constructed fresh* for each call. This is the most underappreciated part and the one that most determines quality. (Chapter 5.)

### 5. The memory / state

What persists across calls and across sessions: conversation history, generated artifacts, the status of long-running work, user preferences. The model is stateless between API calls; memory is how continuity is created. It usually lives in a database and is *selectively* loaded into context. (Chapters 5, 9.)

### 6. The surrounding system

Everything that makes the agent a real product rather than a demo: authentication and authorization, storage, streaming transport, secrets management, rate limiting, observability, error handling, and the data model. This is the bulk of the engineering, and it's where agents succeed or fail in production. (Chapters 8–18.)

## How the parts interact in one turn

Walk through a single user request to see the parts cooperate:

1. The request arrives. The **surrounding system** authenticates the user and authorizes what they can touch.
2. The **orchestrator** assembles **context**: it loads relevant **memory** (history, available artifacts), builds the system prompt, and gathers the **tools** available on this surface.
3. The orchestrator calls the **model** with that context.
4. The model streams reasoning and text, and may request **tools**. The orchestrator runs each tool (these may touch the surrounding system: storage, external APIs), and feeds results back into the **loop**.
5. The model produces a final answer. The orchestrator streams it to the user and writes the outcome into **memory**.

Every chapter in this folder is, in effect, a deep look at one of these steps.

## A crucial reframing: the model is the easy part

Newcomers assume the model is the system and the rest is glue. The opposite is closer to the truth. The provider gives you a smart model for a few cents a call. Your design work is everything around it:

- *Context engineering* (deciding what the model sees) is where most quality lives.
- *Tool design* (what actions exist and how they're described) is where most capability and reliability live.
- *The surrounding system* (auth, storage, streaming, state, observability) is where most of the *engineering effort* lives.

If you remember one thing from this chapter, make it this: **you are not building a model; you are building the system that makes a model useful, safe, and reliable.** The chapters ahead are a tour of that system, part by part.

## Two stances toward the model

Finally, two stances worth naming because they shape design:

- **The model as a smart but unreliable collaborator.** It will occasionally produce malformed output, hallucinate, or call a tool wrong. Design defensively: validate its outputs, give every tool call a defined result, and degrade gracefully. (This stance drives Chapter 13.)
- **The model as a component you can swap.** Today's best model won't be next quarter's. Decouple from any specific provider so you can change models without rewriting your agent. (This stance drives Chapter 4.)

Hold both stances and you'll make architecture decisions that age well.

## Review

**Quick Check**

1. What is the defining feature that distinguishes an agent from a chatbot?
   - A) A larger context window
   - B) A loop that takes actions through tools and observes the results
   - C) The ability to hold conversation history
   - D) Access to a more capable underlying model
   <details><summary>Answer</summary>B) A loop that takes actions through tools and observes the results - a chatbot has history but only talks, while the agent's defining feature is the loop with tools.</details>

2. Which of the six parts is described as being constructed fresh for every model call?
   - A) The context
   - B) The memory and state
   - C) The model
   - D) The surrounding system
   <details><summary>Answer</summary>A) The context - it is assembled fresh on each call from the system prompt, history, tools, and injected information, unlike memory which persists.</details>

3. A developer wants the agent to remember a user's preferences across separate sessions. Which part is responsible?
   - A) The loop
   - B) The model
   - C) The memory and state
   - D) The context
   <details><summary>Answer</summary>C) The memory and state - it persists across calls and sessions in a database and is selectively loaded into context when relevant.</details>

4. Where does the chapter say most of the engineering effort actually goes?
   - A) Training or fine-tuning the model
   - B) Choosing the cheapest provider
   - C) Writing a single perfect prompt
   - D) The surrounding system: auth, storage, streaming, state, and observability
   <details><summary>Answer</summary>D) The surrounding system - the provider gives you a smart model cheaply, so the bulk of the engineering is everything around it.</details>

5. Which statement captures the chapter's crucial reframing rather than the common newcomer assumption?
   - A) Better models eliminate the need for context engineering
   - B) The model is the system and everything else is glue
   - C) The model is the easy part; you are building the system that makes a model useful, safe, and reliable
   - D) Tools matter less than raw model capability
   <details><summary>Answer</summary>C) The model is the easy part; you are building the system that makes a model useful, safe, and reliable - this is the chapter's central reframing.</details>

**More Questions**

6. On the prompt → chatbot → agent spectrum, what does a chatbot have that a single prompt does not?
   - A) The ability to call tools
   - B) Conversation history
   - C) Persistent storage of generated artifacts
   - D) An iteration limit
   <details><summary>Answer</summary>B) Conversation history - a single prompt takes input and returns output once with no memory and no actions, while a chatbot holds a conversation but still only talks.</details>

7. In the walkthrough of a single turn, which part authenticates the user and authorizes what they can touch?
   - A) The orchestrator
   - B) The tools
   - C) The surrounding system
   - D) The context
   <details><summary>Answer</summary>C) The surrounding system - the request arrives and the surrounding system handles authentication and authorization before the orchestrator assembles context.</details>

8. Which is listed as a key property of the model that you design around?
   - A) Its parameter count
   - B) The size of its training dataset
   - C) Whether it supports tool/function calling
   - D) The region it is hosted in
   <details><summary>Answer</summary>C) Whether it supports tool/function calling - alongside its context window, whether it can stream, and whether it exposes a reasoning/thinking mode.</details>

9. Your agent occasionally produces malformed output and calls a tool with the wrong arguments. Which stance from the chapter should drive your design?
   - A) The model as a smart but unreliable collaborator, so validate outputs and degrade gracefully
   - B) The model as a component you can swap, so change providers
   - C) The model as the system, so improve the prompt until it stops
   - D) The model as infallible, so trust its output and remove validation
   <details><summary>Answer</summary>A) The model as a smart but unreliable collaborator - design defensively: validate its outputs, give every tool call a defined result, and degrade gracefully. This stance drives Chapter 13.</details>

10. Your team wants to be able to adopt next quarter's best model without rewriting the agent. Which stance does that reflect, and which chapter does it lead to?
    - A) The model as an unreliable collaborator, leading to Chapter 13
    - B) The model as a component you can swap, leading to Chapter 4
    - C) The context as a budget, leading to Chapter 5
    - D) Memory as durable state, leading to Chapter 9
    <details><summary>Answer</summary>B) The model as a component you can swap, leading to Chapter 4 - today's best model won't be next quarter's, so decouple from any specific provider.</details>

**Coding Challenge**

**Route a design concern to its part**

Write `classify_part(concern)` that maps a design concern to one of the six parts of an agent. The chapter's claim is that holding all six in your head turns most design questions into "which part does this belong to?" - so build exactly that router, and return a clear message for anything unrecognised.

<details>
<summary>Python Solution</summary>

```python
PARTS = {
    "model": ["context window", "tool calling support", "reasoning mode"],
    "loop": ["iteration limit", "tool result feedback", "termination"],
    "tools": ["what actions exist", "tool schema", "capabilities"],
    "context": ["system prompt", "what the model sees", "retrieved snippets"],
    "memory": ["conversation history", "user preferences", "generated artifacts"],
    "surrounding system": ["auth", "rate limiting", "observability", "storage"],
}


def classify_part(concern):
    """Map a design concern to the agent part that owns it."""
    needle = concern.lower()
    for part, concerns in PARTS.items():
        if any(c in needle or needle in c for c in concerns):
            return part
    return f"unclassified: {concern} - which part would own it?"


print(classify_part("rate limiting"))        # surrounding system
print(classify_part("iteration limit"))      # loop
print(classify_part("user preferences"))     # memory
print(classify_part("pricing negotiation"))  # unclassified
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
const PARTS = {
  model: ["context window", "tool calling support", "reasoning mode"],
  loop: ["iteration limit", "tool result feedback", "termination"],
  tools: ["what actions exist", "tool schema", "capabilities"],
  context: ["system prompt", "what the model sees", "retrieved snippets"],
  memory: ["conversation history", "user preferences", "generated artifacts"],
  "surrounding system": ["auth", "rate limiting", "observability", "storage"],
};

function classifyPart(concern) {
  const needle = concern.toLowerCase();
  for (const [part, concerns] of Object.entries(PARTS)) {
    if (concerns.some((c) => needle.includes(c) || c.includes(needle))) return part;
  }
  return `unclassified: ${concern} - which part would own it?`;
}

console.log(classifyPart("rate limiting"));       // surrounding system
console.log(classifyPart("iteration limit"));     // loop
console.log(classifyPart("user preferences"));    // memory
console.log(classifyPart("pricing negotiation")); // unclassified
```

</details>

**Think About It**

1. You could hand a chatbot the most capable model in existence and a context window big enough to hold a library, and it still couldn't file your expense report. What's actually missing?
   <details><summary>Show answer</summary>What's missing isn't intelligence, it's the ability to act and then look at what happened. A chatbot has history, so it can talk about your expense report in impressive detail, but talking is all it does. An agent adds a loop with tools: it can call an API, read the result, notice the receipt is missing, ask for it, and try again. That feedback cycle - act, observe, decide - is the whole difference, and it's why the chapter says everything else in the folder is elaboration on making that loop useful, safe, and reliable.</details>

2. Almost everyone arriving at this field assumes the model is the system and the rest is glue code. The chapter says the opposite is closer to the truth. Why would that be?
   <details><summary>Show answer</summary>Because the hard, valuable part is the part you actually have to build. A provider hands you a genuinely smart model for a few cents a call - you didn't build it and you can't meaningfully improve it. What you can control is what the model sees (context engineering, where most of the quality lives), what it can do (tool design, where most of the capability and reliability live), and everything that makes it a product rather than a demo (auth, storage, streaming, state, observability - where most of the engineering effort goes). So the "glue" is the system, and the model is the component you plug into it.</details>

3. The chapter tells you to treat a state-of-the-art model as an unreliable collaborator. Isn't that needlessly pessimistic about something that clearly works well?
   <details><summary>Show answer</summary>It's not a judgment about how good the model is, it's a judgment about how often "occasionally" happens at scale. A model that emits malformed output or hallucinates one time in a hundred looks flawless in a demo and breaks constantly in production. The stance is useful precisely because it tells you where to put your effort: validate the model's outputs, guarantee every tool call gets a defined result, and degrade gracefully instead of crashing. Design as if the model will be wrong sometimes, and it being right most of the time becomes a pleasant surplus rather than a load-bearing assumption.</details>

---

Next: [Chapter 2: The agent loop pattern](chapter-02-agent-loop-pattern.md)
