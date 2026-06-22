# Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework

# Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the  
Stability and Safety Governed Memory (SSGM) Framework

Chingkwun Lam, Jiaxin Li, Lingfei Zhang, Kuo Zhao  
College of Intelligent Science and Engineering, Jinan University  
zhaokuo@jnu.edu.cn Corresponding author.

###### Abstract

Long-term memory has emerged as a foundational component of autonomous Large Language Model (LLM) agents, enabling continuous adaptation, lifelong multimodal learning, and sophisticated reasoning. However, as memory systems transition from static retrieval databases to dynamic, agentic mechanisms, critical concerns regarding memory governance, semantic drift, and privacy vulnerabilities have surfaced. While recent surveys have focused extensively on memory retrieval efficiency, they largely overlook the emergent risks of memory corruption in highly dynamic environments. To address these emerging challenges, we propose the Stability and Safety-Governed Memory (SSGM) framework, a conceptual governance architecture. SSGM decouples memory evolution from execution by enforcing consistency verification, temporal decay modeling, and dynamic access control prior to any memory consolidation. Through formal analysis and architectural decomposition, we show how SSGM can mitigate topology-induced knowledge leakage where sensitive contexts are solidified into long-term storage, and help prevent semantic drift where knowledge degrades through iterative summarization. Ultimately, this work provides a comprehensive taxonomy of memory corruption risks and establishes a robust governance paradigm for deploying safe, persistent, and reliable agentic memory systems.

## 1 Introduction

Large Language Model (LLM) agents have demonstrated impressive reasoning and interaction capabilities across diverse domains (Matarazzo and Torlone, [2025](#bib.bib19 "A survey on large language models with some insights on their capabilities and limitations")); yet, in the absence of specialized mechanisms, they remain fundamentally stateless. Standard LLMs rely on a fixed-length context window that prevents indefinite information retention (Zhong et al., [2024](#bib.bib50 "MemoryBank: enhancing large language models with long-term memory"); Yousuf et al., [2025](#bib.bib42 "Can an llm induce a graph? investigating memory drift and context length"); OpenAI, [2023](#bib.bib21 "GPT-4 system card")). While early solutions employed Retrieval-Augmented Generation (RAG) to provide a static knowledge base (Lewis et al., [2020](#bib.bib17 "Retrieval-augmented generation for knowledge-intensive nlp tasks"); Gao et al., [2023](#bib.bib8 "Retrieval-augmented generation for large language models: a survey")), modern autonomous agents demand a more dynamic capability: the ability to learn from experience, update their world models, and refine their strategies over time (Xi et al., [2023](#bib.bib37 "The rise and potential of large language model based agents: a survey"); Wang et al., [2023](#bib.bib35 "Voyager: an open-ended embodied agent with large language models")).

This necessity has driven a paradigm shift from static memory storage to adaptive, self-refining memory systems. Recent architectures treat memory operations not as passive retrieval tasks but as active decision-making processes. For instance, Memory-R1 employs reinforcement learning to train specialized sub-agents that autonomously decide when to add, update, or delete memory units based on task feedback (Yan et al., [2026](#bib.bib40 "Memory-r1: enhancing large language model agents to manage and utilize memories via reinforcement learning")). Similarly, frameworks like Mem0 and AtomMem introduce dynamic consolidation mechanisms that continuously optimize the storage structure via atomic operations (Chhikara et al., [2025](#bib.bib5 "Mem0: building production-ready ai agents with scalable long-term memory"); Huo et al., [2026](#bib.bib14 "AtomMem: learnable dynamic agentic memory with atomic memory operation")). In these systems, memory is no longer an immutable log but a mutable asset that evolves alongside the agent (Zhang et al., [2026b](#bib.bib47 "Memory as action: autonomous context curation for long-horizon agentic tasks"); Luo et al., [2026](#bib.bib48 "From storage to experience: a survey on the evolution of llm agent memory mechanisms")).

![Refer to caption](2603.11768v1/figure1.png)
Figure 1: The Lifecycle of Memory Evolution and Emergent Risks. Unlike static RAG, evolving memory systems introduce a feedback loop where errors can accumulate. We identify three critical failure points: (1) Memory Poisoning during input ingestion, (2) Semantic Drift during consolidation updates, and (3) Conflict/Hallucination during retrieval. SSGM aims to govern these interfaces.

However, granting agents the autonomy to rewrite their own memory introduces the stability-plasticity dilemma into artificial systems. Without robust governance, the continuous refinement of memory creates significant risks. An agent may gradually distort facts through repeated summarization (semantic drift), reinforce suboptimal workflows (procedural drift) (Han et al., [2025](#bib.bib10 "Legomem: modular procedural memory for multi-agent llm systems for workflow automation"); Rath, [2026](#bib.bib27 "Agent drift: quantifying behavioral degradation in multi-agent llm systems over extended interactions")), or inadvertently internalize hallucinations and malicious injections as valid knowledge (Wang et al., [2025](#bib.bib38 "Unveiling privacy risks in llm agent memory"); Greshake et al., [2023](#bib.bib9 "Not what you’ve signed up for: compromising real-world llm-integrated applications with indirect prompt injection")). Unlike static RAG systems, where errors are isolated to a single retrieval step, errors in evolving memory systems are cumulative and persistent. As delineated in Figure [1](#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), this creates a compounding failure loop across three critical interfaces: input ingestion (poisoning), memory consolidation (drift), and memory retrieval (hallucination). Figure [1](#S1.F1 "Figure 1 ‣ 1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") presents this coarse-grained lifecycle risk loop, which is later refined into the four-dimensional failure taxonomy in Table [2](#S5.T2 "Table 2 ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"). As noted in recent surveys (Hu et al., [2025](#bib.bib11 "Memory in the age of ai agents"); Luo et al., [2026](#bib.bib48 "From storage to experience: a survey on the evolution of llm agent memory mechanisms")), while the mechanisms of memory update are well-studied, the protocols for ensuring their long-term correctness and safety remain underexplored.

To address this gap, this paper proposes the Stability- and Safety-Governed Memory (SSGM) framework. We argue that for LLM agents to be reliable in high-stakes environments, memory evolution must be decoupled from memory governance. Our contributions are fourfold:

1.  1.
    
    Taxonomy of Evolution: We categorize memory evolution along three dimensions: content abstraction, structural reorganization (e.g., from lists to Zettelkasten-style graphs (Xu et al., [2025](#bib.bib39 "A-mem: agentic memory for llm agents"); Jiang et al., [2026](#bib.bib15 "MAGMA: a multi-graph based agentic memory architecture for ai agents"))), and policy optimization.
    
2.  2.
    
    Failure Analysis: We identify and formalize key failure modes in adaptive memory, specifically distinguishing between intrinsic drift (e.g., knowledge conflict) and extrinsic threats (e.g., memory poisoning).
    
3.  3.
    
    The SSGM Framework: We synthesize design principles for a governed memory architecture that integrates consistency verification and ground-truth anchoring to mitigate the risks of uncontrolled evolution.
    
4.  4.
    
    Fundamental Trade-offs: We establish a formal discussion on the three fundamental trade-offs inherent in agentic memory—the latency-safety trade-off, the stability-plasticity conflict, and the scalability of graph structures—setting the stage for future research.
    

## 2 From Static to Adaptive Memory Systems

Initial iterations of LLM-based agent systems either lacked long-term memory entirely or relied on simplistic approaches to maintain context. For example, some agents maintained a sequential log of recent dialogue and instructions, truncating or discarding older content upon the saturation of the context window (Press et al., [2021](#bib.bib24 "Train short, test long: attention with linear biases enables input length extrapolation")); others utilized vector-similarity search within a database of past interactions to retrieve relevant segments on demand. These strategies constitute a paradigm of static memory: the agent does not alter its memory usage adaptively based on interaction outcomes, and the rules for storage and retrieval are predetermined by developers. A classic example is the Generative Agents framework (Park et al., [2023](#bib.bib23 "Generative agents: interactive simulacra of human behavior")), where simulated characters stored factual observations and reflections, retrieving them via a fixed relevance-and-recency scoring heuristic. While effective to a degree, this design required extensive manual tuning of storage and summarization criteria, and the system could not learn from memory management errors. Similarly, MemoryBank (Zhong et al., [2024](#bib.bib50 "MemoryBank: enhancing large language models with long-term memory")) and related systems summarized or discarded observations using fixed schedules or manually crafted triggers, illustrating the resource-intensive and suboptimal nature of heuristic memory management.

The limitations of static approaches motivated the development of adaptive memory mechanisms. A crucial insight involved framing memory management as a decision problem amenable to learning or operating system-like management. MemGPT (Packer et al., [2024](#bib.bib22 "MemGPT: towards llms as operating systems")) pioneered the concept of treating context as a limited resource, employing an OS-inspired paging mechanism to transfer information between “main context” (RAM) and “external context” (disk) based on immediate task requirements. This represented a fundamental shift from simple sliding windows. The Tensor Brain (Tresp et al., [2023](#bib.bib32 "The tensor brain: a unified theory of perception, memory, and semantic decoding")) constituted another early effort, introducing a neural architecture for differentiable episodic, semantic, and working memory. More recently, Memory-R1 explicitly formulates memory operations as actions to be optimized by a learned policy (Yan et al., [2026](#bib.bib40 "Memory-r1: enhancing large language model agents to manage and utilize memories via reinforcement learning")).

Other systems incorporate adaptivity via alternative mechanisms: MemAct (Zhang et al., [2026b](#bib.bib47 "Memory as action: autonomous context curation for long-horizon agentic tasks")) enables the agent to embed memory-related actions into its chain-of-thought prompting (Wei et al., [2022](#bib.bib36 "Chain-of-thought prompting elicits reasoning in large language models"); Yao et al., [2023](#bib.bib41 "ReAct: synergizing reasoning and acting in language models")). If the agent detects uncertainty regarding a detail, it can explicitly issue a “lookup memory” or “store memory” action. Over multiple reasoning sessions, the agent refines the timing of these actions via feedback. Similarly, Nemori (Nan et al., [2025](#bib.bib20 "Nemori: self-organizing agent memory inspired by cognitive science")) draws upon cognitive science to introduce a self-organizing memory policy: the agent internalizes rules for maintaining consistency and organization (such as periodically reconciling new information with old) without external supervision, thereby gradually improving memory coherence.

System

Memory Structure

Evolution Policy

Refinement & Stability

Safety & Access

Target Domain

Adaptive & Learning-Based Systems

Memory-R1 (Yan et al., [2026](#bib.bib40 "Memory-r1: enhancing large language model agents to manage and utilize memories via reinforcement learning"))

Flat Vector DB

RL (PPO)

Feedback-driven Updates

–

Open-Domain QA

MemAgent (Yu et al., [2025](#bib.bib43 "MemAgent: reshaping long-context llm with multi-conv rl-based memory agent"))

Semantic Slots

RL (DAPO)

Selective Overwriting

–

Long-Context QA

AtomMem (Huo et al., [2026](#bib.bib14 "AtomMem: learnable dynamic agentic memory with atomic memory operation"))

Vector + Buffer

Atomic Ops

Needle-in-Haystack Training

–

Multi-Turn Reasoning

LEGOMem (Han et al., [2025](#bib.bib10 "Legomem: modular procedural memory for multi-agent llm systems for workflow automation"))

Procedural Graph

Failure-driven

Rule Verification

–

Workflow Automation

AgentSM (Biswal et al., [2026](#bib.bib3 "AgentSM: semantic memory for agentic text-to-SQL"))

SQL-based Knowledge

Agentic Tuning

Schema Evolution

Strict Schema Constraints

Text-to-SQL (Enterprise)

AWM (Zheng and others, [2024](#bib.bib49 "Agent workflow memory"))

Workflow Rules

Skill Induction

Trace Compression

–

Procedural Execution

DarwinMem (Mi et al., [2026](#bib.bib51 "Darwinian memory: a training-free self-regulating memory system for gui agent evolution"))

Evolutionary Pool

Training-Free

Survival of the Fittest

–

GUI Agent Evolution

Astraea (Ni et al., [2025](#bib.bib55 "Astraea: a state-aware scheduling engine for llm-powered agents"))

KV Cache

State-Aware Sched.

JCT Lifecycle Optim.

–

Agentic Workflows

Graph-Based & Cognitive Architectures

HiMem (Zhang et al., [2026a](#bib.bib46 "HiMem: hierarchical long-term memory for llm long-horizon agents"))

Hierarchical

LLM-Reasoning

Reconsolidation

Precision-Recall Balance

Long-Horizon Agents

A-MEM (Xu et al., [2025](#bib.bib39 "A-mem: agentic memory for llm agents"))

Zettelkasten Graph

Self-Organizing

Dynamic Linking

–

General Agents

MemoRAG (Qian and others, [2024](#bib.bib25 "MemoRAG: boosting long context processing with global memory-enhanced retrieval augmentation"))

Global Memory Graph

Insight Extraction

Memory-Enhanced Retrieval

–

Long Context QA

LiCoMemory (Huang et al., [2025](#bib.bib13 "Licomemory: lightweight and cognitive agentic memory for efficient long-term reasoning"))

Lightweight KG

Consistency Checks

Semantic Decay

Fact Verification

Multi-Turn Reasoning

HippoRAG (Gutiérrez et al., [2024](#bib.bib52 "HippoRAG: neurobiologically inspired long-term memory for large language models"))

Neurobiological Graph

Spreading Act.

Pathway Consolidation

–

Open-Domain QA

Forgetful/Faithful (Alqithami, [2025](#bib.bib57 "Forgetful but faithful: a cognitive memory architecture and benchmark for privacy-aware generative agents"))

Typed Node Schema

Budgeted Forgetting

Coherence Preserved

(ϵ,δ)(\\epsilon,\\delta)\-Privacy

Privacy-Aware Agents

E-mem (Wang et al., [2026](#bib.bib34 "E-mem: multi-agent based episodic context reconstruction for llm agent memory"))

Episodic Context

Reconstruction

Context Reconstruction

Traceability

Long-Horizon Tasks

Zep (Rasmussen et al., [2025](#bib.bib26 "Zep: a temporal knowledge graph architecture for agent memory"))

Temporal KG

Incremental Extraction

Entity Resolution

–

Conversational AI

Multimodal & Collaborative Systems

TeleMem (Chen et al., [2025](#bib.bib4 "TeleMem: building long-term and multimodal memory for agentic AI"))

Object-Centric Graph

User-driven Trigger

Physical Scene Updates

Privacy Filtering

Embodied AI / IoT

VideoARM (Yin et al., [2025](#bib.bib56 "VideoARM: agentic reasoning over hierarchical memory for long-form video understanding"))

Hierarchical Multi.

Adaptive Loop

Multi-level Clue Updates

–

Long-Form Video

WorldMM (Yeo et al., [2025](#bib.bib53 "WorldMM: dynamic multimodal memory agent for long video reasoning"))

Spatiotemporal Mem

Dynamic Retrieval

Video State Tracking

–

Long Video Reasoning

MemVerse (Liu et al., [2025b](#bib.bib54 "MemVerse: multimodal memory for lifelong learning agents"))

Multimodal Vector

Continual Learning

Cross-Modal Alignment

–

Lifelong Learning

Collab. Mem (Rezazadeh et al., [2025](#bib.bib28 "Collaborative memory: multi-user memory sharing in llm agents with dynamic access control"))

Distributed Vector

Consensus Voting

Cross-User Deduplication

Dynamic ACLs

Multi-User Collab

Topology Matters (Liu et al., [2025a](#bib.bib58 "Topology matters: measuring memory leakage in multi-agent llms"))

Multi-Agent Network

MAMA Framework

Leakage Plateau Anal.

Centrality Const.

Multi-Agent Privacy

MIRIX (Wang and Chen, [2025](#bib.bib33 "MIRIX: multi-agent memory system for llm-based agents"))

Shared Multi-Agent Space

Collaborative Reflection

Procedural Alignment

Agent Role Boundaries

Multi-Agent Systems

Table 1: Taxonomy of Evolving Memory Systems. We categorize recent systems by their storage structure, the policy governing memory evolution, mechanisms for maintaining stability, and safety provisions. Newly integrated approaches like HippoRAG, DarwinMem, and VideoARM emphasize the shift towards neurobiology, adaptive policies, and multimodal environments.

## 3 What Evolves: Content, Structure, and Policy

Memory in LLM agents evolves along multiple dimensions. We categorize the major facets as: (1) the content of memory, comprising stored information and its level of detail; (2) the structure of memory, referring to the organization and representation of knowledge; and (3) the policy for memory management, namely the decision-making process that determines how memory is utilized and updated. While these facets are interrelated, examining them separately clarifies how modern systems transcend the limitations of static memory.

### 3.1 Evolving Memory Content (What is Stored)

The most direct form of memory evolution occurs in the content itself. Unlike a static transcript, adaptive agents continually modify memory units. This process involves adding new facts, updating existing units, summarizing detailed events into high-level conclusions, or deleting information deemed irrelevant or obsolete. By altering the content of stored information, the knowledge base becomes a dynamic resource that changes over time.

A common pattern is summarization and abstraction. An agent may replace a detailed episode with a brief synopsis once confidence is established that fine-grained details are no longer requisite. This was observed in early experiments with Generative Agents (Park et al., [2023](#bib.bib23 "Generative agents: interactive simulacra of human behavior")). More recently, systems have expanded content evolution to include multimodal and procedural knowledge. For instance, VideoARM (Yin et al., [2025](#bib.bib56 "VideoARM: agentic reasoning over hierarchical memory for long-form video understanding")) dynamically constructs hierarchical memory to reason over long-form videos without exhaustive preprocessing, while WorldMM (Yeo et al., [2025](#bib.bib53 "WorldMM: dynamic multimodal memory agent for long video reasoning")) continuously tracks spatiotemporal states. Similarly, TeleMem (Chen et al., [2025](#bib.bib4 "TeleMem: building long-term and multimodal memory for agentic AI")) maintains evolving object-centric graphs that track the changing states of physical environments, while LEGOMem (Han et al., [2025](#bib.bib10 "Legomem: modular procedural memory for multi-agent llm systems for workflow automation")) synthesizes successful execution traces into procedural rules. To further structure this, frameworks like Agent Workflow Memory (AWM) (Zheng and others, [2024](#bib.bib49 "Agent workflow memory")) demonstrate how episodic traces can be systematically compressed into reusable workflow rules, enhancing procedural memory while mitigating the noise of raw logs. This shift from purely textual facts to procedural content increases the complexity of maintaining consistency, as errors in procedural memory can lead to cascading failures in task execution.

### 3.2 Evolving Memory Structure (How Knowledge is Organized)

The structuring of memory dramatically influences retrieval effectiveness and the reasoning capabilities of the agent (Luo et al., [2026](#bib.bib48 "From storage to experience: a survey on the evolution of llm agent memory mechanisms")). Grouping related facts or linking causes and effects facilitates inferences that are difficult to derive from unstructured data. Many agent memory systems draw inspiration from databases or cognitive metaphors such as knowledge graphs and semantic networks.

Recent advancements have introduced self-organizing structures. A-MEM (Xu et al., [2025](#bib.bib39 "A-mem: agentic memory for llm agents")) adopts the Zettelkasten method, treating memories as atomic notes that dynamically evolve by establishing links with related concepts, effectively creating a “living” graph of knowledge. Drawing directly from neurobiology, HippoRAG (Gutiérrez et al., [2024](#bib.bib52 "HippoRAG: neurobiologically inspired long-term memory for large language models")) utilizes a spreading activation mechanism over knowledge graphs to mimic human associative recall, drastically improving multi-hop reasoning performance. To bridge the gap between static retrieval and cognitive synthesis, MemoRAG (Qian and others, [2024](#bib.bib25 "MemoRAG: boosting long context processing with global memory-enhanced retrieval augmentation")) builds a global memory graph over long contexts, enabling agents to extract structural insights before generating answers. Similarly, HiMem (Zhang et al., [2026a](#bib.bib46 "HiMem: hierarchical long-term memory for llm long-horizon agents")) implements a hierarchical structure where episodic details are continuously distilled into semantic knowledge through a process of reconsolidation. ChatDB (Hu et al., [2023](#bib.bib12 "Chatdb: augmenting llms with databases as their symbolic memory")) treats memory as a symbolic SQL database, allowing the agent to execute complex queries rather than relying solely on semantic search; the structure evolves as the agent defines new tables or schemas.

### 3.3 Evolving Memory Policy (How Memory is Managed)

Table [1](#S2.T1 "Table 1 ‣ 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") provides a comprehensive taxonomy of these evolving systems, categorizing them by their structural approach (from vector databases to hierarchical graphs) and their evolution policies. Notably, as shown in the table, newer frameworks like AtomMem (Huo et al., [2026](#bib.bib14 "AtomMem: learnable dynamic agentic memory with atomic memory operation")) and MemAgent (Yu et al., [2025](#bib.bib43 "MemAgent: reshaping long-context llm with multi-conv rl-based memory agent")) employ Reinforcement Learning (RL) to learn optimal memory policies. By framing memory operations (add, update, delete, retrieve) as atomic actions, these agents optimize their memory management strategies to maximize long-term task rewards. Conversely, DarwinMem (Mi et al., [2026](#bib.bib51 "Darwinian memory: a training-free self-regulating memory system for gui agent evolution")) proves that memory policies can also be optimized without parameter updates, employing a training-free “survival of the fittest” evolutionary pool to adapt GUI agents across tasks.

## 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation

Having identified what changes in evolving memory, we now examine how these changes are effected.

### 4.1 Reflection and Self-Supervised Memory Updates

Reflection involves an agent examining its own actions or outcomes and generating analyses or lessons, which then inform future decisions (Sumers et al., [2023](#bib.bib31 "Cognitive architectures for language agents")). In Reflexion (Shinn et al., [2023](#bib.bib30 "Reflexion: language agents with verbal reinforcement learning")), the agent prompts itself: “If the solution was wrong, explain the error.” The generated reflection is stored as a memory. This reflective loop has become a cornerstone of agent improvement (Madaan et al., [2023](#bib.bib18 "Self-refine: iterative refinement with self-feedback"); Wang et al., [2023](#bib.bib35 "Voyager: an open-ended embodied agent with large language models")). MemR3 (Du et al., [2025](#bib.bib6 "MemR3: memory retrieval via reflective reasoning for llm agents")) extends this by employing reflective reasoning during the retrieval process itself, refining queries iteratively to bridge the gap between user intent and stored knowledge.

### 4.2 Reinforcement Learning and Outcome-Driven Memory Optimization

While reflection relies on self-supervision, Reinforcement Learning (RL) offers a direct method to optimize memory behavior toward explicit objectives. Formally, the memory management problem can be modeled as a Partially Observable Markov Decision Process (POMDP). At time tt, the agent receives an observation oto\_{t} (e.g., a user query), maintains an internal memory state MtM\_{t}, and occupies a latent decision state sts\_{t} that summarizes the observation, the current memory, and the task context. The policy πθ​(at∣ot,Mt)\\pi\_{\\theta}(a\_{t}\\mid o\_{t},M\_{t}) selects an action at∈𝒜a\_{t}\\in\\mathcal{A}, where the global action space contains both task-level actions and memory-management actions. We explicitly define the memory-action subset as follows:

𝒜mem\={Add​(c),Update​(i​d​x,v),Delete(idx),Retrieve(q)}\\begin{split}\\mathcal{A}\_{\\text{mem}}=\\{&\\textsc{Add}(c),\\textsc{Update}(idx,v),\\\\ &\\textsc{Delete}(idx),\\textsc{Retrieve}(q)\\}\\end{split}

(1)

where cc denotes the content to be stored, i​d​xidx denotes the index or key of an existing memory item, vv denotes the replacement or updated value written to that indexed item, and qq denotes the retrieval query used to access previously stored memory. Intuitively, Eq. (1) defines the discrete action subspace through which the agent treats memory management as an explicit decision process rather than as a fixed backend routine.

The agent optimizes parameters θ\\theta to maximize the expected discounted return:

J​(θ)\=𝔼τ∼πθ​\[∑t\=0Tγt​r​(st,at)\]J(\\theta)=\\mathbb{E}\_{\\tau\\sim\\pi\_{\\theta}}\\left\[\\sum\_{t=0}^{T}\\gamma^{t}r(s\_{t},a\_{t})\\right\]

(2)

where τ\\tau denotes a trajectory induced by the policy πθ\\pi\_{\\theta}, TT denotes the horizon length of the interaction episode, γ∈\[0,1)\\gamma\\in\[0,1) is the discount factor that balances immediate and long-term reward, sts\_{t} denotes the latent decision state at time tt, and r​(st,at)r(s\_{t},a\_{t}) denotes the reward assigned to taking action ata\_{t} in state sts\_{t}. Intuitively, Eq. (2) formalizes the objective of learning a memory policy that optimizes long-term utility: a memory write that incurs slight short-term cost may still be preferred if it substantially improves future reasoning or retrieval. Memory-R1 (Yan et al., [2026](#bib.bib40 "Memory-r1: enhancing large language model agents to manage and utilize memories via reinforcement learning")) utilizes this formulation via Proximal Policy Optimization (PPO). MemAgent (Yu et al., [2025](#bib.bib43 "MemAgent: reshaping long-context llm with multi-conv rl-based memory agent")) further refines this by using Group Relative Policy Optimization (GRPO) to handle the sparse rewards associated with long-term memory benefits.

### 4.3 Memory Consolidation and Forgetting

The third key mechanism is consolidation and forgetting, analogous to biological processes (Tresp et al., [2023](#bib.bib32 "The tensor brain: a unified theory of perception, memory, and semantic decoding")). Without management, the memory size |ℳ||\\mathcal{M}| grows linearly, causing retrieval latency. Alqithami ([2025](#bib.bib57 "Forgetful but faithful: a cognitive memory architecture and benchmark for privacy-aware generative agents")) formalizes this through “forgetting-by-design”, demonstrating via the FiFA benchmark that bounded, budget-aware forgetting policies (e.g., Priority Decay) not only reduce computational cost but actively preserve narrative coherence and privacy without sacrificing functionality.

#### Temporal Decay and Freshness Governance

To mitigate the risk of temporal obsolescence, where stale facts contradict recent updates, governance mechanisms must incorporate time-aware forgetting. Inspired by cognitive decay theories, Huang et al. ([2025](#bib.bib13 "Licomemory: lightweight and cognitive agentic memory for efficient long-term reasoning")) propose a Weibull-based decay function to model the relevance w​(Δ​τ)w(\\Delta\\tau) of a memory unit over time:

w​(Δ​τ)\=exp⁡(−(Δ​τη)κ)w(\\Delta\\tau)=\\exp\\left(-\\left(\\frac{\\Delta\\tau}{\\eta}\\right)^{\\kappa}\\right)

(3)

where Δ​τ\\Delta\\tau denotes the elapsed time (e.g., measured in conversational turns or absolute hours) since the last successful retrieval of the memory unit, η\\eta is the scale parameter controlling the characteristic time scale of decay, and κ\\kappa is the shape parameter controlling the curvature of the forgetting profile. Intuitively, Eq. (3) assigns lower relevance scores to stale memory entries, thereby allowing the system to downweight or discard items that are less likely to remain valid. The Weibull form is more expressive than a simple exponential decay because the shape parameter can represent faster early decay or more delayed forgetting under different domains. In the SSGM framework, memory items are pruned or archived whenever their temporal relevance falls below a unified freshness threshold θfresh\\theta\_{\\text{fresh}}, thereby reducing the attack surface for stale reasoning and memory-induced hallucination.

Furthermore, E-mem (Wang et al., [2026](#bib.bib34 "E-mem: multi-agent based episodic context reconstruction for llm agent memory")) shifts from simple retrieval to Episodic Context Reconstruction, where the agent actively reconstructs the context from fragmented traces rather than retrieving pre-stored blocks, ensuring higher fidelity to the original experience.

## 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety

Evolving memory empowers LLM agents but also introduces a spectrum of potential failure modes. As illustrated in Table [2](#S5.T2 "Table 2 ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), we categorize these failures into four distinct dimensions: Stability, Validity, Efficiency, and Safety.

Category

Failure Mode

Mechanism & Manifestation

Representative Contexts

SSGM Mitigation Strategy

Stability

Semantic Drift

Iterative summarization causes gradual nuance loss

Recursive Summarization (Park et al., [2023](#bib.bib23 "Generative agents: interactive simulacra of human behavior"))

Ground Truth Anchoring (ℛ\\mathcal{R})

Procedural Drift

Reinforcement of suboptimal/outdated workflows

Workflow Automation (Han et al., [2025](#bib.bib10 "Legomem: modular procedural memory for multi-agent llm systems for workflow automation"); Fang et al., [2025](#bib.bib7 "Memp: exploring agent procedural memory"))

Rule Verification

Goal/Role Drift

Alignment shift due to accumulated interaction bias

Long-term Role-play (Yuen et al., [2026](#bib.bib44 "Intrinsic memory agents: heterogeneous multi-agent llm systems through structured contextual memory"))

Role Partitioning

Validity

Memory Hallucination

Retrieval of non-existent or fabricated facts

Open-domain QA (Du et al., [2025](#bib.bib6 "MemR3: memory retrieval via reflective reasoning for llm agents"))

Consistency Verifier (TMS)

Temporal Obsolescence

Conflict between stale memories and new states

User Personalization (Rasmussen et al., [2025](#bib.bib26 "Zep: a temporal knowledge graph architecture for agent memory"))

Weibull Decay Function

Efficiency

Retrieval Latency

Search time scales linearly/quadratically with history

Real-time Interaction (Chhikara et al., [2025](#bib.bib5 "Mem0: building production-ready ai agents with scalable long-term memory"))

Hierarchical Indexing

Index Bloat

Accumulation of redundant/noisy episodic logs

Infinite Context (Sarin et al., [2025](#bib.bib29 "Memoria: a scalable agentic memory framework for personalized conversational ai"))

Active Forgetting / Pruning

Safety

Memory Poisoning

Injection of malicious instructions into storage

User Instruction Tuning (Greshake et al., [2023](#bib.bib9 "Not what you’ve signed up for: compromising real-world llm-integrated applications with indirect prompt injection"))

Write Filtering (Firewall)

Privacy Leakage

Unauthorized cross-session/cross-user retrieval

Multi-tenant Agents (Rezazadeh et al., [2025](#bib.bib28 "Collaborative memory: multi-user memory sharing in llm agents with dynamic access control"))

Provenance & ACLs

Table 2: Comprehensive Taxonomy of Evolving Memory Failures. We expand the taxonomy to include Efficiency failures (Latency, Bloat), which are critical in long-horizon agents. Validity failures now explicitly distinguish between hallucination and temporal obsolescence (fact conflict over time), citing recent evidence from Rasmussen et al. ([2025](#bib.bib26 "Zep: a temporal knowledge graph architecture for agent memory")).

### 5.1 Semantic Drift and Gradual Deviation

Memory drift refers to the phenomenon where the knowledge stored by an agent gradually deviates from ground truth (conceptually visualized in Figure [2](#S5.F2 "Figure 2 ‣ 5.1 Semantic Drift and Gradual Deviation ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), which specifically illustrates preference-intensity drift under repeated lossy summarization). Drift is not monolithic; it manifests in several forms.

Semantic drift is primarily driven by lossy compression algorithms, such as iterative summarization. As information is re-encoded multiple times (e.g., from raw text to summary to higher-level reflection), nuanced details are stripped away, leading to a gradual distortion of the ground truth (Park et al., [2023](#bib.bib23 "Generative agents: interactive simulacra of human behavior")). Figure [2](#S5.F2 "Figure 2 ‣ 5.1 Semantic Drift and Gradual Deviation ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") provides an intuitive example of this process: a mild user preference can be progressively intensified through repeated rewriting, eventually causing a concrete preference violation. As contrasted in Figure [3](#S5.F3 "Figure 3 ‣ 5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), while a naive pipeline exacerbates this nuance loss by repeatedly overwriting the active memory, an anchored approach periodically reconciles the mutable state with an immutable episodic ledger (formally denoted as 𝒦ledger\\mathcal{K}\_{\\text{ledger}} later in Section 6.2) to preserve original fidelity. Figure [3](#S5.F3 "Figure 3 ‣ 5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") abstracts the causal mechanism behind this process, whereas Figure [2](#S5.F2 "Figure 2 ‣ 5.1 Semantic Drift and Gradual Deviation ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") visualizes its concrete symptom at the level of a user preference.

![Refer to caption](2603.11768v1/figure2.png)
Figure 2: An Illustrative Case of Semantic Drift. Iterative summarization gradually distorts a specific user preference through lossy compression and semantic intensification. For example, an originally mild preference (e.g., “I like mild spicy food”) may be progressively rewritten as “likes spicy food” and later “loves very spicy food,” ultimately causing a preference violation (e.g., suggesting ghost pepper wings).

Procedural drift refers to the degradation of the skills or strategies of an agent as it reinforces suboptimal execution paths (Han et al., [2025](#bib.bib10 "Legomem: modular procedural memory for multi-agent llm systems for workflow automation")). For instance, an agent might “learn” a convoluted workaround for a simple API call and rigidify this into its procedural memory, blocking future optimization.

Finally, Goal drift represents a subtle misalignment where the behavior of the agent shifts away from original instructions due to accumulated biases in its memory (Rath, [2026](#bib.bib27 "Agent drift: quantifying behavioral degradation in multi-agent llm systems over extended interactions")).

We can formalize semantic drift δ\\delta at time TT as the divergence between the embedding representation E​(MT)E(M\_{T}) of the current memory and the embedding of the ground-truth reference ledger 𝒦true\\mathcal{K}\_{\\text{true}}:

δ​(MT,𝒦true)\=1−sim​(E​(MT),E​(𝒦true))\\delta(M\_{T},\\mathcal{K}\_{\\text{true}})=1-\\mathrm{sim}\\left(E(M\_{T}),E(\\mathcal{K}\_{\\text{true}})\\right)

(4)

where MTM\_{T} denotes the memory state after TT update steps, 𝒦true\\mathcal{K}\_{\\text{true}} denotes the idealized ground-truth semantic target, E​(⋅)∈ℝdE(\\cdot)\\in\\mathbb{R}^{d} denotes a fixed semantic embedding model projecting the memory into a dd\-dimensional continuous space, and sim​(⋅,⋅)\\mathrm{sim}(\\cdot,\\cdot) denotes cosine similarity in the embedding space. Intuitively, Eq. (4) uses embedding-space divergence as a tractable proxy for semantic corruption: the larger the distance between the current memory representation and the reference ledger, the larger the estimated drift. In practice, 𝒦true\\mathcal{K}\_{\\text{true}} may be approximated by an immutable ledger of raw observations, which preserves details that may be lost in iterative summarization.

### 5.2 Validity Failures: Hallucination and Obsolescence

Closely related to drift is the problem of Validity. This manifests primarily as Memory Hallucination, where the agent stores hallucinated content as truth. Distinct from hallucination is temporal obsolescence, a failure mode highlighted by Rasmussen et al. ([2025](#bib.bib26 "Zep: a temporal knowledge graph architecture for agent memory")) in temporal knowledge graphs. Here, stored information is factually correct but outdated. Without mechanisms to resolve conflicting timestamps (as addressed by LiCoMemory’s decay function), agents may retrieve and act upon stale data.

### 5.3 Systemic Failures: Efficiency and Safety

Beyond correctness, evolving memory systems face Efficiency and Safety challenges. As memory logs expand, Retrieval Latency can scale linearly or quadratically (Chhikara et al., [2025](#bib.bib5 "Mem0: building production-ready ai agents with scalable long-term memory")). Astraea (Ni et al., [2025](#bib.bib55 "Astraea: a state-aware scheduling engine for llm-powered agents")) reveals that isolated segment retrieval causes severe Head-of-Line blocking, advocating for state-aware scheduling that optimizes the global request lifecycle during agentic memory operations.

On the safety front, Memory Poisoning remains a critical risk (Greshake et al., [2023](#bib.bib9 "Not what you’ve signed up for: compromising real-world llm-integrated applications with indirect prompt injection")). Additionally, in multi-user environments, Privacy Leakage becomes a concern. Topology Matters (Liu et al., [2025a](#bib.bib58 "Topology matters: measuring memory leakage in multi-agent llms")) highlights that the network structure of multi-agent systems intrinsically governs memory leakage, finding that fully connected graphs maximize vulnerability. Therefore, without rigorous Access Control Lists (ACLs), as implemented in Collaborative Memory (Rezazadeh et al., [2025](#bib.bib28 "Collaborative memory: multi-user memory sharing in llm agents with dynamic access control")), agents may inadvertently retrieve cross-session memories, leaking sensitive data to unauthorized parties.

![Refer to caption](2603.11768v1/figure3.png)
Figure 3: Logical Mechanism of Memory Drift vs. Anchored Stability. The left path illustrates how naive iterative summarization causes semantic drift (loss of nuance). The right path demonstrates the SSGM approach, where periodic reconciliation (ℛ\mathcal{R}) with an immutable anchor log (𝒦ledger\mathcal{K}_{\text{ledger}}) bounds the distortion relative to the ground truth (𝒦true\mathcal{K}_{\text{true}}).

## 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda

Current memory systems predominantly prioritize adaptability—the ability of an agent to rapidly learn and incorporate new context—over stability and safety. In unrestricted architectures, the agent interacts directly with the storage medium, acting as both the sole generator and validator of its evolving knowledge base. As established in Section 4, this unconstrained autonomy is the primary catalyst for semantic drift, catastrophic forgetting, and susceptibility to adversarial memory poisoning (Greshake et al., [2023](#bib.bib9 "Not what you’ve signed up for: compromising real-world llm-integrated applications with indirect prompt injection")).

To bridge this critical gap, we formulate the Stability- and Safety-Governed Memory (SSGM) framework. Rather than a specific software implementation, SSGM provides a rigorous theoretical architecture and a set of design principles. At its core, SSGM proposes that robust memory systems must structurally decouple the generative cognitive policy of the agent from the underlying memory substrate through an active, intercepting Governance Middleware. Figure [4](#S6.F4 "Figure 4 ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") operationalizes the mechanism abstracted in Figure [3](#S5.F3 "Figure 3 ‣ 5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework") as a full governed architecture, where Eq. (5), Eq. (6), and Eq. (7) correspond respectively to constrained retrieval, gated writing, and asynchronous reconciliation.

![Refer to caption](2603.11768v1/x1.png)
Figure 4: The conceptual architecture of the SSGM framework, featuring a decoupled left-to-right processing pipeline. The Governance Middleware intercepts memory interactions between the LLM Agent and the Memory Substrate. The upper pathway governs memory consolidation (Write Validation) to ensure logical consistency and mitigate drift, while the lower pathway manages memory retrieval (Read Filtering) by enforcing access scopes and temporal relevance. The right-side dual-memory substrate further supports reversible reconciliation by pairing a mutable active graph with an immutable episodic log.

### 6.1 Design Principles of Governed Memory

As illustrated in Figure [4](#S6.F4 "Figure 4 ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), SSGM replaces direct memory access with a set of governed gates. We articulate four foundational design principles necessary for engineering reliable, long-horizon agents:

#### Principle 1: Pre-Consolidation Validation

In biological systems, the hippocampus does not instantly commit every perception to the neocortex; information undergoes significant filtering and reality monitoring (Tresp et al., [2023](#bib.bib32 "The tensor brain: a unified theory of perception, memory, and semantic decoding")). Similarly, in SSGM, memory updates should never be committed passively. When the agent generates a memory delta (Δ​M\\Delta M), it must pass through a Write Validation Gate (depicted as the upper consolidation pathway in Figure [4](#S6.F4 "Figure 4 ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework")). This mechanism acts as a Truth Maintenance System (TMS) that retrieves established core facts (McoreM\_{\\text{core}}) to execute a strict logical contradiction check: if the condition Δ​M∧Mcore⊧⊥\\Delta M\\wedge M\_{\\text{core}}\\models\\bot evaluates to true, the update is rejected. By bounding updates with formal Natural Language Inference (NLI) checks, the system actively prevents hallucination cascades from permanently corrupting the semantic graph (Xu et al., [2025](#bib.bib39 "A-mem: agentic memory for llm agents")).

#### Principle 2: Temporal and Provenance Grounding

Not all stored information retains its validity indefinitely. Unrestricted retrieval often pulls stale or maliciously injected instructions, leading to temporal obsolescence (Rasmussen et al., [2025](#bib.bib26 "Zep: a temporal knowledge graph architecture for agent memory")). SSGM advocates for a Read Filtering Gate (illustrated in the lower retrieval pathway in Figure [4](#S6.F4 "Figure 4 ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework")) that evaluates candidate contexts based on two axes. First, it requires cryptographic provenance (σ​(μ)\\sigma(\\mu)) to ensure the memory unit was generated by a trusted source rather than an adversarial prompt. Second, it applies a cognitive decay function, such as the Weibull distribution w​(Δ​τ)\=exp⁡(−(Δ​τ/η)κ)w(\\Delta\\tau)=\\exp(-(\\Delta\\tau/\\eta)^{\\kappa}) proposed by Huang et al. ([2025](#bib.bib13 "Licomemory: lightweight and cognitive agentic memory for efficient long-term reasoning")). Memories falling below a dynamic relevance threshold are pruned before reaching the agent’s context window, ensuring the agent reasons exclusively over fresh, high-confidence data.

#### Principle 3: Access-Scoped Retrieval

The shift towards multi-agent (Wang and Chen, [2025](#bib.bib33 "MIRIX: multi-agent memory system for llm-based agents")) and multi-tenant systems exposes critical privacy vulnerabilities. As demonstrated by Liu et al. ([2025a](#bib.bib58 "Topology matters: measuring memory leakage in multi-agent llms")), fully connected memory networks maximize the risk of topology-induced knowledge leakage. SSGM dictates that retrieval mechanisms must not rely solely on semantic similarity. Instead, the Read Filtering Gate must inject identity-based constraints (e.g., Attribute-Based Access Control, ABAC) directly into the query execution layer (Rezazadeh et al., [2025](#bib.bib28 "Collaborative memory: multi-user memory sharing in llm agents with dynamic access control")). This ensures strict isolation of memory sub-graphs, preventing the cross-contamination of agent personas or sensitive user data.

#### Principle 4: Reversible Reconciliation

To effectively bound long-term semantic drift, the underlying storage substrate must be dual-track. Drawing inspiration from human episodic and semantic memory divisions (Alqithami, [2025](#bib.bib57 "Forgetful but faithful: a cognitive memory architecture and benchmark for privacy-aware generative agents")), SSGM pairs a rapidly updatable Mutable Active Graph (for fast, semantic reasoning) with an append-only Immutable Episodic Log (acting as the operational source of truth). This dual structure enables asynchronous reconciliation, allowing the system to periodically “replay” and correct drifted concepts against the raw interaction trace, effectively offering a rollback mechanism if severe agent behavioral degradation occurs (Rath, [2026](#bib.bib27 "Agent drift: quantifying behavioral degradation in multi-agent llm systems over extended interactions")).

### 6.2 Formalizing the SSGM Framework

To provide a rigorous theoretical account of SSGM, we formulate the agent’s memory evolution as a controlled state transition. Let Mt−1M\_{t-1} denote the mutable memory state at time t−1t-1, let McoreM\_{\\text{core}} denote the set of protected core facts used for contradiction checking, let 𝒦ledger\\mathcal{K}\_{\\text{ledger}} denote the append-only immutable ledger of raw observations, and let 𝒦true\\mathcal{K}\_{\\text{true}} denote the idealized semantic target that the system seeks to approximate.The read–write lifecycle in SSGM is then governed by constrained retrieval, gated writing, and periodic reconciliation.

The Read Phase (Constrained Retrieval): Unlike naive Retrieval-Augmented Generation (RAG), which relies only on semantic Top-KK retrieval, the retrieved context CtC\_{t} given a query qtq\_{t} in SSGM is defined by jointly enforcing semantic relevance, access control, and temporal freshness:

Ct\={μ∈Top-K(qt,Mt−1)∣ACL(μ,uid)∧(w(Δτμ)≥θfresh)}\\begin{split}C\_{t}=\\left\\{\\mu\\in\\text{Top-}K(q\_{t},M\_{t-1})\\mid\\mathrm{ACL}(\\mu,u\_{\\mathrm{id}})\\right.\\\\ \\left.\\wedge\\left(w(\\Delta\\tau\_{\\mu})\\geq\\theta\_{\\text{fresh}}\\right)\\right\\}\\end{split}

(5)

where μ\\mu denotes a candidate memory unit, Top-​K​(qt,Mt−1)\\text{Top-}K(q\_{t},M\_{t-1}) denotes the set of the top-KK semantically retrieved items from the current memory state with respect to query qtq\_{t}, uidu\_{\\mathrm{id}} denotes the identity of the requesting user or agent, ACL​(μ,uid)\\mathrm{ACL}(\\mu,u\_{\\mathrm{id}}) denotes an access-control predicate that returns true only when uidu\_{\\mathrm{id}} is permitted to read memory unit μ\\mu, Δ​τμ\\Delta\\tau\_{\\mu} denotes the elapsed time since the last valid use of μ\\mu, and θfresh\\theta\_{\\text{fresh}} denotes the global freshness threshold. Intuitively, Eq. (5) implements a two-stage read path: semantic retrieval first proposes candidates, and governance then filters them to prevent both privacy leakage and stale-memory activation.

The Write Phase (Gated Transition): In an unconstrained system, the next memory state would be produced by directly unioning the agent-generated update with the existing memory, i.e., Mt\=Mt−1∪Agent​(Ct)M\_{t}=M\_{t-1}\\cup\\mathrm{Agent}(C\_{t}). In SSGM, this transition is intercepted by a write-governance operator:

Mt\=Mt−1∪𝒢write​(Agent​(Ct),Mcore)M\_{t}=M\_{t-1}\\cup\\mathcal{G}\_{\\text{write}}\\left(\\mathrm{Agent}(C\_{t}),M\_{\\text{core}}\\right)

(6)

where Agent​(Ct)\\mathrm{Agent}(C\_{t}) denotes the candidate memory delta proposed by the agent after reasoning over CtC\_{t}, and 𝒢write​(Δ​M,Mcore)\=Δ​M\\mathcal{G}\_{\\text{write}}(\\Delta M,M\_{\\text{core}})=\\Delta M if Δ​M∧Mcore⊧̸⊥\\Delta M\\wedge M\_{\\text{core}}\\not\\models\\bot, and ∅\\emptyset otherwise. Here, Δ​M\\Delta M denotes the candidate update set and ⊧⊥\\models\\bot denotes the logical entailment of contradiction. Intuitively, Eq. (6) turns memory writing into a guarded transition: the system only admits updates that do not conflict with protected core facts, thereby preventing hallucinated or inconsistent statements from being consolidated into long-term memory.

Reconciliation (Drift Bounding): To prevent the cumulative drift of admitted updates from diverging as T→∞T\\to\\infty, the asynchronous reconciliation operator ℛ\\mathcal{R} periodically re-aligns the mutable memory against the immutable ledger:

Mclean←arg⁡minM⁡𝔼​\[δ​(ℛ​(M,𝒦ledger),𝒦true)\]M\_{\\text{clean}}\\leftarrow\\arg\\min\_{M}\\mathbb{E}\\Big\[\\delta\\Big(\\mathcal{R}(M,\\mathcal{K}\_{\\text{ledger}}),\\mathcal{K}\_{\\text{true}}\\Big)\\Big\]

(7)

where MM ranges over candidate cleaned memory states, ℛ​(M,𝒦ledger)\\mathcal{R}(M,\\mathcal{K}\_{\\text{ledger}}) denotes the reconciled memory obtained by replaying or correcting MM using the immutable ledger, δ​(⋅,⋅)\\delta(\\cdot,\\cdot) is the semantic-drift measure defined in Eq. (4), and the expectation is taken over the stochasticity of task trajectories, noisy summaries, or reconciliation decisions. Intuitively, Eq. (7) states that the system repeatedly searches for a cleaned memory state McleanM\_{\\text{clean}} whose reconciled form is, in expectation, as close as possible to the desired semantic target. This objective makes the distinction among the three reference objects explicit: McoreM\_{\\text{core}} protects critical facts during writing, 𝒦ledger\\mathcal{K}\_{\\text{ledger}} is the operational raw trace used for correction, and 𝒦true\\mathcal{K}\_{\\text{true}} is the ideal target used for evaluation.

Theorem 1 (Bounded Semantic Drift). Assume that each valid summarization or consolidation step introduces at most ϵstep\\epsilon\_{\\text{step}} semantic error before reconciliation, and assume that the reconciliation operator ℛ\\mathcal{R} restores the mutable memory to a state whose residual error is bounded by a constant independent of the total horizon. In a naive system, the expected drift at time TT scales as O​(T⋅ϵstep)O(T\\cdot\\epsilon\_{\\text{step}}). Under the SSGM framework, if reconciliation is executed every NN steps, the expected semantic drift is upper-bounded by O​(N⋅ϵstep)O(N\\cdot\\epsilon\_{\\text{step}}), ensuring stability even when T≫NT\\gg N.

Proof Sketch. In an unconstrained update process without Eq. (7), per-step errors accumulate additively, yielding 𝔼​\[δ​(MT)\]≤∑t\=1Tϵstep\=T⋅ϵstep\\mathbb{E}\[\\delta(M\_{T})\]\\leq\\sum\_{t=1}^{T}\\epsilon\_{\\text{step}}=T\\cdot\\epsilon\_{\\text{step}}. Under SSGM, reconciliation is invoked every NN steps, so error can accumulate for at most one reconciliation window before being corrected. For any T\=m​N+rT=mN+r with 0≤r<N0\\leq r<N, the unreconciled portion contributes at most r⋅ϵstep<N⋅ϵstepr\\cdot\\epsilon\_{\\text{step}}<N\\cdot\\epsilon\_{\\text{step}}, up to the bounded residual reconciliation error. Hence the dominant growth term is bounded by the window size NN, not by the full horizon TT.

### 6.3 Testable Research Hypotheses and Evaluation Protocols

The formalization of SSGM establishes a new paradigm for evaluating agent memory. Moving beyond simplistic metrics like Recall@K (Ai et al., [2025](#bib.bib2 "MemoryBench: a benchmark for memory and continual learning in llm systems")), we propose three testable research hypotheses that should guide future empirical evaluations in the NLP community:

H1: Governance Gates Statistically Bound Drift Magnitude. Based on Theorem 1, we hypothesize that agents equipped with 𝒢write\\mathcal{G}\_{\\text{write}} and ℛ\\mathcal{R} will exhibit an asymptotic upper limit on drift magnitude (δ​(MT,𝒦true)\\delta(M\_{T},\\mathcal{K}\_{\\text{true}})) over infinite-horizon tasks (e.g., T\>100T>100 turns), whereas baseline agents will demonstrate approximately linear drift accumulation. Evaluation Protocol: This can be robustly tested using established benchmarks like LongMemEval (Wu et al., [2025](#bib.bib59 "LongMemEval: benchmarking chat assistants on long-term interactive memory")), utilizing LLM-as-a-Judge and metrics like BERTScore to quantify the fidelity of the final memory graph against the ground-truth text over extended timesteps.

H2: Access-Scoped Retrieval Lowers Adversarial Leakage Risk. We hypothesize that enforcing the constrained retrieval rule in Eq. (5) will dramatically lower the successful injection rate of cross-tenant adversarial prompts without degrading the primary task success rate. Evaluation Protocol: Researchers should simulate multi-user role-playing scenarios and measure the “Leakage Plateau” (Liu et al., [2025a](#bib.bib58 "Topology matters: measuring memory leakage in multi-agent llms")) when adversarial data is deliberately injected into neighboring graph nodes.

H3: The Latency vs. Coherence Trade-off. Integrating strict logical contradiction checks into the critical path of Eq. (6) will yield a measurable increase in memory write latency. Evaluation Protocol: Future studies must quantify this trade-off, potentially demonstrating that asynchronous governance protocols (e.g., executing ℛ\\mathcal{R} during idle periods) can achieve high coherence (low δ\\delta) without compromising the immediate conversational fluidity (Zhang et al., [2025](#bib.bib45 "G-memory: tracing hierarchical memory for multi-agent systems")).

## 7 Conclusion

The transition from static context windows to evolving, self-refining memory represents a pivotal leap in agentic AI. However, as demonstrated in this survey, this autonomy comes with the peril of memory corruption—ranging from subtle semantic drift to catastrophic poisoning. We argue that the prevailing focus on “retrieval accuracy” is insufficient; the next generation of memory systems must prioritize memory integrity and safety.

The SSGM framework proposed in this paper serves as a conceptual foundation for rigorous memory governance. By decoupling the cognitive policy from the memory substrate via validation and filtering gates, we can build agents that are adaptable yet robust. Beyond proposing SSGM, this work also provides a taxonomy of evolving memory systems, a structured analysis of failure modes, and a framing of the core trade-offs that will shape future governed memory designs. Looking forward, the community must focus on standardized safety benchmarks (like MemoryBench) that stress-test memory stability under adversarial drift, machine unlearning protocols to surgically remove toxic memories, and evaluating the hypotheses defined in our research agenda. Ultimately, solving the memory-governance problem is a prerequisite for deploying lifelong learning agents in high-stakes, real-world environments.

## Limitations

While SSGM provides a blueprint for reliable memory, it introduces three fundamental trade-offs that warrant future investigation:

1\. The Latency-Safety Trade-off: The proposed governance layer introduces a “System 2” verification step into the memory loop. Validating consistency and provenance for every update incurs significant latency, potentially rendering the agent unresponsive in real-time scenarios. Future work must explore asynchronous governance, where memory is optimistically updated but periodically “sanitized” in the background (Zhang et al., [2025](#bib.bib45 "G-memory: tracing hierarchical memory for multi-agent systems")).

2\. The Stability-Plasticity Conflict: Strict consistency filtering may lead to knowledge ossification. If the governance layer aggressively rejects information that conflicts with established memory, the agent may fail to adapt to legitimate environmental changes (e.g., a user changing their address). Designing “conflict resolution protocols” that can distinguish between drift and update remains an open algorithmic challenge.

3\. Scalability of Graph Structures: While graph-based memories (e.g., Zep, MAGMA) offer superior reasoning capabilities, maintaining a consistent graph at scale is non-trivial. As interaction history grows, the complexity of graph traversal and entity resolution can degrade retrieval performance, necessitating more efficient graph pruning and compression algorithms (Jiang et al., [2026](#bib.bib15 "MAGMA: a multi-graph based agentic memory architecture for ai agents")).

## References

-   Q. Ai, Y. Tang, C. Wang, J. Long, W. Su, and Y. Liu (2025) MemoryBench: a benchmark for memory and continual learning in llm systems. arXiv preprint arXiv:2510.17281. Cited by: [§6.3](#S6.SS3.p1.1 "6.3 Testable Research Hypotheses and Evaluation Protocols ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   S. Alqithami (2025) Forgetful but faithful: a cognitive memory architecture and benchmark for privacy-aware generative agents. arXiv preprint arXiv:2512.12856. Cited by: [Table 1](#S2.T1.1.1.1.2 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.3](#S4.SS3.p1.1 "4.3 Memory Consolidation and Forgetting ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px4.p1.1 "Principle 4: Reversible Reconciliation ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   A. Biswal, C. Lei, X. Qin, A. Li, B. Narayanaswamy, and T. Kraska (2026) AgentSM: semantic memory for agentic text-to-SQL. arXiv preprint arXiv:2601.15709. Cited by: [Table 1](#S2.T1.1.1.8.7.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   C. Chen, M. Guan, X. Lin, L. Lin, J. Li, Q. Wang, X. Chen, J. Luo, C. Sun, D. Zhang, and X. Li (2025) TeleMem: building long-term and multimodal memory for agentic AI. arXiv preprint arXiv:2501.07722. Cited by: [Table 1](#S2.T1.1.1.21.20.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.1](#S3.SS1.p2.1 "3.1 Evolving Memory Content (What is Stored) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   P. Chhikara, D. Khant, S. Aryan, T. Singh, and D. Yadav (2025) Mem0: building production-ready ai agents with scalable long-term memory. arXiv preprint arXiv:2504.19413. Cited by: [§1](#S1.p2.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.3](#S5.SS3.p1.1 "5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.7.5.4 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   X. Du, L. Li, D. Zhang, and L. Song (2025) MemR3: memory retrieval via reflective reasoning for llm agents. arXiv preprint arXiv:2512.20237. Cited by: [§4.1](#S4.SS1.p1.1 "4.1 Reflection and Self-Supervised Memory Updates ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.5.3.4 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   R. Fang, Y. Liang, X. Wang, J. Wu, S. Qiao, P. Xie, F. Huang, H. Chen, and N. Zhang (2025) Memp: exploring agent procedural memory. arXiv preprint arXiv:2508.06433. Cited by: [Table 2](#S5.T2.1.1.3.1.3 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Y. Gao, Y. Xiong, X. Gao, K. Jia, J. Pan, Y. Bi, Y. Dai, J. Sun, H. Wang, and H. Wang (2023) Retrieval-augmented generation for large language models: a survey. arXiv preprint arXiv:2312.10997 2 (1). Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   K. Greshake, S. Abdelnabi, S. Mishra, C. Endres, T. Holz, and M. Fritz (2023) Not what you’ve signed up for: compromising real-world llm-integrated applications with indirect prompt injection. In Proceedings of the 16th ACM Workshop on Artificial Intelligence and Security, pp. 79–90. Cited by: [§1](#S1.p3.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.3](#S5.SS3.p2.1 "5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.9.7.4 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6](#S6.p1.1 "6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   B. J. Gutiérrez, Y. Shu, Y. Gu, M. Yasunaga, and Y. Su (2024) HippoRAG: neurobiologically inspired long-term memory for large language models. In Advances in Neural Information Processing Systems, Vol. 37. Cited by: [Table 1](#S2.T1.1.1.17.16.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.2](#S3.SS2.p2.1 "3.2 Evolving Memory Structure (How Knowledge is Organized) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   D. Han, C. Couturier, D. M. Diaz, X. Zhang, V. Rühle, and S. Rajmohan (2025) Legomem: modular procedural memory for multi-agent llm systems for workflow automation. arXiv preprint arXiv:2510.04851. Cited by: [§1](#S1.p3.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 1](#S2.T1.1.1.7.6.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.1](#S3.SS1.p2.1 "3.1 Evolving Memory Content (What is Stored) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.1](#S5.SS1.p3.1 "5.1 Semantic Drift and Gradual Deviation ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.3.1.3 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   C. Hu, J. Fu, C. Du, S. Luo, J. Zhao, and H. Zhao (2023) Chatdb: augmenting llms with databases as their symbolic memory. arXiv preprint arXiv:2306.03901. Cited by: [§3.2](#S3.SS2.p2.1 "3.2 Evolving Memory Structure (How Knowledge is Organized) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Y. Hu, S. Liu, Y. Yue, G. Zhang, B. Liu, F. Zhu, J. Lin, H. Guo, S. Dou, Z. Xi, et al. (2025) Memory in the age of ai agents. arXiv preprint arXiv:2512.13564. Cited by: [§1](#S1.p3.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Z. Huang, Z. Tian, Q. Guo, F. Zhang, Y. Zhou, D. Jiang, Z. Xie, and X. Zhou (2025) Licomemory: lightweight and cognitive agentic memory for efficient long-term reasoning. arXiv preprint arXiv:2511.01448. Cited by: [Table 1](#S2.T1.1.1.16.15.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.3](#S4.SS3.SSS0.Px1.p1.1 "Temporal Decay and Freshness Governance ‣ 4.3 Memory Consolidation and Forgetting ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px2.p1.2 "Principle 2: Temporal and Provenance Grounding ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Y. Huo, Y. Lu, Z. Zhang, H. Chen, and Y. Lin (2026) AtomMem: learnable dynamic agentic memory with atomic memory operation. arXiv preprint arXiv:2601.08323. Cited by: [§1](#S1.p2.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 1](#S2.T1.1.1.6.5.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.3](#S3.SS3.p1.1 "3.3 Evolving Memory Policy (How Memory is Managed) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   D. Jiang, Y. Li, G. Li, and B. Li (2026) MAGMA: a multi-graph based agentic memory architecture for ai agents. arXiv preprint arXiv:2601.03236. Cited by: [item 1](#S1.I1.i1.p1.1 "In 1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Limitations](#Sx1.p4.1 "Limitations ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   P. Lewis, E. Perez, A. Piktus, F. Petroni, V. Karpukhin, N. Goyal, H. Küttler, M. Lewis, W. Yih, T. Rocktäschel, et al. (2020) Retrieval-augmented generation for knowledge-intensive nlp tasks. In Advances in neural information processing systems, Vol. 33, pp. 9459–9474. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. Liu, D. Cao, Y. Wei, T. Su, Y. Liang, Y. Dong, Y. Liu, Y. Zhao, and X. Hu (2025a) Topology matters: measuring memory leakage in multi-agent llms. arXiv preprint arXiv:2512.04668. Cited by: [Table 1](#S2.T1.1.1.26.25.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.3](#S5.SS3.p2.1 "5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px3.p1.1 "Principle 3: Access-Scoped Retrieval ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.3](#S6.SS3.p3.1 "6.3 Testable Research Hypotheses and Evaluation Protocols ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. Liu, Y. Sun, W. Cheng, H. Lei, Y. Chen, L. Wen, X. Yang, D. Fu, P. Cai, N. Deng, Y. Yu, S. Hu, B. Shi, and D. Wang (2025b) MemVerse: multimodal memory for lifelong learning agents. arXiv preprint arXiv:2512.03627. Cited by: [Table 1](#S2.T1.1.1.24.23.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. Luo, Y. Tian, C. Cao, Z. Luo, H. Lin, K. Li, C. Kong, R. Yang, and J. Ma (2026) From storage to experience: a survey on the evolution of llm agent memory mechanisms. Preprints. Cited by: [§1](#S1.p2.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§1](#S1.p3.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.2](#S3.SS2.p1.1 "3.2 Evolving Memory Structure (How Knowledge is Organized) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   A. Madaan, N. Tandon, P. Gupta, S. Hallinan, L. Gao, S. Wiegreffe, U. Alon, N. Dziri, S. Prabhumoye, Y. Yang, et al. (2023) Self-refine: iterative refinement with self-feedback. In Advances in Neural Information Processing Systems, Vol. 36, pp. 46534–46594. Cited by: [§4.1](#S4.SS1.p1.1 "4.1 Reflection and Self-Supervised Memory Updates ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   A. Matarazzo and R. Torlone (2025) A survey on large language models with some insights on their capabilities and limitations. arXiv preprint arXiv:2501.04040. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   H. Mi, Y. Feng, W. Lu, S. Cao, J. Li, Y. Li, X. Zhang, H. Luo, S. Peng, H. Cui, T. Tian, J. Fang, H. Chai, and N. Tan (2026) Darwinian memory: a training-free self-regulating memory system for gui agent evolution. arXiv preprint arXiv:2601.22528. Cited by: [Table 1](#S2.T1.1.1.10.9.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.3](#S3.SS3.p1.1 "3.3 Evolving Memory Policy (How Memory is Managed) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. Nan, W. Ma, W. Wu, and Y. Chen (2025) Nemori: self-organizing agent memory inspired by cognitive science. arXiv preprint arXiv:2508.03341. Cited by: [§2](#S2.p3.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   H. Ni, J. Zhang, G. Li, Z. Wang, R. Wu, C. Zhang, and H. Tan (2025) Astraea: a state-aware scheduling engine for llm-powered agents. arXiv preprint arXiv:2512.14142. Cited by: [Table 1](#S2.T1.1.1.11.10.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.3](#S5.SS3.p1.1 "5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   OpenAI (2023) GPT-4 system card. Technical report OpenAI. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   C. Packer, S. Wooders, K. Lin, V. Fang, S. G. Patil, I. Stoica, and J. E. Gonzalez (2024) MemGPT: towards llms as operating systems. arXiv preprint arXiv:2310.08560. Cited by: [§2](#S2.p2.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. S. Park, J. O’Brien, C. J. Cai, M. R. Morris, P. Liang, and M. S. Bernstein (2023) Generative agents: interactive simulacra of human behavior. In Proceedings of the 36th annual acm symposium on user interface software and technology, pp. 1–22. Cited by: [§2](#S2.p1.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.1](#S3.SS1.p2.1 "3.1 Evolving Memory Content (What is Stored) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.1](#S5.SS1.p2.1 "5.1 Semantic Drift and Gradual Deviation ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.1.5 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   O. Press, N. A. Smith, and M. Lewis (2021) Train short, test long: attention with linear biases enables input length extrapolation. arXiv preprint arXiv:2108.12409. Cited by: [§2](#S2.p1.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   H. Qian et al. (2024) MemoRAG: boosting long context processing with global memory-enhanced retrieval augmentation. In Proceedings of the ACM Web Conference 2025, Cited by: [Table 1](#S2.T1.1.1.15.14.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.2](#S3.SS2.p2.1 "3.2 Evolving Memory Structure (How Knowledge is Organized) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   P. Rasmussen, P. Paliychuk, T. Beauvais, J. Ryan, and D. Chalef (2025) Zep: a temporal knowledge graph architecture for agent memory. arXiv preprint arXiv:2501.13956. Cited by: [Table 1](#S2.T1.1.1.19.18.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.2](#S5.SS2.p1.1 "5.2 Validity Failures: Hallucination and Obsolescence ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.6.4.3 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px2.p1.2 "Principle 2: Temporal and Provenance Grounding ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   A. Rath (2026) Agent drift: quantifying behavioral degradation in multi-agent llm systems over extended interactions. arXiv preprint arXiv:2601.04170. Cited by: [§1](#S1.p3.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.1](#S5.SS1.p4.1 "5.1 Semantic Drift and Gradual Deviation ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px4.p1.1 "Principle 4: Reversible Reconciliation ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   A. Rezazadeh, Z. Li, A. Lou, Y. Zhao, W. Wei, and Y. Bao (2025) Collaborative memory: multi-user memory sharing in llm agents with dynamic access control. arXiv preprint arXiv:2505.18279. Cited by: [Table 1](#S2.T1.1.1.25.24.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§5.3](#S5.SS3.p2.1 "5.3 Systemic Failures: Efficiency and Safety ‣ 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 2](#S5.T2.1.1.10.8.3 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px3.p1.1 "Principle 3: Access-Scoped Retrieval ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   S. Sarin, L. Singh, B. Sarmah, and D. Mehta (2025) Memoria: a scalable agentic memory framework for personalized conversational ai. In 2025 5th International Conference on AI-ML-Systems, pp. 32–39. Cited by: [Table 2](#S5.T2.1.1.8.6.3 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   N. Shinn, F. Cassano, A. Gopinath, K. Narasimhan, and S. Yao (2023) Reflexion: language agents with verbal reinforcement learning. In Advances in Neural Information Processing Systems, Vol. 36, pp. 8634–8652. Cited by: [§4.1](#S4.SS1.p1.1 "4.1 Reflection and Self-Supervised Memory Updates ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   T. Sumers, S. Yao, K. R. Narasimhan, and T. L. Griffiths (2023) Cognitive architectures for language agents. Transactions on Machine Learning Research. Cited by: [§4.1](#S4.SS1.p1.1 "4.1 Reflection and Self-Supervised Memory Updates ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   V. Tresp, S. Sharifzadeh, H. Li, D. Konopatzki, and Y. Ma (2023) The tensor brain: a unified theory of perception, memory, and semantic decoding. Neural Computation 35 (2), pp. 156–227. Cited by: [§2](#S2.p2.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.3](#S4.SS3.p1.1 "4.3 Memory Consolidation and Forgetting ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px1.p1.3 "Principle 1: Pre-Consolidation Validation ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   B. Wang, W. He, S. Zeng, Z. Xiang, Y. Xing, J. Tang, and P. He (2025) Unveiling privacy risks in llm agent memory. In Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics, pp. 25241–25260. Cited by: [§1](#S1.p3.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   G. Wang, Y. Xie, Y. Jiang, A. Mandlekar, C. Xiao, Y. Zhu, L. Fan, and A. Anandkumar (2023) Voyager: an open-ended embodied agent with large language models. arXiv preprint arXiv:2305.16291. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.1](#S4.SS1.p1.1 "4.1 Reflection and Self-Supervised Memory Updates ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   K. Wang, Y. Lin, J. Lou, Z. Zhou, B. Suvonov, and J. Li (2026) E-mem: multi-agent based episodic context reconstruction for llm agent memory. arXiv preprint arXiv:2601.21714. Cited by: [Table 1](#S2.T1.1.1.18.17.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.3](#S4.SS3.SSS0.Px1.p2.1 "Temporal Decay and Freshness Governance ‣ 4.3 Memory Consolidation and Forgetting ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Y. Wang and X. Chen (2025) MIRIX: multi-agent memory system for llm-based agents. arXiv preprint arXiv:2507.07957. Cited by: [Table 1](#S2.T1.1.1.27.26.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px3.p1.1 "Principle 3: Access-Scoped Retrieval ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. Wei, X. Wang, D. Schuurmans, M. Bosma, F. Xia, E. Chi, Q. V. Le, D. Zhou, et al. (2022) Chain-of-thought prompting elicits reasoning in large language models. In Advances in neural information processing systems, Vol. 35, pp. 24824–24837. Cited by: [§2](#S2.p3.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   D. Wu, H. Wang, W. Yu, Y. Zhang, K. Chang, and D. Yu (2025) LongMemEval: benchmarking chat assistants on long-term interactive memory. External Links: 2410.10813, [Link](https://arxiv.org/abs/2410.10813) Cited by: [§6.3](#S6.SS3.p2.4 "6.3 Testable Research Hypotheses and Evaluation Protocols ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Z. Xi, W. Chen, X. Guo, W. He, Y. Ding, B. Hong, M. Zhang, J. Wang, S. Jin, E. Zhou, et al. (2023) The rise and potential of large language model based agents: a survey. arXiv preprint arXiv:2309.07864. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   W. Xu, K. Mei, H. Gao, J. Tan, Z. Liang, and Y. Zhang (2025) A-mem: agentic memory for llm agents. In Advances in Neural Information Processing Systems, Cited by: [item 1](#S1.I1.i1.p1.1 "In 1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 1](#S2.T1.1.1.14.13.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.2](#S3.SS2.p2.1 "3.2 Evolving Memory Structure (How Knowledge is Organized) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§6.1](#S6.SS1.SSS0.Px1.p1.3 "Principle 1: Pre-Consolidation Validation ‣ 6.1 Design Principles of Governed Memory ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   S. Yan, X. Yang, Z. Huang, E. Nie, Z. Ding, Z. Li, X. Ma, J. Bi, K. Kersting, J. Z. Pan, et al. (2026) Memory-r1: enhancing large language model agents to manage and utilize memories via reinforcement learning. arXiv preprint arXiv:2508.19828. Cited by: [§1](#S1.p2.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Table 1](#S2.T1.1.1.4.3.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§2](#S2.p2.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.2](#S4.SS2.p2.10 "4.2 Reinforcement Learning and Outcome-Driven Memory Optimization ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   S. Yao, J. Zhao, D. Yu, N. Du, I. Shafran, K. Narasimhan, and Y. Cao (2023) ReAct: synergizing reasoning and acting in language models. In International Conference on Learning Representations (ICLR), Cited by: [§2](#S2.p3.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   W. Yeo, K. Kim, J. Yoon, and S. J. Hwang (2025) WorldMM: dynamic multimodal memory agent for long video reasoning. arXiv preprint arXiv:2512.02425. Cited by: [Table 1](#S2.T1.1.1.23.22.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.1](#S3.SS1.p2.1 "3.1 Evolving Memory Content (What is Stored) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Y. Yin, Q. Meng, M. Chen, J. Ding, Z. Shao, and Z. Yu (2025) VideoARM: agentic reasoning over hierarchical memory for long-form video understanding. arXiv preprint arXiv:2512.12360. Cited by: [Table 1](#S2.T1.1.1.22.21.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.1](#S3.SS1.p2.1 "3.1 Evolving Memory Content (What is Stored) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   R. B. Yousuf, A. Khatri, S. Xu, M. Sharma, and N. Ramakrishnan (2025) Can an llm induce a graph? investigating memory drift and context length. arXiv preprint arXiv:2510.03611. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   H. Yu, T. Chen, J. Feng, J. Chen, W. Dai, Q. Yu, Y. Zhang, W. Ma, J. Liu, M. Wang, and H. Zhou (2025) MemAgent: reshaping long-context llm with multi-conv rl-based memory agent. arXiv preprint arXiv:2507.02259. Cited by: [Table 1](#S2.T1.1.1.5.4.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.3](#S3.SS3.p1.1 "3.3 Evolving Memory Policy (How Memory is Managed) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§4.2](#S4.SS2.p2.10 "4.2 Reinforcement Learning and Outcome-Driven Memory Optimization ‣ 4 How Memory Evolves: Reflection, Reinforcement, and Consolidation ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   S. Yuen, F. G. Medina, T. Su, Y. Du, and A. J. Sobey (2026) Intrinsic memory agents: heterogeneous multi-agent llm systems through structured contextual memory. arXiv preprint arXiv:2508.08997. Cited by: [Table 2](#S5.T2.1.1.4.2.3 "In 5 Why Memory Fails: Drift, Efficiency, Validity, and Safety ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   J. Zhang, M. Fu, G. Wan, M. Yu, K. Wang, and S. Yan (2025) G-memory: tracing hierarchical memory for multi-agent systems. arXiv preprint arXiv:2506.07398. Cited by: [§6.3](#S6.SS3.p4.2 "6.3 Testable Research Hypotheses and Evaluation Protocols ‣ 6 Stability and Safety Governed Memory (SSGM): Design Principles and Research Agenda ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [Limitations](#Sx1.p2.1 "Limitations ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   N. Zhang, X. Yang, Z. Tan, W. Deng, and W. Wang (2026a) HiMem: hierarchical long-term memory for llm long-horizon agents. arXiv preprint arXiv:2601.06377. Cited by: [Table 1](#S2.T1.1.1.13.12.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.2](#S3.SS2.p2.1 "3.2 Evolving Memory Structure (How Knowledge is Organized) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   Y. Zhang, J. Shu, Y. Ma, X. Lin, S. Wu, and J. Sang (2026b) Memory as action: autonomous context curation for long-horizon agentic tasks. arXiv preprint arXiv:2510.12635. Cited by: [§1](#S1.p2.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§2](#S2.p3.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   B. Zheng et al. (2024) Agent workflow memory. arXiv preprint arXiv:2409.07429. Cited by: [Table 1](#S2.T1.1.1.9.8.1 "In 2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§3.1](#S3.SS1.p2.1 "3.1 Evolving Memory Content (What is Stored) ‣ 3 What Evolves: Content, Structure, and Policy ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").
-   W. Zhong, L. Guo, Q. Gao, H. Ye, and Y. Wang (2024) MemoryBank: enhancing large language models with long-term memory. In Proceedings of the AAAI Conference on Artificial Intelligence, Vol. 38, pp. 19724–19731. Cited by: [§1](#S1.p1.1 "1 Introduction ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework"), [§2](#S2.p1.1 "2 From Static to Adaptive Memory Systems ‣ Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework").