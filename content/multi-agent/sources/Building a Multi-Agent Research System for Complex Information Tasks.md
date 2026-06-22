# Anthropic: Building a Multi-Agent Research System for Complex Information Tasks - ZenML LLMOps Database

[![ZenML](/images/zenml-logo.svg)](/)

[Star · 5,454](https://github.com/zenml-io/zenml)

[Read Docs](/docs) [Book a demo](/book-your-demo)

# Building a Multi-Agent Research System for Complex Information Tasks

Anthropic · 2025

[View original source](https://www.anthropic.com/engineering/built-multi-agent-research-system)

Anthropic developed a production multi-agent system for their Claude Research feature that uses multiple specialized AI agents working in parallel to conduct complex research tasks across web and enterprise sources. The system employs an orchestrator-worker architecture where a lead agent coordinates and delegates to specialized subagents that operate simultaneously, achieving 90.2% performance improvement over single-agent systems on internal evaluations. The implementation required sophisticated prompt engineering, robust evaluation frameworks, and careful production engineering to handle the stateful, non-deterministic nature of multi-agent interactions at scale.

## Industry

[Tech](/industry-tags/tech)

## Technologies

[question\_answering](/llmops-tags/question-answering)[document\_processing](/llmops-tags/document-processing)[data\_analysis](/llmops-tags/data-analysis)[content\_moderation](/llmops-tags/content-moderation)[summarization](/llmops-tags/summarization)[chatbot](/llmops-tags/chatbot)[code\_generation](/llmops-tags/code-generation)[healthcare](/llmops-tags/healthcare)[customer\_support](/llmops-tags/customer-support)[multi\_agent\_systems](/llmops-tags/multi-agent-systems)[prompt\_engineering](/llmops-tags/prompt-engineering)[rag](/llmops-tags/rag)[few\_shot](/llmops-tags/few-shot)[semantic\_search](/llmops-tags/semantic-search)[vector\_search](/llmops-tags/vector-search)[agent\_based](/llmops-tags/agent-based)[human\_in\_the\_loop](/llmops-tags/human-in-the-loop)[latency\_optimization](/llmops-tags/latency-optimization)[cost\_optimization](/llmops-tags/cost-optimization)[fallback\_strategies](/llmops-tags/fallback-strategies)[chunking](/llmops-tags/chunking)[system\_prompts](/llmops-tags/system-prompts)[error\_handling](/llmops-tags/error-handling)[monitoring](/llmops-tags/monitoring)[api\_gateway](/llmops-tags/api-gateway)[load\_balancing](/llmops-tags/load-balancing)[microservices](/llmops-tags/microservices)[cicd](/llmops-tags/cicd)[scaling](/llmops-tags/scaling)[serverless](/llmops-tags/serverless)[devops](/llmops-tags/devops)[orchestration](/llmops-tags/orchestration)[continuous\_deployment](/llmops-tags/continuous-deployment)[continuous\_integration](/llmops-tags/continuous-integration)[open\_source](/llmops-tags/open-source)[documentation](/llmops-tags/documentation)[security](/llmops-tags/security)[compliance](/llmops-tags/compliance)[guardrails](/llmops-tags/guardrails)[reliability](/llmops-tags/reliability)[scalability](/llmops-tags/scalability)[fastapi](/llmops-tags/fastapi)[postgresql](/llmops-tags/postgresql)[redis](/llmops-tags/redis)[cache](/llmops-tags/cache)[elasticsearch](/llmops-tags/elasticsearch)[langchain](/llmops-tags/langchain)[wandb](/llmops-tags/wandb)[anthropic](/llmops-tags/anthropic)[google\_gcp](/llmops-tags/google-gcp)[amazon\_aws](/llmops-tags/amazon-aws)

## Overview

Anthropic’s multi-agent research system represents a sophisticated production implementation of LLMOps for complex information retrieval and synthesis tasks. The system powers Claude’s Research feature, which enables users to conduct comprehensive research across web sources, Google Workspace, and other integrations through coordinated AI agents working in parallel. This case study demonstrates how multi-agent architectures can scale LLM capabilities beyond single-agent limitations while addressing the significant engineering challenges of deploying such systems in production.

The core motivation for this multi-agent approach stems from the inherent limitations of single-agent systems when handling open-ended research tasks. Traditional approaches using static Retrieval Augmented Generation (RAG) fetch predetermined chunks based on query similarity, but research requires dynamic exploration, continuous strategy adjustment based on findings, and the ability to follow emergent leads. Single agents face context window limitations and sequential processing bottlenecks that make them unsuitable for comprehensive research requiring broad information gathering and synthesis.

## Technical Architecture

The system implements an orchestrator-worker pattern with a lead agent that coordinates the overall research process while spawning specialized subagents to explore different aspects of queries simultaneously. When users submit research queries, the lead agent analyzes the request, develops a strategic approach, and creates multiple subagents with specific research mandates. Each subagent operates with its own context window, tools, and exploration trajectory, enabling parallel information gathering that would be impossible with sequential processing.

The architecture addresses several key technical challenges in multi-agent coordination. The lead agent maintains overall research state through a memory system that persists context when conversations exceed 200,000 tokens, preventing loss of research plans and findings. Subagents function as intelligent filters, iteratively using search tools to gather relevant information before condensing findings for the lead agent’s synthesis. This distributed approach enables the system to process far more information than single-agent systems while maintaining coherent research narratives.

A critical component is the citation system, implemented through a specialized CitationAgent that processes research documents and reports to identify specific source locations for all claims. This ensures proper attribution while maintaining research integrity across the multi-agent workflow. The system also implements parallel tool calling at two levels: the lead agent spawns 3-5 subagents simultaneously, and individual subagents execute multiple tool calls in parallel, reducing research time by up to 90% for complex queries.

## Prompt Engineering for Multi-Agent Systems

The transition from prototype to production revealed that prompt engineering becomes significantly more complex in multi-agent environments due to coordination challenges and emergent behaviors. Early iterations suffered from agents spawning excessive subagents for simple queries, conducting redundant searches, and failing to coordinate effectively. The team developed several key principles for multi-agent prompt engineering that proved essential for production reliability.

The orchestration prompts required careful design to ensure effective task delegation. The lead agent needed specific guidance on decomposing queries into subtasks, with each subagent receiving clear objectives, output formats, tool usage guidance, and task boundaries. Without detailed task descriptions, agents would duplicate work or leave critical information gaps. The prompts evolved from simple instructions like “research the semiconductor shortage” to detailed mandates that specify search strategies, source types, and coordination protocols.

Effort scaling became another critical prompt engineering challenge. Agents struggled to judge appropriate resource allocation for different query types, leading to either insufficient exploration or excessive token consumption. The team embedded explicit scaling rules: simple fact-finding requires one agent with 3-10 tool calls, direct comparisons need 2-4 subagents with 10-15 calls each, while complex research might use over 10 subagents with clearly divided responsibilities. These guidelines prevent both under-investment in complex queries and over-investment in simple ones.

The prompts also incorporate research methodology best practices, mirroring how skilled human researchers approach complex topics. This includes strategies for starting with broad queries before narrowing focus, evaluating source quality, adapting search approaches based on findings, and balancing depth versus breadth exploration. The team found that Claude 4 models could serve as effective prompt engineers themselves, diagnosing failure modes and suggesting improvements when given prompts and error examples.

## Tool Design and Integration

Tool design emerged as equally critical as prompt engineering for multi-agent success. The team discovered that agent-tool interfaces require the same careful design attention as human-computer interfaces, with poor tool descriptions capable of sending agents down completely wrong paths. Each tool needs distinct purposes and clear descriptions that help agents select appropriate tools for specific tasks.

The system implements explicit tool selection heuristics within the prompts: examining all available tools first, matching tool usage to user intent, preferring specialized tools over generic ones, and using web search for broad external exploration versus specialized tools for specific data sources. With Model Context Protocol (MCP) servers providing access to external tools, the quality of tool descriptions becomes paramount for agent success.

An innovative approach involved creating a tool-testing agent that attempts to use flawed MCP tools and then rewrites tool descriptions to avoid common failures. Through dozens of test iterations, this agent identified key nuances and bugs, resulting in 40% decreased task completion time for future agents using improved descriptions. This demonstrates how AI agents can be used to improve their own operational environment.

## Evaluation and Quality Assurance

Evaluating multi-agent systems presents unique challenges compared to traditional AI applications. Unlike deterministic systems that follow predictable paths from input to output, multi-agent systems can take completely different valid approaches to reach the same goal. One agent might search three sources while another searches ten, or they might use entirely different tools to find identical answers. This variability requires evaluation methodologies that focus on outcomes rather than process compliance.

The team developed a multi-faceted evaluation approach starting with small sample sizes during early development. With dramatic effect sizes common in early agent development (improvements from 30% to 80% success rates), small test sets of about 20 queries representing real usage patterns proved sufficient for detecting changes. This contradicts common beliefs that only large-scale evaluations are useful, demonstrating the value of rapid iteration with focused test cases.

For scalable evaluation, the team implemented LLM-as-judge methodologies with carefully designed rubrics covering factual accuracy, citation accuracy, completeness, source quality, and tool efficiency. A single LLM call with structured prompts outputting 0.0-1.0 scores and pass-fail grades proved more consistent than multiple specialized judges. This approach proved especially effective when test cases had clear correct answers, allowing the LLM judge to verify accuracy for specific factual queries.

Human evaluation remained essential for catching edge cases that automated systems missed, including hallucinated answers on unusual queries, system failures, and subtle biases in source selection. Human testers identified that early agents consistently preferred SEO-optimized content farms over authoritative sources like academic PDFs or personal blogs, leading to source quality heuristics being added to the prompts. The combination of automated and human evaluation proved necessary for comprehensive quality assurance.

## Production Engineering Challenges

Deploying multi-agent systems in production required addressing several unique engineering challenges beyond typical software deployment considerations. The stateful nature of agents running for extended periods with multiple tool calls means that minor system failures can cascade into major behavioral changes. Unlike traditional software where bugs might degrade performance, agent system errors can completely derail research trajectories.

State management became particularly complex because agents maintain context across many tool calls and cannot simply restart from the beginning when errors occur. The team built systems capable of resuming from failure points rather than forcing expensive restarts. They combined AI agent adaptability with deterministic safeguards like retry logic and regular checkpoints, while leveraging the models’ intelligence to handle issues gracefully by informing agents of tool failures and allowing adaptive responses.

Debugging multi-agent systems required new approaches due to their dynamic decision-making and non-deterministic behavior between runs. Users would report agents “not finding obvious information,” but determining root causes proved challenging without visibility into agent reasoning processes. The team implemented comprehensive production tracing to diagnose failure modes systematically, monitoring agent decision patterns and interaction structures while maintaining user privacy by avoiding individual conversation content monitoring.

Deployment coordination presented additional challenges due to the highly stateful nature of agent webs consisting of prompts, tools, and execution logic running almost continuously. Standard deployment approaches could break running agents mid-process. The solution involved rainbow deployments that gradually shift traffic from old to new versions while maintaining both simultaneously, preventing disruption to in-progress research sessions.

The team identified synchronous execution as a current bottleneck, with lead agents waiting for each set of subagents to complete before proceeding. While this simplifies coordination, it creates information flow bottlenecks and prevents real-time steering or coordination between agents. Asynchronous execution would enable additional parallelism but introduces challenges in result coordination, state consistency, and error propagation that the team acknowledges as future development areas.

## Performance and Resource Considerations

Internal evaluations demonstrated significant performance improvements from the multi-agent architecture, with the system using Claude Opus 4 as lead agent and Claude Sonnet 4 subagents outperforming single-agent Claude Opus 4 by 90.2% on research evaluations. The system excelled particularly on breadth-first queries requiring multiple independent exploration directions simultaneously, such as identifying board members across all Information Technology S&P 500 companies.

Analysis revealed that token usage explains 80% of performance variance in browsing evaluations, with tool call frequency and model choice as additional factors. This validates the multi-agent architecture’s approach of distributing work across agents with separate context windows to add reasoning capacity. The latest Claude models act as efficiency multipliers, with upgrading to Claude Sonnet 4 providing larger performance gains than doubling token budgets on Claude Sonnet 3.7.

However, the approach comes with significant resource costs. Agents typically consume about 4× more tokens than chat interactions, while multi-agent systems use approximately 15× more tokens than chats. This resource intensity requires tasks valuable enough to justify the increased performance costs. The team found multi-agent systems most suitable for high-value tasks involving heavy parallelization, information exceeding single context windows, and complex tool interfaces.

## Real-World Usage and Impact

User feedback indicates that the Research feature has proven valuable for complex problem-solving scenarios. Users report that Claude helped them identify previously unconsidered business opportunities, navigate complex healthcare options, resolve technical bugs, and save days of work by uncovering research connections they wouldn’t have found independently. Usage analysis shows primary categories including developing software systems across specialized domains (10%), optimizing professional content (8%), developing business strategies (8%), academic research assistance (7%), and information verification (5%).

The system’s ability to handle tasks that exceed single-agent capabilities has proven particularly valuable for users dealing with information-intensive research requiring comprehensive source coverage and synthesis. The parallel processing capabilities enable research breadth and depth that would be impractical with sequential approaches, while the specialized agent architecture allows for focused expertise on different aspects of complex queries.

## Lessons and Future Directions

The development process revealed that the gap between prototype and production in multi-agent systems is often wider than anticipated due to the compound nature of errors in agentic systems. Minor issues that might be manageable in traditional software can completely derail agent trajectories, leading to unpredictable outcomes. Success requires understanding interaction patterns and emergent behaviors rather than just individual agent performance.

The team emphasizes that effective multi-agent systems require careful engineering, comprehensive testing, detailed prompt and tool design, robust operational practices, and close collaboration between research, product, and engineering teams with deep understanding of current agent capabilities. The compound complexity of multi-agent coordination makes system reliability challenging but achievable with proper engineering practices.

Future development directions include addressing current limitations around asynchronous execution, improving real-time agent coordination, and expanding the types of tasks suitable for multi-agent approaches. The current system works best for research tasks with high parallelization potential, but the team acknowledges that domains requiring shared context or high interdependency between agents remain challenging for current multi-agent architectures.

This case study demonstrates both the significant potential and substantial engineering challenges of deploying sophisticated multi-agent systems in production, providing valuable insights for organizations considering similar approaches to scaling LLM capabilities beyond single-agent limitations.

## More Like This

[

### Agentic AI Copilot for Insurance Underwriting with Multi-Tool Integration

Snorkel ·2025

Snorkel developed a specialized benchmark dataset for evaluating AI agents in insurance underwriting, leveraging their expert network of Chartered Property and Casualty Underwriters (CPCUs). The benchmark simulates an AI copilot that assists junior underwriters by reasoning over proprietary knowledge, using multiple tools including databases and underwriting guidelines, and engaging in multi-turn conversations. The evaluation revealed significant performance variations across frontier models (single digits to ~80% accuracy), with notable error modes including tool use failures (36% of conversations) and hallucinations from pretrained domain knowledge, particularly from OpenAI models which hallucinated non-existent insurance products 15-45% of the time.

healthcare fraud\_detection customer\_support +90

](/llmops-database/agentic-ai-copilot-for-insurance-underwriting-with-multi-tool-integration)[

### Reinforcement Learning for Code Generation and Agent-Based Development Tools

Cursor ·2025

This case study examines Cursor's implementation of reinforcement learning (RL) for training coding models and agents in production environments. The team discusses the unique challenges of applying RL to code generation compared to other domains like mathematics, including handling larger action spaces, multi-step tool calling processes, and developing reward signals that capture real-world usage patterns. They explore various technical approaches including test-based rewards, process reward models, and infrastructure optimizations for handling long context windows and high-throughput inference during RL training, while working toward more human-centric evaluation metrics beyond traditional test coverage.

code\_generation code\_interpretation data\_analysis +63

](/llmops-database/reinforcement-learning-for-code-generation-and-agent-based-development-tools)[

### Building Custom Agents at Scale: Notion's Multi-Year Journey to Production-Ready Agentic Workflows

Notion ·2026

Notion, a knowledge work platform serving enterprise customers, spent multiple years (2022-2026) iterating through four to five complete rebuilds of their agent infrastructure before shipping Custom Agents to production. The core problem was enabling users to automate complex workflows across their workspaces while maintaining enterprise-grade reliability, security, and cost efficiency. Their solution involved building a sophisticated agent harness with progressive tool disclosure, SQL-like database abstractions, markdown-based interfaces optimized for LLM consumption, and a comprehensive evaluation framework. The result was a production system handling over 100 tools, serving majority-agent traffic for search, and enabling workflows like automated bug triaging, email processing, and meeting notes capture that fundamentally changed how their company and customers operate.

chatbot question\_answering summarization +52

](/llmops-database/building-custom-agents-at-scale-notions-multi-year-journey-to-production-ready-agentic-workflows)

We use cookies to improve your experience and analyze site traffic. See our [privacy policy](/privacy-policy).

ManageReject allAccept all