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

## Review

**Quick Check**

1. What is the defining behaviour of the single-agent agentic RAG architecture?
   - A) Parallel retrieval across specialized agents
   - B) Routing — one agent analyzes the query and selects the most suitable knowledge source
   - C) Evaluating its own retrieved documents and rewriting the query
   - D) Maintaining state across a multi-step business process
   <details><summary>Answer</summary>B) One agent receives the query, decides where to look (a structured database via Text-to-SQL, semantic search over documents, web search, or a recommendation system), retrieves, and integrates the answer.</details>

2. Agentic corrective RAG is built on five specialized agents. Which set is correct?
   - A) Planner, executor, critic, summarizer, and router
   - B) Classifier, retriever, re-ranker, generator, and logger
   - C) Context retrieval, relevance evaluation, query refinement, external knowledge retrieval, and response synthesis
   - D) Orchestrator, four domain workers
   <details><summary>Answer</summary>C) Retrieve initial documents from a vector database, assess and flag irrelevant or ambiguous ones, rewrite the query to improve retrieval, search the web or other sources when context is insufficient, then integrate the validated information into the answer.</details>

3. How does adaptive agentic RAG decide what to do?
   - A) A top-tier agent ranks sources by reliability
   - B) A classifier assesses query complexity and chooses no retrieval, single-step retrieval, or multi-step reasoning
   - C) A critic module flags low-confidence results for re-retrieval
   - D) A coordinator delegates to four specialized retrieval agents
   <details><summary>Answer</summary>B) It matches effort to need, so a simple factual question does not trigger an expensive multi-hop process. The chapter calls this the same idea as effort scaling from the multi-agent topic, applied to retrieval strategy.</details>

4. What does the hierarchical architecture add that plain multi-agent retrieval does not?
   - A) Parallel execution of retrieval agents
   - B) A vector database as the primary source
   - C) Strategic prioritization — the top-tier agent assesses complexity and decides which subordinate agents or sources to prioritize, judging some more reliable for a given domain
   - D) Query rewriting when retrieval comes back weak
   <details><summary>Answer</summary>C) It is the orchestrator-workers pattern applied across levels, with added strategic decision-making and layered oversight. The price is coordination complexity that grows with the number of levels, plus the difficulty of allocating tasks across tiers without creating bottlenecks.</details>

5. You need a system that parses incoming invoices, extracts numbers, dates, vendors, line items, and payment terms, checks them against domain-specific guidelines, and produces an actionable recommendation — carrying what it learned about the document from step to step. Which architecture is this?
   - A) Single-agent router
   - B) Adaptive agentic RAG
   - C) Graph-based agentic RAG (Agent-G)
   - D) Agentic Document Workflows (ADW)
   <details><summary>Answer</summary>D) ADW parses documents and extracts key fields, maintains state about the document across steps, retrieves relevant references and guidelines, and applies business rules with multi-step reasoning — orchestrating parsers, retrievers, and APIs together.</details>

**More Questions**

6. What challenges does the chapter list for multi-agent agentic RAG?
   - A) Poor semantic matching and no re-ranking
   - B) Coordination complexity, computational overhead from running many agents, and the difficulty of integrating outputs from diverse sources into one coherent answer
   - C) Graph maintenance cost and data dependency
   - D) Latency from the correction loop
   <details><summary>Answer</summary>B) The chapter notes these "echo the multi-agent topic exactly." Its strengths are modularity, scalability through parallel processing, task specialization, and versatility across domains.</details>

7. In Agent-G, what does the critic module do?
   - A) Rewrites the user's query before retrieval begins
   - B) Chooses between the graph and the document store
   - C) Evaluates the relevance and quality of what was retrieved, flagging low-confidence results for re-retrieval
   - D) Scores the final answer for style and tone
   <details><summary>Answer</summary>C) Agent-G integrates graph knowledge bases (relationships and hierarchies, such as disease-to-symptom mappings) with unstructured document retrieval, using modular retriever banks, a critic module, and feedback loops that refine the process iteratively.</details>

8. What is the trade the corrective architecture makes?
   - A) Higher factuality assurance, at the cost of added latency from the correction loop
   - B) Lower latency, at the cost of accuracy
   - C) Better multi-hop reasoning, at the cost of modularity
   - D) Cheaper retrieval, at the cost of coverage
   <details><summary>Answer</summary>A) Validating retrieved and generated content minimizes hallucination, and the architecture also gains dynamic adaptability through real-time web search and query rewriting — but the correction loop adds latency, as the lessons chapter notes.</details>

9. What does the adaptive architecture give up in exchange for responsiveness?
   - A) Modularity
   - B) The ability to use web search
   - C) Some correctness guarantees
   - D) Support for structured data
   <details><summary>Answer</summary>C) The lessons chapter notes that adaptive systems trade some correctness guarantees for responsiveness — a trivial-looking query routed to "no retrieval" is fast, but only right if the classifier judged it correctly.</details>

10. A customer asks "where is my order?" Answering it well needs tracking details from the order database, a status update from the shipping API, and possibly a check on local conditions — but one well-chosen source per lookup is enough, and there is no need for agents to critique each other. Which architecture does the chapter recommend starting with?
    - A) Single-agent router — centralized simplicity, efficiency, dynamic routing, and versatility across tools
    - B) Hierarchical, so a top agent can rank the sources
    - C) Corrective, so the retrieved status can be validated
    - D) Graph-based, to model the order-to-shipment relationship
    <details><summary>Answer</summary>A) This is the survey's own delivery-status example. The single agent pulls tracking details, fetches shipping updates, optionally checks the web, and synthesizes one answer — the right starting architecture when one well-chosen source per query is enough.</details>

**Coding Challenge**

*A corrective retrieval loop*

Implement `corrective_answer(query, vector_search, web_search, is_relevant, max_refinements=2)`. Retrieve from the vector store, keep only the documents `is_relevant` accepts, and if nothing survives, refine the query (append a clarifying term) and retry up to the cap. If retrieval is still insufficient after the cap, fall back to `web_search`. Return the documents plus a trace of which of the five corrective roles ran — the trace is what makes the process auditable, which Chapter 4 asks for.

<details>
<summary>Python Solution</summary>

```python
def corrective_answer(query, vector_search, web_search, is_relevant, max_refinements=2):
    trace = []
    current = query
    for attempt in range(max_refinements + 1):
        docs = vector_search(current)                      # 1. context retrieval
        trace.append(f"retrieve({current!r})")
        kept = [d for d in docs if is_relevant(d, query)]  # 2. relevance evaluation
        trace.append(f"evaluate -> kept {len(kept)}/{len(docs)}")
        if kept:
            trace.append("synthesize")                    # 5. response synthesis
            return kept, trace
        if attempt < max_refinements:
            current = f"{current} definition"             # 3. query refinement
            trace.append(f"refine -> {current!r}")
    fallback = web_search(query)                           # 4. external knowledge
    trace.append("web_search fallback")
    trace.append("synthesize")
    return fallback, trace


INDEX = {"agentic rag definition": ["Agentic RAG embeds agents in the RAG pipeline."]}

print(corrective_answer(
    "agentic rag",
    vector_search=lambda q: INDEX.get(q, []),
    web_search=lambda q: [f"web result for {q}"],
    is_relevant=lambda doc, q: "Agentic RAG" in doc,
))
# (['Agentic RAG embeds agents in the RAG pipeline.'],
#  ["retrieve('agentic rag')", 'evaluate -> kept 0/0',
#   "refine -> 'agentic rag definition'", "retrieve('agentic rag definition')",
#   'evaluate -> kept 1/1', 'synthesize'])
```

</details>

**Think About It**

1. Corrective RAG spends four extra agents just to check whether the first one's retrieval was any good. Why would anyone pay that, and when is it obviously the wrong call?
   <details><summary>Show answer</summary>You pay it when being wrong is expensive and being slow is merely annoying. The four extra roles exist because a single retrieval pass has no way to notice it pulled irrelevant or ambiguous documents — so the loop adds a judge, a query rewriter, an escape hatch to the open web, and only then a synthesizer, which is why the chapter credits it with factuality assurance. That's a fair trade for the academic research assistant in the survey's example, where a confidently wrong citation is the worst outcome. It is the wrong call when the query is a well-scoped lookup that the first retrieval nails every time: you've added latency and several model calls to re-check work that was never in doubt, which is exactly the restraint Chapter 4 opens with.</details>

2. Adaptive agentic RAG sometimes decides to retrieve *nothing at all*. That looks like abandoning the entire premise of RAG. Why is it arguably the most sophisticated architecture in the chapter?
   <details><summary>Show answer</summary>Because it's the only one that treats retrieval effort as a variable rather than a constant. Every other architecture has a fixed appetite — the router always picks a source, the corrective loop always evaluates and may re-retrieve — so a trivial question costs roughly what a hard one does. The adaptive classifier matches effort to need, spending nothing on a trivial query, one step on a moderate one, and full multi-step reasoning on a complex one, which is the same effort-scaling instinct the multi-agent topic arrives at. The catch is that all the risk concentrates in one place: the classifier. Misjudge a hard question as easy and you've skipped the retrieval that would have made the answer right, which is what "trading some correctness guarantees for responsiveness" actually means in practice.</details>

3. Multi-agent and hierarchical architectures both run several specialized agents. Strip away the diagrams — what does the *hierarchy* actually buy, and what does it cost?
   <details><summary>Show answer</summary>It buys judgement about sources rather than just division of labour. A flat coordinator delegates and merges; the top-tier agent in the hierarchical design first assesses the query's complexity and then decides which subordinates and sources deserve priority, because some sources are more reliable for a given domain — the survey's financial example prioritizes vetted financial databases over web opinion. That's a claim about trust, encoded structurally. The cost is that coordination complexity grows with each level, and work has to be allocated across tiers without the top agent becoming a bottleneck every query must queue behind. So the hierarchy is worth it precisely when sources differ in reliability enough that ranking them matters more than the throughput you give up.</details>

4. Agentic Document Workflows are the only architecture the chapter says goes "beyond single-question RAG." The thing that gets them there is unglamorous: keeping state. Why is that the hinge?
   <details><summary>Show answer</summary>Because a stateless system can only ever answer questions, one at a time, each in isolation. Real document work is a process with steps that depend on earlier ones — you extract the invoice fields, then check them against payment terms, then apply the business rule, then recommend an action — and every one of those steps needs to remember what the earlier ones established about *this* document. Once the system maintains that state and applies domain logic across the steps, it is no longer retrieving on your behalf; it is completing the work. That's why the chapter puts ADW at the top of the ladder and calls it the point where agentic RAG starts to look like genuine knowledge-work automation.</details>

---

Continue to Chapter 4 for guidance on choosing and deploying these wisely.
