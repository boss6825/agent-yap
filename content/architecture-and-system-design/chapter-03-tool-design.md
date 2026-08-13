# Chapter 3: Tool Design

Tools are how an agent acts. The set of tools defines what an agent *can* do; the *design* of those tools determines whether the model uses them correctly. This chapter is about designing tools and their schemas well, arguably the highest-leverage skill in building agents, because a well-designed tool turns an unreliable model into a reliable system, and a badly-designed one does the opposite.

## What a tool is

A tool is a function the model can call, exposed to it as a schema with three parts:

- **A name**: the identifier the model emits to call it.
- **A description**: natural-language instructions telling the model what the tool does and when/how to use it.
- **A parameter schema**: typically JSON Schema, defining the arguments and their types.

When the model wants to act, it emits a tool call: the name plus arguments matching the schema. Your code runs the corresponding function and returns a result, which the model reads. The description and schema are the *entire interface* the model has to your capability, so they must teach, not just declare.

## The description is a prompt

The single most important idea in tool design: **a tool description is a mini system prompt for that capability.** The model decides whether and how to call a tool almost entirely from its description. So descriptions should:

- **State when to use the tool**, not just what it does. "Always call this before answering questions about a document" is far more effective than "reads a document."
- **State how to use it well.** "Make minimal substitutions of specific words, not whole-line replacements" shapes the model's behaviour decisively.
- **Encode the intended workflow.** If tool B should follow tool A, say so in both descriptions ("after searching, call read_X with the id from the results"). The model learns the sequence.

I would say - Time spent sharpening descriptions usually beats time spent tweaking the system prompt, because descriptions are read exactly when the decision is being made, so think wisely here.

## Granularity: how big should a tool be?

A central design question is tool *granularity*: too fine and the model drowns in calls; too coarse and it can't express what it needs.

- **Too granular**: `open_file`, `read_line`, `close_file` forces the model to orchestrate plumbing. Prefer `read_document`.
- **Too coarse**: a single `do_everything` tool with a giant polymorphic schema confuses the model about what it can actually do.
- **Right-sized**: each tool maps to one meaningful user-level action. "Read a document," "search case law," "generate a document," "edit a document."

A good test: each tool should correspond to a verb a *user* would recognise. If you can't describe the tool in one clear sentence, it's probably mis-sized (i couldn't find a better word🥲).

## The cheap/expensive pairing- A way to reduce token usage in models :-P

A recurring, valuable pattern: offer a **cheap, narrow** variant alongside an **expensive, broad** one, so the model can pick the right cost for the task.

- "Find this phrase in the document" (cheap, targeted) vs. "read the whole document" (expensive, complete).
- "Get just the metadata" (cheap) vs. "fetch the full text" (expensive).
- "List what's available" (cheap discovery) vs. "fetch these N items" (expensive retrieval).

Without the cheap option, the model pays full price for every lookup: more tokens, more latency, more cost. The cheap variant lets it confirm a fact or locate a needle without ingesting a haystack. Give the model economical options and it will often use them.

## Batching

When the model commonly needs N of something, give it a tool that does N at once rather than forcing N separate calls. "Fetch these documents" (a list) beats N× "fetch this document." ***Batching cuts round-trips, which cuts latency and loop iterations***. Cap the batch size in the schema to prevent abuse.

## Schema discipline

The parameter schema is your guardrail against malformed calls. Tighten it:

- **Use enums** for fields with a fixed set of values. The model can't send an invalid option.
- **Use bounds** (`minimum`/`maximum`) for numbers. "Create up to 20 copies," not unbounded.
- **Mark required fields** explicitly, and keep optional fields genuinely optional.
- **Describe each field**, not just the tool. A field description like "~40 characters immediately preceding the target text, used to disambiguate" teaches the model how to fill it.
- **Keep schemas flat where possible.** Deeply nested schemas are harder for models to fill correctly.

A tight schema reduces the rate of malformed calls, which reduces error-recovery loops, which improves latency and reliability.

## Structured input for deterministic output

When a tool produces formatted output (a document, a spreadsheet), prefer **structured input** over free text. Instead of "generate a contract" taking a blob of prose, have it take an array of sections with headings, levels, and tables. Then *your code* applies the formatting deterministically. This:

- moves formatting from the unreliable model to reliable code,
- lets you enforce house style/numbering/branding,
- and makes the model responsible only for content.

Tell the model what *not* to do (don't type the numbers, don't repeat the title) because your generator handles those. This division, model decides content, code decides format, is one of the most reliable patterns for producing polished artifacts.

## Tool results are also an interface

The *result* you return is read by the model, so design it too:

- **Return useful errors, not exceptions.** If a tool can't do the thing, return a message the model can act on: "No edits applied; refine your context anchors and retry." The model will adapt. A thrown exception just crashes the turn.
- **Reinforce instructions at the point of use.** Returning a document? Prepend a short reminder of how to cite it. Instructions delivered alongside the data are obeyed more reliably than ones only in the system prompt.
- **Distill, don't dump.** If a tool calls an external API with a huge response, return the decision-relevant fields and cap long ones, rather than flooding the context. Leave a separate tool for "get more detail" when needed. (See Chapters 5 and 7.)
- **Keep results stable and parseable** if your code will read them too.



## Scoping tools to the surface

Not every tool belongs in every context. A tool to "list documents in this folder" makes no sense in a chat with no folder. Offer each tool only where it's meaningful. This keeps the model focused on the relevant capabilities and avoids it attempting actions that can't succeed. Compose the active tool set per surface (general chat, project chat, bulk-extraction chat) from a shared base plus surface-specific extras.

## Tools and the provider abstraction

If you support multiple model providers (Chapter 4), define your tools once in a single canonical schema format and convert to each provider's dialect at the boundary. Then adding a tool is purely additive: one schema, one executor branch, and it works across every model. Don't let provider-specific tool formats leak into your tool definitions.

## A checklist for a well-designed tool

- Does its name map to a recognisable user-level action?
- Does its description say *when* and *how* to use it, not just *what* it does?
- Does it chain to related tools where relevant?
- Is there a cheaper variant for the common case?
- Can the model batch when it needs many?
- Is the schema tight (enums, bounds, required, field descriptions)?
- For formatted output, does it take structured input?
- Does its result return useful errors and distilled (not dumped) data?
- Is it offered only on surfaces where it makes sense?

## Review

**Quick Check**

1. According to the chapter, the single most important idea in tool design is:
   - A) Tools should always be made as granular as possible
   - B) A tool description is a mini system prompt for that capability
   - C) Every tool must return JSON
   - D) Tools should never be batched
   <details><summary>Answer</summary>B) A tool description is a mini system prompt for that capability - the model decides whether and how to call a tool almost entirely from its description.</details>

2. Which schema technique stops the model from sending an invalid option for a fixed-value field?
   - A) Marking the field required
   - B) Adding minimum and maximum bounds
   - C) Using an enum
   - D) Deeply nesting the field
   <details><summary>Answer</summary>C) Using an enum - it restricts the field to a fixed set of values the model cannot deviate from.</details>

3. Your agent pays full cost reading entire documents just to confirm a single fact. Which pattern best addresses this?
   - A) Offering a cheap, targeted "find this phrase" tool alongside the expensive "read whole document" tool
   - B) Increasing the iteration cap
   - C) Returning exceptions instead of error messages
   - D) Removing the read tool entirely
   <details><summary>Answer</summary>A) Offering a cheap, targeted "find this phrase" tool alongside the expensive "read whole document" tool - the cheap/expensive pairing lets the model pick the right cost for the task.</details>

4. You are building a tool that generates a formatted contract. What does the chapter recommend for reliable, polished output?
   - A) Have the tool take a prose blob and let the model format everything
   - B) Take structured input (sections, headings, tables) and let your code apply the formatting deterministically
   - C) Ask the model to also type the clause numbers
   - D) Return the raw API response unfiltered
   <details><summary>Answer</summary>B) Take structured input and let your code apply the formatting deterministically - the model decides content, code decides format.</details>

5. A tool cannot complete its action. What should it return?
   - A) Throw an exception to halt the turn
   - B) An empty string so the model moves on
   - C) A useful error message the model can act on and retry
   - D) The full stack trace for debugging
   <details><summary>Answer</summary>C) A useful error message the model can act on and retry - a thrown exception just crashes the turn, while a clear message lets the model adapt.</details>

**More Questions**

6. Exposing `open_file`, `read_line`, and `close_file` as three separate tools is an example of:
   - A) Right-sized granularity
   - B) Too granular - it forces the model to orchestrate plumbing
   - C) Too coarse - a polymorphic do-everything schema
   - D) The cheap/expensive pairing
   <details><summary>Answer</summary>B) Too granular - it forces the model to orchestrate plumbing when a single `read_document` would do. The opposite failure is a single `do_everything` tool with a giant polymorphic schema.</details>

7. What test does the chapter offer for whether a tool is right-sized?
   - A) It should map to a verb a user would recognise, and be describable in one clear sentence
   - B) Its schema should have at most three fields
   - C) It should complete in under one second
   - D) It should be usable by every model provider
   <details><summary>Answer</summary>A) It should map to a verb a user would recognise, and be describable in one clear sentence - if you can't describe the tool in one clear sentence, it's probably mis-sized.</details>

8. The model routinely needs several documents at once. What does the chapter recommend, and what guard comes with it?
   - A) N separate calls, so each result stays small
   - B) A batch tool that fetches a list, with the batch size capped in the schema
   - C) A single do-everything tool with a polymorphic schema
   - D) Raising the iteration cap to accommodate the extra calls
   <details><summary>Answer</summary>B) A batch tool taking a list, with the size capped in the schema to prevent abuse - batching cuts round-trips, which cuts latency and loop iterations.</details>

9. Your tool set includes "list documents in this folder", but the user is in a plain chat with no folder. What is the fix?
   - A) Return an empty list and let the model figure it out
   - B) Scope tools to the surface, offering each tool only where it is meaningful
   - C) Add a `folder_id` enum with every possible folder
   - D) Move the check into the system prompt
   <details><summary>Answer</summary>B) Scope tools to the surface - compose the active tool set per surface from a shared base plus surface-specific extras, so the model stays focused and doesn't attempt actions that can't succeed.</details>

10. A tool calls an external API that returns an enormous response. What should the tool return to the model?
    - A) The entire payload, so nothing is lost
    - B) Nothing, and log the payload instead
    - C) The decision-relevant fields with long ones capped, plus a separate tool to fetch more detail
    - D) A model-generated summary of the payload
    <details><summary>Answer</summary>C) The decision-relevant fields with long ones capped, plus a separate "get more detail" tool - distill, don't dump. A giant unfiltered payload floods the context and buries the signal.</details>

**Coding Challenge**

**Validate a tool call against its schema**

Write a `validate_call(schema, args)` function that checks arguments against a minimal tool schema. Enforce required fields, enum membership, and numeric minimum/maximum bounds, returning a useful message instead of raising so the model could recover from it.

<details>
<summary>Python Solution</summary>

```python
def validate_call(schema, args):
    """Validate args against a minimal tool schema; return (ok, message)."""
    for field in schema.get("required", []):
        if field not in args:
            return False, f"missing required field: {field}"
    for name, spec in schema.get("properties", {}).items():
        if name not in args:
            continue
        value = args[name]
        if "enum" in spec and value not in spec["enum"]:
            return False, f"{name} must be one of {spec['enum']}"
        if "minimum" in spec and value < spec["minimum"]:
            return False, f"{name} must be >= {spec['minimum']}"
        if "maximum" in spec and value > spec["maximum"]:
            return False, f"{name} must be <= {spec['maximum']}"
    return True, "ok"


schema = {
    "required": ["status", "count"],
    "properties": {
        "status": {"enum": ["open", "closed"]},
        "count": {"minimum": 1, "maximum": 20},
    },
}
print(validate_call(schema, {"status": "open", "count": 5}))    # (True, 'ok')
print(validate_call(schema, {"status": "paused", "count": 5}))  # enum error
print(validate_call(schema, {"status": "open", "count": 99}))   # bound error
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function validateCall(schema, args) {
  for (const field of schema.required || []) {
    if (!(field in args)) return [false, `missing required field: ${field}`];
  }
  for (const [name, spec] of Object.entries(schema.properties || {})) {
    if (!(name in args)) continue;
    const value = args[name];
    if (spec.enum && !spec.enum.includes(value))
      return [false, `${name} must be one of ${spec.enum}`];
    if (spec.minimum !== undefined && value < spec.minimum)
      return [false, `${name} must be >= ${spec.minimum}`];
    if (spec.maximum !== undefined && value > spec.maximum)
      return [false, `${name} must be <= ${spec.maximum}`];
  }
  return [true, "ok"];
}

const schema = {
  required: ["status", "count"],
  properties: {
    status: { enum: ["open", "closed"] },
    count: { minimum: 1, maximum: 20 },
  },
};
console.log(validateCall(schema, { status: "open", count: 5 }));
console.log(validateCall(schema, { status: "paused", count: 5 }));
console.log(validateCall(schema, { status: "open", count: 99 }));
```

</details>

**Think About It**

1. The chapter claims that time spent sharpening a tool description usually beats time spent tweaking the system prompt. How can a paragraph buried in a schema outweigh the agent's top-level instructions?
   <details><summary>Show answer</summary>Timing. The system prompt is read at the start of the call, competing with everything else for the model's attention; the tool description is read at the exact moment the model is deciding whether and how to call that tool. That's why a description should say when to use the tool ("always call this before answering questions about a document"), not just what it does, and should say how to use it well ("make minimal substitutions of specific words, not whole-line replacements"). You can even encode the intended workflow - "after searching, call read_X with the id from the results" - and the model learns the sequence. The description and schema are the entire interface the model has to your capability, so they have to teach, not just declare.</details>

2. Here's a strange one: giving the model an objectively weaker, less capable tool often makes the agent better. Why would that work?
   <details><summary>Show answer</summary>Because capability isn't the only axis - cost is. Without a cheap, narrow option, the model has no choice but to pay full price for every lookup: reading the whole document to confirm one date, fetching full text when metadata would do. Offering "find this phrase in the document" beside "read the whole document" lets the model confirm a fact or locate a needle without ingesting a haystack, which means fewer tokens, less latency, less money. The weak tool isn't a downgrade, it's an option, and the chapter's observation is that if you give the model economical choices, it will often take them.</details>

3. You've got a model that writes genuinely elegant prose. Why should you take formatting away from it?
   <details><summary>Show answer</summary>Because formatting is deterministic work and the model is not a deterministic component. If your contract-generation tool takes a blob of prose, the model is responsible for headings, numbering, tables, and house style - all things it will get subtly wrong some fraction of the time. If it instead takes an array of sections with headings, levels, and tables, your code applies the formatting the same way every time, and you can enforce branding and numbering centrally. The division is "model decides content, code decides format," and it's worth telling the model explicitly what not to do - don't type the numbers, don't repeat the title - because your generator handles those.</details>

4. A tool fails and your instinct is to raise an exception. Why is that instinct, which is correct almost everywhere else in software, wrong here?
   <details><summary>Show answer</summary>Because the model is the caller, and an exception is unreadable to it. A thrown exception crashes the turn and the user gets nothing; a returned message like "No edits applied; refine your context anchors and retry" is something the model can read, understand, and act on - it will adapt and try a better call. The same insight extends further: the result is an interface, so you can reinforce instructions at the point of use, prepending a short reminder of how to cite a document you just returned. Instructions delivered alongside the data are obeyed more reliably than ones that only live in the system prompt.</details>

---

Next: [Chapter 4: Model-provider abstraction and multi-model strategy](chapter-04-provider-abstraction.md)
