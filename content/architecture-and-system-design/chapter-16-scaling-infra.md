# Chapter 16: Scaling and Infrastructure

A demo runs on one process on one laptop. A product serves many users concurrently, holds long-lived streaming connections, processes files, and calls slow external APIs, all without falling over. This chapter covers the infrastructure patterns that take an agent from "works for me" to "works for everyone," and where the bottlenecks actually are.

## What's different about scaling an agent

Agents stress infrastructure in specific ways:

- **Long-lived connections.** Streaming turns hold a connection open for many seconds. A server that assumes short requests will exhaust its connection pool.
- **Slow, external bottleneck.** The dominant latency is the *model provider*, which you don't control. Your own compute is often nearly idle while waiting on the model.
- **Bursty, heavy work.** File processing and bulk extraction spike CPU and memory unpredictably.
- **Rate limits upstream.** Providers and external APIs cap your throughput; scaling your own fleet doesn't help if you hit their ceiling.

So scaling an agent is less about raw compute and more about concurrency, statelessness, and respecting upstream limits.

## Statelessness: the foundation

The single most important property for horizontal scaling is **stateless application servers**. Each request should be servable by any instance, carrying no in-memory state between requests. Achieve it by:

- Keeping all durable state in shared stores (database, object storage, cache), not in process memory.
- Making the agent loop a function of its inputs: it loads context from the database at the start and writes results at the end (Chapters 2, 9), holding nothing between turns.
- Carrying session/identity in tokens validated per request (Chapter 11), not server-side session memory.

With stateless servers, you scale by adding instances behind a load balancer, and any instance can handle any user.

## Handling streaming connections at scale

Long-lived SSE connections need attention:

- **Async, non-blocking I/O.** Use a server model that handles many concurrent open connections cheaply (event-loop or async runtimes), since most connections are just *waiting* on the model. A thread-per-connection model would exhaust threads quickly.
- **Proxy configuration.** Reverse proxies and load balancers must allow long-lived streaming connections and not buffer them (or the real-time feel dies). Configure timeouts and buffering accordingly.
- **Connection cleanup.** When a client disconnects mid-stream, release resources and abort the in-flight model call so abandoned turns stop consuming tokens and compute.
- **Graceful shutdown / deploys.** Draining a server with open streams needs care so in-flight turns finish or fail cleanly rather than being cut off.

## Move heavy work off the request path

CPU/memory-heavy or slow work (document conversion, OCR, large bulk extraction) shouldn't run inside the request that holds a user's connection. As load grows, move it to **background workers** fed by a **queue**:

- The request enqueues a job and returns quickly (with a `processing` status; Chapter 9).
- Workers pull jobs, do the heavy work, and update status; the client polls or subscribes for completion.
- Workers scale independently of the web tier, so a burst of uploads doesn't starve interactive chat.

As emphasized in Chapter 10, *design for this from the start with status fields even if you begin synchronous*; the migration to workers is then localized.

## Respect and manage upstream rate limits

You can scale your fleet infinitely and still be capped by the model provider's rate limits. Manage them deliberately:

- **Concurrency control / queuing** toward providers so you don't blow past limits and trigger errors.
- **Backoff and retry** on rate-limit responses (Chapter 13).
- **Spread load** across providers or accounts where appropriate; tiering (Chapter 14) also helps by sending bulk work to higher-throughput smaller models.
- **Cache** to avoid redundant calls (Chapter 9).

When fanning out parallel work (bulk extraction), bound the fan-out to stay within limits rather than firing thousands of simultaneous calls.

## Data tier scaling

The database and storage have their own scaling story:

- **Connection pooling.** Many app instances × many connections can overwhelm a database; use a pooler. (Note that schema-migration/DDL connections sometimes need a separate, unpooled path.)
- **Indexing for access paths.** Index the columns your hot queries filter and sort on (per-user, per-project, per-document-by-time). Avoid N+1 queries by batching lookups (e.g. resolve many artifacts' current versions in one query).
- **Object storage for blobs.** Keep large content in object storage, the database for metadata and pointers (Chapter 9). Object storage scales effectively infinitely; your database stays lean.
- **Read/write patterns.** As you grow, consider read replicas for heavy read paths, and keep write paths (the turn-persistence) lean.

## Caching tiers

Introduce caching where it pays:

- **External-API cache** (a table or a fast cache like Redis) for slow/rate-limited upstream calls.
- **Hot-data cache** for frequently-read, rarely-changed data.
- **Provider prompt caching** by keeping a stable context prefix (Chapter 14).

Add these as evidence (from observability, Chapter 15) shows a hotspot, not preemptively.

## Don't over-build early

A caution: it's easy to design a microservice-and-queue cathedral before you have users. The pragmatic path:

- **Start as a single well-structured service** with a relational DB and object storage. This scales remarkably far with stateless instances behind a load balancer.
- **Keep the seams ready**: status fields for future async, a provider abstraction, stateless servers, so you can extract workers and add caches *when the load justifies it*.
- **Let observability drive infra decisions.** Add the queue when synchronous processing actually hurts; add the cache when a call is actually hot; add replicas when reads actually saturate. Build for the scale you have plus a bit, not the scale you fantasize about.

## Deployment and operational basics

- **Containerize** so the runtime (including any subprocess dependencies like a document converter) is reproducible.
- **Health checks** so the load balancer routes only to healthy instances.
- **Horizontal autoscaling** on the stateless web tier based on connections/CPU; separate scaling for workers based on queue depth.
- **Config via environment** (secrets in a manager; Chapter 12), so the same image runs in every environment.
- **Observability and alerting** (Chapter 15) so you see saturation and failures before users do.

## The scaling mindset

Scaling an agent is mostly about **statelessness, concurrency, and respecting the slow external bottleneck**. Keep servers stateless so you can add them freely; use async I/O so idle streaming connections are cheap; push heavy work to workers behind a queue; keep blobs in object storage and metadata in a well-indexed database; cache and rate-limit toward upstreams; and let real measurements, not speculation, tell you when to add the next piece of infrastructure.

## Review

**Quick Check**

1. According to the chapter, the single most important property for horizontal scaling is:
   - A) A powerful multi-core CPU on each instance
   - B) Stateless application servers, with all durable state in shared stores
   - C) In-memory session caching on each server
   - D) A single large database connection per request
   <details><summary>Answer</summary>B) Stateless application servers - if each request can be served by any instance with no in-memory state carried between requests, you scale simply by adding instances behind a load balancer.</details>

2. Why does the chapter favor async, non-blocking I/O for handling streaming connections?
   - A) It reduces the number of tokens the model consumes
   - B) It encrypts the connection automatically
   - C) Most connections are just waiting on the model, so an event-loop runtime handles many cheap open connections while a thread-per-connection model would exhaust threads
   - D) It removes the need for a load balancer
   <details><summary>Answer</summary>C) Streaming connections spend most of their time idle, waiting on the model; an async runtime keeps those waiting connections cheap, whereas a thread-per-connection model would exhaust threads quickly.</details>

3. A burst of document uploads triggers heavy OCR and conversion that starts slowing down interactive chat for everyone. What does the chapter recommend?
   - A) Run the conversion inside the request that holds the user's connection
   - B) Add more model providers
   - C) Move the heavy work to background workers fed by a queue, so workers scale independently of the web tier
   - D) Disable streaming during high load
   <details><summary>Answer</summary>C) CPU/memory-heavy or slow work should be moved off the request path to background workers behind a queue; workers scale independently, so a burst of uploads doesn't starve interactive chat.</details>

4. You've scaled your own fleet massively but still hit errors under load. The chapter warns that this is often because:
   - A) You don't have enough database indexes
   - B) You're capped by the model provider's (or external API's) rate limits, which more of your own instances won't fix
   - C) Your health checks are misconfigured
   - D) Your containers are too large
   <details><summary>Answer</summary>B) Upstream rate limits cap your throughput regardless of your own fleet size; manage them with concurrency control/queuing toward providers, backoff and retry, spreading load, and caching.</details>

5. Where does the chapter say large content (file bytes) should live versus the database?
   - A) All content in the database as BLOB columns
   - B) Large content in object storage, with the database holding metadata and pointers
   - C) Large content in process memory for speed
   - D) Large content only in the CDN cache
   <details><summary>Answer</summary>B) Keep large blobs in object storage (which scales effectively infinitely) and use the database only for metadata and pointers, so the database stays lean.</details>

**More Questions**

6. What is the chapter's caution about infrastructure and "don't over-build early"?
   - A) Always start with microservices and queues to be safe
   - B) Build for the scale you fantasize about so you never have to change
   - C) Start as a single well-structured service with a relational DB and object storage, keep the seams ready, and add complexity when load justifies it
   - D) Avoid load balancers until you have millions of users
   <details><summary>Answer</summary>C) Start simple - a single well-structured stateless service scales remarkably far; keep seams ready (status fields, provider abstraction) and add workers, caches, and replicas only when real load justifies them.</details>

7. Why does the chapter recommend a connection pooler for the data tier?
   - A) It makes individual queries run faster
   - B) Many app instances each opening many connections can overwhelm a database, so a pooler bounds and shares connections
   - C) It encrypts data at rest
   - D) It replaces the need for indexes
   <details><summary>Answer</summary>B) With many app instances × many connections you can overwhelm the database; a pooler manages that. (Note schema-migration/DDL connections sometimes need a separate, unpooled path.)</details>

8. A client closes its browser tab in the middle of a streamed turn. What should the server do, per the chapter?
   - A) Keep the model call running to finish the turn for later
   - B) Ignore it; the connection will time out eventually
   - C) Release resources and abort the in-flight model call so the abandoned turn stops consuming tokens and compute
   - D) Restart the whole instance
   <details><summary>Answer</summary>C) On client disconnect, clean up resources and abort the in-flight model call, so abandoned turns stop burning tokens and compute.</details>

9. The chapter says caching tiers and other infrastructure should be added:
   - A) Preemptively, before launch, to be ready
   - B) When evidence from observability shows an actual hotspot or the load actually justifies it
   - C) Only after a customer complains in writing
   - D) On a fixed quarterly schedule
   <details><summary>Answer</summary>B) Let observability drive infra decisions - add the queue when synchronous processing actually hurts, the cache when a call is actually hot, replicas when reads actually saturate.</details>

10. What does the chapter identify as the dominant source of latency when running an agent, and what is the consequence for your own compute?
    - A) Disk I/O; your CPU is saturated
    - B) The model provider (an external bottleneck you don't control); your own compute is often nearly idle while waiting on the model
    - C) Network routing inside your data center; your memory is exhausted
    - D) The load balancer; your database is the bottleneck
    <details><summary>Answer</summary>B) The dominant latency is the model provider, which you don't control, so your own compute is often nearly idle while waiting - which is exactly why concurrency and statelessness matter more than raw compute.</details>

**Coding Challenge**

**Bounded fan-out**

The chapter says when fanning out parallel work (e.g. bulk extraction) you must *bound the fan-out* to stay within upstream rate limits rather than firing thousands of simultaneous calls. Write an async `bounded_gather(tasks, limit)` that runs an iterable of coroutine-producing callables with at most `limit` running concurrently, and returns results in the original order.

<details>
<summary>Python Solution</summary>

```python
import asyncio

async def bounded_gather(task_factories, limit):
    """Run coroutine-producing callables with at most `limit` in flight.

    task_factories: iterable of zero-arg callables that return a coroutine.
    Returns results in the original order.
    """
    semaphore = asyncio.Semaphore(limit)

    async def run(factory):
        async with semaphore:          # bound concurrency toward the upstream
            return await factory()

    return await asyncio.gather(*(run(f) for f in task_factories))


# Demo: 20 "provider calls" but never more than 3 concurrently
async def fake_call(i):
    await asyncio.sleep(0.01)
    return i * i

async def main():
    factories = [lambda i=i: fake_call(i) for i in range(20)]
    results = await bounded_gather(factories, limit=3)
    print(results)                     # [0, 1, 4, 9, ..., 361] in order

asyncio.run(main())
```

</details>

**Think About It**

1. A newcomer sizes the agent's servers by CPU cores, reasoning "more compute, more users." But the chapter says your own compute is often *nearly idle* even under load. How can a server be busy serving hundreds of users and barely using its CPU at the same time — and what does that tell you about what you should actually be scaling?
   <details><summary>Show answer</summary>The bottleneck isn't your code, it's the model provider on the other end of the network. Each streaming turn spends most of its wall-clock time simply waiting for tokens to come back, so the CPU sits idle while the connection stays open. If you scale on CPU you'll add machines that are also mostly idle. What you're really scaling is the ability to hold many concurrent *waiting* connections cheaply — which is why the chapter points you at async I/O and statelessness rather than raw horsepower. The slow external dependency, not your compute, defines the shape of the problem.</details>

2. The classic web server assigns one thread per connection, and it worked fine for decades. Why would that same battle-tested design fall over the moment you put streaming agent turns behind it — and what changed about the *shape* of a request to break it?
   <details><summary>Show answer</summary>Thread-per-connection assumes requests are short: grab a thread, do the work, release it fast, so a modest thread pool serves huge traffic. A streaming turn inverts that: the connection stays open for many seconds, mostly idle, waiting on the model. Each open turn pins a thread that's doing nothing, so a few hundred simultaneous streams can exhaust the whole pool while the CPU is bored. The event-loop/async model fixes it by decoupling "connection is open" from "a thread is blocked," letting one worker juggle thousands of waiting connections. It's the long-lived, mostly-waiting nature of the request that breaks the old design.</details>

3. It's tempting to build the microservices-plus-queue "cathedral" up front so you never have to re-architect later. The chapter argues the opposite. What actually goes wrong when you build for the scale you fantasize about, and what does "keep the seams ready" let you avoid without paying that cost now?
   <details><summary>Show answer</summary>Premature distributed architecture buys you operational complexity — more moving parts, more failure modes, harder debugging, slower iteration — long before you have the load or the data to know where the real bottlenecks are, so you often optimize the wrong thing. The chapter's middle path is to start as one well-structured stateless service but leave the *seams* in place: status fields ready for async, a provider abstraction, stateless servers. Those seams cost almost nothing now, yet they make extracting a worker queue or adding a cache a localized change later, driven by observability, once the load actually justifies it. You get future flexibility without paying today's complexity tax.</details>

---

Next: [Chapter 17: Domain-specific and regulated-industry agents](chapter-17-domain-and-compliance.md)
