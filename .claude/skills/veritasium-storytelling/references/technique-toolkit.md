# Technique Toolkit — Before/After Transformations

This reference provides the complete set of Veritasium writing techniques with
concrete before/after examples showing how to transform textbook-style technical
prose into narrative-driven content.

## Table of Contents

1. [The Wrong Answer Technique](#1-the-wrong-answer-technique)
2. [The Inventor's Voice](#2-the-inventors-voice)
3. [Numbers That Wow](#3-numbers-that-wow)
4. [The "But Wait" Pivot](#4-the-but-wait-pivot)
5. [Concrete → Abstract → Concrete Cycles](#5-concrete--abstract--concrete-cycles)
6. [The Explanation as Discovery](#6-the-explanation-as-discovery)
7. [Progressive Code Building](#7-progressive-code-building)
8. [The Expert Witness](#8-the-expert-witness)
9. [Scene-Setting in Two Sentences](#9-scene-setting-in-two-sentences)
10. [The Emotional Stakes Reframe](#10-the-emotional-stakes-reframe)
11. [The Constraint That Creates](#11-the-constraint-that-creates)
12. [The Return](#12-the-return)

---

## 1. The Wrong Answer Technique

Present the common belief. Let the reader commit to it. Then break it.

**BEFORE (textbook):**
> Context engineering is the practice of deciding what information to include in
> each model call. It is the most important factor in agent quality.

**AFTER (narrative):**
> Ask an engineer what makes a great AI agent, and nine out of ten will say "a
> better model." Upgrade to GPT-5, use Claude Opus, throw more intelligence at
> the problem. They're wrong — or rather, they're solving the wrong problem.
>
> The teams building the best agents in production figured out something
> counterintuitive: the model is the least important variable. What matters is
> what you *show* the model. Two identical models, same prompt, same tools. One
> gets a carefully curated context. The other gets everything dumped in. The
> curated one wins every single time. Not by a little — by a lot.
>
> This is context engineering. And it's the skill that separates agents that
> demo well from agents that work in production.

**Why it works:** The reader's existing mental model ("better model = better agent")
creates tension when it collides with the truth. That tension is what drives them
to keep reading.

---

## 2. The Inventor's Voice

First-person quotes from the people who built it. Direct > paraphrased > summarized.

**BEFORE (textbook):**
> Dijkstra developed his shortest path algorithm in 1956 while working on the
> ARMAC computer at the Mathematical Center in Amsterdam.

**AFTER (narrative):**
> "Dutch marriage rights require you to state your profession," Dijkstra later
> recalled. "I said that I was a programmer. But the municipal authorities of
> Amsterdam didn't accept it on the ground that there was no such profession.
> And believe it or not, under the heading 'profession,' my marriage act shows
> the ridiculous entry: 'theoretical physicist.'"
>
> The man who would invent one of the most important algorithms in computing
> couldn't even call himself a computer scientist.

**For AI agent content, source quotes from:**
- Anthropic's engineering blog posts
- OpenAI's system card and research posts
- Conference talks (transcripts from YouTube)
- Twitter/X threads by practitioners
- Academic paper introductions (often surprisingly personal)
- Podcast interviews with AI engineers

Always attribute. If you can't find a real quote, paraphrase clearly:
"As one Anthropic engineer put it (paraphrasing)..."

---

## 3. Numbers That Wow

Specific, concrete numbers that create scale shock. The number itself tells
a story.

**BEFORE (textbook):**
> Large language models have limited context windows, which constrains how much
> information can be provided per call.

**AFTER (narrative):**
> Claude's context window is 200,000 tokens. That sounds enormous — it's roughly
> 500 pages of text. But a typical enterprise codebase has 50,000+ files. A
> legal contract review might involve 200 documents. An agent researching a
> complex topic might need to cross-reference dozens of sources.
>
> 200,000 tokens is both a vast space and a tiny keyhole into the world of
> information the agent needs to work with. The art of context engineering is
> choosing which 500 pages, out of the millions available, to slide through
> that keyhole.

**The formula:** [Impressive absolute number] + [comparison that reframes it] +
[implication for the reader].

More examples:
- "Each API call costs ~$0.01. An agent that chains 50 calls costs $0.50.
  A thousand users doing that hourly: $12,000/day. Suddenly context engineering
  is a budget item, not a nice-to-have."
- "The model processes 100 tokens per second. A 4,000-token tool result takes
  40 seconds of 'reading time.' Multiply by 5 tools per turn, and the user is
  waiting 3+ minutes. This is why you distill tool outputs."

---

## 4. The "But Wait" Pivot

The moment you think you understand, a new layer opens. This is what keeps pages
turning in long technical content.

**Transition phrases that signal a pivot:**
- "This works beautifully. For toy problems."
- "There's a catch."
- "But in production, something else happens."
- "That handles the happy path. Now consider what happens when..."
- "If this were the whole story, every agent would work perfectly."
- "Except: the user didn't ask about that document. They asked about *this* one."

**Structure:**
> [Establish understanding of Level N]
>
> "But there's a problem with this approach..."
>
> [Reveal why Level N breaks in a specific scenario]
>
> [Build Level N+1]

**Example in context engineering:**
> So you load the last 10 turns of conversation into context. The model has
> continuity. It remembers what it said. Problem solved.
>
> Except three turns ago, the user edited the document the model read. The model
> is now reasoning about a version of the document that no longer exists. It
> confidently references paragraph 4, which was deleted two minutes ago.
>
> The model doesn't know this. It can't know this. It's working from a snapshot
> that's already stale. And this is where most agent bugs actually come from —
> not from the model being stupid, but from the context being outdated.

---

## 5. Concrete → Abstract → Concrete Cycles

Never stay abstract for more than two paragraphs. Oscillate.

**The pattern:**
```
Concrete example (the reader can picture it)
   ↓
Abstract principle (the generalization)
   ↓
New concrete example (that proves the generalization)
   ↓
Deeper abstraction (building on the first)
   ↓
Concrete at scale (the principle in production)
```

**Example:**
> **Concrete:** Your agent reads a 50-page contract. You paste the whole thing
> into context. The model takes 30 seconds and costs $0.15. It misses the key
> clause on page 37.
>
> **Abstract:** This is the "lost in the middle" effect — models attend less to
> information in the middle of long contexts. More isn't better; it's worse.
>
> **Concrete:** Instead, give the model a table of contents and a `read_section`
> tool. It reads only the relevant sections — pages 35-40. Response time: 3
> seconds. Cost: $0.02. It finds the clause immediately.
>
> **Deeper abstraction:** This is the "reference, don't embed" pattern.
> The model pulls what it needs rather than wading through everything.
>
> **Concrete at scale:** Anthropic's own Claude Code uses this exact pattern.
> It doesn't paste your entire codebase into context. It gives the model tools
> to read files, search code, and explore — and lets the model decide what's
> relevant.

---

## 6. The Explanation as Discovery

Frame explanations as if the reader is discovering the solution alongside the
inventor. Use "we" and "let's" to make the reader an active participant.

**BEFORE (textbook):**
> The agent loop pattern consists of calling the model, checking for tool calls,
> executing them, and feeding results back.

**AFTER (narrative):**
> Let's build an agent from scratch. The simplest possible version.
>
> We need a model — that's our thinking engine. We call it with a question.
> It answers. Done? Not quite.
>
> What if the model needs information it doesn't have? It can't answer "what's
> in this file?" from training data alone. So we give it a tool: `read_file`.
> Now the model can say "I need to read main.py" and we run that tool for it.
>
> But after reading the file, it might need to read another. Or search for
> something. So we put this in a loop: call the model, check if it wants a
> tool, run the tool, call the model again with the result.
>
> That loop — that's the entire agent. Everything else is making it reliable.

**The key:** The reader should feel like they *could have* invented this
themselves, given the same constraints.

---

## 7. Progressive Code Building

Show code the way Veritasium shows physical models — piece by piece, each addition
motivated by a problem with the current version.

**BEFORE (textbook):**
```python
async def agent_loop(messages, tools, model):
    while True:
        response = await model.create(messages=messages, tools=tools)
        if response.stop_reason == "end_turn":
            return response.content
        for tool_call in response.tool_calls:
            result = await execute_tool(tool_call)
            messages.append({"role": "tool", "content": result})
        messages.append({"role": "assistant", "content": response.content})
```

**AFTER (narrative):**
```python
# Version 1: The simplest possible agent
response = model.create(messages=[{"role": "user", "content": question}])
print(response.content)
# Works! But it can only answer from its training data.
```

> That handles general questions. But what if the user asks about *their* files?

```python
# Version 2: Add a tool
response = model.create(
    messages=[{"role": "user", "content": question}],
    tools=[read_file_tool]
)
# Now the model can REQUEST a file read. But who runs it?
```

> The model can ask for a tool, but someone needs to actually run it. That's us.

```python
# Version 3: The loop
while True:
    response = model.create(messages=messages, tools=tools)
    if response.stop_reason == "end_turn":
        break  # Model is done
    # Model asked for a tool — run it and feed the result back
    for tool_call in response.tool_calls:
        result = execute_tool(tool_call)
        messages.append({"role": "tool", "content": result})
```

> And that's an agent. The same loop that powers Claude Code, Codex, and every
> serious AI agent in production. The model thinks, acts, observes, repeats.

---

## 8. The Expert Witness

Bring in an outside voice to validate, add depth, or offer a different perspective.
In video, this is an interview. In text, it's a quoted passage with attribution.

**Pattern:**
> [Your explanation of the concept]
>
> [Expert name] from [affiliation] puts it this way: "[quote]"
>
> [Your commentary connecting the quote to the broader point]

**Example:**
> The instinct to "give the model everything" is almost universal among new
> agent builders. It feels safe — what if the model needs that information?
>
> Karpathy calls this "vibes-based context assembly" — throwing tokens at the
> model and hoping it figures out what's relevant. "The context window is not a
> bucket," he writes. "It's a budget."
>
> That single reframe — from bucket to budget — changes how you build agents.

---

## 9. Scene-Setting in Two Sentences

Historical context without becoming a history lesson. Two vivid sentences max,
then move on.

**Too much:**
> In the 1950s, computing was in its infancy. Computers filled entire rooms and
> were programmed with punch cards. The general public was skeptical of their
> utility, and the field of computer science didn't formally exist as an academic
> discipline. It was in this context that...

**Just right:**
> Amsterdam, 1956. Computers filled rooms, "programmer" wasn't a real profession,
> and Edsger Dijkstra needed to prove to a skeptical public that his machine
> was useful.

**The formula:** [Place, date]. [One sentence of context that creates the world].
[One sentence connecting to the person or problem].

---

## 10. The Emotional Stakes Reframe

Transform a dry technical motivation into an emotional one. Not "this is important
for performance" but "this is the difference between a product people love and one
they abandon."

**BEFORE:** "Reducing latency improves user experience."

**AFTER:** "When the agent takes 8 seconds to respond, the user doesn't think
'the model is processing.' They think 'it's broken.' They close the tab. They
don't come back. The difference between a 2-second response and an 8-second
response isn't 6 seconds of patience. It's the entire product."

---

## 11. The Constraint That Creates

Show how limitations drove innovation. Constraints aren't obstacles to the
story — they ARE the story.

**Example:**
> Dijkstra designed his algorithm without pencil and paper. This wasn't
> masochism — it was method. "One of the advantages of designing without pencil
> and paper is that you are almost forced to avoid all avoidable complexities."
>
> The constraint produced a simpler algorithm. And that simplicity is why it's
> still the foundation of every shortest-path system 70 years later.

**For AI topics:**
- Token limits forced the invention of RAG
- Stateless models forced the invention of context engineering
- Model unreliability forced defensive tool design
- Cost constraints forced model tiering

---

## 12. The Return

Circle back to the opening. The same question or scenario, but now the reader
has the knowledge to see it differently. This creates closure and reinforces
how much they've learned.

**Entropy example:**
> Opens: "What does the Earth get from the sun?"
> Closes: "Let's make use of the low entropy we've got while we can."
>
> Same topic. Completely different depth of understanding. The reader can feel
> the distance they've traveled.

**For AI agent content:**
> Open a chapter on context engineering with: "Why do AI agents hallucinate?"
> Close with: "They don't hallucinate because they're stupid. They hallucinate
> because we showed them the wrong things. The model is only as good as the
> context we build for it. And now you know how to build it well."
