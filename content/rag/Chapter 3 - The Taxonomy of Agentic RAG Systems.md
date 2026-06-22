# Chapter 3: The Taxonomy of Agentic RAG Systems

This is the core of the survey: a catalog of the main agentic RAG architectures. As Chapter 2 set up, each one is a particular combination of the agentic and workflow patterns. This chapter walks through all of them in order of increasing sophistication, explaining how each works, what it is good at, and where it struggles. For each, it helps to ask: which workflow pattern is this built around?

## Single-agent agentic RAG: the router

The simplest architecture. One [agent](../glossary/Glossary.md#agent) handles everything: it receives the query, decides where to look, retrieves, and integrates the answer. Its defining behavior is [routing](../glossary/Glossary.md#orchestrator-worker-pattern) (the workflow pattern from Chapter 2).

The workflow: a coordinating agent analyzes the query, then selects the most suitable knowledge source from its options, which might include a structured database (via a Text-to-SQL engine), [semantic search](../glossary/Glossary.md#semantic-search) over unstructured documents, web search for real-time information, or a recommendation system. It retrieves from the chosen source, the LLM synthesizes the result, and the answer is returned.

Strengths: centralized simplicity (easy to design, implement, and maintain), efficiency (fewer agents, less coordination, lower resource use), dynamic routing in real time, and versatility across tools. It is ideal for simpler systems with a limited number of tools or data sources.

The survey's example is a customer support query about delivery status: the single agent pulls tracking details from the order database, fetches updates from the shipping API, and optionally checks the web for local conditions, then synthesizes one answer. This is the right starting architecture when one well-chosen source per query is enough.

## Multi-agent agentic RAG

A modular, scalable step up. Instead of one agent doing everything, responsibilities are split across multiple specialized agents, coordinated by a master agent. It is built around the [parallelization](../glossary/Glossary.md#orchestrator-worker-pattern) pattern.

The workflow: a coordinator receives the query and delegates to specialized retrieval agents, for example one for structured SQL queries, one for [semantic search](../glossary/Glossary.md#semantic-search) over documents, one for web search, and one for recommendations. These agents retrieve in parallel using their own tools, and the results are synthesized by the LLM into one response.

Strengths: modularity (agents can be added or removed independently), scalability (parallel processing handles high query volumes), task specialization (each agent is tuned to its domain), and versatility across domains.

Challenges, which echo the multi-agent topic exactly: coordination complexity (managing inter-agent communication needs sophisticated orchestration), computational overhead from running many agents, and the difficulty of integrating outputs from diverse sources into one coherent answer.

The survey's example is a research assistant answering a question about the economic and environmental impacts of renewable energy in Europe, with separate agents handling economic databases, academic papers, recent news, and related recommendations, then merging the findings.

## Hierarchical agentic RAG

A multi-tiered structure where higher-level agents oversee lower-level ones. It is the [orchestrator-workers](../glossary/Glossary.md#orchestrator-worker-pattern) pattern applied across levels, with added strategic decision-making.

The workflow: a top-tier agent receives the query and assesses its complexity, then makes a strategic decision about which subordinate agents or data sources to prioritize (some sources may be judged more reliable for a given domain). It delegates to lower-level agents specialized in particular retrieval methods, which work independently, and then it aggregates and synthesizes their results.

Strengths: strategic prioritization (the top agent can rank sources by reliability or relevance), scalability across tiers for complex queries, and enhanced decision-making through layered oversight.

Challenges: coordination complexity grows with the number of levels, and allocating tasks across tiers without creating bottlenecks is hard.

The survey's example is a financial analysis system where the top-tier agent prioritizes reliable financial databases, a mid-level agent retrieves real-time market data, and lower-level agents handle web searches and expert-opinion recommendations, with everything compiled at the top.

## Agentic corrective RAG

This architecture adds self-correction to retrieval. It is built around the [evaluator-optimizer](../glossary/Glossary.md#reflection-and-reflexion) pattern: it judges its own retrieved documents and fixes them when they fall short.

The core idea is to evaluate retrieved documents dynamically, take corrective action, and refine queries to improve the answer. It is built on five specialized agents:

1. A context retrieval agent fetches initial documents from a vector database.
2. A relevance evaluation agent assesses those documents and flags irrelevant or ambiguous ones.
3. A query refinement agent rewrites the query to improve retrieval, using semantic understanding.
4. An external knowledge retrieval agent performs web searches or hits other sources when the context is insufficient.
5. A response synthesis agent integrates the validated information into the final answer.

Strengths: iterative correction (dynamically identifying and fixing poor retrieval), dynamic adaptability (real-time web search and query rewriting), modularity, and [factuality assurance](../glossary/Glossary.md#hallucination) (validating content minimizes hallucination). The cost, as the lessons chapter notes, is added latency from the correction loop.

The survey's example is an academic research assistant: it retrieves papers, evaluates their relevance, rewrites the query and searches the web if needed, and only then synthesizes a summary.

## Adaptive agentic RAG

This architecture adjusts its strategy based on the difficulty of the query. It uses a classifier to assess query complexity and then chooses the appropriate path: no retrieval at all for a trivial query, single-step retrieval for a moderate one, or multi-step reasoning for a complex one.

The value is efficiency through matching effort to need. A simple factual question does not trigger an expensive multi-hop process, while a complex question gets the full treatment. This is the same idea as [effort scaling](../glossary/Glossary.md#effort-scaling) from the multi-agent topic, applied at the level of retrieval strategy. The tradeoff the lessons chapter notes is that adaptive systems trade some correctness guarantees for responsiveness.

## Graph-based agentic RAG

This family combines [knowledge graphs](../glossary/Glossary.md#knowledge-graph-and-zettelkasten) with agentic reasoning. The survey highlights Agent-G as a representative: it integrates structured graph knowledge bases with unstructured document retrieval, using modular retriever banks, a critic module, and feedback loops.

In Agent-G, graph knowledge bases supply relationships and hierarchies (for example, disease-to-symptom mappings in healthcare), unstructured documents add contextual detail, a critic module evaluates the relevance and quality of what was retrieved (flagging low-confidence results for re-retrieval), and feedback loops refine the process iteratively. The strength of this family is strong [multi-hop reasoning](../glossary/Glossary.md#multi-hop-reasoning) over structured relationships combined with the flexibility of text retrieval. It suits domains where relationships are central, such as healthcare and legal analysis.

## Agentic document workflows

The most application-oriented architecture in the survey: end-to-end automation of document-centric work, called Agentic Document Workflows (ADW). These go beyond answering questions to actually processing documents through a multi-step business process.

The workflow: documents are parsed and their key fields extracted (for example, invoice numbers, dates, vendors, line items, payment terms); the system maintains state about the document across steps; it retrieves relevant references and domain-specific guidelines; and intelligent agents apply business rules, perform multi-step reasoning, and generate actionable recommendations, orchestrating parsers, retrievers, and APIs together.

The key advance over both ordinary document processing and ordinary RAG is that ADW maintains [state](../glossary/Glossary.md#stateful-and-stateless) across a multi-step workflow and applies domain logic, rather than answering a single question in isolation. This is where agentic RAG starts to look like genuine knowledge-work automation.

## How to read the taxonomy as a whole

The arc from router to document workflows is an arc of increasing autonomy and structure. The router decides where to look. The multi-agent and hierarchical systems add parallelism and oversight. The corrective and adaptive systems add self-evaluation and effort-matching. The graph-based systems add relational reasoning. The document workflows add stateful, end-to-end process automation. Each step buys more capability at the price of more coordination complexity, latency, and cost, which is precisely the tradeoff the next chapter tells you how to navigate.

## Key takeaways

- Single-agent router: one agent routes each query to the best source. Simple, efficient, best for limited toolsets.
- Multi-agent: specialized agents retrieve in parallel under a coordinator. Scalable and modular, but harder to coordinate.
- Hierarchical: tiered agents with strategic top-level prioritization. Good for complex queries, more orchestration overhead.
- Corrective: a five-agent loop that evaluates and fixes its own retrieval. High factuality, added latency.
- Adaptive: a classifier matches retrieval effort to query complexity, trading some correctness for responsiveness.
- Graph-based (Agent-G): combines knowledge graphs and text with a critic and feedback loops; strong multi-hop reasoning.
- Agentic document workflows: stateful, end-to-end automation of document processes, beyond single-question RAG.
- The taxonomy is a ladder of increasing autonomy and structure, each rung adding capability at the cost of complexity.

Continue to Chapter 4 for guidance on choosing and deploying these wisely.
