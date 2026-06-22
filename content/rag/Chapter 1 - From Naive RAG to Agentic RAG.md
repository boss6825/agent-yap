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

Continue to Chapter 2 for the building blocks that make retrieval agentic.
