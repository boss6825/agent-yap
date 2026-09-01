# Chapter 2: The Agent Loop

## Concept explanation

If you remember one thing from this guide, remember this: the core of every coding agent is a small loop, and it is much simpler than you think.

Here is the entire idea, lifted almost verbatim from the open-source Codex codebase (the file is literally called `turn.rs`):

```text
while needs_follow_up:
    1. Gather the conversation history
    2. Send it to the LLM, along with the list of available tools
    3. Look at the response:
       - If it contains tool calls -> run them, append the results, loop again
       - If it is just text     -> we are done
```

That is it. There is no separate "planning engine," no mysterious reasoning module. The agentic behavior you see (the way it investigates, tries things, course-corrects) all *emerges* from running this one loop until the model decides it is finished.

Anthropic describes the same thing with three friendlier words: **gather context, take action, verify results**, repeated until the task is done. Codex's lead engineer Michael Bolin draws it as a cycle of inference and tool calls. They are all the same loop.

### The two outcomes of every model call

Each time the harness calls the model, the model does exactly one of two things:

1. It **asks for a tool call**: "run `ls`," "read this file," "apply this patch." The harness runs the tool, captures the output, appends it to the conversation, and calls the model again with the new information.
2. It **produces an assistant message**: plain text for the user. This signals the end of the turn. Control returns to you.

So the loop spins on outcome 1 and stops on outcome 2. A single user request ("fix the failing tests") might spin through that loop fifty times (run tests, read the error, search for the file, read it, edit it, run tests again) before the model finally says, in plain text, "Fixed it. The bug was a stale session token."

### What "output" really means

Here is a subtle point that trips people up, and Bolin calls it out directly. When you think about what a coding agent "outputs," you picture that final text message. But for a software agent, the text is not the deliverable. The deliverable is **the changes it made to your machine**: the files it edited, the tests it made pass, the commit it created. The assistant message is just the *termination signal*, a polite "I'm done, your turn." 

The practical consequence, which we will use later: you do not need the agent to produce flowery prose. You need it to produce reliable tool calls. Design your instructions to guide good actions, not good paragraphs.

### Turn, thread, conversation

A bit of vocabulary that the sources use consistently:

- A **turn** is one cycle of "user input goes in, agent works, agent comes back with an assistant message." Inside a single turn, the inference-and-tool-call loop may run many times.
- A **thread** (Codex's word) or **conversation** is the whole back-and-forth, made of many turns.
- Every new turn includes the *entire history of previous turns* in the prompt. That detail seems innocent. It is actually the source of the biggest performance problem in the whole field, and Chapter 4 is devoted to it.

## Why it matters

Understanding the loop demystifies everything else. Costs, context limits, the need for compaction, the value of subagents, the design of approval systems: all of them are consequences of this loop running and the prompt growing each time around. Once you can see the loop, the rest of the harness stops looking like a bag of tricks and starts looking like a set of sensible responses to one repeating process.

It also tells you where you can intervene. You (the user) are part of this loop. You can interrupt at any point to steer, add context, or redirect. The agent works autonomously but stays responsive. That is why Claude Code lets you press Escape to stop a running tool, or type a correction mid-stream that the model reads as soon as the current action finishes.

## How it works: a closer walk

Let us trace one real turn, the kind Bolin describes in the Codex write-up.

1. You type: "Add an architecture diagram to the README."
2. The harness builds a prompt (Chapter 3 covers exactly what goes in it) and calls the model.
3. The model thinks, then asks for a tool call: `shell` with command `cat README.md`. It does not run anything; it asks.
4. The harness runs `cat README.md`, captures the output, and appends two things to the history: the tool call and its result, linked by a shared `call_id` so the model knows which result belongs to which call.
5. The harness calls the model again, now with the README contents included.
6. The model asks for another tool call: an edit that inserts the diagram.
7. The harness applies the edit, appends the result, calls again.
8. This time the model returns plain text: "I added a diagram explaining the client/server architecture." Turn over.

Notice that step 4's appended history is what makes step 5 smarter than step 2. Each tool result feeds back in. That feedback is the whole point; it is why the loop can course-correct instead of blindly executing a fixed plan.

## Code MVP: a working agent loop

This is the skeleton the entire capstone is built around. It runs without a real model by using a tiny scripted stand-in, so you can see the control flow clearly. Replace `fake_model` with a real API call and it becomes a real agent.

```python
"""
chapter 02: the agent loop.
A minimal, runnable agent loop with a fake model and one real tool.
The structure here is exactly what production harnesses use.
"""
import subprocess

# --- The tools the model is allowed to ask for (Chapter 6 expands this) ---
def tool_shell(command: str) -> str:
    """Run a shell command and return combined output."""
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    return (result.stdout + result.stderr).strip()

TOOLS = {"shell": tool_shell}

# --- A fake "model": it returns tool requests, then a final message. ---
# A real model would return these decisions itself. We script them so the
# loop's control flow is visible without an API key.
def fake_model(history: list) -> dict:
    # Count how many tool results are already in the history.
    tool_results = [h for h in history if h["role"] == "tool"]
    if len(tool_results) == 0:
        # First call: ask to list files.
        return {"type": "tool_call", "name": "shell",
                "args": {"command": "echo hello from the agent"}}
    else:
        # We already ran a tool; now produce a final answer.
        last = tool_results[-1]["content"]
        return {"type": "text", "content": f"Done. The command said: {last!r}"}

# --- The loop itself. This is the heart of every coding agent. ---
def agent_loop(user_request: str, max_turns: int = 10) -> str:
    history = [{"role": "user", "content": user_request}]

    for _ in range(max_turns):                 # a safety cap (Chapter 12)
        response = fake_model(history)         # 1 & 2: gather + call the model

        if response["type"] == "text":         # 3a: plain text -> we are done
            history.append({"role": "assistant", "content": response["content"]})
            return response["content"]

        # 3b: a tool call -> execute it, append the result, loop again.
        name, args = response["name"], response["args"]
        history.append({"role": "assistant", "content": f"(calling {name} {args})"})
        output = TOOLS[name](**args)
        history.append({"role": "tool", "content": output})

    return "Stopped: hit the turn limit without finishing."

if __name__ == "__main__":
    print(agent_loop("say hello using the shell"))
```

Run it and you will see the loop make one tool call, feed the result back, and then finish with a text message. That is the same shape as a fifty-step Codex session; only the number of laps and the realism of the model change.

A few things to notice, because they foreshadow later chapters:

- `history` grows every lap. That growth is the quadratic problem (Chapter 4).
- `max_turns` is a crude kill switch. Real harnesses make this a proper budget (Chapter 12).
- `TOOLS` is one dict with one tool. Real harnesses make it a rich registry with validation and truncation (Chapter 6), and gate every call behind a permission check (Chapter 7).
- We blindly trusted the tool call. Production code validates the arguments against a schema first.

## Connecting to the bigger picture

Chapter 1 gave you the model-versus-harness split; this chapter shows the harness's central job, driving that loop. Everything from here is about making each piece of the loop better: Chapter 3 makes the "gather history and call the model" step rich and correct; Chapters 4 and 5 keep the growing history affordable; Chapter 6 makes the tools real and safe; Chapter 12 replaces `max_turns` with real budgets. The `agent_loop` function you just wrote is, almost unchanged, the spine of the capstone in Chapter 17.

## Key takeaways

- The agent loop is tiny: call the model, run any tool it asks for, append the result, repeat until the model returns plain text.
- Anthropic's version is "gather context, take action, verify results." It is the same loop.
- Each model call ends one of two ways: a tool request (keep looping) or an assistant message (stop).
- For a software agent, the real output is the changes on your machine, not the final text. The text is just the "I'm done" signal.
- A turn can contain dozens of inference-and-tool laps, and each turn re-sends the whole growing history, which sets up the cost problem in Chapter 4.

Original sources for this chapter: Anthropic's [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) and OpenAI's [Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) by Michael Bolin.

---

## Review

**Quick Check**

1. In the agent loop, what are the two possible outcomes of each model call?
   - A) A tool call or an error message
   - B) A tool call (keep looping) or an assistant text message (stop the loop)
   - C) A planning step or an execution step
   - D) A reasoning trace or a final answer with citations
   <details><summary>Answer</summary>B) A tool call (keep looping) or an assistant text message (stop the loop) - Each model call either requests a tool (the harness runs it, appends the result, and loops again) or produces plain text (signaling the turn is over).</details>

2. How are tool calls and their results matched together in the conversation history?
   - A) They are matched by their position in the history array
   - B) The model remembers which tool it called most recently
   - C) They are linked by a shared call_id
   - D) The harness names each result after the tool that produced it
   <details><summary>Answer</summary>C) They are linked by a shared call_id - The harness appends both the tool call and its result to the history, connected by a shared call_id so the model knows which result belongs to which call.</details>

3. A user asks an agent to "refactor the auth module." The agent runs 40 tool calls (reading files, applying edits, running tests) and then responds with "Refactoring complete." Which part is the real deliverable?
   - A) The final text message summarizing what changed
   - B) The 40 tool calls recorded in the conversation history
   - C) The changes made to files on the machine during those tool calls
   - D) The prompt that was assembled before the first model call
   <details><summary>Answer</summary>C) The changes made to files on the machine during those tool calls - For a software agent, the deliverable is the changes it made to your machine (edited files, passing tests, commits). The assistant message is just the termination signal, not the output.</details>

4. An agent is working on a task and has completed 15 tool-call laps within a single turn. The user then types a correction. What happens next?
   - A) The correction is queued for the next turn and cannot affect the current one
   - B) The agent reads the correction as soon as the current action finishes, steering the ongoing turn
   - C) The agent restarts the entire turn from scratch with the new input
   - D) The correction is ignored because only one user message is allowed per turn
   <details><summary>Answer</summary>B) The agent reads the correction as soon as the current action finishes, steering the ongoing turn - The user is part of the loop and can interrupt at any point to steer, add context, or redirect. Claude Code lets you press Escape or type a correction mid-stream.</details>

5. A developer builds a custom agent loop but does not include a max_turns cap. The model enters a cycle where each tool result triggers another tool call that produces the same result. What is the most accurate description of what happens?
   - A) The model will detect the cycle and automatically emit a text response to break out
   - B) The loop runs indefinitely (or until an external limit like token budget or timeout stops it), because without max_turns there is no safety cap
   - C) The harness will automatically deduplicate repeated tool results and stop
   - D) The loop will crash after exactly 10 iterations because that is the built-in default
   <details><summary>Answer</summary>B) The loop runs indefinitely (or until an external limit like token budget or timeout stops it), because without max_turns there is no safety cap - The max_turns parameter is a safety cap to prevent runaway loops. Without it, the loop has no built-in way to stop if the model keeps requesting tool calls. The model itself has no guaranteed cycle-detection mechanism.</details>

**Coding Challenge**

Build Your Own Agent Loop With History Inspection

Write an agent loop that uses a scripted fake model and a single tool called `reverse` (which reverses a string). The fake model should: on its first call, request `reverse` with the input `"agent"`; on its second call, request `reverse` again with whatever the first tool returned; on its third call, return a text message reporting the final result. After the loop finishes, print the number of entries in the history and the final message. This exercises the core loop pattern: call model, run tool, append result, repeat.

<details><summary>Python Solution</summary>

```python
def tool_reverse(text: str) -> str:
    return text[::-1]

TOOLS = {"reverse": tool_reverse}

def fake_model(history: list) -> dict:
    tool_results = [h for h in history if h["role"] == "tool"]
    if len(tool_results) == 0:
        return {"type": "tool_call", "name": "reverse",
                "args": {"text": "agent"}}
    elif len(tool_results) == 1:
        return {"type": "tool_call", "name": "reverse",
                "args": {"text": tool_results[-1]["content"]}}
    else:
        last = tool_results[-1]["content"]
        return {"type": "text", "content": f"Final result: {last}"}

def agent_loop(user_request: str, max_turns: int = 10) -> str:
    history = [{"role": "user", "content": user_request}]
    for _ in range(max_turns):
        response = fake_model(history)
        if response["type"] == "text":
            history.append({"role": "assistant", "content": response["content"]})
            print(f"History entries: {len(history)}")
            return response["content"]
        name, args = response["name"], response["args"]
        history.append({"role": "assistant", "content": f"call {name}({args})"})
        output = TOOLS[name](**args)
        history.append({"role": "tool", "content": output})
    return "Hit turn limit."

print(agent_loop("reverse a word twice"))
```

</details>

<details><summary>JavaScript Solution</summary>

```javascript
function toolReverse(text) {
  return text.split("").reverse().join("");
}

const TOOLS = { reverse: toolReverse };

function fakeModel(history) {
  const toolResults = history.filter((h) => h.role === "tool");
  if (toolResults.length === 0) {
    return { type: "tool_call", name: "reverse", args: { text: "agent" } };
  } else if (toolResults.length === 1) {
    return { type: "tool_call", name: "reverse",
             args: { text: toolResults[toolResults.length - 1].content } };
  } else {
    const last = toolResults[toolResults.length - 1].content;
    return { type: "text", content: `Final result: ${last}` };
  }
}

function agentLoop(userRequest, maxTurns = 10) {
  const history = [{ role: "user", content: userRequest }];
  for (let i = 0; i < maxTurns; i++) {
    const response = fakeModel(history);
    if (response.type === "text") {
      history.push({ role: "assistant", content: response.content });
      console.log(`History entries: ${history.length}`);
      return response.content;
    }
    const { name, args } = response;
    history.push({ role: "assistant", content: `call ${name}(${JSON.stringify(args)})` });
    const output = TOOLS[name](args.text);
    history.push({ role: "tool", content: output });
  }
  return "Hit turn limit.";
}

console.log(agentLoop("reverse a word twice"));
```

</details>
