# Building Production-Ready AI Agents: OpenAI Codex CLI Architecture and Agent Loop Design - ZenML LLMOps Database

[![ZenML](/images/zenml-logo.svg)](/)

[Star · 5,454](https://github.com/zenml-io/zenml)

[Read Docs](/docs) [Book a demo](/book-your-demo)

# Building Production-Ready AI Agents: OpenAI Codex CLI Architecture and Agent Loop Design

OpenAI · 2026

[View original source](https://openai.com/index/unrolling-the-codex-agent-loop/)

OpenAI's Codex CLI is a cross-platform software agent that executes reliable code changes on local machines, demonstrating production-grade LLMOps through its sophisticated agent loop architecture. The system orchestrates interactions between users, language models, and tools through an iterative process that manages inference calls, tool execution, and conversation state. Key technical achievements include stateless request handling for Zero Data Retention compliance, strategic prompt caching optimization to achieve linear rather than quadratic performance, automatic context window management through intelligent compaction, and robust handling of multi-turn conversations while maintaining conversation coherence across potentially hundreds of model-tool iterations.

## Industry

[Tech](/industry-tags/tech)

## Technologies

[code\_generation](/llmops-tags/code-generation)[chatbot](/llmops-tags/chatbot)[prompt\_engineering](/llmops-tags/prompt-engineering)[agent\_based](/llmops-tags/agent-based)[token\_optimization](/llmops-tags/token-optimization)[error\_handling](/llmops-tags/error-handling)[system\_prompts](/llmops-tags/system-prompts)[mcp](/llmops-tags/mcp)[docker](/llmops-tags/docker)[fastapi](/llmops-tags/fastapi)[cache](/llmops-tags/cache)[open\_source](/llmops-tags/open-source)[guardrails](/llmops-tags/guardrails)[openai](/llmops-tags/openai)[microsoft\_azure](/llmops-tags/microsoft-azure)

## Overview

This case study provides an in-depth technical exploration of OpenAI’s Codex CLI, a production-grade software agent designed to execute high-quality, reliable code changes on local machines. The document is particularly valuable as it reveals the internal architecture and design decisions behind building a world-class AI agent system, representing real-world LLMOps practices at scale. The text is the first in a series documenting the Codex system, which encompasses multiple offerings including Codex CLI, Codex Cloud, and the Codex VS Code extension, all sharing a common “harness” that provides the core agent loop and execution logic.

The Codex CLI launched in April 2025 (based on the reference to “since we first launched the CLI in April” in the context of discussing learnings), making this a relatively mature production system with significant operational experience. OpenAI has made the codebase open source at github.com/openai/codex, providing transparency into implementation details through GitHub issues and pull requests. This level of openness is particularly valuable for understanding production LLMOps patterns.

## Core Architecture: The Agent Loop

The fundamental orchestration mechanism in Codex is the agent loop, which coordinates interactions between users, the language model, and various tools. The loop follows a classical pattern found in agentic systems but with sophisticated optimizations for production use. The process begins with user input being incorporated into a prompt, which is then used to query the model through an inference step. During inference, text is tokenized into integers indexing the model’s vocabulary, these tokens are used to sample the model, and output tokens are generated and translated back to text. This tokenization abstraction is typically hidden behind APIs that operate on text directly.

The model’s response takes one of two forms: either a final response to the user, or a request for a tool call that the agent must execute. When a tool call is requested, the agent executes it, appends the output to the prompt, and re-queries the model with this augmented context. This cycle repeats until the model produces an assistant message rather than additional tool calls, signaling the end of a conversation turn. Critically, the agent’s output isn’t limited to text messages—the primary output is often the actual code changes made to the local machine, with the assistant message serving as a human-readable summary like “I added the architecture.md you asked for.”

Each user input to agent response cycle constitutes one “turn” of a conversation (called a “thread” in Codex terminology). A single turn can involve many iterations between model inference and tool execution. When users send subsequent messages, the entire conversation history is included in the prompt, meaning prompt length grows with conversation depth. This growth pattern necessitates careful context window management, as every model has a maximum token limit for both input and output combined. An agent making hundreds of tool calls in a single turn could potentially exhaust this window, making context management a critical production concern.

## API Integration and Request Structure

Codex CLI uses the Responses API for model inference, sending HTTP requests to different endpoints depending on authentication method. When using ChatGPT login, it targets chatgpt.com/backend-api/codex/responses; with API key authentication it uses api.openai.com/v1/responses; and when running with the —oss flag to use gpt-oss with ollama or LM Studio, it defaults to localhost:11434/v1/responses. The system also supports Azure-hosted Responses API endpoints, demonstrating multi-cloud flexibility.

The prompt construction process is sophisticated and multi-layered. Rather than specifying prompts verbatim, users provide various input types in their API query, and the Responses API server structures this information into a model-consumable prompt. The prompt is conceptually a “list of items” where each item has an associated role indicating priority weight: system, developer, user, or assistant (in decreasing order of priority).

The initial prompt construction involves several components. The instructions field contains system or developer messages inserted into the model’s context. The tools field provides a list of tool definitions conforming to the Responses API schema, including Codex-provided tools, API-provided tools, and user-provided tools typically sourced from MCP (Model Context Protocol) servers. The input field contains text, image, or file inputs to the model.

## Prompt Engineering and Configuration Management

Codex employs a hierarchical approach to prompt construction with careful attention to context precedence. The initial prompt includes a developer-role message describing the sandbox environment, but this applies only to the Codex-provided shell tool—other tools from MCP servers are not sandboxed by Codex and must enforce their own guardrails. This distinction is important for understanding the security model.

Optional developer instructions can be read from the user’s config.toml file and inserted as a developer-role message. User instructions are aggregated across multiple sources in a cascading fashion that allows increasingly specific instructions to override more general ones. The system looks for AGENTS.override.md and AGENTS.md files in the $CODEX\_HOME directory, then traverses from the Git/project root up to the current working directory, adding contents from AGENTS.override.md, AGENTS.md, or any filenames specified in the project\_doc\_fallback\_filenames configuration, subject to a 32 KiB limit by default. If skills have been configured, their instructions are also included.

Each message in the input array is a JSON object with type, role, and content fields. Once the full JSON payload is constructed, Codex makes an HTTP POST request with appropriate authorization headers based on the Responses API endpoint configuration in ~/.codex/config.toml.

When the OpenAI Responses API server receives the request, it derives the actual model prompt in a specific order: system message (server-controlled), tools (client-provided definitions), instructions (client-provided content), and finally the input sequence from the JSON payload. This ordering is server-determined, though custom Responses API implementations could make different choices. Critically, only the system message content is server-controlled; tools and instructions are client-determined.

## Streaming and Event Handling

The Responses API replies with a Server-Sent Events (SSE) stream, where each event’s data field contains JSON with a type starting with “response”. Events include types like response.output\_text.delta for streaming UI updates and response.output\_item.added for objects that must be appended to subsequent Responses API calls. Codex consumes this event stream and republishes events as internal objects usable by clients.

When the first request includes multiple response.output\_item.done events—for example, one with type=reasoning and one with type=function\_call—these must be represented in the input field for the next model query with the tool call response. The resulting prompt for subsequent queries maintains the old prompt as an exact prefix of the new prompt. This prefix preservation is intentional and critical for enabling prompt caching optimizations.

The agent loop can iterate many times between inference and tool calling until an assistant message is received, ending the turn. The Codex CLI presents this message to the user and focuses the composer to indicate it’s the user’s turn. When users respond, both the previous assistant message and the new user message are appended to the input for the next Responses API request, causing the input length to grow continuously.

## Performance Optimization Through Caching

A critical observation about the agent loop is that it appears quadratic in terms of JSON sent to the Responses API over the conversation’s lifetime—each request must include the full conversation history. While the Responses API supports an optional previous\_response\_id parameter to mitigate this, Codex deliberately doesn’t use it to maintain stateless requests and support Zero Data Retention (ZDR) configurations.

Avoiding previous\_response\_id simplifies provider implementation by ensuring every request is stateless, which is essential for ZDR customers who have opted out of data storage. Storing data required to support previous\_response\_id would contradict ZDR principles. Notably, ZDR customers don’t lose access to proprietary reasoning messages from prior turns, as the encrypted\_content can be decrypted on the server using the customer’s decryption key, which OpenAI persists separately from customer data.

The cost of sampling the model typically dominates network traffic costs, making sampling the primary efficiency target. Prompt caching is crucial here, enabling computation reuse from previous inference calls. With cache hits, sampling becomes linear rather than quadratic. Cache hits only occur for exact prefix matches within prompts, so structuring prompts with static content like instructions and examples at the beginning and variable content like user-specific information at the end is essential for cache efficiency. This principle also applies to images and tools, which must be identical between requests for cache hits.

Several operations can cause cache misses in Codex: changing the tools available mid-conversation, changing the target model (which modifies model-specific instructions in the prompt), or changing sandbox configuration, approval mode, or current working directory. The Codex team must carefully consider these impacts when introducing new features. For instance, initial MCP tool support introduced a bug where tools weren’t enumerated in consistent order, causing cache misses. MCP tools are particularly challenging because MCP servers can dynamically change their tool lists via notifications/tools/list\_changed notifications, and honoring these mid-conversation can cause expensive cache misses.

Where possible, Codex handles mid-conversation configuration changes by appending new messages to input rather than modifying earlier messages, preserving the prefix for cache hits. When sandbox configuration or approval mode changes, a new developer-role message with the same format as the original permissions instructions is inserted. When the current working directory changes, a new user-role message with the same format as the original environment\_context is inserted.

## Context Window Management and Compaction

Beyond caching, the other critical resource to manage is the context window. Codex’s strategy is to compact the conversation once token count exceeds a threshold, replacing the input with a smaller representative list that enables the agent to continue with understanding of what has transpired. Early implementation required manual invocation of the /compact command, which queried the Responses API with the existing conversation plus custom summarization instructions, using the resulting summary as the new input for subsequent turns.

The Responses API has since evolved to support a specialized /responses/compact endpoint that performs compaction more efficiently. This endpoint returns a list of items that can replace the previous input while freeing context window space. The list includes a special type=compaction item with opaque encrypted\_content that preserves the model’s latent understanding of the original conversation. Codex now automatically uses this endpoint when the auto\_compact\_limit is exceeded, demonstrating sophisticated automated resource management.

## Production-Grade Design Considerations

This case study reveals several production LLMOps patterns worth noting. The stateless request architecture, while appearing inefficient due to sending full conversation history, enables critical capabilities like ZDR compliance and multi-cloud deployment flexibility. The careful attention to prompt caching through prefix preservation demonstrates how theoretical performance characteristics translate to real-world optimizations. The hierarchical configuration system with cascading instruction precedence provides flexibility while maintaining predictability.

The open-source approach to the Codex CLI implementation provides unusual transparency for a commercial AI system, allowing practitioners to learn from detailed implementation decisions memorialized in GitHub issues and pull requests. The explicit discussion of tradeoffs—such as choosing stateless requests over previous\_response\_id despite apparent inefficiency—provides valuable insight into production decision-making processes.

The integration of multiple tool sources (Codex-provided, API-provided, and MCP servers) with different sandboxing models demonstrates real-world complexity in agentic systems. The distinction that only Codex-provided tools are sandboxed, while MCP tools must enforce their own guardrails, highlights important security considerations in production agent architectures.

The streaming architecture using Server-Sent Events with internal event republishing shows how to build responsive user experiences while maintaining clean internal abstractions. The separation between events for UI updates (response.output\_text.delta) and state management (response.output\_item.added) demonstrates thoughtful architecture for real-time systems.

## Assessment and Critical Perspective

While this document provides valuable technical insights, readers should note it represents OpenAI’s perspective on their own system and serves partly as educational marketing for the Responses API. The document emphasizes sophisticated engineering while potentially understating challenges or limitations. For instance, the discussion of quadratic request size growth and ZDR compliance makes the tradeoffs seem cleanly resolved, when in practice these may involve significant costs or operational complexities not fully explored.

The reliance on exact prefix matching for cache hits creates brittleness that could impact user experience when configurations change mid-conversation. The document mentions this causes “expensive cache misses” but doesn’t quantify the performance impact or discuss whether users are informed when this occurs. The automatic compaction using the /responses/compact endpoint is presented as a clean solution, but practitioners should consider what information might be lost during compaction and whether this could impact agent performance on complex, long-running tasks.

The open-source release is commendable, but the core language models remain proprietary, and many implementation details depend on OpenAI-specific API behavior. Organizations adopting these patterns with different model providers would need to adapt significantly. The document’s focus on OpenAI’s Responses API as the abstraction layer means some patterns may not transfer cleanly to other orchestration approaches or model providers.

Nevertheless, this case study represents valuable documentation of production LLMOps practices from a leading AI organization, offering concrete technical patterns that can inform agent architecture design even when adapted to different contexts or providers.

## More Like This

[

### Building Custom Agents at Scale: Notion's Multi-Year Journey to Production-Ready Agentic Workflows

Notion ·2026

Notion, a knowledge work platform serving enterprise customers, spent multiple years (2022-2026) iterating through four to five complete rebuilds of their agent infrastructure before shipping Custom Agents to production. The core problem was enabling users to automate complex workflows across their workspaces while maintaining enterprise-grade reliability, security, and cost efficiency. Their solution involved building a sophisticated agent harness with progressive tool disclosure, SQL-like database abstractions, markdown-based interfaces optimized for LLM consumption, and a comprehensive evaluation framework. The result was a production system handling over 100 tools, serving majority-agent traffic for search, and enabling workflows like automated bug triaging, email processing, and meeting notes capture that fundamentally changed how their company and customers operate.

chatbot question\_answering summarization +52

](/llmops-database/building-custom-agents-at-scale-notions-multi-year-journey-to-production-ready-agentic-workflows)[

### Context Engineering and Agent Development at Scale: Building Open Deep Research

LangChain ·2025

Lance Martin from LangChain discusses the emerging discipline of "context engineering" through his experience building Open Deep Research, a deep research agent that evolved over a year to become the best-performing open-source solution on Deep Research Bench. The conversation explores how managing context in production agent systems—particularly across dozens to hundreds of tool calls—presents challenges distinct from simple prompt engineering, requiring techniques like context offloading, summarization, pruning, and multi-agent isolation. Martin's iterative development journey illustrates the "bitter lesson" for AI engineering: structured workflows that work well with current models can become bottlenecks as models improve, requiring engineers to continuously remove structure and embrace more general approaches to capture exponential model improvements.

code\_generation summarization chatbot +39

](/llmops-database/context-engineering-and-agent-development-at-scale-building-open-deep-research)[

### Building and Scaling Codex: OpenAI's Production Coding Agent

OpenAI ·2025

OpenAI developed Codex, a coding agent that serves as an AI-powered software engineering teammate, addressing the challenge of accelerating software development workflows. The solution combines a specialized coding model (GPT-5.1 Codex Max), a custom API layer with features like context compaction, and an integrated harness that works through IDE extensions and CLI tools using sandboxed execution environments. Since launching and iterating based on user feedback in August, Codex has grown 20x, now serves many trillions of tokens per week, has become the most-served coding model both in first-party use and via API, and has enabled dramatic productivity gains including shipping the Sora Android app (which became the #1 app in the app store) in just 28 days with 2-3 engineers, demonstrating significant acceleration in production software development at scale.

code\_generation chatbot poc +32

](/llmops-database/building-and-scaling-codex-openai-s-production-coding-agent)

We use cookies to improve your experience and analyze site traffic. See our [privacy policy](/privacy-policy).

ManageReject allAccept all