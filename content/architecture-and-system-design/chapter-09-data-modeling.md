# Chapter 9 — Data Modeling for Agents

An agent's data model is easy to underestimate and expensive to get wrong. It must capture conversations richly enough to replay them, version the artifacts the agent produces, preserve an audit trail, and track the state of long-running work. This chapter covers the modeling patterns that recur across agents, independent of any particular database.

## Conversations as event logs, not transcripts

The instinct is to model a conversation as a list of `{role, text}` messages. For an agent, that's not enough. An assistant turn isn't just text — it read three documents, generated a file, proposed five edits, and cited four sources. If you store only the final text, you lose all of that, and a reloaded conversation can't show the chips, cards, and citations the user saw live.

So model assistant messages as **structured event logs**: an ordered array of typed events (`content`, `reasoning`, `document_read`, `document_generated`, `document_edited`, `citation`, …) — the same timeline you streamed (Chapter 8). Store it as a JSON column. On reload, replay the events to reconstruct the rich rendering exactly. The conversation table thus holds, per message: role, the event array (for assistant turns), the user's attachments and selections (for user turns), and any extracted annotations (citations, edits).

This single decision — *events, not transcripts* — is what makes faithful conversation replay possible.

## Persist at the edges of the turn

A reliability pattern that's really a data-modeling decision: **save the user's message before the model runs, and save the assistant's outcome after.** If you only persist at the end, a failed or interrupted turn loses the user's input. By writing the user message immediately, the conversation is durable regardless of what happens during generation. The orchestrator stays a stateless function between these two writes (Chapter 2).

## Artifacts as versioned, immutable records

Agents that produce or modify artifacts — documents, datasets, code — need versioning, and the right model is **immutable versions with a pointer to the current one**:

- An **artifact identity** record (stable id, name, owner, status) that doesn't hold the content location directly.
- A **versions** table: one row per version, each pointing at its stored content, with a `version_number`, a `source` (how this version came to be), and timestamps. Versions are never mutated; new states create new rows.
- The identity record holds a `current_version_id` pointer to whichever version is live.

This gives you a complete, trustworthy history: you can see how an artifact evolved, diff versions, and roll back. The `source` field (e.g. `upload`, `generated`, `agent_edit`, `user_accept`, `user_reject`) doubles as an audit trail of *who or what* produced each version.

Separating content location from identity (paths live on versions, not on the artifact) is the key move that makes clean versioning possible — the artifact just knows its current version; the version knows where its bytes are.

## Modeling fine-grained changes

When the agent proposes changes a user can individually accept or reject (edits, suggestions), model each **change as its own row**: what it changes, where (anchored), the agent's reason, and a `status` (`pending`/`accepted`/`rejected`) with a resolution timestamp. This first-class modeling is what lets the UI present granular accept/reject controls and lets the system track resolution. A change is data, not just text inside a document.

## State machines with explicit status fields

Anything asynchronous or multi-step needs an explicit **status field** that names each state. Documents move `processing → ready → error`; extraction cells move `pending → generating → done → error`; changes move `pending → accepted/rejected`. Benefits:

- The UI can render the right state (spinner, value, error) directly from the field.
- Work is **resumable** — you can find everything still `pending` and continue.
- It's a natural seam to make a synchronous flow asynchronous later (move the work to a worker; the status field is already there).

Constrain these fields to their valid values at the database level (a check constraint or enum) so an invalid state can't be written.

## The snapshot-vs-current reconciliation

A subtle but common issue: a conversation message captures a *point-in-time snapshot* (e.g. "this edit was pending when the agent proposed it"), but some referenced facts are *mutable* (the edit was later accepted). You have two options:

1. **Update every historical snapshot** when the underlying fact changes — expensive and error-prone.
2. **Reconcile on read** — store the snapshot as-is, and when loading the conversation, re-read the current state of referenced mutable records and patch the snapshot before sending it to the client.

Option 2 is usually better: it keeps writes cheap and localised, and accepts a small read-time join to present current truth. Design your read path to reconcile snapshots against live records for any field that can change after it's recorded.

## Sharing and multi-tenancy in the schema

If artifacts and conversations can be shared, model sharing **explicitly**: an owner field plus a `shared_with` list (of user ids or emails), or a separate shares table with per-grant permissions. Make the sharing rule visible in the data so your access checks (Chapter 11) can evaluate it directly. Nullable "container" references (a document may or may not belong to a project) let the same tables serve both standalone and grouped use.

## Metering and limits

Commercial agents usually meter usage. Bake the scaffolding into the data model early: per-user counters (messages/tokens used), reset dates, and a tier/plan field. Even if you don't enforce limits on day one, having the fields means you can turn enforcement on without a migration scramble.

## Caching external calls

Agents lean on external APIs that are slow, rate-limited, or costly. A simple **cache table** — keyed by a deterministic request key, storing the response payload and an expiry — turns repeated identical calls into instant lookups and shields you from upstream limits. Index the expiry for cleanup. This is data modeling in service of reliability and cost (Chapters 13, 14).

## Choosing a store

Most agents are well served by a **relational database (Postgres)** for structured state — conversations, artifacts, versions, users, sharing — plus **object storage** (S3-compatible) for the large binary content, with the database holding only paths/pointers. Add a **vector store** only if you adopt semantic search (Chapter 7), and a **cache/queue** (Redis, a job queue) as scale demands (Chapters 13, 16). Resist the urge to start with a sprawl of specialised stores; a relational DB plus object storage covers a remarkable amount.

## What a good agent schema reveals

A well-designed agent data model, read on its own, tells you what the product does: artifacts are versioned and audited (there's a versions table with a source enum); work is shareable (explicit share fields); conversations are rich event logs (JSON content, not text); async work has status fields; usage is metered; external calls are cached. The schema *is* the product, expressed in tables — so design it as deliberately as you design the agent loop.

---

Next: [Chapter 10 — Document and file processing pipelines](chapter-10-document-pipelines.md)

---

## Review

### Quick Check

1. Why model assistant turns as structured event logs rather than as plain {role, text} messages?
   * A) It uses less storage than text
   * B) Providers require this exact format
   * C) Plain text cannot reproduce the chips, cards, and citations the user saw live
   * D) It removes the need for a database
   <details><summary>Answer</summary>C) Plain text cannot reproduce the chips, cards, and citations the user saw live - storing the event timeline is what makes faithful replay possible.</details>

2. In the immutable-versioning model, what does the artifact identity record hold to locate the live content?
   * A) A current_version_id pointer to the live version
   * B) The raw bytes stored inline
   * C) Nothing; versions are mutated in place
   * D) A concatenated list of every file path
   <details><summary>Answer</summary>A) A current_version_id pointer to the live version - versions are immutable rows, and the identity just points at the current one.</details>

3. An edit was "pending" when proposed but later accepted, yet loading the old conversation should show current truth. Best approach?
   * A) Update every historical snapshot whenever the underlying fact changes
   * B) Reconcile on read - store the snapshot as-is, then patch it against live records when loading
   * C) Never store snapshots at all
   * D) Re-run the agent to regenerate the turn
   <details><summary>Answer</summary>B) Reconcile on read - keep writes cheap and localised, and accept a small read-time join to present current truth.</details>

4. You want async extraction work to be resumable after a crash. Which modeling choice enables this?
   * A) Storing only the final results
   * B) A larger context window
   * C) Caching the model output
   * D) An explicit status field (pending/generating/done/error) you can query for unfinished work
   <details><summary>Answer</summary>D) An explicit status field you can query for unfinished work - you can find everything still pending and continue.</details>

5. What is the chapter's advice on choosing data stores?
   * A) Start with many specialised stores, one per data type
   * B) Use a vector database as the primary store by default
   * C) A relational database plus object storage covers most needs; add a vector store only if you adopt semantic search
   * D) Store large binaries directly inside the relational database
   <details><summary>Answer</summary>C) A relational database plus object storage covers a remarkable amount; add a vector store only when you adopt semantic search.</details>

### Coding Challenge

**Implement an immutable versioned artifact store**

Build an `ArtifactStore` that appends immutable versions (each with content and a `source`), tracks the live version with a `current_version_id` pointer, exposes `get_current()`, and supports `rollback(version_id)` as a pointer move that never rewrites data.

<details>
<summary>Python Solution</summary>

```python
class ArtifactStore:
    def __init__(self):
        self.versions = []          # immutable rows, never mutated
        self.current_id = None

    def add_version(self, content, source):
        version = {"id": len(self.versions) + 1, "content": content, "source": source}
        self.versions.append(version)
        self.current_id = version["id"]
        return version["id"]

    def get_current(self):
        return next(v for v in self.versions if v["id"] == self.current_id)

    def rollback(self, version_id):
        self.current_id = version_id    # pointer move, no data rewrite


store = ArtifactStore()
store.add_version("draft v1", "generated")
store.add_version("draft v2", "agent_edit")
print(store.get_current())              # v2
store.rollback(1)
print(store.get_current())              # back to v1
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
class ArtifactStore {
  constructor() {
    this.versions = []; // immutable rows, never mutated
    this.currentId = null;
  }
  addVersion(content, source) {
    const version = { id: this.versions.length + 1, content, source };
    this.versions.push(version);
    this.currentId = version.id;
    return version.id;
  }
  getCurrent() {
    return this.versions.find((v) => v.id === this.currentId);
  }
  rollback(versionId) {
    this.currentId = versionId; // pointer move, no data rewrite
  }
}

const store = new ArtifactStore();
store.addVersion("draft v1", "generated");
store.addVersion("draft v2", "agent_edit");
console.log(store.getCurrent()); // v2
store.rollback(1);
console.log(store.getCurrent()); // back to v1
```

</details>
