# Chapter 9: Data Modeling for Agents

An agent's data model is easy to underestimate and expensive to get wrong. It must capture conversations richly enough to replay them, version the artifacts the agent produces, preserve an audit trail, and track the state of long-running work. This chapter covers the modeling patterns that recur across agents, independent of any particular database.

## Conversations as event logs, not transcripts

The instinct is to model a conversation as a list of `{role, text}` messages. For an agent, that's not enough. An assistant turn isn't just text: it read three documents, generated a file, proposed five edits, and cited four sources. If you store only the final text, you lose all of that, and a reloaded conversation can't show the chips, cards, and citations the user saw live.

So model assistant messages as **structured event logs**: an ordered array of typed events (`content`, `reasoning`, `document_read`, `document_generated`, `document_edited`, `citation`, …), the same timeline you streamed (Chapter 8). Store it as a JSON column. On reload, replay the events to reconstruct the rich rendering exactly. The conversation table thus holds, per message: role, the event array (for assistant turns), the user's attachments and selections (for user turns), and any extracted annotations (citations, edits).

This single decision, *events, not transcripts*, is what makes faithful conversation replay possible.

## Persist at the edges of the turn

A reliability pattern that's really a data-modeling decision: **save the user's message before the model runs, and save the assistant's outcome after.** If you only persist at the end, a failed or interrupted turn loses the user's input. By writing the user message immediately, the conversation is durable regardless of what happens during generation. The orchestrator stays a stateless function between these two writes (Chapter 2).

## Artifacts as versioned, immutable records

Agents that produce or modify artifacts, documents, datasets, code, need versioning, and the right model is **immutable versions with a pointer to the current one**:

- An **artifact identity** record (stable id, name, owner, status) that doesn't hold the content location directly.
- A **versions** table: one row per version, each pointing at its stored content, with a `version_number`, a `source` (how this version came to be), and timestamps. Versions are never mutated; new states create new rows.
- The identity record holds a `current_version_id` pointer to whichever version is live.

This gives you a complete, trustworthy history: you can see how an artifact evolved, diff versions, and roll back. The `source` field (e.g. `upload`, `generated`, `agent_edit`, `user_accept`, `user_reject`) doubles as an audit trail of *who or what* produced each version.

Separating content location from identity (paths live on versions, not on the artifact) is the key move that makes clean versioning possible: the artifact just knows its current version; the version knows where its bytes are.

## Modeling fine-grained changes

When the agent proposes changes a user can individually accept or reject (edits, suggestions), model each **change as its own row**: what it changes, where (anchored), the agent's reason, and a `status` (`pending`/`accepted`/`rejected`) with a resolution timestamp. This first-class modeling is what lets the UI present granular accept/reject controls and lets the system track resolution. A change is data, not just text inside a document.

## State machines with explicit status fields

Anything asynchronous or multi-step needs an explicit **status field** that names each state. Documents move `processing → ready → error`; extraction cells move `pending → generating → done → error`; changes move `pending → accepted/rejected`. Benefits:

- The UI can render the right state (spinner, value, error) directly from the field.
- Work is **resumable**: you can find everything still `pending` and continue.
- It's a natural seam to make a synchronous flow asynchronous later (move the work to a worker; the status field is already there).

Constrain these fields to their valid values at the database level (a check constraint or enum) so an invalid state can't be written.

## The snapshot-vs-current reconciliation

A subtle but common issue: a conversation message captures a *point-in-time snapshot* (e.g. "this edit was pending when the agent proposed it"), but some referenced facts are *mutable* (the edit was later accepted). You have two options:

1. **Update every historical snapshot** when the underlying fact changes: expensive and error-prone.
2. **Reconcile on read**: store the snapshot as-is, and when loading the conversation, re-read the current state of referenced mutable records and patch the snapshot before sending it to the client.

Option 2 is usually better: it keeps writes cheap and localised, and accepts a small read-time join to present current truth. Design your read path to reconcile snapshots against live records for any field that can change after it's recorded.

## Sharing and multi-tenancy in the schema

If artifacts and conversations can be shared, model sharing **explicitly**: an owner field plus a `shared_with` list (of user ids or emails), or a separate shares table with per-grant permissions. Make the sharing rule visible in the data so your access checks (Chapter 11) can evaluate it directly. Nullable "container" references (a document may or may not belong to a project) let the same tables serve both standalone and grouped use.

## Metering and limits

Commercial agents usually meter usage. Bake the scaffolding into the data model early: per-user counters (messages/tokens used), reset dates, and a tier/plan field. Even if you don't enforce limits on day one, having the fields means you can turn enforcement on without a migration scramble.

## Caching external calls

Agents lean on external APIs that are slow, rate-limited, or costly. A simple **cache table**, keyed by a deterministic request key, storing the response payload and an expiry, turns repeated identical calls into instant lookups and shields you from upstream limits. Index the expiry for cleanup. This is data modeling in service of reliability and cost (Chapters 13, 14).

## Choosing a store

Most agents are well served by a **relational database (Postgres)** for structured state, conversations, artifacts, versions, users, sharing, plus **object storage** (S3-compatible) for the large binary content, with the database holding only paths/pointers. Add a **vector store** only if you adopt semantic search (Chapter 7), and a **cache/queue** (Redis, a job queue) as scale demands (Chapters 13, 16). Resist the urge to start with a sprawl of specialised stores; a relational DB plus object storage covers a remarkable amount.

## What a good agent schema reveals

A well-designed agent data model, read on its own, tells you what the product does: artifacts are versioned and audited (there's a versions table with a source enum); work is shareable (explicit share fields); conversations are rich event logs (JSON content, not text); async work has status fields; usage is metered; external calls are cached. The schema *is* the product, expressed in tables, so design it as deliberately as you design the agent loop.

## Review

**Quick Check**

1. Why is `{role, text}` insufficient for modelling an agent's assistant turn?
   - A) Because roles change mid-turn
   - B) Because a turn also read documents, generated files, proposed edits, and cited sources — all lost if you store only final text
   - C) Because text columns have length limits
   - D) Because the model needs its own role
   <details><summary>Answer</summary>B) A reloaded conversation couldn't show the chips, cards, and citations the user saw live. Model assistant messages as ordered arrays of typed events instead.</details>

2. What is the "persist at the edges of the turn" pattern?
   - A) Write to the database only when the stream completes successfully
   - B) Save the user's message before the model runs and the assistant's outcome after
   - C) Persist every token as it arrives
   - D) Store conversations in the edge cache rather than the primary database
   <details><summary>Answer</summary>B) Writing the user message immediately makes the conversation durable regardless of what happens during generation; the orchestrator stays a stateless function between the two writes.</details>

3. In the recommended artifact-versioning model, where does the content location live?
   - A) On the artifact identity record
   - B) On each version row, with the artifact holding a `current_version_id` pointer
   - C) In a separate storage-index table keyed by owner
   - D) Inline in the conversation event log
   <details><summary>Answer</summary>B) Separating content location from identity is the key move: the artifact knows its current version, the version knows where its bytes are.</details>

4. What does the `source` field on a version row (e.g. `upload`, `generated`, `agent_edit`, `user_accept`) give you?
   - A) A hint for the storage tier to use
   - B) A way to deduplicate identical versions
   - C) An audit trail of who or what produced each version
   - D) The permission level required to read it
   <details><summary>Answer</summary>C) It doubles as an audit trail, recording how each version came to be alongside the complete, immutable history.</details>

5. The chapter lists three benefits of explicit status fields. Which is NOT one of them?
   - A) The UI can render the right state directly from the field
   - B) Work becomes resumable — you can find everything still `pending`
   - C) It's a natural seam for making a synchronous flow asynchronous later
   - D) It removes the need for database-level constraints
   <details><summary>Answer</summary>D) The opposite — constrain status fields to their valid values with a check constraint or enum so an invalid state can't be written.</details>

**More Questions**

6. A conversation message recorded an edit as `pending`, but the user later accepted it. Which approach does the chapter prefer?
   - A) Update every historical snapshot when the underlying fact changes
   - B) Reconcile on read: store the snapshot as-is, then patch it against current state when loading
   - C) Forbid mutable facts from appearing in messages
   - D) Re-run the agent turn to regenerate the message
   <details><summary>Answer</summary>B) Reconcile on read. It keeps writes cheap and localised, at the cost of a small read-time join to present current truth.</details>

7. How does the chapter suggest modelling agent-proposed changes a user can individually accept or reject?
   - A) As markup embedded in the document text
   - B) As one row per change: what it changes, where (anchored), the agent's reason, and a status with a resolution timestamp
   - C) As a diff string stored on the version row
   - D) As separate artifact versions, one per change
   <details><summary>Answer</summary>B) A change is data, not text inside a document. First-class rows are what let the UI offer granular accept/reject controls and let the system track resolution.</details>

8. What does the chapter recommend baking into the data model early even if you won't enforce it on day one?
   - A) A vector store for semantic search
   - B) Metering scaffolding: per-user counters, reset dates, and a tier/plan field
   - C) Row-level encryption on every table
   - D) A full event-sourcing log for all tables
   <details><summary>Answer</summary>B) Having the metering fields means you can turn enforcement on later without a migration scramble.</details>

9. Your agent calls a slow, rate-limited external API, and the same lookups repeat constantly. What data-modeling move does the chapter suggest?
   - A) Move the calls into a background worker
   - B) A cache table keyed by a deterministic request key, storing the response payload and an expiry (indexed for cleanup)
   - C) Store the responses in the conversation event log
   - D) Batch the calls into a nightly job
   <details><summary>Answer</summary>B) A simple cache table turns repeated identical calls into instant lookups and shields you from upstream limits — data modeling in service of reliability and cost.</details>

10. What default storage combination does the chapter recommend for most agents?
    - A) A document database plus a vector store
    - B) A relational database (Postgres) for structured state plus object storage for large binary content
    - C) Object storage alone, with metadata in filenames
    - D) A specialised store per concern from the outset
    <details><summary>Answer</summary>B) Postgres for conversations, artifacts, versions, users, and sharing, with object storage holding the bytes and the database holding only pointers. Add a vector store or cache/queue only as need arises.</details>

**Coding Challenge**

*Immutable versions with a current pointer*

Implement an `Artifact` class holding a list of immutable version dicts and a `current_version_id`. `add_version(path, source)` appends a new version with an incrementing `version_number` and updates the pointer; `current()` returns the live version; `rollback_to(version_id)` moves the pointer without deleting or mutating anything.

<details>
<summary>Python Solution</summary>

```python
class Artifact:
    def __init__(self, name):
        self.name = name
        self.versions = []              # immutable: never mutated, only appended
        self.current_version_id = None

    def add_version(self, path, source):
        version = {
            "id": len(self.versions) + 1,
            "version_number": len(self.versions) + 1,
            "path": path,               # location lives on the version, not the artifact
            "source": source,           # upload | generated | agent_edit | user_accept ...
        }
        self.versions.append(version)
        self.current_version_id = version["id"]
        return version

    def current(self):
        return next(
            (v for v in self.versions if v["id"] == self.current_version_id), None
        )

    def rollback_to(self, version_id):
        if not any(v["id"] == version_id for v in self.versions):
            raise ValueError(f"no such version: {version_id}")
        self.current_version_id = version_id   # pointer move; history is preserved
        return self.current()


a = Artifact("nda.docx")
a.add_version("s3://docs/nda-v1.docx", "upload")
a.add_version("s3://docs/nda-v2.docx", "agent_edit")
print(a.current())        # version 2, source agent_edit
print(a.rollback_to(1))   # version 1, source upload
print(len(a.versions))    # 2 - nothing was destroyed
```

</details>

**Think About It**

1. The chapter says a well-designed agent schema, read on its own, "tells you what the product does." Try reading one backwards: if you opened a database and found a versions table with a `source` enum, JSON conversation content, status fields, and a shares table — what would you already know about the product before seeing a single line of code, and why is that a design goal rather than a coincidence?
   <details><summary>Show answer</summary>You'd know artifacts are versioned and audited, that conversations are rich event logs rather than transcripts, that some work is asynchronous and resumable, and that users can share things — which is most of the product's behaviour. That legibility isn't accidental: each of those columns exists because a product capability demanded it, so the schema is the capability set written down. The practical upshot is that vague schemas signal vague products; if you can't tell from the tables whether history is recoverable or work is resumable, the answer is usually "no." That's why the chapter says to design the schema as deliberately as the agent loop.</details>

2. "Reconcile on read" looks like the lazier of the two options — you're leaving stale data lying around and patching it at query time. Why does the chapter call the diligent-sounding alternative, updating every historical snapshot, the error-prone one?
   <details><summary>Show answer</summary>Because updating snapshots means every mutation must find and rewrite every past message that mentioned the changed fact — a fan-out that grows with conversation length and multiplies with every new referencing message type. Miss one path and you get silently inconsistent history, which is worse than obviously stale history because nothing signals the error. Reconcile-on-read inverts this: writes stay cheap and local, and the read path does one join to present current truth in a single place you can reason about and test. The general pattern — store what happened, derive what's true now — keeps correctness concentrated instead of scattered.</details>

3. The advice to save the user's message *before* the model runs sounds like a reliability tip, but the chapter files it under data modeling. What does that placement reveal about the relationship between where you write and how failures feel to a user?
   <details><summary>Show answer</summary>Where you place your writes determines what survives a crash, which means the durability boundary is a schema decision as much as an error-handling one. Persist only at the end and an interrupted turn takes the user's typed message with it — the most infuriating possible failure, since they did the work and lost it. Writing at the edges means the worst case degrades to "the assistant failed to respond," with the input intact and a retry available. It also keeps the orchestrator a clean stateless function between two known writes, which is exactly why the reliability property and the model design are the same decision.</details>

4. Immutable versions never overwrite anything, so a heavily edited document accumulates rows forever. Why does the chapter treat that growth as acceptable — even desirable — when most of the versions will never be read again?
   <details><summary>Show answer</summary>Because the value of the history isn't in routine reads, it's in the questions you can only answer if you kept it: how did this clause get here, what did the agent change versus the user, can we roll back a bad edit, what did the document look like when it was signed. Those questions arrive unpredictably and are unanswerable retroactively if you overwrote. The cost is cheap — rows and object storage — while the alternative risks the one scenario where you truly need the past. And because versions are immutable and the artifact just holds a pointer, rollback is a pointer move rather than a destructive restore, so keeping everything actually makes the operation simpler, not harder.</details>

---

Next: [Chapter 10: Document and file processing pipelines](chapter-10-document-pipelines.md)
