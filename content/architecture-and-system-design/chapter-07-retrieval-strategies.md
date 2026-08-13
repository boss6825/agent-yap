# Chapter 7: Retrieval: RAG vs Tools vs Long Context

An agent is only as good as the information it can bring to bear. Getting the right facts in front of the model is the *retrieval* problem, and there are three broad strategies: stuff everything into a long context, retrieve relevant chunks (RAG), or let the model fetch what it needs through tools. This chapter compares them and explains when each wins, and why a tool-based approach is often the right default for document agents.

## The three strategies

### 1. Long context ("just include it")

Put the relevant documents directly into the prompt and let the large context window hold them. Simple, no infrastructure.

- **Wins when:** the total content is small relative to the window, the task needs the *whole* document (not a snippet), and you can afford the tokens.
- **Loses when:** content is large (cost and latency balloon), there's a lot of it (the model gets "lost in the middle" and quality drops), or it changes often (you re-send it every call).

### 2. Retrieval-augmented generation (RAG)

Pre-process documents into chunks, embed them into a vector store, and at query time retrieve the most semantically similar chunks to inject into context.

- **Wins when:** you have a large corpus, queries are answerable from *fragments*, and you need to search across many documents by meaning rather than exact text.
- **Loses when:** the task needs whole-document understanding (chunking fragments the structure), exactness matters (embeddings retrieve "similar," not "the exact clause"), or you need verbatim quotes with precise locations (chunk boundaries and approximate retrieval undermine citation precision). RAG also adds real infrastructure: an embedding pipeline, a vector DB, chunking strategy, and retrieval tuning.

### 3. Tool-based retrieval ("let the model fetch")

Give the model tools to read and search content on demand, "read this document," "find this phrase," "list what's available," and let *it* decide what to pull, driven by the task.

- **Wins when:** the model can reason about *what* it needs (it knows it wants "the termination clause"), exactness matters, you need whole-document or targeted reads, and content changes (tools always fetch the current version).
- **Loses when:** the corpus is so large the model can't even know what exists without help (then you add a search/list tool, blending toward RAG), or when latency from multiple fetch round-trips is unacceptable.

## Why tools are often the right default for document agents

For an agent working with a bounded, identified set of documents (a user's files, a project folder, a matter), tool-based retrieval tends to win for several reasons:

- **Exactness and citations.** When the model reads the actual document text (paginated, complete) rather than approximate chunks, it can quote verbatim and cite precise locations. For domains where citation accuracy is the whole point (law, medicine, finance), this is decisive.
- **Freshness.** Tools fetch the current version every time, so edits and updates are reflected automatically. A vector index, by contrast, must be re-embedded when content changes.
- **Grounding.** Forcing the model to explicitly fetch content makes it engage with the real text instead of leaning on training-data priors.
- **Simplicity.** No embedding pipeline, no vector store, no chunking strategy to tune. The model's own reasoning *is* the retrieval policy.
- **Whole-document tasks.** Summarising or editing a contract needs the whole thing in coherent order, which chunked retrieval handles poorly.

The cost is multiple round-trips (the model reads, then acts), which the agent loop already handles, and which you mitigate with batching tools ("fetch these N documents at once") and cheap targeted tools ("find this phrase" instead of reading everything).

## When to add search (the hybrid)

Tool-based retrieval assumes the model knows *what* to fetch. When the corpus is large enough that the model can't enumerate it, give it discovery tools:

- A **list** tool ("what documents are in this project?") so it can see what exists.
- A **search** tool, which, under the hood, might be keyword search, full-text search, or *vector* search. This is where RAG techniques re-enter: a `search` tool backed by embeddings, exposed to the model as just another tool it can call.

This hybrid, tools for reading and acting, plus a search tool (possibly RAG-powered) for discovery, scales from a handful of documents to large corpora while keeping the model in control of retrieval. The crucial framing: **RAG becomes a tool the model can choose to call, not the mandatory front door for every query.**

## A decision guide

Ask, in order:

1. **Is the content small and always needed whole?** → Long context. Don't over-engineer.
2. **Is it a bounded, identified set the model can reason about by name/structure?** → Tool-based reads (plus a list tool). Best for exactness, freshness, citations.
3. **Is it a large corpus where the model can't know what exists?** → Add a search tool (keyword or vector). Keep reads as tools so the model pulls full, exact text for whatever search surfaces.
4. **Do you need both whole-document work and corpus-wide search?** → Hybrid: read/find/list tools + a search tool backing into RAG.

## Retrieval and the citation contract

Whatever strategy you pick, design it so the model can *cite precisely*. That means:

- Preserve and expose **location information** (page numbers, section ids) with the retrieved text, so the model can point at exactly where a fact came from.
- Prefer returning **verbatim text** the model can quote, over paraphrased or pre-summarised content.
- If you chunk, keep chunks aligned to meaningful boundaries and carry their source location, so a citation resolves back to a real place in a real document.

For grounded, auditable agents, retrieval and citation are two halves of one design: the way you fetch content determines how precisely the model can attribute its claims. (Chapter 17 returns to this for regulated domains.)

## The bottom line

Don't reach for a vector database reflexively because "RAG" is the default story. For many agents, especially those working with a user's own identified documents and needing exact, citable, current answers, giving the model good read/find/list tools is simpler, more accurate, and more maintainable. Add semantic search as a *tool* when, and only when, corpus scale demands it.

## Review

**Quick Check**

1. What are the three broad retrieval strategies the chapter compares?
   - A) Fine-tuning, prompting, and distillation
   - B) Long context, retrieval-augmented generation (RAG), and tool-based retrieval
   - C) Keyword search, vector search, and hybrid search
   - D) Caching, streaming, and batching
   <details><summary>Answer</summary>B) Long context ("just include it"), RAG (chunk, embed, retrieve), and tool-based retrieval ("let the model fetch").</details>

2. When does the long-context strategy start to lose?
   - A) When the content is small relative to the window
   - B) When the task needs the whole document rather than a snippet
   - C) When content is large, plentiful (the model gets "lost in the middle"), or changes often
   - D) When you need semantic rather than exact matching
   <details><summary>Answer</summary>C) Cost and latency balloon on large content, quality drops as the model gets lost in the middle, and frequently-changing content must be re-sent every call.</details>

3. Why does the chapter say RAG undermines citation precision?
   - A) Vector databases don't store source metadata at all
   - B) Embeddings retrieve "similar," not "the exact clause," and chunk boundaries fragment structure
   - C) Chunks are always paraphrased before storage
   - D) Embedding models can't handle legal or medical text
   <details><summary>Answer</summary>B) Approximate retrieval plus chunk boundaries means you get similar text rather than the exact clause, which breaks verbatim quotes with precise locations.</details>

4. What is the main cost of tool-based retrieval, and how does the chapter suggest mitigating it?
   - A) Vector index staleness; mitigate by re-embedding on a schedule
   - B) Multiple round-trips; mitigate with batching tools and cheap targeted tools like "find this phrase"
   - C) Prompt bloat; mitigate by shortening tool descriptions
   - D) Hallucinated citations; mitigate with a verification model call
   <details><summary>Answer</summary>B) The model reads, then acts, costing round-trips. Batch fetches ("fetch these N documents at once") and targeted tools reduce them; the agent loop already handles the iteration.</details>

5. Your agent works over a bounded set of a user's own contracts, and answers must quote exact clauses with page numbers that stay current as files are edited. Which strategy does the chapter favour?
   - A) Long context — stuff every contract into the window
   - B) RAG as the mandatory front door for every query
   - C) Tool-based reads (plus a list tool) for exactness, freshness, and citations
   - D) Fine-tune a model on the contract corpus
   <details><summary>Answer</summary>C) Tool-based reads. The model reads actual paginated document text so it can quote verbatim and cite precisely, and tools always fetch the current version.</details>

**More Questions**

6. What is the chapter's crucial reframing of RAG in a hybrid design?
   - A) RAG replaces tools once the corpus exceeds a certain size
   - B) RAG becomes a tool the model can choose to call, not the mandatory front door for every query
   - C) RAG should run before every model call to pre-warm context
   - D) RAG and tools should never be combined in one agent
   <details><summary>Answer</summary>B) A `search` tool backed by embeddings is exposed as just another tool, keeping the model in control of retrieval instead of forcing every query through a vector index.</details>

7. In the decision guide, what triggers adding a search tool?
   - A) Any corpus larger than one document
   - B) Needing verbatim quotes
   - C) A corpus large enough that the model can't know what exists
   - D) A requirement for whole-document summarisation
   <details><summary>Answer</summary>C) Tool-based retrieval assumes the model knows what to fetch. When the corpus is too large to enumerate, add discovery tools (list and search).</details>

8. Why does the chapter say tool-based retrieval improves *grounding*?
   - A) Tools return smaller payloads, so the model attends better
   - B) Forcing the model to explicitly fetch content makes it engage with real text instead of leaning on training-data priors
   - C) Tools run server-side, where content is validated
   - D) Tool results are always placed at the end of the prompt
   <details><summary>Answer</summary>B) The explicit fetch step makes the model engage with the actual document rather than recalling something plausible from training data.</details>

9. If you do chunk content, what does the chapter say you must preserve so citations still resolve?
   - A) The embedding vector alongside the text
   - B) Chunks aligned to meaningful boundaries, each carrying its source location
   - C) A summary of each chunk for the model to skim
   - D) The original upload timestamp
   <details><summary>Answer</summary>B) Align chunks to meaningful boundaries and carry location information, so a citation resolves back to a real place in a real document.</details>

10. What is the chapter's bottom line about reaching for a vector database?
    - A) Always start with one; retrofitting RAG later is painful
    - B) Never use one; tools are strictly superior
    - C) Don't reach for it reflexively — add semantic search as a tool when, and only when, corpus scale demands it
    - D) Use one only for text, never for structured documents
    <details><summary>Answer</summary>C) For many agents, good read/find/list tools are simpler, more accurate, and more maintainable. Add semantic search as a tool when scale actually requires it.</details>

**Coding Challenge**

*Encode the decision guide*

Write a `choose_strategy(small_and_whole, bounded_and_identifiable, model_can_enumerate)` function that returns one of `"long_context"`, `"tools"`, `"tools_plus_search"`, following the chapter's ordered questions: small content always needed whole → long context; a bounded, identifiable set → tool-based reads; otherwise, or when the model can't enumerate what exists → tools plus a search tool.

<details>
<summary>Python Solution</summary>

```python
def choose_strategy(small_and_whole, bounded_and_identifiable, model_can_enumerate):
    # 1. Small and always needed whole? Don't over-engineer.
    if small_and_whole:
        return "long_context"
    # 2. Bounded set the model can reason about by name/structure?
    if bounded_and_identifiable and model_can_enumerate:
        return "tools"
    # 3. Model can't know what exists -> add discovery (search may be RAG-backed).
    return "tools_plus_search"


print(choose_strategy(True, False, False))    # long_context
print(choose_strategy(False, True, True))     # tools
print(choose_strategy(False, True, False))    # tools_plus_search
print(choose_strategy(False, False, False))   # tools_plus_search
```

</details>

**Think About It**

1. "RAG" became the default answer to "how do I give a model my documents?" — and this chapter spends most of its length arguing you probably shouldn't start there. What problem was RAG originally solving that made it the default, and why does that justification quietly evaporate for an agent working on a user's own files?
   <details><summary>Show answer</summary>RAG exists to solve corpus scale: when you have far more text than fits in a context window and queries are answerable from fragments, you need a way to find the relevant few thousand tokens out of millions. That's a real problem, and the machinery — chunking, embeddings, a vector store — is the right answer to it. But an agent working on a user's project folder has a *bounded, identified* set of documents the model can reason about by name, so the scale problem it solves isn't the problem you have. You end up paying RAG's costs — approximate matches, fragmented structure, stale indexes, tuning — for a benefit you didn't need. The lesson is to ask which constraint the popular architecture was designed around before adopting it.</details>

2. Both long context and RAG degrade as you add more content, but for opposite-sounding reasons. Long context gets "lost in the middle"; RAG retrieves things that are merely similar. What does it tell you that *more* information can make an answer worse in both cases?
   <details><summary>Show answer</summary>It tells you that retrieval quality, not retrieval quantity, is the thing you're actually optimising. Stuffing the window dilutes attention across irrelevant text, so the signal the model needs competes with noise; embedding-based recall widens the net and pulls in near-misses that read as authoritative. In both cases the failure is the same shape — the model is confidently working from the wrong passage — and it's harder to debug than a missing document, because the output looks well-sourced. That's the underlying reason the chapter prefers letting the model *decide* what to fetch: a targeted read is precise by construction, rather than precise by tuning.</details>

3. The chapter claims retrieval and citation are "two halves of one design." Try to break that claim: couldn't you retrieve however you like and just bolt citations on afterwards by searching for the quoted text? Why does the chapter think the fetch strategy locks in your citation ceiling?
   <details><summary>Show answer</summary>You can bolt on a post-hoc search, but you can only cite as precisely as the text you handed the model allows. If the model saw an approximate chunk with no page number, there's no location to point at; if it saw pre-summarised or paraphrased content, there's no verbatim string to match back to the source. Post-hoc matching also fails silently — it finds *a* plausible location rather than *the* one the model actually used, which is worse than no citation in an auditable domain. So the moment you choose how to fetch, you've decided whether "page 3, this exact sentence" is even expressible. That's why preserving location information and returning verbatim text are retrieval-time decisions, not display-time ones.</details>

---

Next: [Chapter 8: Streaming and real-time UX](chapter-08-streaming-ux.md)
