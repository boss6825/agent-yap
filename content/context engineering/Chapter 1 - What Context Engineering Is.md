# Chapter 1: What Context Engineering Is, and Why It Replaced Prompt Engineering

## Starting from what you already know

You probably know about prompt engineering: the craft of wording a question or instruction so the model gives you a good answer. If you have used a chatbot and learned that "write me a polite, three-sentence reply declining this meeting" works better than "reply to this," you have done prompt engineering.

Context engineering is the next level up, and the shift in language is deliberate. The term was popularized by people like Tobi Lutke (CEO of Shopify) and Andrej Karpathy. Lutke described it as "the art of providing all the context for the task to be plausibly solvable by the LLM." Karpathy described it as "the delicate art and science of filling the context window with just the right information for the next step." Both definitions point at the same shift in attention: away from the single clever sentence, and toward the whole bundle of information the model sees before it responds.

The articles in this folder make a strong claim that is worth stating plainly: when an agent fails, it is usually not because the model is too weak. It is because the model was handed the wrong [context](../glossary/Glossary.md#context-window). In the words of the first article, "Most agent failures are not model failures anymore, they are context failures."

## What "context" actually means

The word "context" is doing a lot of work here, so it helps to expand it. Context is not just your prompt. It is everything the model sees before it generates its next response. The first article breaks this into pieces:

- The system prompt or instructions: the rules and behavior you set up front, often including examples.
- The user prompt: the immediate question or task.
- The short-term memory or history: the conversation so far, including earlier model responses and [tool](../glossary/Glossary.md#tool-calling-function-calling) outputs.
- Long-term memory: persistent knowledge gathered across many past sessions, such as learned preferences or facts the agent was told to remember.
- Retrieved information: external, up-to-date knowledge pulled in from documents, databases, or APIs. This is [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation).
- Available tools: the definitions of every function the agent can call, such as `check_inventory` or `send_email`.
- Structured output rules: the required shape of the response, for example a specific JSON format.

All of that has to fit inside the model's [context window](../glossary/Glossary.md#context-window), which is the fixed-size working memory measured in [tokens](../glossary/Glossary.md#token). So context engineering is partly about choosing what to include, and partly about what to leave out.

## A concrete example: the cheap demo versus the magical agent

The first article uses an example that makes the point well. Imagine an assistant that receives this email:

> "Hey, just checking if you're around for a quick sync tomorrow."

A "cheap demo" agent sees only that sentence and nothing else. Its code might be perfectly functional, but with no surrounding context it can only produce something robotic:

> "Thank you for your message. Tomorrow works for me. May I ask what time you had in mind?"

A "magical" agent is given rich context before the model is ever called. The system gathers your calendar (which shows you are fully booked tomorrow), your past emails with this person (which show an informal tone is appropriate), your contact list (which identifies them as a key partner), and tools to send an invite. Only then does it generate:

> "Hey Jim! Tomorrow's packed on my end, back-to-back all day. Thursday AM free if that works for you? Sent an invite, lmk if it works."

The lesson is that the difference in quality came from the context, not from a smarter model or a cleverer algorithm. The same model produced both replies. The author summarizes it this way: the code's primary job is not to figure out how to respond, but to gather the information the model needs.

## The definition that ties it together

Pulling the threads together, the articles converge on this definition:

> Context engineering is the discipline of designing and building dynamic systems that provide the right information and tools, in the right format, at the right time, to give an LLM everything it needs to accomplish a task.

Four parts of that definition are worth dwelling on, because they are what separate context engineering from prompt engineering:

1. It is a system, not a string. A prompt is static text. Context is the output of a system that runs before the main model call, assembling what is needed.
2. It is dynamic. The context is built on the fly for each request. One request might need calendar data, another might need a web search.
3. It is about the right information and tools at the right time. The goal is not to dump everything in. It is to provide knowledge and capabilities only when they are useful. The old saying "garbage in, garbage out" applies directly.
4. Format matters. A clean summary beats a raw data dump. A clear tool definition beats a vague instruction. How you present information changes how well the model uses it.

## Why this matters more in the agent era

In a single chatbot turn, you can often get away with a sloppy context, because there is only one exchange. Agents are different. An agent runs in a loop, and a typical task in a system like [Manus](../glossary/Glossary.md#agent) uses around 50 tool calls. Every one of those calls produces output that, by default, piles up in the context window. Without active management, the window fills with old [tool](../glossary/Glossary.md#tool-calling-function-calling) results, and the model's quality starts to degrade. That degradation has a name, [context rot](../glossary/Glossary.md#context-rot), and it is the subject of the next chapter.

This is why the articles treat context engineering as the number one job of an engineer building agents. The reasoning quality of the underlying model is becoming a given. What you control, and what decides whether your agent feels magical or broken, is the context you build around it.

## Key takeaways

- Prompt engineering is wording one instruction well. Context engineering is building a system that assembles everything the model sees, automatically and dynamically.
- Context includes the system prompt, the user request, conversation history, long-term memory, retrieved information, tool definitions, and output format rules.
- Most agent failures today are context failures, not model failures.
- The same model can produce a robotic answer or a magical one; the difference is the context it was given.
- Agents make this skill critical because they run in long loops that flood the context window unless it is actively managed.

Continue to Chapter 2 to see the specific ways context goes wrong.

## Review

**Quick Check**

1. How did Andrej Karpathy describe context engineering?
   - A) The art of wording a single instruction as precisely as possible
   - B) The delicate art and science of filling the context window with just the right information for the next step
   - C) The practice of fine-tuning a model on your own task data
   - D) The discipline of expanding the context window as far as the provider allows
   <details><summary>Answer</summary>B) The delicate art and science of filling the context window with just the right information for the next step - Karpathy's phrasing, alongside Tobi Lutke's "providing all the context for the task to be plausibly solvable by the LLM."</details>

2. According to the chapter, what is the usual cause when an agent fails today?
   - A) The model is too weak for the task
   - B) The context window limit was exceeded and the API errored
   - C) The model was handed the wrong context
   - D) The user's prompt was grammatically unclear
   <details><summary>Answer</summary>C) The model was handed the wrong context - "Most agent failures are not model failures anymore, they are context failures."</details>

3. In the cheap-demo-versus-magical-agent email example, what produced the difference in quality?
   - A) A smarter model on the magical agent
   - B) A cleverer response-generation algorithm
   - C) A longer, more carefully worded prompt
   - D) The context gathered before the model was called
   <details><summary>Answer</summary>D) The context gathered before the model was called - the same model produced both replies; the magical one had the calendar, past emails, contact list, and tools available.</details>

4. Which part of the definition most clearly separates context engineering from prompt engineering?
   - A) It is a system, not a string
   - B) It requires a larger context window
   - C) It always involves retrieval from a vector database
   - D) It replaces the system prompt entirely
   <details><summary>Answer</summary>A) It is a system, not a string - a prompt is static text, while context is the output of a system that runs before the main model call and assembles what is needed.</details>

5. Why does the chapter say context engineering matters more in the agent era than for single chatbot turns?
   - A) Agents use larger models that are more sensitive to wording
   - B) An agent runs in a loop (a typical Manus task uses around 50 tool calls) and every result piles up in the window
   - C) Agents cannot use a system prompt
   - D) Chatbots have no context at all
   <details><summary>Answer</summary>B) An agent runs in a loop and every tool result accumulates by default - around 50 tool calls per typical Manus task, which floods the window and leads to context rot unless managed.</details>

**More Questions**

6. Which of the following is *not* listed in the chapter as a component of context?
   - A) The definitions of every tool the agent can call
   - B) Structured output rules, such as a required JSON shape
   - C) The model's weights and training data
   - D) Long-term memory gathered across past sessions
   <details><summary>Answer</summary>C) The model's weights and training data - context is everything the model *sees* before generating: system prompt, user prompt, short-term history, long-term memory, retrieved information, tool definitions, and output format rules.</details>

7. In the chapter's breakdown of context, which component corresponds to RAG?
   - A) Short-term memory or history
   - B) Retrieved information pulled from documents, databases, or APIs
   - C) Available tools
   - D) The system prompt or instructions
   <details><summary>Answer</summary>B) Retrieved information pulled in from documents, databases, or APIs - external, up-to-date knowledge, which is what RAG provides.</details>

8. The chapter says context engineering is about the right information and tools "at the right time." What does that rule out?
   - A) Using tools at all
   - B) Building context dynamically per request
   - C) Dumping everything the agent might conceivably need into every call
   - D) Including examples in the system prompt
   <details><summary>Answer</summary>C) Dumping everything in - the goal is to provide knowledge and capabilities only when they are useful; garbage in, garbage out applies directly.</details>

9. You are handing an agent the results of a database query. According to the chapter's fourth point, what should you consider beyond *whether* to include it?
   - A) Whether the model was trained on similar data
   - B) The format: a clean summary beats a raw data dump
   - C) Whether to send it as a second API call
   - D) Whether to shorten the user's prompt to compensate
   <details><summary>Answer</summary>B) The format - how you present information changes how well the model uses it, just as a clear tool definition beats a vague instruction.</details>

10. Your agent gives robotic, unhelpful answers, so your team's first instinct is to upgrade to a more expensive model. What does this chapter suggest you check first?
    - A) Whether the temperature setting is too low
    - B) Whether the structured output schema is valid
    - C) Whether the system that assembles context is gathering the information the model needs
    - D) Whether the context window limit has been raised
    <details><summary>Answer</summary>C) Whether the context-assembling system is gathering what the model needs - the chapter's framing is that the code's primary job is not to figure out how to respond but to gather the information the model needs, and reasoning quality is increasingly a given.</details>

**Think About It**

1. Two replies to the same email - one stiff and useless, one that reads like a busy human wrote it in five seconds. Same model, same code quality. So where did the intelligence come from?
<details><summary>Show answer</summary>
It came from the retrieval work that happened before the model was ever called. The "magical" agent didn't reason better; it was simply told that your calendar is packed tomorrow, that Thursday morning is free, that your history with this person is informal, that they are a key partner, and that a calendar tool exists. Given all that, the good reply is almost forced - there isn't much room left to be robotic. The uncomfortable implication is that the part you'd instinctively call the hard part (generating a good response) was handled for you by the provider, and the part you'd call plumbing (gathering calendar, contacts, and email history) is where the quality actually lives. That inversion is the whole reason the field renamed itself.
</details>

2. The field renamed itself from prompt engineering to context engineering. Isn't that just rebranding the same job with a bigger word?
<details><summary>Show answer</summary>
No, because the object you're engineering changed from a string to a system. Prompt engineering means you sit down and write one good sentence; the artifact is static text that a human authors and tunes. Context engineering means you write code that runs *before* every model call and decides, for this specific request, which of the seven context components to assemble - maybe calendar data this time, a web search the next. Nobody hand-writes that; it is produced dynamically. So the rename tracks a real change in what you build and where the effort goes: from wordsmithing to designing an information-assembly pipeline.
</details>

3. Your instinct with a huge context window is to fill it - more information can only help the model, right? The chapter says the goal is to decide what to *leave out*. Why would withholding information make an agent better?
<details><summary>Show answer</summary>
Because the context window is fixed-size working memory measured in tokens, and everything you put in competes for the model's attention. Extra material isn't free padding; it is noise the model has to sift through to find the part that mattered, and irrelevant tool definitions or stale results can actively pull its reasoning off course. The chapter's phrasing is that context engineering is "partly about choosing what to include, and partly about what to leave out," and it invokes garbage in, garbage out for exactly this reason. Chapter 2 gives the failure modes names - rot, pollution, confusion - but the intuition starts here: a smaller, cleaner context is a stronger signal.
</details>

4. Sloppy context barely hurts a chatbot but reliably breaks an agent. What changes between one exchange and fifty?
<details><summary>Show answer</summary>
Accumulation. In a single chatbot turn, a messy context is a one-off cost - you get one mediocre answer and move on. An agent runs in a loop, and a typical Manus task involves around 50 tool calls, each producing output that by default stays in the window forever. So a small amount of clutter per step compounds into a window stuffed with old, already-used tool results. Quality then degrades quietly, without any error being thrown - the phenomenon called context rot. That compounding is why the articles promote context engineering from a nice-to-have prompting trick to the number one job of an engineer building agents.
</details>

**Coding Challenge**

**Build a dynamic context assembler**

The chapter's definition insists context is "a system, not a string": it runs before the model call and assembles only what the current request needs. Write `assemble_context(request, sources)` that takes a request describing which components it needs and a registry of context sources, then returns the assembled context in a stable order (system prompt first, user prompt last) - including only the requested components and skipping anything unavailable.

<details>
<summary>Python Solution</summary>

```python
ORDER = [
    "system_prompt",
    "long_term_memory",
    "history",
    "retrieved",
    "tools",
    "output_schema",
    "user_prompt",
]


def assemble_context(request, sources):
    """Assemble only the components this request needs, in a stable order."""
    needed = set(request["needs"]) | {"system_prompt", "user_prompt"}
    parts = []
    for component in ORDER:                    # stable order, not dict order
        if component not in needed:
            continue                           # leaving out is half the job
        value = sources.get(component)
        if not value:
            continue                           # unavailable: skip, don't pad
        parts.append(f"<{component}>{value}</{component}>")
    return "\n".join(parts)


sources = {
    "system_prompt": "You are a scheduling assistant.",
    "user_prompt": "Hey, just checking if you're around for a quick sync tomorrow.",
    "history": "Jim always writes informally.",
    "retrieved": "Calendar: tomorrow fully booked. Thursday AM free.",
    "tools": "send_invite(when, who)",
    "long_term_memory": "",                    # nothing learned yet
}

cheap = assemble_context({"needs": []}, sources)
magical = assemble_context(
    {"needs": ["history", "retrieved", "tools", "long_term_memory"]}, sources
)
print(cheap)                                   # system + user only
print("---")
print(magical)                                 # same model, far richer context
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
const ORDER = [
  "system_prompt",
  "long_term_memory",
  "history",
  "retrieved",
  "tools",
  "output_schema",
  "user_prompt",
];

function assembleContext(request, sources) {
  const needed = new Set([...request.needs, "system_prompt", "user_prompt"]);
  return ORDER.filter((c) => needed.has(c) && sources[c]) // skip unrequested + unavailable
    .map((c) => `<${c}>${sources[c]}</${c}>`)
    .join("\n");
}

const sources = {
  system_prompt: "You are a scheduling assistant.",
  user_prompt: "Hey, just checking if you're around for a quick sync tomorrow.",
  history: "Jim always writes informally.",
  retrieved: "Calendar: tomorrow fully booked. Thursday AM free.",
  tools: "send_invite(when, who)",
  long_term_memory: "", // nothing learned yet
};

console.log(assembleContext({ needs: [] }, sources)); // system + user only
console.log("---");
console.log(
  assembleContext(
    { needs: ["history", "retrieved", "tools", "long_term_memory"] },
    sources,
  ),
); // same model, far richer context
```

</details>
