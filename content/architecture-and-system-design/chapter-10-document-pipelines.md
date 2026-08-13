# Chapter 10: Document and File Processing Pipelines

Many agents are fundamentally *document* agents: their value comes from reading, transforming, and producing files. The pipeline that turns an uploaded file into something the agent can use, and turns the agent's output into a downloadable artifact, is a system in its own right. This chapter covers ingestion, conversion, extraction, generation, and the synchronous-vs-asynchronous decision.

## The ingestion pipeline

When a file is uploaded, a sequence of steps prepares it for use. A typical pipeline:

1. **Validate**: accept only the formats you actually support; reject the rest immediately with a clear error. Narrowness is a feature: fewer formats means fewer edge cases.
2. **Create a record**: write a metadata row with a `processing` status *before* doing the heavy work, so you have a durable handle even if a later step fails.
3. **Store the original bytes**: put the raw file in object storage under a predictable, owner-scoped key. Keep the original untouched; everything else is derived.
4. **Produce a renderable form**: convert to a viewable format (often PDF) if the source isn't already viewable, so your UI can display it consistently regardless of input type.
5. **Extract structure and text**: pull a structural outline (headings/sections) and any metadata (page count) you'll need for navigation and citation.
6. **Record a first version**: create the initial version row pointing at the stored bytes (Chapter 9).
7. **Mark ready**: flip the status to `ready`; only `ready` items are ever loaded into the agent's context.

If anything fails, mark the record `error` rather than leaving it half-built. The status field makes the pipeline's state explicit and recoverable.

## Format conversion is messy: isolate it

Converting between document formats (Office → PDF, etc.) is one of the messiest parts of any document system. Real-world files are malformed in creative ways: non-standard internal paths, corrupt structures, unusual encodings. Lessons:

- **Use a battle-tested converter** (a mature library or a tool like LibreOffice invoked as a subprocess) rather than writing your own. It encodes decades of edge-case handling.
- **Normalise before converting.** Pre-process known quirks (e.g. archives with non-standard internal path separators) so the converter doesn't choke. These fixes are unglamorous but essential once real user files arrive.
- **Fail softly.** If conversion fails, degrade: keep the document usable for text extraction even without a rendered preview, rather than rejecting the upload outright. Wrap conversion in a try/catch and continue with what succeeded.
- **Treat the converter as an external dependency.** It may need installing in your runtime image, it adds latency, and it can crash. Isolate it so its failures don't take down the request.

## Text extraction and pagination

For the agent to read and cite a document, you extract its text, and *how* you extract it matters for citation precision (Chapter 7). Annotate the extracted text with **stable location markers** (page numbers, section ids) that line up with what the user sees in the rendered view. Then a citation that says "page 3" can scroll the viewer to page 3 and highlight the quote. Don't trust page numbers printed *inside* the document (footers, roman numerals); use your own sequential markers tied to the rendering. Extraction and rendering must agree on locations, or citations point to the wrong place.

## Generation: structured input → deterministic output

For producing documents, the pattern from Chapter 3 applies: have the agent emit **structured content** (sections, headings, tables) and let *your code* render it into the target format deterministically, applying house style, numbering, fonts, and layout. This keeps formatting reliable and consistent, and confines the model to deciding content. Use a mature document-generation library and encode your domain's formatting conventions once, in code.

## Versioning generated and edited artifacts

Generated and edited documents flow back into the same versioning model as uploads (Chapter 9): a generated document is a new artifact with a first version (`source: generated`); an edit creates a new version (`source: agent_edit`) of an existing artifact. The pipeline for "agent edits a document" is its own mini-pipeline: load current bytes → apply the change → store new bytes → record a new version → record the individual changes → update the current pointer. Keep these steps transactional enough that you never end up with a version row pointing at bytes that weren't written, or a current pointer to a version that doesn't exist.

## The synchronous vs asynchronous decision

A central architectural choice: do you process the file *during the upload request* (synchronous) or hand it to a background worker (asynchronous)?

**Synchronous** (do it all in the request):

- *Pros:* simple, linear code; the response can return the finished, ready document; no queue infrastructure.
- *Cons:* the request is held open for the duration (conversion can be slow); large files risk timeouts; a burst of uploads ties up request handlers.
- *Good when:* files are modest in size, processing takes a few seconds, and volume is moderate.

**Asynchronous** (enqueue, process in a worker):

- *Pros:* uploads return instantly with a `processing` status; heavy work runs off the request path; you can scale workers independently and retry failures.
- *Cons:* more infrastructure (a queue, workers), and the client must poll or subscribe for completion; eventual-consistency UX.
- *Good when:* files are large, processing is slow (OCR, heavy conversion), or volume is high.

A pragmatic path: **start synchronous, but design as if it will become asynchronous.** The single thing that makes the later migration easy is already having the explicit status field (`processing → ready → error`). With that in place, moving steps 3–6 into a worker is a localised change; the rest of the system already understands "not ready yet." Don't build the queue before you need it; do build the status field from day one.

## Operational concerns

- **Size limits.** Enforce maximum file sizes at the edge to protect memory and processing time.
- **Storage hygiene.** Owner-scoped keys make cleanup and access reasoning easy; delete derived artifacts when the source is deleted.
- **Idempotency.** If a processing step is retried, it shouldn't create duplicate versions or orphaned files. Make steps safe to re-run (Chapter 13).
- **Observability.** Log each pipeline stage with the document id so a failed conversion is diagnosable. Document pipelines fail in field-specific ways; you'll want the breadcrumbs.

## The takeaway

A document pipeline is a small ETL system bolted to your agent. Treat it with the same rigor: validate inputs, store originals immutably, isolate the messy conversion step and make it fail soft, extract with citation-grade location markers, version everything, and use an explicit status state machine so the whole thing is recoverable and ready to go asynchronous when scale demands. The agent gets the credit, but the pipeline is what makes its document work trustworthy.

## Review

**Quick Check**

1. Why does the pipeline create a metadata record with a `processing` status *before* doing the heavy conversion and extraction work?
   - A) To reserve a database id for the UI to display immediately
   - B) So you have a durable handle even if a later step fails, making the state explicit and recoverable
   - C) Because object storage requires a record to exist first
   - D) To speed up the conversion step
   <details><summary>Answer</summary>B) So you have a durable handle even if a later step fails. Writing the record first means a crash mid-pipeline leaves a recoverable `processing`/`error` row rather than nothing.</details>

2. What does the chapter recommend for converting between document formats (e.g. Office → PDF)?
   - A) Write your own converter for full control over edge cases
   - B) Reject any file that isn't already in a viewable format
   - C) Use a battle-tested converter (a mature library or a tool like LibreOffice as a subprocess)
   - D) Convert on the client before upload
   <details><summary>Answer</summary>C) Use a battle-tested converter. It encodes decades of edge-case handling that you would otherwise have to rediscover against malformed real-world files.</details>

3. A user uploads a document and the format conversion step crashes. According to the "fail softly" guidance, what should the pipeline do?
   - A) Reject the whole upload and return an error
   - B) Retry the conversion indefinitely until it succeeds
   - C) Degrade: keep the document usable for text extraction even without a rendered preview
   - D) Silently mark the document `ready` anyway
   <details><summary>Answer</summary>C) Degrade. Wrap conversion in try/catch and continue with what succeeded, keeping the document usable for text even if the preview render failed.</details>

4. For citation-precise location markers, what does the chapter say you should NOT trust?
   - A) Your own sequential page markers tied to the rendering
   - B) Section ids extracted from the structural outline
   - C) Page numbers printed inside the document (footers, roman numerals)
   - D) The object-storage key of the original file
   <details><summary>Answer</summary>C) Page numbers printed inside the document. Use your own sequential markers tied to the rendering so extraction and the viewer agree on locations.</details>

5. What is the recommended pattern for having an agent *generate* a document?
   - A) Let the model emit the final formatted bytes directly
   - B) Have the model emit structured content (sections, headings, tables) and let your code render it deterministically
   - C) Ask the model to describe the layout in prose and format it by hand
   - D) Generate the document client-side from a template
   <details><summary>Answer</summary>B) The model emits structured content; your code renders it into the target format, applying house style and layout. This confines the model to deciding content and keeps formatting reliable.</details>

**More Questions**

6. When is asynchronous processing (enqueue, process in a worker) the better choice over synchronous?
   - A) When files are small and processing takes a couple of seconds
   - B) When you want the simplest possible linear code
   - C) When files are large, processing is slow (OCR, heavy conversion), or volume is high
   - D) When you want to avoid any queue infrastructure
   <details><summary>Answer</summary>C) Async fits large files, slow processing, and high volume: uploads return instantly with a `processing` status and heavy work runs off the request path.</details>

7. The chapter recommends starting synchronous but designing so the later move to asynchronous is easy. What single thing makes that migration localised?
   - A) Using object storage from day one
   - B) Having the explicit status field (`processing → ready → error`) already in place
   - C) Choosing PDF as the canonical renderable format
   - D) Writing the converter as a subprocess
   <details><summary>Answer</summary>B) The explicit status field. With it, the rest of the system already understands "not ready yet," so moving the heavy steps into a worker is a localised change.</details>

8. Why must processing steps be idempotent (safe to re-run)?
   - A) So the agent can call them as tools
   - B) So a retried step doesn't create duplicate versions or orphaned files
   - C) So conversion runs faster on the second attempt
   - D) So the UI can poll them repeatedly
   <details><summary>Answer</summary>B) So retries don't create duplicate versions or orphaned files. Make steps safe to re-run rather than assuming they run exactly once.</details>

9. Your document system runs fully synchronous, and a marketing team uploads a burst of large files at once. What failure mode does the chapter warn about?
   - A) The originals get overwritten in object storage
   - B) Citations point to the wrong page
   - C) Requests are held open for the duration, tying up request handlers and risking timeouts
   - D) The status field gets stuck on `ready`
   <details><summary>Answer</summary>C) Synchronous processing holds each request open for the whole conversion; a burst ties up request handlers and large files risk timeouts. This is exactly when async pays off.</details>

10. What does "storage hygiene" with owner-scoped keys buy you?
    - A) Faster text extraction
    - B) Easy cleanup and access reasoning, so derived artifacts can be deleted when the source is deleted
    - C) Automatic format conversion
    - D) Immunity from prompt injection
    <details><summary>Answer</summary>B) Owner-scoped keys make cleanup and access reasoning easy, and let you delete derived artifacts when the source is deleted.</details>

**Coding Challenge**

*Recoverable ingestion state machine*

Write a `process_document(steps)` function that runs an ordered list of pipeline steps, tracking a status that starts at `"processing"`. Each step is a zero-argument callable. If every step succeeds, return status `"ready"`; if any step raises, stop and return status `"error"` (never leave it half-built as `"processing"`). Return a dict with the final `status` and the name of the failed step (or `None`).

<details>
<summary>Python Solution</summary>

```python
def process_document(steps):
    state = {"status": "processing", "failed_step": None}
    for step in steps:
        try:
            step()
        except Exception:
            state["status"] = "error"
            state["failed_step"] = getattr(step, "__name__", str(step))
            return state
    state["status"] = "ready"
    return state


# Example
def validate(): pass
def convert(): raise RuntimeError("LibreOffice choked on a malformed archive")
def extract(): pass

print(process_document([validate, convert, extract]))
# {'status': 'error', 'failed_step': 'convert'}
print(process_document([validate, extract]))
# {'status': 'ready', 'failed_step': None}
```

</details>

**Think About It**

1. The chapter insists you store the original bytes untouched and treat everything else as "derived." Imagine you skipped that and only kept the converted PDF. A year later you discover your converter had a bug that silently dropped tables from certain files. Why is that scenario so much worse if you *didn't* keep the originals, and what does this tell you about which artifact is the source of truth?
   <details><summary>Show answer</summary>If you only kept the derived PDF, the bug is now baked into the only copy you have — the dropped tables are simply gone, and no re-run can recover them. Keeping the immutable original means every derived form is reproducible: fix the converter, re-run the pipeline, and every document heals. This is why the original bytes are the source of truth and everything else is disposable cache. The whole "store originals immutably" rule exists precisely because your extraction and conversion logic *will* have bugs you haven't found yet, and you want the ability to reprocess history rather than losing it.</details>

2. Converting document formats sounds like it should be a solved, boring problem — you're just turning one file into another. So why does the chapter single it out as "one of the messiest parts of any document system," to the point of recommending you shell out to LibreOffice rather than handle it yourself?
   <details><summary>Show answer</summary>The mess isn't the format spec — it's that real-world files violate the spec in creative ways: non-standard internal paths, corrupt structures, unusual encodings, archives with the wrong path separators. A converter has to survive all of that gracefully, and a mature tool like LibreOffice encodes decades of accumulated fixes for exactly these quirks. Writing your own means rediscovering every one of those edge cases in production, against files you didn't know existed. The lesson generalizes: any place where you ingest arbitrary user-generated artifacts is a place where "the happy path is easy, the long tail is brutal," and buying battle-tested handling beats building it.</details>

3. Citations feel like a display detail, yet the chapter says extraction and rendering "must agree on locations, or citations point to the wrong place." Walk through what actually goes wrong for a user if the text extractor numbers pages differently from the viewer — and why trusting the page numbers printed inside the document makes it worse.
   <details><summary>Show answer</summary>If the extractor and viewer disagree, a citation that says "page 3" scrolls the user to the wrong page and highlights nothing (or the wrong quote) — which quietly destroys trust in every citation, even the correct ones. Printed-in-document page numbers make it worse because they're unreliable: front matter uses roman numerals, some pages are unnumbered, footers lie. By assigning your own sequential markers tied to the rendering, you guarantee that "page 3" means the same physical location to both the citation logic and the viewer. The deeper point is that grounding is only as trustworthy as the weakest link between the claim and the source the user can see.</details>

---

Next: [Chapter 11: Security, auth, and multi-tenancy](chapter-11-security-multitenancy.md)
