---
name: veritasium-storytelling
description: >
  Write educational technical content using Veritasium-style narrative storytelling —
  the method that turns dense concepts into compelling stories people can't stop reading.
  Use this skill whenever creating or rewriting chapters, slides, or educational content
  for Agent YAP or any technical knowledge base. Trigger on: "write a chapter",
  "rewrite this content", "make this more engaging", "storytelling style", "Veritasium",
  "narrative", "make this interesting", "hook the reader", "origin story", content
  creation for any topic under content/, or when the user wants to transform dry
  technical material into something people actually want to read. Also use when the
  user says "cook" in a content context — they mean make it compelling.
---

# Veritasium-Style Storytelling for Technical Content

You are writing educational content that teaches hard technical concepts through
narrative. The goal: a reader finishes the chapter and feels like they just watched
a great documentary, not like they studied a textbook. They understood the concept
deeply because they followed the *thinking* that created it, not because someone
listed facts at them.

This method is extracted from Veritasium's approach: Derek Muller's videos
consistently make millions of people voluntarily learn thermodynamics, graph theory,
and quantum mechanics — not because they dumb things down, but because they make
the *journey* of understanding irresistible.

## The core principle

**People don't learn concepts. They learn stories about people who needed concepts.**

Entropy isn't interesting as a definition. It becomes unforgettable when you follow
a 17-year-old French kid who wrote a letter to Napoleon, got rejected, watched his
country fall, and then channeled that energy into figuring out why steam engines
waste heat — and accidentally discovered why time moves forward.

Dijkstra's algorithm isn't interesting as pseudocode. It becomes unforgettable when
you learn that the man who invented it couldn't put "programmer" on his marriage
license because the profession didn't exist yet, and he invented the algorithm in
20 minutes without pencil and paper while drinking coffee with his fiancée.

The concept enters through the story. The story enters through a person.

## The 10-beat narrative structure

Every chapter follows this arc. Not every beat needs equal weight — some chapters
lean heavier on certain beats. But the arc must be present.

Read `references/narrative-anatomy.md` for the full breakdown with examples.
Here's the skeleton:

### Beat 1: The Disorienting Hook
Open with a question or scenario that the reader thinks they can answer — but can't.
Create a **curiosity gap**: the distance between what they think they know and what's
actually true. This is the single most important paragraph in the chapter.

### Beat 2: The Human Entry Point
Introduce a real person with real stakes. Not "researchers discovered" — a specific
person, in a specific place, with a specific problem they cared about personally.

### Beat 3: The Problem as They Saw It
Frame the technical problem through that person's eyes and era. What were they
trying to do? What was at stake? What did they try first?

### Beat 4: The First Principles Build
Walk through the reasoning step by step, using the simplest possible concrete model.
Hot bar, cold bar, piston. Two small towns connected by a bridge. Start absurdly
simple — the complexity comes later.

### Beat 5: The Counterintuitive Reveal
The "aha" moment. Something the reader assumed is wrong, or a conclusion that
surprises. This is the emotional peak of the learning — the moment understanding
*clicks*. Every chapter must have at least one.

### Beat 6: Progressive Complexity
Each new concept builds on the one just established. Never introduce something
that doesn't connect to what came before. The reader is climbing a staircase,
not being handed a pile of bricks.

### Beat 7: The Scale Bridge
Take the principle from a toy model to the real world. 8 atoms → 80 atoms →
trillions. A 10-node graph → New York City → 64 million intersections. Make the
reader feel the scale shift.

### Beat 8: The Concrete Analogy
A physical, visceral metaphor that makes the abstract tangible. A Rubik's cube
for entropy. Tea and milk mixing. A 3D landscape for A* search heuristics. The
best analogies are ones the reader can picture with their eyes closed.

### Beat 9: The "So What" Connection
Why does this matter beyond the textbook? Connect the concept to the reader's
actual life or to something they already care about. Every Google Maps query.
Every living organism. The arrow of time itself.

### Beat 10: The Philosophical Landing
End with a thought that lingers. Often circles back to the opening question with
a deeper answer. Leave the reader with something to chew on — not a summary, but
a *perspective*.

## Writing techniques

Read `references/technique-toolkit.md` for the full technique library. The
essential ones:

### The Wrong Answer Technique
Present what most people believe first. Let the reader commit to it mentally.
Then reveal why it's wrong. This creates cognitive dissonance — the brain's
favorite state for learning.

> "What does the Earth get from the sun? If you said energy, you're in good
> company. And you're wrong — or at least, you're missing the real answer."

### The Inventor's Voice
Use direct quotes from the creators. First person hits differently than third
person. "I designed it without pencil and paper" lands harder than "He designed
it without pencil and paper." When you have quotes, use them. When you don't
have exact quotes, paraphrase clearly but keep the personal framing.

### Numbers That Wow
Specific numbers create scale shock. Not "there are many possible routes" but
"there are 10^220 possible routes — testing a billion per second would take
10^200 years." Not "entropy was low" but "the early universe had
0.000000000000003% of its current entropy."

### The "But Wait" Pivot
Just when the reader thinks they understand, open a new layer. "So Dijkstra's
algorithm is fast enough, right? Well, not if you're one of millions of people
asking at once..." This keeps pages turning.

### Concrete → Abstract → Concrete Cycles
Never stay abstract for more than two paragraphs. Every abstraction must be
preceded by a concrete example and followed by another. The reader's understanding
oscillates between feeling and knowing.

## Adapting for written technical content (not video)

Video has demonstrations, interviews, and visuals. Written content compensates:

| Video technique | Written adaptation |
|---|---|
| Street interviews showing confusion | "Most engineers assume..." / "Ask five developers and you'll get..." |
| Physical demonstrations | Diagrams (Mermaid), thought experiments, code snippets |
| On-screen animations | Progressive code examples that build on each other |
| Expert interviews | Quoted passages from blog posts, talks, papers — with attribution |
| B-roll of historical places | Brief historical scene-setting (2-3 vivid sentences, not a history essay) |
| Scale animations | Tables or lists that show the same principle at different scales |

## Adapting for Agent YAP specifically

Agent YAP chapters are markdown files that get split into slides. Each `##` heading
becomes a slide boundary. This means:

1. **Each section (slide) must be a complete narrative beat** — it needs to work as
   a standalone moment while also flowing into the next. Think of each ## section as
   a scene in a documentary, not a topic in a textbook.

2. **The hook must be in the first section** before the first ## — this is what the
   reader sees first and decides whether to keep reading.

3. **Review questions should test understanding of the *story***, not just recall.
   Instead of "What is entropy?" → "Why can't a perfect heat engine be 100%
   efficient, even with zero friction?" The question should make the reader replay
   the reasoning, not recite a definition.

4. **Mermaid diagrams are the visual language** — use them for flows, architectures,
   sequences. They're the closest thing to Veritasium's animations in a markdown
   context.

5. **Code snippets are demonstrations** — when you show code, it should be a
   "watch this" moment. Build it up piece by piece like Veritasium builds a
   physical model. Don't dump a complete implementation; show the evolution.

## Chapter structure template

```markdown
# Chapter N: [Title That Hints at the Story, Not Just the Topic]

[THE HOOK — 2-4 paragraphs. A question, a scenario, a misconception revealed.
The reader must feel a gap between what they assumed and what's true.
No technical jargon yet. Just a human-scale problem.]

## [Scene 1: The Person and Their Problem]

[Introduce the inventor/creator/team. Specific place, specific time, specific
personal stakes. Why did THEY care about this problem?]

## [Scene 2: The First Attempt / Naive Approach]

[What's the obvious solution? Why doesn't it work? Show it concretely.
This is where the reader realizes the problem is harder than it looks.]

## [Scene 3: The Insight]

[The counterintuitive reveal. Walk through the reasoning that led to the
breakthrough. Use the simplest possible model. This is the heart of the chapter.]

## [Scene 4: Building on the Insight]

[Now layer in complexity. Each new piece connects to what was just established.
Progressive disclosure — the reader earns each level.]

## [Scene 5: At Scale / In the Real World]

[Bridge from toy model to production reality. Show the same principle operating
in real systems the reader uses or builds.]

## [Scene 6: Why It Matters / The Bigger Picture]

[Connect to something larger. The reader's daily work. The industry. The future.
End with a thought that lingers.]

## Review

[Questions that test reasoning and story comprehension, not definition recall.]
```

## Quality checklist

Before considering content done, verify:

- [ ] **The first paragraph creates a curiosity gap** — would someone who "already knows this topic" still want to keep reading?
- [ ] **There is at least one real person** with a name, a place, and a personal stake
- [ ] **There is at least one counterintuitive reveal** — something that surprises
- [ ] **No section stays abstract for more than two paragraphs** without a concrete example
- [ ] **The complexity builds progressively** — no concept appears before its prerequisites
- [ ] **There is a scale bridge** — from simple model to real-world system
- [ ] **The ending circles back** to the opening or leaves a thought that lingers
- [ ] **Technical accuracy is preserved** — storytelling never distorts the concepts
- [ ] **The reader can follow without prior expertise** in this specific topic (general technical literacy is fine)
- [ ] **Each ## section works as a standalone scene** while flowing into the next

## What this skill is NOT

- Not "dumbing down." The technical depth should be *equal to or greater than* a
  textbook treatment. The story is a vehicle for deeper understanding, not shallower.
- Not fiction. Every historical detail should be real or clearly marked as
  illustrative. Don't invent quotes or events.
- Not decoration. The narrative isn't sprinkled on top of existing content. The
  content is *restructured around* the narrative. The story IS the explanation.

## The clarity layer — mandatory second pass (Bhadani rulebook)

This skill gives you the **macro**: the narrative architecture that makes a
chapter compelling (hook, human entry, arc, reveal). It does not govern the
**micro**: whether every individual sentence is understandable to a reader
meeting this jargon for the first time. That is a separate, equally mandatory
discipline.

**After the story is structured, run the whole draft through the Bhadani
clarity layer:** `references/bhadani-explanation-rulebook.md`. It is the
sentence-and-paragraph discipline that guarantees no unexplained term, no
unmotivated concept, and no visible scaffolding ever reaches the reader.

Think of it as two altitudes on the same draft:

| Layer | Skill / file | Governs | The failure it prevents |
|---|---|---|---|
| **Macro** (structure) | this skill | Chapter arc, hook, story, reveal | Boring, textbook-flat content |
| **Micro** (clarity) | `references/bhadani-explanation-rulebook.md` | Every sentence: jargon, definitions, analogies, hidden scaffolding | Compelling story the reader still can't follow |

The two reinforce each other. This skill already says "never decoration —
the story IS the explanation"; Bhadani's **Rule 0 (hide the machinery)** is
the same instinct at sentence level: never write a sentence whose only job is
to announce the next one. A well-told story that still drops an undefined term
in paragraph two has failed both skills at once.

**The single non-negotiable carried over from Bhadani Rule 0:** motivation,
definitions, and analogies are woven in casually — the term arrives *after*
the plain-language explanation, never announced with "Let's define," "To use
an analogy," or "It's important to note." Run the banned-phrase check in the
rulebook against every draft.

### House overrides (Agent YAP wins where they differ)

The rulebook was written for a general beginner audience. In this repo, adapt it:

- **"Beginner" means "new to *this specific topic*,"** not non-technical. The
  audience is practitioners (see the `context` skill). Preserve full technical
  depth — Bhadani's clarity discipline makes depth *accessible*, it never
  dumps it. This matches this skill's own rule: depth ≥ textbook.
- **No em dashes.** The repo's #1 content rule overrides any em-dash usage in
  the rulebook's own examples. Use commas, parentheses, colons, or a rewrite.
- **Analogies come from the reader's world** — for this audience that's
  engineering, AI, distributed systems, everyday computing — not consumer
  scenarios, unless the consumer scenario genuinely maps better.
- The rulebook file itself is a style guide, not published content, so its own
  em dashes and formatting are irrelevant — only the *rules* transfer.

## Reference files

- `references/narrative-anatomy.md` — Deep breakdown of all 10 beats with
  extended examples and common mistakes
- `references/technique-toolkit.md` — Complete technique library with before/after
  examples showing how to transform textbook prose into narrative
- `references/agent-yap-stories.md` — Curated origin stories, inventor moments,
  and "aha" narratives for common AI agent engineering topics (context engineering,
  tool design, the agent loop, RAG, etc.) — use these as starting material
- `references/bhadani-explanation-rulebook.md` — **The clarity layer (mandatory
  second pass).** Sentence-level discipline: just-in-time definitions, hidden
  scaffolding (Rule 0), concrete analogies, when-to-use decision rules, and the
  banned-phrase list. Every draft passes through this before it ships.
