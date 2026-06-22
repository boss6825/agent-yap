# How Anthropic Built a Multi-Agent Research System

# How Anthropic Built a Multi-Agent Research System

[

![ByteByteGo's avatar](https://substackcdn.com/image/fetch/$s_!U1Ej!,w_36,h_36,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fc9941c68-e5b7-4b93-be75-df7cc4ffef02_504x540.png)

](https://substack.com/@bytebytego399569)

[ByteByteGo](https://substack.com/@bytebytego399569)

Sep 16, 2025

285

1

18

Share

## [Free ticket to P99 CONF — 60+ low-latency engineering talks (Sponsored)](https://bit.ly/ScyllaDB_091625)

![](https://substackcdn.com/image/fetch/$s_!1iR9!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F46b94e77-334f-41f3-aa4d-761e3ac785ca_1600x840.png)

P99 CONF is the technical conference for anyone who obsesses over high-performance, low-latency applications. Engineers from Pinterest, Prime Video, Clickhouse, Gemini, Arm, Rivian and VW Group Technology, Meta, Wayfair, Disney, Uber, NVIDIA, and more will be sharing 60+ talks on topics like Rust, Go, Zig, distributed data systems, Kubernetes, and AI/ML.

Join 20K of your peers for an unprecedented opportunity to learn from experts like Chip Huyen (author of the O’Reilly AI Engineering book), Alexey Milovidov (Clickhouse creator/CTO), Andy Pavlo (CMU professor) and more – for free, from anywhere.

[GET YOUR FREE TICKET](https://bit.ly/ScyllaDB_091625)

Bonus: Registrants are eligible to enter to win 300 free swag packs, get 30-day access to the complete O’Reilly library & learning platform, plus free digital books.

---

_Disclaimer: The details in this post have been derived from the official documentation shared online by the Anthropic Engineering Team. All credit for the technical details goes to the Anthropic Engineering Team. The links to the original articles and sources are present in the references section at the end of the post. We’ve attempted to analyze the details and provide our input about them. If you find any inaccuracies or omissions, please leave a comment, and we will do our best to fix them._

Open-ended research tasks are difficult to handle because they rarely follow a predictable path. Each discovery can shift the direction of inquiry, making it impossible to rely on a fixed pipeline. This is where multi-agent systems become important

By running several agents in parallel, multi-agent systems allow breadth-first exploration, compress large search spaces into manageable insights, and reduce the risk of missing key information.

Anthropic’s engineering team also found that this approach delivers major performance gains. In internal evaluations, a system with Claude Opus 4 as the lead agent and Claude Sonnet 4 as supporting subagents outperformed a single-agent setup by more than 90 percent. The improvement was strongly linked to token usage and the ability to spread reasoning across multiple independent context windows, with subagents enabling the kind of scaling that a single agent cannot achieve.

However, the benefits also come with costs:

-   Multi-agent systems consume approximately fifteen times more tokens than standard chat interactions, making them best suited for tasks where the value of the outcome outweighs the expense.
    
-   They excel at problems that can be divided into parallel strands of research, but are less effective for tightly interdependent tasks such as coding.
    

Despite these trade-offs, multi-agent systems are proving to be a powerful way to tackle complex, breadth-heavy research challenges. In this article, we will understand the architecture of the multi-agent research system that Anthropic built.

![](https://substackcdn.com/image/fetch/$s_!_EXl!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F917e3a5d-487d-4a41-b9d6-91bafb783392_1600x1386.png)

## The Architecture of the Research System

The research system is built on an orchestrator-worker pattern, a common design in computing where one central unit directs the process and supporting units carry out specific tasks.

In this case, the orchestrator is the Lead Researcher agent, while the supporting units are subagents that handle individual parts of the job. Here are the details about the same:

-   **Lead Researcher agent:** This is the main coordinator. When a user submits a query, the Lead Researcher analyzes it, decides on an overall strategy, and records the plan in memory. Memory management is important here because large research tasks can easily exceed the token limit of the model’s context window. By saving the plan, the system avoids losing track when tokens run out.
    
-   **Subagents:** These are specialized agents created by the Lead Researcher. Each subagent is given a specific task, such as exploring a certain company, checking a particular time period, or looking into a technical detail. Because subagents operate in parallel and maintain their own context, they can search, evaluate results, and refine queries independently without interfering with one another. This separation of tasks reduces duplication and makes the process more efficient.
    
-   **Citation Agent:** Once enough information has been gathered, the results are passed to a Citation Agent. Its job is to check every claim against the sources, match citations correctly, and ensure the final output is traceable. This prevents errors such as making statements without evidence or attributing information to the wrong source.
    

See the diagram below that shows the high level architecture of these components:

![](https://substackcdn.com/image/fetch/$s_!F0nv!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F427678b7-f2ca-41c6-98a5-ee0672960bc5_1600x1002.png)

This design differs from traditional Retrieval-Augmented Generation (RAG) systems.

In standard RAG, the model retrieves a fixed set of documents that look most similar to the query and then generates an answer from them. The limitation is that retrieval happens only once, in a static way.

The multi-agent system operates dynamically: it performs multiple rounds of searching, adapts based on the findings, and explores deeper leads as needed. In other words, it learns and adjusts during the research process rather than relying on a single snapshot of data.

The complete workflow looks like this:

-   A user submits a query.
    
-   The Lead Researcher creates a plan for performing the investigation.
    
-   Subagents are spawned, each carrying out searches or using tools in parallel.
    
-   The Lead Researcher gathers their results, synthesizes them, and decides if further work is required. If so, more subagents can be created, or the strategy can be refined.
    
-   Once enough information is collected, everything is handed to the Citation Agent, which ensures the report is properly sourced.
    
-   The final research report is then returned to the user.
    

See the diagram below for more details:

![](https://substackcdn.com/image/fetch/$s_!LTy1!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F514bedee-926f-4fe5-87ef-359a17ec6b3d_1600x1272.png)

This layered system allows for flexibility, depth, and accountability. The Lead Researcher ensures direction and consistency, subagents provide parallel exploration and scalability, and the Citation Agent enforces accuracy by tying results back to sources. Together, they create a system that is both more powerful and more reliable than single-agent or static retrieval approaches.

## Prompt Engineering Principles

Designing good prompts turned out to be the single most important way to guide how the agents behaved.

Since each agent is controlled by its prompt, small changes in phrasing could make the difference between efficient research and wasted effort. Through trial and error, Anthropic identified several principles that made the system work better.

### 1 - Think like your agents

To improve prompts, the engineering team built simulations where agents ran step by step using the same tools and instructions they would in production.

Watching them revealed common mistakes. Some agents kept searching even after finding enough results, others repeated the same queries, and some chose the wrong tools.

By mentally modeling how the agents interpret prompts, engineers could predict these failure modes and adjust the wording to steer agents toward better behavior.

See the diagram below to understand the concept of an agent on a high level:

![](https://substackcdn.com/image/fetch/$s_!SGD6!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F10de1c4c-f571-472b-8a15-043bf461a05b_1598x1600.png)

### 2 - Teach delegation

The Lead Researcher is responsible for breaking down a query into smaller tasks and passing them to subagents.

For this to work, the instructions must be very clear: each subagent needs a concrete objective, boundaries for the task, the right output format, and guidance on which tools to use. Without this level of detail, subagents either duplicated each other’s work or left gaps. For example, one subagent looked into the 2021 semiconductor shortage while two others repeated nearly identical searches on 2025 supply chains. Proper delegation avoids wasted effort.

### 3 - Scale effort to query complexity

Agents often struggle to judge how much effort a task deserves. To prevent over-investment in simple problems, scaling rules were written into prompts. For instance:

-   A simple fact check should involve only one agent making 3–10 tool calls.
    
-   A direct comparison might need 2–4 subagents, each with 10–15 calls.
    
-   A complex research problem could require 10 or more subagents, each with clearly divided responsibilities.
    

These built-in guidelines helped the Lead Researcher allocate resources more effectively.

### 4 - Tool design matters

The way agents understand tools is as important as how humans interact with software interfaces. A poorly described tool can send an agent down the wrong path entirely.

For example, if a task requires Slack data but the agent only searches the web, the result will fail. With MCP servers that give the model access to external tools, this problem can be compounded since agents encounter unseen tools with varying quality.

See the diagram below that shows the concept of MCP or Model Context Protocol.

![](https://substackcdn.com/image/fetch/$s_!A3ym!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F4cd89719-b080-4843-8a06-7d22a0f1f0a5_1600x1003.png)

To solve this, the team gave agents heuristics such as:

-   Examine all available tools before starting.
    
-   Match the tool to the user’s intent.
    
-   Use the web for broad searches, but prefer specialized tools when possible.
    

Each tool was carefully described with a distinct purpose so that agents could make the right choice.

### 5 - Let agents improve themselves

Claude 4 models proved capable of acting as their own prompt engineers. By giving them failing scenarios, they could analyze why things went wrong and suggest improvements.

Anthropic even created a tool-testing agent that repeatedly tried using a flawed tool, then rewrote its description to avoid mistakes. This process cut task completion times by about 40 percent, because later agents could avoid the same pitfalls.

### 6 - Start wide, then narrow down

Agents often defaulted to very specific search queries, which returned few or irrelevant results.

To fix this, prompts encouraged them to begin with broad queries, survey the landscape, and then narrow their focus as they learned more. This mirrors how expert human researchers work.

### 7 - Guide the thinking process

Anthropic used extended thinking and interleaved thinking as controllable scratchpads. Extended thinking allows the Lead Researcher to write out their reasoning before acting, such as planning which tools to use or how many subagents to create.

Subagents also plan their steps and then, after receiving tool outputs, use interleaved thinking to evaluate results, spot gaps, and refine their next queries. This structured reasoning improved accuracy and efficiency.

### 8 - Use parallelization

Early systems ran searches one after another, which was slow.

By redesigning prompts to encourage parallelization, the team achieved dramatic speedups. The Lead Researcher now spawns several subagents at once, and each subagent can use multiple tools in parallel.

This reduced research times by as much as 90 percent for complex queries, making it possible to gather broad information in minutes instead of hours.

## Evaluation Methods

Evaluating multi-agent systems is difficult because they rarely follow the same steps to reach an answer.

Anthropic used a mix of approaches to judge outcomes rather than strict processes.

-   **Start small:** In early development, even tiny changes to prompts had big effects. Testing with just 20 representative queries was enough to see improvements instead of waiting for large test sets.
    
-   **LLM-as-judge:** A separate model graded outputs using a rubric for factual accuracy, citation quality, completeness, source quality, and tool efficiency. Scores ranged from 0.0 to 1.0 with a pass/fail grade. This made the evaluation scalable and consistent with human judgment.
    
-   **Human oversight:** People remained essential for spotting edge cases, such as hallucinations or bias toward SEO-heavy sources. Their feedback led to new heuristics for source quality.
    
-   **Emergent behavior:** Small prompt changes could shift agent interactions in unpredictable ways. Instead of rigid rules, the best results came from prompt frameworks that guided collaboration, division of labor, and effort allocation.
    

## Production Engineering Challenges

Running multi-agent systems in production introduces reliability issues that go beyond traditional software.

-   **Stateful agents:** These agents run for long periods, keeping track of their progress across many tool calls. Small errors can build up, so the system needs durable recovery methods (such as checkpoints, retry logic, and letting agents adapt when tools fail) so that work can resume without starting over.
    
-   **Debugging:** Because agents make dynamic, non-deterministic choices, the same prompt may lead to different paths. To diagnose failures, Anthropic added production tracing and monitored high-level decision patterns, while avoiding storage of sensitive user content.
    
-   **Deployments:** Updates risk breaking agents already mid-task. To avoid this, Anthropic used rainbow deployments, where traffic is shifted gradually from old to new versions, keeping both active during rollout.
    
-   **Synchronous bottlenecks:** Currently, the LeadResearcher waits for subagents to finish before moving forward. This simplifies coordination but slows down the system. Asynchronous execution could remove these bottlenecks, though it would add complexity in managing state, coordinating results, and handling errors.
    

## Conclusion

Building multi-agent systems is far more challenging than building single-agent prototypes.

Small bugs or errors can ripple through long-running processes, leading to unpredictable outcomes. Reliable performance requires proper prompt design, durable recovery mechanisms, detailed evaluations, and cautious deployment practices.

Despite the complexity, the benefits are significant.

Multi-agent research systems have shown they can uncover connections, scale reasoning across vast amounts of information, and save users days of work on complex tasks. They are best suited for problems that demand breadth, parallel exploration, and reliable sourcing. With the right engineering discipline, these systems can operate at scale and open new possibilities for how AI assists with open-ended research.

**References:**

-   [How we built our multi-agent research system?](https://www.anthropic.com/engineering/multi-agent-research-system)
    
-   [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
    
-   [Building effective AI Agents](https://www.anthropic.com/engineering/building-effective-agents)
    

---

## Help us Make ByteByteGo Newsletter Better

TL:DR: Take this 2-minute survey so I can learn more about who you are,. what you do, and how I can improve ByteByteGo

[Take the ByteByteGo Survey](https://forms.gle/1XeRbZ1DQvhpW9xV8)

---

## SPONSOR US

Get your product in front of more than 1,000,000 tech professionals.

Our newsletter puts your products and services directly in front of an audience that matters - hundreds of thousands of engineering leaders and senior engineers - who have influence over significant tech decisions and big purchases.

Space Fills Up Fast - Reserve Today

Ad spots typically sell out about 4 weeks in advance. To ensure your ad reaches this influential audience, reserve your space now by emailing **sponsorship@bytebytego.com.**

---

#### Subscribe to ByteByteGo Newsletter

Explain complex systems with simple terms, from the authors of the best-selling system design book series. Join over 1,000,000 friendly readers.

Subscribe

By subscribing, you agree Substack's [Terms of Use](https://substack.com/tos), and acknowledge its [Information Collection Notice](https://substack.com/ccpa#personal-data-collected) and [Privacy Policy](https://substack.com/privacy).

[

![Panu's avatar](https://substackcdn.com/image/fetch/$s_!yhEH!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8174bc3c-410b-48e0-9e14-0960f592fd62_144x144.png)

](https://substack.com/profile/110104808-panu)[

![Jens Soeldner's avatar](https://substackcdn.com/image/fetch/$s_!HQ1J!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F8ea822e1-21f8-4402-855d-d47b7f39017d_144x144.png)

](https://substack.com/profile/32269207-jens-soeldner)[

![Charles's avatar](https://substackcdn.com/image/fetch/$s_!S2It!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0e80bd4d-ed8a-4fc0-8bfd-927951593c1d_144x144.png)

](https://substack.com/profile/26952160-charles)[

![Paul Carter's avatar](https://substackcdn.com/image/fetch/$s_!0hfw!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff143ea88-f3d9-4daa-8126-55af6282611a_144x144.png)

](https://substack.com/profile/12328971-paul-carter)[

![K Young's avatar](https://substackcdn.com/image/fetch/$s_!LCmW!,w_32,h_32,c_fill,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fbd786f06-8dad-4cca-937b-c35e231b1788_144x144.png)

](https://substack.com/profile/131251865-k-young)

285 Likes∙

[18 Restacks](https://substack.com/note/p-173421327/restacks?utm_source=substack&utm_content=facepile-restacks)

285

1

18

Share