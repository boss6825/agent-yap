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
