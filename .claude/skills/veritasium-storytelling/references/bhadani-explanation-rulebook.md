# The Bhadani Explanation Rulebook

A style guide for writing technical explanations that beginners can actually understand — reverse-engineered from Shivam Bhadani's "System Design for Beginners" teaching style.

Give this file to any writing or coding agent. Its job: **explain any technical topic so that a complete beginner finishes each paragraph without being confused, and finishes the whole piece feeling like the topic was easy.**

---

## The Core Philosophy

> Never let an unexplained word or an unmotivated concept pass in front of the reader.

Every hard idea is made easy by doing three things relentlessly:
1. **Explain the "why" before the "what."**
2. **Define every new term the instant it appears** — before continuing the sentence's thought.
3. **Anchor every abstract idea to a concrete, everyday example.**

If a rule below ever conflicts with "will a beginner understand this?", the beginner wins.

---

## Rule 0 — Hide the machinery (READ THIS FIRST — it governs every other rule)

The techniques below are **invisible scaffolding**, not visible labels. A human writer slides the "why," the definition, and the analogy in so casually that the reader never notices a technique was used at all — it just feels like a knowledgeable friend explaining. An LLM's default failure is to **announce the structure** and expose the seams, which makes the writing feel formulaic and robotic.

**The reader must never be able to tell the text was written against a rulebook.**

### The seams you must hide

**1. Don't label the "why" — dramatize it as a scenario.**
Bhadani almost never writes a heading that says "Here is the motivation." He drops you into a situation you recognize:
- ✅ *"You often see that whenever someone launches their website and suddenly traffic increases, their website crashes. To prevent this, we need to scale."*
- ❌ *"Let's first understand **why** scaling is important. The motivation behind scaling is..."*

The "why" is doing its job precisely because it doesn't wear a "why" name tag. (Occasional genuine "Why do we need X?" section headers are fine — they read as a real question a reader would ask. The failure is signposting *every* motivation, mid-paragraph, with meta-language.)

**2. Don't announce a definition — just state it in passing.**
- ✅ *"...it can't communicate with A and C. One individual server that is part of the system is called a Node."*
- ❌ *"Now, let me **define** an important term for you. The **definition** of a Node is as follows:"*

**3. Don't announce an analogy — just make the comparison.**
- ✅ *"You can think of S3 as Google Drive, where you store all your files."*
- ❌ *"To help you understand this, let me use **an analogy**. Think of it **like** a real-world scenario where..."*

**4. Don't bookend with meta-commentary.**
Never explain what you just did or what you're about to do.
- ❌ *"This example perfectly illustrates the concept of..."*, *"As you can see from the above, this demonstrates why..."*, *"Let's break this down step by step."*, *"Now that we understand X, let's move on to Y."*

### Banned LLM tells (the phrases that expose the machinery)

Do not use these. They are the tell-tale fingerprints of generated explanation:

- "Let's break this down" / "Let's dive in" / "Let's unpack this"
- "At its core," / "In essence," / "Essentially," / "Fundamentally,"
- "Think of it like..." *as a stock opener* (a plain "You can think of X as Y" is fine — the stiffness is the throat-clearing wind-up)
- "Imagine a scenario where..." (just describe the scenario directly)
- "It's important to note that" / "It's worth noting that"
- "This is a great example of..." / "This perfectly illustrates..."
- "But here's the thing:" / "Here's the kicker:"
- "Now that we've covered X, let's turn to Y."
- Any sentence whose only job is to name the technique being used ("To use an analogy," "As a definition," "The key takeaway here is").

### How the human keeps it casual (imitate these)

- **Plain connective words** carry the flow instead of section-labels: *"Now,"*, *"So,"*, *"But,"*, *"Suppose,"*, *"Let..."*, *"For this,"*, *"In that situation,"*.
- **The scenario comes first, the term comes after.** Describe the situation in plain words, and only then attach the technical name to it — the reader has already understood it before the jargon lands. *"All the clients hit one machine that routes traffic to the least busy server. This machine is called a load balancer."*
- **Vary how motivation is introduced.** Sometimes it's a scenario, sometimes a rhetorical question, sometimes a consequence ("...then your website may crash"). Never the same wind-up twice in a row.
- **Trust the reader.** Once something is explained, don't re-summarize that you explained it. Move on the way a person talking would.

### The test
Read the draft and ask: *"Could a reader point to a sentence and say 'this sentence only exists to announce the next sentence'?"* If yes, delete that sentence and let the content speak. Good explanation has **no throat-clearing** — every sentence carries real information, and the structure is felt, not seen.

---

## The 12 Rules

> Apply all 12 through the lens of Rule 0: use the technique, hide the label.

### Rule 1 — Define every new term the moment it appears (Just-in-Time Definitions)

The instant a new term, acronym, or jargon word shows up, stop and define it in one plain sentence. Then continue. Never use a term in paragraph 1 that you only define in paragraph 4.

**Pattern:** `<Introduce term> is <plain-language definition>. <Continue the topic>.`

**Examples from the source:**
- "One individual server that is part of the overall distributed system is called **Node**."
- "This binary representation is called **Blob** (Binary Large Object)."
- "The node (server) which processes the write request is called the **Master Node**."
- "**Cache Hit** means data is present in the cache. **Cache Miss** means data is not present in the cache."

**Rules for the definition itself:**
- One sentence. Plain words. No other jargon inside the definition (or define that too).
- Always expand acronyms on first use: "DNS (Domain Name Service)", "RTT (Round Trip Time)".
- Bold or emphasize the term being defined so the eye catches it.

**Do NOT:** assume "everyone knows what X is." Even for common terms, add: *"Many of you might already know what a server is, but this blog is for beginners, so I am explaining it."*

---

### Rule 2 — Lead with "Why," then "What," then "How"

Open almost every section with the motivation — the problem this concept solves — before explaining the concept itself. A reader who knows *why* something exists learns *what* it is far faster.

Use explicit "Why" headings:
- "Why study System Design?"
- "Why do we need the Load Balancer?"
- "Why do we break our app into microservices?"
- "Why do we make the system distributed?"

**Pattern per concept:**
1. **Why** — the pain / the problem ("your website may crash because...").
2. **What** — the concept that solves it, defined plainly.
3. **How** — the mechanism, step by step.

---

### Rule 3 — Anchor every abstract idea to an everyday analogy

For each abstract concept, give one relatable analogy from ordinary life or from something the target reader already does. The analogy must map cleanly onto the concept.

**Examples from the source:**
- Server choking under load → *"a cheap mobile with less RAM... hangs by using heavy games."*
- Throughput vs latency → *"Latency: time for one car to travel. Throughput: number of cars on a highway per hour."*
- Blob Storage (S3) → *"You can think of S3 as Google Drive, where you store all your files."*
- Redis RAM limit → *"if you did coding in leetcode... sometimes you get 'Memory Limit Exceeded'."*
- Multiple apps on a server found by port → *"Like on your laptop, there are multiple applications running at the same time, such as Google Chrome, Netflix, etc."*

**Rules:**
- Pick analogies from the reader's world (phones, cars, drive, games), not from more jargon.
- Keep the analogy short — one or two sentences — then return to the real concept.
- Tailor analogies to the audience. (For QuicShop docs: use sellers, orders, carts, catalogs, payments.)

---

### Rule 4 — Anticipate the reader's next question and answer it immediately

Predict the exact doubt a beginner will have at that moment, voice it in their words, then answer it. This keeps the reader from getting stuck.

**Patterns:**
- "You may be wondering how we know which table to query from... Don't worry, you can again hit the same query."
- "One question you might be thinking is that if Redis is so fast, then why use a database? **Ans)** Redis stores data in RAM, and RAM has very little memory..."
- "Why can we only achieve CP or AP and not CAP?"
- "Why not choose CA?"

Use a visible `Ans)` or a rhetorical question-heading so the Q&A structure is obvious. Reassure explicitly with phrases like **"Don't worry"** when the reader is likely to feel overwhelmed.

---

### Rule 5 — Use concrete, named examples — never stay abstract

Every concept gets a worked example with real, recognizable entities and specific numbers. Abstractions alone don't stick; "Twitter with 100 million users" does.

**Examples from the source:**
- Estimation done on **Twitter** (100M DAU, 10 tweets/user, 200 chars/tweet, 2MB/photo).
- Master-master split as **"North India DB and South India DB."**
- Caching explained via **a blog website's `/blogs` route** (800ms → 20ms).
- Cache-write example via a **Codeforces contest rank list.**

**Rules:**
- Name a real product/domain the reader knows (Twitter, e-commerce, banking, a blog).
- Use specific numbers, not "some" or "a lot."
- Walk the example step by step, showing the arithmetic.

---

### Rule 6 — Show the math / mechanism step by step, out loud

When calculating or tracing a process, show every intermediate step. Never jump from problem to answer. Reveal approximations explicitly so the reader learns the technique, not just the result.

**Example from the source (storage estimation):**
```
=> (Size of one tweet) * (Total tweets) + (Size of photo) * (tweets with photo)
=> (500 bytes * 1 billion) + (2MB * 100 million)
Take approx to make calculation easy:
=> (1000 bytes * 1 billion) + (2MB * 500 million)
=> 1 TB + 1 PB
=> approx 1 PB   (ignore 1TB, it's tiny next to 1PB)
```

Narrate the reasoning between steps ("Take approx to make calculation easy", "ignore 1TB as it is very small"). The reader should be able to redo it themselves.

---

### Rule 7 — Always flag hypothetical numbers as hypothetical

Whenever you invent numbers to illustrate, say so — so beginners don't memorize them as facts.

**Examples from the source:**
- "(These are hypothetical numbers)."
- "Note: These numbers are all hypothetical to make you understand the topic. If you want the actual threshold, do Load Testing."
- "Suppose one EC2 machine can serve 1000 users without choking."

Use **"Suppose..."** and **"Let..."** to introduce illustrative values, and add a one-line disclaimer after big invented figures.

---

### Rule 8 — Build incrementally; warn against over-engineering

Introduce solutions in order of increasing complexity, and tell the reader to only go as far as they need. This teaches judgment, not just facts.

**Examples from the source:**
- "We will be scaling our database step by step... if we have only 10k users, then scaling it to support 10 million is a waste. It's over-engineering."
- "First, always prefer vertical scaling. It's easy... If you hit the bottleneck here then only do the below things."
- "Sharding is a very complex thing. Try to avoid this in practical life and only do this when all the above things are not sufficient."

Each new technique should start with the sentence: *"Use this when [the previous, simpler thing] is no longer enough."*

---

### Rule 9 — Give decision rules: "When to use which"

Beginners don't just need to know what things are — they need to know when to pick each. End comparison-heavy topics with an explicit decision guide mapping situation → choice, with an example per choice.

**Examples from the source:**
- "When to use which database?" — NoSQL for unstructured data (reviews), SQL for structured (customer accounts), SQL for integrity (payments), NoSQL for scale (posts/likes).
- "What to choose, CP or AP? — For banking/payments go with consistency. For social media go with availability."
- "Sum up of Database Scaling" — a prioritized rule list.

**Pattern:** `When <situation>, use <choice>. Ex: <concrete case>.`

---

### Rule 10 — Summarize with short, memorable rules of thumb

After a dense section, collapse it into a short bulleted list of takeaways or a one-line contrast the reader can carry away.

**Examples from the source:**
- "In short: Latency measures the time to process a single request. Throughput measures how many requests can be handled concurrently."
- "Availability is continued serving when node failure happens. Partition Tolerance is continued serving when network failures happen."
- The "Sum up of Database Scaling" bullet list.

Keep summaries parallel in structure (same sentence shape for each item) so the contrast is instant.

---

### Rule 11 — Keep the tone conversational, direct, and encouraging

Write to one person as "you." Use plain, short sentences. Be warm and reassuring, especially at hard moments.

- Direct address: "You often see that...", "Suppose you have a database server..."
- Reassurance: "Don't worry, you can again hit the same query.", "You don't need to worry about anything."
- Honesty about difficulty: "Sharding is a very complex thing.", "This was a very short and simple explanation about indexing."
- Plain words over fancy ones. Contractions are fine ("it's", "you'll").

**Avoid:** dense academic phrasing, passive voice, and long multi-clause sentences. If a sentence has three commas, split it.

---

### Rule 12 — Make it practical and hands-on

Wherever possible, move from theory to something the reader can *do*: real commands, code snippets, or an exercise. This is what separates "read and forget" from "understand."

**Examples from the source:**
- Runnable command: `docker run -d --name redis-stack -p 6379:6379 ... redis/redis-stack:latest`
- Real Redis commands (`SET`, `GET`, `LPUSH`, `RPOP`) with what each does.
- Recurring "**Exercise for you:**" prompts ("code your own load balancer from scratch").
- Links to hands-on follow-ups.

End major sections with an **"Exercise for you"** or a "try this yourself" nudge when the topic is something the reader could build.

---

## Reusable Templates

### Template A — Introducing a new concept
```
### Why do we need <Concept>?
<One paragraph on the problem / pain the reader would hit without it. Use "you".>

<Concept> is <one-sentence plain definition>.   ← Rule 1

<Everyday analogy that maps onto it.>   ← Rule 3

How it works:
1. <step>
2. <step>
3. <step>

Example: <named, concrete example with specific numbers>.   ← Rule 5

<You may be wondering: "<predicted doubt>?" Ans) <answer>.>   ← Rule 4

Use <Concept> when <situation>. Avoid it / keep it simpler when <situation>.   ← Rules 8 & 9
```

### Template B — Comparing options (X vs Y)
```
X
- <trait> ... <trait>
- Ex: <product/tool>

Y
- <trait> ... <trait>
- Ex: <product/tool>

When to use which?
- When <situation>, go with X. Ex: <case>.
- When <situation>, go with Y. Ex: <case>.
```

### Template C — A worked numeric estimation
```
Suppose <entity> has <number> and <assumption>.   (numbers are illustrative)   ← Rule 7
Step 1: <calculation> = <result>
Step 2: <calculation> = <result>
Take approx to make calculation easy: <approximation + why>   ← Rule 6
Result: <final answer>
```

---

## Worked Example — same content, machinery visible vs hidden

The task: explain a **load balancer** to a beginner.

### ❌ LLM-mechanical (seams exposed — do NOT write like this)

> **Why do we need a Load Balancer?**
>
> Let's first understand the motivation. It's important to note that when traffic grows, a single server can't cope. This is where load balancing comes in.
>
> **What is a Load Balancer?** At its core, a load balancer is essentially a component that distributes traffic. Think of it like a traffic cop. To use an analogy, imagine a scenario where many cars arrive at an intersection...
>
> Now that we understand what a load balancer is, let's break down how it works, step by step.

Every heading announces the technique. "Let's first understand," "It's important to note," "At its core," "essentially," "To use an analogy," "imagine a scenario," "Now that we understand... let's break down." The reader feels the template.

### ✅ Bhadani-woven (machinery hidden — write like this)

> You often see that when a website suddenly gets popular, it crashes. One server can only handle so many users at once — push more traffic at it and it chokes, just like a cheap phone hangs when you open too many apps. So we add more servers and split the load between them.
>
> But now there's a problem. Say we have 3 servers. The client on their laptop has no idea our system has 3 machines — we can't hand out 3 different addresses and expect the user to pick one. So we put one machine in front of all of them. Every request hits this machine, and it forwards each one to whichever server is least busy. This machine is called a **load balancer**.
>
> How does it decide which server to pick? That's where load balancing algorithms come in...

Same information, same order (why → what → how), same analogy. But nothing is labeled. The "why" is a story about a crashing website. The definition arrives *after* you already understand the thing ("This machine is called a load balancer"). The analogy ("like a cheap phone") is dropped in mid-sentence with no wind-up. The transition to "how" is a plain question the reader is already asking.

**The difference is not the content — it's that the second version never tells you what it's doing.**

---

## Quick Checklist (run before shipping any explanation)

- [ ] Does every new term get defined the first time it appears, in one plain sentence?
- [ ] Does each concept start with *why it exists* before *what it is*?
- [ ] Is there at least one everyday analogy per abstract idea?
- [ ] Did I voice and answer the reader's most likely doubt?
- [ ] Is there a named, concrete example with specific numbers?
- [ ] For any calculation, did I show every step and label approximations?
- [ ] Are invented numbers flagged as hypothetical?
- [ ] Do I tell the reader *when* to use this vs. simpler alternatives (no over-engineering)?
- [ ] Is there a short rule-of-thumb summary?
- [ ] Is the tone "you", short sentences, reassuring at hard spots?
- [ ] Is there something the reader can actually run, code, or try?
- [ ] **(Rule 0) Are the seams hidden?** No labeled "here's the motivation / definition / analogy," no banned LLM tells, no throat-clearing sentences whose only job is to announce the next sentence?
- [ ] **(Rule 0) Does the term arrive *after* the plain-language explanation**, not before it?
- [ ] **(Rule 0)** If I removed every heading, would the why/what/how still flow naturally as spoken explanation?

---

## Anti-Patterns (never do these)

- ❌ Using an acronym or term before defining it.
- ❌ Explaining *what* something is without *why* it matters.
- ❌ Staying abstract — no example, no numbers, no analogy.
- ❌ Jumping from problem to final answer with the math hidden.
- ❌ Presenting the most complex solution first as if it's the default.
- ❌ Long, multi-clause academic sentences and passive voice.
- ❌ Presenting invented numbers as if they were measured facts.
- ❌ Assuming the reader already knows something ("obviously", "as everyone knows").

---

## One-line summary of the whole style

**Explain *why* first, define *every* new word on the spot, anchor it to something the reader already knows, show the working step by step, tell them when to use it, and give them something to try.**
