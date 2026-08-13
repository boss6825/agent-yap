# Chapter 6: Prompt Architecture

The prompt is the agent's constitution, written in prose. It defines who the agent is, what rules bind it, and, crucially, the structured protocols it must emit so your code can parse its output. This chapter is about architecting prompts so they're effective, maintainable, and don't rot as the system grows.

## The system prompt is a contract

Think of the system prompt as a contract between you and the model: "behave like this, follow these rules, emit output in these formats." It's the one piece of context present on every call, so it carries the agent's *invariant* behaviour: the things true regardless of the specific task. Keep task-specific instructions out of it (load those on demand; Chapter 5) so it stays focused on the universal.

A good system prompt typically covers:

- **Identity and scope**: who the agent is, who it serves, what it does. One or two sentences set the persona.
- **Output protocols**: any machine-readable formats the model must produce (see below).
- **Behavioural rules**: how to do the core tasks well, including domain consequences.
- **Guardrails**: what never to do (fabricate, leak internal identifiers, etc.).

## Emitted protocols: the model's structured output channel

The most powerful prompt-architecture idea is to **define a structured format that the model emits and your code parses deterministically.** Rather than trying to extract meaning from free-form prose ("did it cite anything?"), instruct the model to append a strict, machine-readable block, then parse it.

Examples of emitted protocols:

- A trailing JSON block of citations, each mapping an inline marker to a source, page, and verbatim quote.
- Inline tagged values like `[[Yes]]`, `[[USD]]`, or `[[page:3||quote:...]]` that your code reliably extracts.
- A marker convention that triggers behaviour (a message prefix that means "apply this template").

The pattern is always: **the model produces structure, your code consumes it.** This turns the model from a prose generator into a structured-data source you can build features on (clickable citations, typed spreadsheet cells, triggered workflows). Define the protocol precisely, give an example, and parse it with a simple, deterministic parser (a regex or JSON parse), not another model call.

When you stream output to a user, remember to **hide the protocol** from the visible stream: buffer just enough to detect the block boundary so the user sees clean prose while your code still gets the structured trailer. (Chapter 8.)

## Write rules as consequences, not just actions

For domain agents, the difference between a toy and a trustworthy tool is often in the rules that encode *consequences*. "Edit the text" is an action. "Any edit that adds or removes a numbered item shifts every following number, so renumber the siblings and update every cross-reference to them in the same edit" is a consequence. The second is hard-won domain expertise expressed as instruction, and it's what makes the agent safe to use on real work. Capture your experts' knowledge as these consequence-rules.

## Push determinism into code; tell the model what not to do

When output formatting is rule-bound and deterministic, don't ask the model to format; do it in code, and use the prompt to keep the model from *fighting* your formatter. If your generator applies numbering automatically, tell the model "do not type the numbers yourself." If it renders the title, tell it "do not repeat the title as a heading." The prompt's job here is negative: prevent the model from duplicating work the code does deterministically. This division yields consistent, polished output.

## Reinforce critical rules at the point of use

A rule stated once in a long system prompt competes with everything else for the model's attention. For the rules that matter most, **repeat them where the relevant action happens**: in the tool description, and inside the tool's result. "Read before you answer" belongs in the system prompt *and* the read tool's description *and* as a reminder prepended to document content. Redundant reinforcement at the decision point measurably improves compliance.

## Use emphasis surgically

Models respond to emphasis (capitalisation, "MUST," "NEVER"), but if everything is emphasised, nothing is. Reserve strong emphasis for the one or two things that are *always* misunderstood without it: the single most error-prone rule. Over-emphasised prompts read as shouting and lose their signal.

## Layered assembly and maintainability

Architect the final prompt as a base plus appendices assembled at runtime:

- A static base system prompt (the invariant constitution).
- Surface-specific appendices (a project context section, a bulk-extraction section) concatenated when relevant.
- A dynamic situational section (the list of what's available to act on).

This keeps the base prompt stable and version-controllable, while letting each surface add only what it needs. It also makes the prompt *testable*: you can assert that the project appendix appears in project chats and not elsewhere.

For maintainability:

- **Keep prompts in version control**, reviewed like code, because they *are* behaviour.
- **Comment the why** where a rule is non-obvious (a workaround for a known model quirk).
- **Avoid duplicating the same rule in five places** unless it's deliberate point-of-use reinforcement; otherwise updates drift out of sync.
- **Keep the prompt and the code in sync.** If the prompt says "the generator numbers clauses as 1.1, (a), (i)," the generator must actually do that. A prompt that describes behaviour the code doesn't implement is a bug waiting to happen.

## Don't over-prompt

A failure mode is the ever-growing prompt: every bug spawns another paragraph until the prompt is thousands of lines and the model can't prioritise. Resist. Prefer:

- moving task-specific instructions into loadable templates,
- moving deterministic formatting into code,
- and fixing systemic issues (better tools, better context) rather than papering over them with more prose.

A focused prompt that the model actually follows beats an exhaustive one it can't prioritise.

## Testing prompts

Prompts deserve evaluation like any other component (Chapter 15). Maintain a set of representative inputs and check that the model's behaviour matches the rules: does it cite correctly, does it apply the template when triggered, does it avoid the forbidden outputs? When you change a rule, re-run the set to catch regressions. Prompt changes are deploys; treat them with the same care.

## Review

**Quick Check**

1. Why does the chapter say the system prompt should carry only *invariant* behaviour?
   - A) Because models ignore anything after the first few hundred tokens
   - B) Because it is the one piece of context present on every call, so task-specific instructions belong in on-demand loads
   - C) Because system prompts are billed at a higher rate than user messages
   - D) Because invariant rules are the only ones models can follow
   <details><summary>Answer</summary>B) It's present on every call, so it should hold what's true regardless of the task; task-specific instructions load on demand (Chapter 5) to keep it focused.</details>

2. What is the core idea behind an "emitted protocol"?
   - A) The model summarises its own output in plain English at the end
   - B) A second model call extracts meaning from the first model's prose
   - C) The model produces a strict, machine-readable structure and your code parses it deterministically
   - D) The prompt is emitted to a log for later review
   <details><summary>Answer</summary>C) The model produces structure, your code consumes it — parsed with a deterministic parser (regex or JSON parse), not another model call.</details>

3. The chapter contrasts "Edit the text" with "Any edit that adds or removes a numbered item shifts every following number, so renumber the siblings and update every cross-reference." What distinction is being drawn?
   - A) Short rules versus long rules
   - B) An action versus a consequence
   - C) A guardrail versus an output protocol
   - D) A static rule versus a dynamic one
   <details><summary>Answer</summary>B) An action versus a consequence. Consequence-rules encode hard-won domain expertise and are what make a domain agent trustworthy rather than a toy.</details>

4. Your code already applies clause numbering automatically, but the model keeps typing numbers too, producing "1. 1. Term". What does the chapter recommend?
   - A) Post-process the output to strip duplicate numbers
   - B) Move numbering out of code and let the model own it
   - C) Use the prompt negatively: tell the model not to type the numbers itself
   - D) Add a validation tool the model must call before answering
   <details><summary>Answer</summary>C) Push determinism into code and use the prompt to stop the model from fighting your formatter — "do not type the numbers yourself."</details>

5. Where does the chapter say a critical rule like "read before you answer" should appear?
   - A) Only in the system prompt, stated once and emphatically
   - B) Only in the tool description, closest to the action
   - C) In the system prompt, the tool description, *and* prepended to the tool's result
   - D) Nowhere in prose — enforce it purely in code
   <details><summary>Answer</summary>C) Redundant reinforcement at the point of use — system prompt, tool description, and tool result — measurably improves compliance.</details>

**More Questions**

6. According to the chapter, what happens when you emphasise everything in a prompt?
   - A) The model follows all rules more reliably
   - B) Nothing is emphasised — the signal is lost, and the prompt reads as shouting
   - C) The prompt becomes cheaper to process
   - D) The model refuses to answer
   <details><summary>Answer</summary>B) Emphasis works only when scarce. Reserve strong emphasis for the one or two rules that are always misunderstood without it.</details>

7. What are the three layers of the recommended runtime prompt assembly?
   - A) Persona, examples, and few-shot completions
   - B) A static base prompt, surface-specific appendices, and a dynamic situational section
   - C) System, user, and assistant messages
   - D) Identity, tools, and citations
   <details><summary>Answer</summary>B) A static base (the invariant constitution), appendices concatenated per surface, and a dynamic section listing what's currently available to act on.</details>

8. Why does the chapter say a layered prompt is more *testable*?
   - A) Because each layer can be sent to a different model
   - B) Because you can assert that a given appendix appears on the surfaces it should and not elsewhere
   - C) Because shorter prompts always score higher on evals
   - D) Because layers can be diffed against the model's output
   <details><summary>Answer</summary>B) Assembly becomes assertable: you can check that, say, the project appendix appears in project chats and nowhere else.</details>

9. Every bug in your agent has been fixed by adding another paragraph to the system prompt, which is now thousands of lines and the model's compliance is getting worse. Which remedies does the chapter suggest?
   - A) Split the prompt across multiple model calls and merge the answers
   - B) Move task-specific instructions into loadable templates, move deterministic formatting into code, and fix systemic issues
   - C) Add stronger emphasis (MUST, NEVER) to the rules being missed
   - D) Switch to a model with a larger context window
   <details><summary>Answer</summary>B) Resist the ever-growing prompt: load task-specific instructions on demand, do deterministic formatting in code, and fix root causes (better tools, better context) rather than papering over them with prose.</details>

10. What does the chapter mean by "keep the prompt and the code in sync"?
    - A) Prompt files should live in the same directory as the code that uses them
    - B) Prompt versions should be numbered to match release tags
    - C) If the prompt describes behaviour the code doesn't actually implement, that's a bug waiting to happen
    - D) The model should be able to read the source code at runtime
    <details><summary>Answer</summary>C) A prompt that claims "the generator numbers clauses as 1.1, (a), (i)" when the generator doesn't is a latent bug. Prompts are behaviour, so they must describe the system as it really is.</details>

**Coding Challenge**

*Split the prose from the emitted protocol*

Write a `parse_response(text)` function that takes model output ending in an optional citations block delimited by `<<CITATIONS>>` and `<</CITATIONS>>` containing JSON. Return a dict with `prose` (everything before the marker, stripped) and `citations` (the parsed list, or `[]` if the block is missing or malformed). The user must never see the protocol.

<details>
<summary>Python Solution</summary>

```python
import json

OPEN, CLOSE = "<<CITATIONS>>", "<</CITATIONS>>"


def parse_response(text):
    start = text.find(OPEN)
    if start == -1:
        return {"prose": text.strip(), "citations": []}

    prose = text[:start].strip()
    end = text.find(CLOSE, start)
    raw = text[start + len(OPEN): end if end != -1 else len(text)]

    try:
        citations = json.loads(raw)
    except json.JSONDecodeError:
        citations = []          # fail soft: never show the protocol to the user
    return {"prose": prose, "citations": citations}


out = parse_response(
    'The termination notice is 30 days [1].\n'
    '<<CITATIONS>>[{"marker": 1, "page": 3, "quote": "thirty (30) days"}]<</CITATIONS>>'
)
print(out["prose"])       # The termination notice is 30 days [1].
print(out["citations"])   # [{'marker': 1, 'page': 3, 'quote': 'thirty (30) days'}]
print(parse_response("No sources here."))
# {'prose': 'No sources here.', 'citations': []}
```

</details>

**Think About It**

1. The chapter calls the system prompt "the agent's constitution, written in prose" — and then insists it belongs in version control and gets reviewed like code. Why is treating a text file as code more than a tidiness preference? What actually goes wrong on the day someone edits a prompt outside of review?
   <details><summary>Show answer</summary>Prompts *are* behaviour: changing a sentence can change what the agent refuses to do, how it cites, or whether it fights your formatter — with no compiler, no type error, and no stack trace to catch it. An unreviewed prompt edit is an unreviewed production deploy, except it's invisible in the diff of "real" code if the file isn't tracked. That's why the chapter also says prompt changes need a re-run of your evaluation set: the only way to detect a regression in prose-defined behaviour is to test the behaviour. Once you accept that, the version control, the review, and the "comment the why" advice all follow naturally.</details>

2. There's something counterintuitive about the advice to use the prompt *negatively* — "do not type the numbers yourself," "do not repeat the title." Why would you spend precious prompt real estate telling a capable model *not* to do useful-looking work, instead of just asking it to format things correctly in the first place?
   <details><summary>Show answer</summary>Because when formatting is rule-bound, code does it perfectly every time and the model does it approximately. If both try, you get duplicated numbers and repeated headings — the model's helpfulness actively corrupts your deterministic output. So the division of labour is: code owns anything with a right answer, the model owns anything requiring judgement, and the prompt's job at that boundary is to keep the model from crossing it. The surprise is that "prevent the model from helping" turns out to be one of the highest-leverage things you can write in a prompt.</details>

3. A rule stated clearly, once, in a system prompt still gets ignored — so the chapter tells you to repeat it in the tool description *and* inside the tool's result. That looks like exactly the duplication the maintainability section warns against. How do you square those two pieces of advice?
   <details><summary>Show answer</summary>The distinction is deliberate versus accidental duplication. A rule scattered across five places because nobody checked drifts out of sync and becomes a maintenance trap. The same rule placed at the decision point on purpose — where the model is actually choosing whether to read before answering — is reinforcement, and the chapter says it measurably improves compliance. The mechanism is attention: a rule buried in a long prompt competes with everything else, while a rule attached to the tool the model is about to call arrives exactly when it matters. So duplicate intentionally, document that you did, and keep the copies together in your assembly code so they can't drift.</details>

4. Notice that the emitted-protocol idea and the "hide the protocol while streaming" note (Chapter 8) are two halves of the same design. Why can't you get clickable citations without both — and what does that say about where a "prompt" ends?
   <details><summary>Show answer</summary>The protocol gets you machine-readable structure, but if you stream the raw token stream to the user they'll watch a JSON blob spool out at the end of every answer, which is unusable. Hiding it requires the streaming path to buffer just enough to detect the block boundary and route the rest to your parser. So the feature only exists when the prompt, the parser, and the transport all agree on the same marker convention. That's the real point: a prompt isn't a standalone text asset, it's one end of a contract whose other end is code — which is exactly why the chapter insists the two must stay in sync.</details>

---

Next: [Chapter 7: Retrieval: RAG vs tools vs long context](chapter-07-retrieval-strategies.md)
