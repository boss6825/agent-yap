# Chapter 1: From Naive RAG to Agentic RAG: The Evolution

## Why RAG exists at all

A language model only knows what it learned during training. That knowledge is frozen at a point in time and can be incomplete or outdated. [RAG](../glossary/Glossary.md#rag-retrieval-augmented-generation), Retrieval-Augmented Generation, fixes this by retrieving relevant external information at the moment of the query and feeding it into the model before it answers. The result is an answer that is current and [grounded](../glossary/Glossary.md#grounding) in real sources rather than invented from memory.

The survey describes RAG as having three core components, and it is worth fixing these in mind because everything later builds on them:

- Retrieval: querying external sources (knowledge bases, APIs, [vector databases](../glossary/Glossary.md#vector-database)) to find relevant information.
- Augmentation: processing and summarizing the retrieved data to fit the query.
- Generation: combining the retrieved information with the model's own knowledge to produce the answer.

## The five stages of RAG

The heart of this chapter is the survey's account of how RAG evolved through five paradigms. Reading them in order shows a clear trajectory: from dumb keyword lookup toward systems that reason about their own retrieval.

### Naive RAG

The original, simplest form. It uses keyword-based retrieval methods like [TF-IDF and BM25](../glossary/Glossary.md#bm25-and-tf-idf) to fetch documents from a static dataset, then hands them to the model. It follows a plain "retrieve then read" workflow.

Its strengths are simplicity and ease of implementation, which made it a useful proof of concept. But its limitations are real: it lacks contextual awareness (matching words, not meaning, so "car" misses "automobile"), it produces fragmented or generic outputs because it does little preprocessing, and it scales poorly because keyword matching struggles to find the most relevant information in large datasets.

### Advanced RAG

This stage adds semantic understanding. Instead of matching keywords, it uses [dense retrieval](../glossary/Glossary.md#dense-retrieval-and-sparse-retrieval) (representing queries and documents as [embeddings](../glossary/Glossary.md#embedding) and matching by meaning), [re-ranking](../glossary/Glossary.md#re-ranking) (reordering results so the most relevant come first), and iterative or [multi-hop](../glossary/Glossary.md#multi-hop-reasoning) retrieval (reasoning across several documents). This makes it suitable for tasks needing precision and nuance, like research synthesis. The costs are higher computation and still-limited scalability on very large datasets or multi-step queries.

### Modular RAG

This stage breaks the pipeline into independent, reusable components that can be swapped and reconfigured. Its key innovations are hybrid retrieval (combining sparse keyword methods with dense semantic ones to cover more query types), tool integration (pulling in external APIs, databases, or computation), and composable pipelines (retrievers and generators can be replaced or rearranged independently). The survey gives a finance example: a modular system might fetch live stock prices via an API, analyze historical trends with dense retrieval, and generate investment insights with a tailored model. This flexibility makes it suited to complex, multi-domain tasks.

### Graph RAG

This stage adds [knowledge graphs](../glossary/Glossary.md#knowledge-graph-and-zettelkasten) to the mix. By storing information as connected entities, Graph RAG can reason over relationships and hierarchies, which strongly helps [multi-hop reasoning](../glossary/Glossary.md#multi-hop-reasoning) and reduces [hallucination](../glossary/Glossary.md#hallucination) by following real connections. Its limitations are scalability (graphs get expensive to maintain at size), data dependency (it needs high-quality graph data), and integration complexity (combining structured graph data with unstructured retrieval is hard). It suits domains where relationships matter, like healthcare diagnostics and legal research.

### Agentic RAG

The final stage, and the subject of the whole survey. It introduces autonomous [agents](../glossary/Glossary.md#agent) into the retrieval process. Where every earlier stage retrieves in a fixed way, agentic RAG makes retrieval a decision: agents evaluate the query, choose retrieval strategies, retrieve iteratively with feedback loops, and orchestrate the workflow dynamically. Its strengths are adaptability to real-time changes, scalability across multiple domains, and higher accuracy. Its challenges are the familiar costs of agents: coordination complexity, computational overhead from running multiple agents, and scalability strain under high query volumes.

## Why traditional RAG was not enough

The survey spends time on the specific limitations that pushed the field toward agentic RAG. These are worth understanding because each one is a problem an agent is meant to solve.

Contextual integration. Even when traditional RAG retrieves the right documents, it often fails to weave them into a coherent answer. The survey's example: a query about the latest Alzheimer's research and its implications for early-stage treatment might retrieve relevant papers, but a static system fails to synthesize them into an explanation connecting new treatments to specific patient scenarios.

Multi-step reasoning. Many real questions need [multi-hop](../glossary/Glossary.md#multi-hop-reasoning) reasoning, retrieving and synthesizing across several steps where each depends on the last. Traditional RAG cannot refine its retrieval based on intermediate insights. The example: a question about applying European renewable energy policy lessons to developing nations, including economic impacts, requires orchestrating policy data, regional context, and economic analysis, which a static pipeline cannot stitch together.

Scalability and latency. As the volume of external data grows, querying and ranking become computationally heavy, causing latency. In time-sensitive settings like financial analytics or live support, that delay undermines the system's usefulness.

## The paradigm shift

The survey frames agentic RAG as a genuine paradigm shift rather than just another increment. By adding autonomous agents capable of dynamic decision-making, iterative reasoning, and adaptive retrieval, agentic RAG keeps the modularity of the earlier paradigms while overcoming their rigidity. The promise is to handle complex, multi-domain, multi-step tasks with better precision, and even to reduce latency through optimized workflows rather than brute-force querying.

The key mental shift to carry into the next chapters: in traditional RAG, retrieval is something that happens to the system (a fixed step). In agentic RAG, retrieval is something the system decides and controls.

## Key takeaways

- RAG retrieves external information at query time and feeds it to the model, keeping answers current and grounded; its three parts are retrieval, augmentation, and generation.
- RAG evolved through five stages: Naive (keyword lookup), Advanced (semantic and re-ranking), Modular (swappable components and hybrid retrieval), Graph (relationship reasoning), and Agentic (autonomous agents controlling retrieval).
- Traditional RAG struggles with contextual integration, multi-step reasoning, and scalability or latency.
- Agentic RAG's shift is making retrieval an active, reasoned decision rather than a fixed step.

## Review

**Quick Check**

1. What are the three core components of RAG as the survey describes it?
   - A) Retrieval, ranking, and generation
   - B) Retrieval, augmentation, and generation
   - C) Chunking, embedding, and indexing
   - D) Planning, tool use, and reflection
   <details><summary>Answer</summary>B) Retrieval (querying external sources), augmentation (processing and summarizing the retrieved data to fit the query), and generation (combining retrieved information with the model's own knowledge).</details>

2. Which failure is characteristic of Naive RAG's keyword retrieval?
   - A) Knowledge graphs become too expensive to maintain
   - B) It lacks contextual awareness — it matches words rather than meaning, so "car" misses "automobile"
   - C) Coordinating multiple agents introduces latency
   - D) Re-ranking reorders results incorrectly
   <details><summary>Answer</summary>B) Naive RAG uses TF-IDF and BM25 style keyword matching, so it matches words and not meaning. It also produces fragmented or generic output because it does little preprocessing, and it scales poorly.</details>

3. What does the Advanced RAG stage add on top of Naive RAG?
   - A) Knowledge graphs of connected entities
   - B) Autonomous agents that decide when to retrieve
   - C) Dense retrieval, re-ranking, and iterative or multi-hop retrieval
   - D) Swappable components and hybrid retrieval
   <details><summary>Answer</summary>C) Advanced RAG adds semantic understanding: dense retrieval via embeddings, re-ranking so the most relevant results come first, and iterative or multi-hop retrieval across several documents. The cost is higher computation and still-limited scalability.</details>

4. In the survey's finance example, what makes the system *Modular* RAG?
   - A) A knowledge graph links companies to their subsidiaries
   - B) It fetches live stock prices via an API, analyzes historical trends with dense retrieval, and generates insights with a tailored model — independent components combined
   - C) One agent critiques another agent's investment thesis
   - D) A classifier decides how much retrieval effort each query deserves
   <details><summary>Answer</summary>B) Modular RAG breaks the pipeline into independent, reusable components — hybrid retrieval, tool integration, and composable pipelines — so retrievers and generators can be swapped or rearranged independently.</details>

5. A clinician asks about the latest Alzheimer's research and what it implies for early-stage treatment. The system retrieves exactly the right papers, but the answer reads as a disjointed list of abstracts rather than an explanation tied to patient scenarios. Which traditional-RAG limitation is this?
   - A) Scalability and latency
   - B) Contextual integration — retrieval succeeded, but the static system failed to synthesize the sources into a coherent answer
   - C) Keyword mismatch between query and documents
   - D) Data dependency on high-quality graph data
   <details><summary>Answer</summary>B) Contextual integration. This is the survey's own example: even when traditional RAG retrieves the right documents, it often fails to weave them into an explanation connecting new treatments to specific patient scenarios.</details>

**More Questions**

6. What limitations does the chapter attribute to Graph RAG?
   - A) Poor semantic matching and no re-ranking
   - B) Scalability (graphs get expensive at size), data dependency (it needs high-quality graph data), and integration complexity (mixing structured graph data with unstructured retrieval)
   - C) Coordination complexity between competing agents
   - D) It cannot support multi-hop reasoning
   <details><summary>Answer</summary>B) Those three. Its payoff is reasoning over relationships and hierarchies, which helps multi-hop reasoning and reduces hallucination by following real connections — which is why it suits healthcare diagnostics and legal research.</details>

7. What is the key mental shift the chapter says to carry forward about agentic RAG?
   - A) Retrieval moves from keyword matching to embeddings
   - B) Retrieval moves from the database layer into the model's weights
   - C) In traditional RAG, retrieval is something that happens to the system as a fixed step; in agentic RAG it is something the system decides and controls
   - D) Generation becomes optional once retrieval is good enough
   <details><summary>Answer</summary>C) Agents evaluate the query, choose retrieval strategies, retrieve iteratively with feedback, and orchestrate the workflow dynamically. Retrieval becomes a decision rather than a fixed step.</details>

8. Which set of challenges does the chapter list for agentic RAG?
   - A) Keyword mismatch, fragmented output, and poor preprocessing
   - B) Coordination complexity, computational overhead from running multiple agents, and scalability strain under high query volumes
   - C) Graph maintenance cost and data quality
   - D) Higher computation from re-ranking only
   <details><summary>Answer</summary>B) These are "the familiar costs of agents." Its strengths — adaptability to real-time changes, scalability across domains, and higher accuracy — are bought with those costs.</details>

9. Your live support assistant gives accurate answers, but since the knowledge base grew tenfold, querying and ranking take long enough that users give up. Which limitation is this, and what does the chapter claim agentic RAG can do about it?
   - A) Multi-step reasoning; agentic RAG adds more retrieval hops
   - B) Contextual integration; agentic RAG summarizes more aggressively
   - C) Scalability and latency; agentic RAG promises to reduce latency through optimized workflows rather than brute-force querying
   - D) Nothing can be done — agentic systems are always slower
   <details><summary>Answer</summary>C) Scalability and latency. The chapter notes that in time-sensitive settings like financial analytics or live support, delay undermines usefulness, and that agentic RAG's promise includes reducing latency via optimized workflows instead of brute-force querying.</details>

10. Which ordering matches the five paradigms as the chapter presents them?
    - A) Naive → Modular → Advanced → Agentic → Graph
    - B) Naive → Advanced → Modular → Graph → Agentic
    - C) Advanced → Naive → Graph → Modular → Agentic
    - D) Modular → Naive → Advanced → Agentic → Graph
    <details><summary>Answer</summary>B) The trajectory runs from dumb keyword lookup (Naive), to semantic matching and re-ranking (Advanced), to swappable components and hybrid retrieval (Modular), to relationship reasoning (Graph), to autonomous agents controlling retrieval (Agentic).</details>

**Coding Challenge**

*From keyword matching to meaning*

Write two retrievers over a small list of documents. `keyword_retrieve(query, docs)` returns every document that shares at least one word with the query — Naive RAG's "retrieve then read" behaviour. `semantic_retrieve(query, docs, synonyms)` first expands the query with known synonyms, then matches — a stand-in for Advanced RAG's dense retrieval. Show that a query for `"car"` misses a document that says `"automobile"` under the first retriever and finds it under the second.

<details>
<summary>Python Solution</summary>

```python
DOCS = [
    "the automobile was recalled for a brake defect",
    "the train timetable changed in March",
    "our car insurance premium went up",
]

SYNONYMS = {"car": {"automobile", "vehicle"}, "automobile": {"car", "vehicle"}}


def _words(text):
    return set(text.lower().split())


def keyword_retrieve(query, docs):
    # Naive RAG: match words, not meaning.
    q = _words(query)
    return [d for d in docs if q & _words(d)]


def semantic_retrieve(query, docs, synonyms):
    # Advanced RAG (stand-in): expand the query so meaning, not spelling, matches.
    q = set(_words(query))
    for w in list(q):
        q |= synonyms.get(w, set())
    return [d for d in docs if q & _words(d)]


print(keyword_retrieve("car", DOCS))
# ['our car insurance premium went up']   <- the automobile recall is missed

print(semantic_retrieve("car", DOCS, SYNONYMS))
# ['the automobile was recalled for a brake defect', 'our car insurance premium went up']
```

</details>

**Think About It**

1. The chapter's fix for a model whose knowledge is frozen isn't to teach the model more — it's to change what the model *reads* at the moment of the question. That sounds like a workaround. Why is it actually the stronger move?
   <details><summary>Show answer</summary>Because it moves knowledge out of the weights and into a system you can update independently. If the fact lives in the model, changing it means changing the model; if it lives in a retrievable source, changing it means editing a document. You also get something training can never give you: the answer is grounded in a real source rather than invented from memory, so a claim can be traced back to where it came from. That's why the chapter frames RAG's payoff as two things at once — currency and grounding — rather than just "the model knows more."</details>

2. Here's an apparent contradiction in the chapter. Agentic RAG's listed challenges include computational overhead from running multiple agents — yet its listed promise includes *reducing* latency. How can adding agents make a system both more expensive and faster?
   <details><summary>Show answer</summary>Because the two costs are paid in different places. Traditional pipelines pay per query for brute-force querying and ranking over an ever-growing corpus, and that bill rises with data volume no matter how simple the question. An agent that reasons about the query first can skip retrieval it doesn't need, pick one cheap source instead of scanning everything, or stop as soon as it has enough — an optimized workflow rather than a fixed sweep. What it adds instead is coordination overhead: agents talking to agents, each with its own model calls. Whether you come out ahead depends on whether the work you avoid is bigger than the coordination you take on, which is exactly why the chapter lists both.</details>

3. Naive RAG can't tell that "car" and "automobile" are the same thing — a failure obvious enough that you'd wonder why anyone built it this way. Why *did* keyword retrieval come first, and what does that tell you about judging an architecture?
   <details><summary>Show answer</summary>Because its strengths were real for the moment it existed in: TF-IDF and BM25 are simple, cheap, and easy to implement, which made Naive RAG a genuinely useful proof of concept. On a small, vocabulary-controlled corpus where users happen to type the words the documents use, it mostly works. The failures the chapter lists — missed synonyms, fragmented output, poor scaling — show up as the corpus grows and the vocabulary drifts away from the query. So the honest reading isn't "keyword search was stupid," it's that every stage in this ladder was adequate until scale changed the question being asked of it, which should make you ask what scale your own design is quietly assuming.</details>

4. Of traditional RAG's three limitations, contextual integration is the one where retrieval *worked*. Why is that the harder failure to catch?
   <details><summary>Show answer</summary>Because everything visible looks right. The citations are real, the sources are on-topic, and a reviewer skimming the references will conclude the system did its job — the defect is in the synthesis, which has no artifact you can inspect. A retrieval miss announces itself: the relevant paper simply isn't there. A synthesis miss produces a fluent, well-sourced answer that doesn't actually connect the pieces into the explanation the user asked for, like the Alzheimer's example that returns papers but never links new treatments to specific patient scenarios. And a static pipeline has nowhere to notice this, because it has no step that evaluates its own output — which is precisely the gap the later corrective and reflective architectures exist to fill.</details>

---

Continue to Chapter 2 for the building blocks that make retrieval agentic.
