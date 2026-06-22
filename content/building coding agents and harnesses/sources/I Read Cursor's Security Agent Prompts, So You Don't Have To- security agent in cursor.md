# Cursor’s AI Security Agents: What They Get Right (and What’s Missing) | Snyk

[Snyk Blog](/blog/)

In this article

# I Read Cursor's Security Agent Prompts, So You Don't Have To

Written by

![Headshot of Randall Degges](/_next/image/?url=https%3A%2F%2Fres.cloudinary.com%2Fsnyk%2Fimage%2Fupload%2Fv1771463819%2Frdegges-avatar_plt6xf.png&w=48&q=75)

[Randall Degges](/contributors/randall-degges/)

![](/_next/image/?url=https%3A%2F%2Fres.cloudinary.com%2Fsnyk%2Fimage%2Fupload%2Fv1773776915%2FCursor_Response_Graphic_rdvufs.png&w=2560&q=75)

March 17, 2026

33 mins read

## TL;DR:

Cursor's security team built four autonomous agents that review 3,000+ PRs per week, catch 200+ vulnerabilities, and open fix PRs automatically. The engineering is impressive, and the prompts are shockingly simple. But there's a meaningful gap between "LLM agents reviewing PRs" and "enterprise security program," and that gap is exactly where things get interesting.

This is the prompt – the whole thing:

```
You are a security reviewer for pull requests.
Goal: Detect and clearly explain real vulnerabilities introduced or exposed by this PR. Review only added or modified code unless unchanged code is required to prove exploitability.
1. Inspect the PR diff and surrounding code paths.
2. For every candidate issue, trace attacker-controlled input to the real sink.
3. Verify whether existing controls already block exploitation: auth or permission checks, schema validation or type constraints, framework escaping, ORM parameterization, allowlists or bounded constants.
4. Report only medium, high, or critical findings with a plausible attack path and concrete code evidence.
Prioritize: injection risks, authn or authz bypasses, permission-boundary mistakes, secret leakage or insecure logging, SSRF, XSS, request forgery, path traversal, and unsafe deserialization, dependency or supply-chain risk introduced by the change.
```

It's the core of Cursor's [Agentic Security Review](https://cursor.com/marketplace/automations/find-vulnerabilities) automation, the one that's been reviewing 3,000+ internal PRs per week and catching 200+ real vulnerabilities. A role assignment, a goal, a four-step methodology, and a priority list. No elaborate chain-of-thought scaffolding. No pages of few-shot examples. No complex JSON output schemas.

If you'd told me two years ago that a prompt this concise could run at that scale and produce results worth blocking CI on, I would've been skeptical. We've all been conditioned to think AI prompting requires elaborate engineering: pages of instructions, carefully crafted examples, detailed output specifications. Cursor's open-sourced templates suggest that for security review, a clear role definition and a structured methodology might be all you need.

That's a remarkable signal about where frontier models are right now. The model already "knows" what SQL injection looks like, how authentication bypasses work, and what unsafe deserialization means. It just needs a framework for applying that knowledge systematically. If models can do this much with so little instruction today, the trajectory over the next six to twelve months is genuinely exciting.

Of course, the prompt is just the tip of the iceberg. The real engineering achievement here isn't the 15 lines of instructions; it's everything underneath: the custom MCP server handling persistence and deduplication, the Terraform-managed deployment pipeline, the webhook orchestration that knows when to trigger which agent, and the state management that lets agents compare findings across runs. The prompt is simple _because_ the surrounding infrastructure is not. That's an important distinction, and it's actually the more interesting story: Cursor didn't just write clever prompts; they built a production-grade agent orchestration platform and then put simple prompts on top of it.

But before we get ahead of ourselves, let's look at the full picture of what Cursor built, what's impressive about each piece, and where the gaps are. To do that, it helps to have a framework for thinking about security in agentic development environments.

### The three dimensions of agentic security

At Snyk, we think about securing agentic development across three dimensions: **the code the agents generate**, **the supply chain the agents depend on**, and **the behavior of the agents themselves**. The code dimension is the one most people focus on: is the AI writing secure code, and are we catching vulnerabilities before they ship? The supply chain dimension is newer and less obvious: MCP servers, automation templates, agent skills, and plugins are all components your agents depend on, and they carry the same risks as any third-party dependency. The behavior dimension is the most nuanced: are the agents acting within their intended scope, are they making decisions they shouldn't, and do you have visibility into what they're actually doing across your organization?

Cursor's security agents primarily operate in the first dimension, catching vulnerabilities in code. That's valuable and necessary work. But as you'll see in the walkthrough below, the other two dimensions matter just as much, especially at enterprise scale. And the organizations getting the best results, like [Labelbox](https://labelbox.com/), which cleared a multi-year vulnerability backlog by running Cursor and Snyk together, are the ones addressing all three.

## The four agents: what's strong, what's missing

Today, Travis McPeak published a [blog post](https://cursor.com/blog/security-agents) detailing how Cursor's security team built four autonomous security agents on top of [Cursor Automations](https://cursor.com/features/automations) (their cloud agent platform) and open-sourced the templates for anyone to use. Their PR velocity had increased 5x over nine months, and traditional static analysis couldn't keep up. So they built agents that could.

The whole system sits on a foundation that's worth noting: a custom MCP (Model Context Protocol) server deployed as a serverless Lambda function. It provides persistent state tracking, a deduplication layer powered by Gemini Flash 2.5 (so different agents don't file the same finding using different words), and consistent Slack output formatting with dismiss/snooze actions. Everything is managed through Terraform. Solid engineering.

Here's each agent, along with what I think is genuinely impressive and what an enterprise security team should be thinking about.

### Agentic Security Review: the PR gatekeeper

**What it does:** Reviews every pull request against Cursor's specific threat model. Posts findings to a private Slack channel, comments directly on PRs, and can block the CI pipeline on security findings. The key differentiator from a general-purpose review bot like [Cursor’s Bugbot](https://cursor.com/bugbot) is the ability to prompt-tune specifically for security without blocking on every code quality nit.

**What's impressive:** The results speak for themselves. In the last two months, this agent has run on thousands of PRs and prevented hundreds of issues from reaching production. And as I showed above, the prompt driving all of this is remarkably concise. The signal-to-noise ratio, for an LLM-based reviewer, is genuinely surprising.

**What to think about:** LLMs can confidently flag a "critical SQL injection" in a parameterized query that's perfectly safe, because the model misread the data flow. They can also miss a real vulnerability because attention drifts across a large codebase. In a security context, both failure modes are expensive: false positives erode developer trust, and false negatives leave real vulnerabilities in production. When your detection layer is entirely probabilistic, you're accepting both risks. The principle here is simple: the agent cannot mark its own homework. You need an independent validation layer confirming what the LLM found. That's why layering deterministic SAST analysis (like [Snyk Code](/product/snyk-code/)) underneath the LLM review matters. The deterministic engine catches known patterns with mechanical precision; the LLM catches the novel, cross-file logic bugs that rule-based tools miss. You want both.

Also worth noting: look at the end of the prompt template.

```
Post a short Slack summary with the overall outcome and the top findings, if any.
Do not push changes or open fix PRs from this workflow.
```

The review agent explicitly does _not_ push fixes. It finds, it reports, it blocks, but a human still decides what to do. Even Cursor's own security team keeps humans in the loop for their own tooling. That should tell you something about where autonomous AI security actually stands today: it's a powerful accelerator, not a replacement for human judgment. At least not yet.

### Vuln Hunter: scanning the existing codebase

**What it does:** Instead of watching new code come in, Vuln Hunter scans the existing codebase. It divides the repo into logical segments, searches each one for vulnerabilities, and the security team triages findings from Slack. They often use @Cursor directly from Slack to generate fix PRs.

**What's impressive:** Pointing LLM reasoning at legacy code is smart. This is where AI shines: understanding complex, undocumented codebases and identifying vulnerabilities that static rules would miss. Cross-file logic bugs, broken access control patterns, and authentication bypasses buried in years-old code. Traditional scanners struggle here because they need well-defined patterns to match against.

**What to think about:** This is the agent most likely to produce false positives at scale. Scanning an entire codebase (rather than a focused PR diff) means the model is working with a much larger context, and that's where LLM attention drift becomes a real concern. BaxBench, a benchmark from ETH Zurich, UC Berkeley, and INSAIT, found that 62% of solutions generated by even the best models are either incorrect or contain security vulnerabilities. When the model is reasoning about large, complex codebases, the "agent can't mark its own homework" principle applies doubly: you want deterministic validation confirming or disproving what the LLM found before anyone spends time on a fix.

### Anybump: automated dependency patching

**What it does:** Tackles the most tedious job in application security: dependency patching. It runs a reachability analysis to filter down to actually impactful vulnerabilities, traces code paths, runs tests, checks for breakage, and opens a PR when tests pass. All automated, with Cursor's canary deployment pipeline as a final safety gate.

Here's the core of the prompt:

```
You are a dependency-vulnerability remediation automation.
Goal: When a new Linear issue describes a vulnerable dependency, determine whether it can be upgraded safely and open a PR only when confidence is high.
Decision rule: Create PR only when upgrade is clearly safe; otherwise do not make changes.
```

**What's impressive:** This addresses a pain point that every security team knows intimately. Dependency patching is so time-intensive that most teams eventually give up and push it to engineering, where it sits in backlogs for months (or years). Automating the reachability analysis, testing, and PR generation is a real workflow improvement.

**What to think about:** Anybump solves the hardest part of dependency management: actually getting the patch applied, tested, and into a PR. Where it stops is everything around that patch. There's no SBOM generation, no license compliance check, and no audit trail for your compliance team. Those aren't shortcomings of the agent so much as they are a different category of problem entirely. Automated patching and enterprise software composition analysis overlap, but they're not the same thing. If you're in a regulated industry or shipping software under customer contracts with compliance requirements, you'll still need that broader infrastructure alongside the automation.

If you're a startup with one repo, Anybump might be all you need. If you're operating at enterprise scale (hundreds of repositories, regulated industries, customer contracts requiring specific compliance certifications), you need to know exactly what's in your software, what licenses you're using, and you need to be able to prove it. That's the difference between automated patching and enterprise-grade software composition analysis: they overlap, but they solve fundamentally different problems.

### Invariant Sentinel: compliance drift detection

**What it does:** Runs daily to check for drift against a set of security and compliance properties. It spins up subagents for each logical segment of the repo, compares the current state against previous runs using automation memory, and alerts the security team when something changes.

**What's impressive:** The statefulness here is clever. Using the automation’s memory feature to compare across runs means the agent can detect _changes_ in security posture, not just point-in-time snapshots. The ability to write and execute validation code alongside the analysis adds rigor that pure LLM reasoning alone wouldn't have.

**What to think about:** Compliance drift detection is valuable, but compliance _governance_ is a broader challenge. Invariant Sentinel tells you when something changed; it doesn't enforce policy-as-code across hundreds of repos, generate compliance reports for auditors, or give your CISO a dashboard showing risk trends over time. Those are platform-level capabilities that sit above what any single agent can provide.

## This is still CI, and CI is not where security should start

Here's the thing that's easy to miss when you're looking at the architecture diagrams and agent orchestration: what Cursor built is, at its core, a really sophisticated CI layer. The agents trigger on GitHub webhooks when PRs are opened or pushed. They review diffs, post comments, block pipelines, and open fix PRs. That's fundamentally the same control point that traditional security tools have been operating at for years, but it's smarter now because there's an LLM doing the analysis instead of a regex-based rule engine.

And look, that's a real improvement – no argument there. But CI is still the _wrong place_ for security to start.

### Why CI is too late for security

Think about it: if you're using Cursor to write code in your IDE and the vulnerable code makes it all the way to a PR before anyone catches it, you've already lost time. The developer context-switches away from the code they wrote, the PR review cycle adds latency, and if the CI check blocks, now the developer has to go back, understand the finding, make a fix, push again, and wait for another review cycle. It's better than discovering the vulnerability in production, sure, but it's still the "scan and ticket" model, just compressed into the PR timeline.

### What shifting left actually looks like

What you really want is security tooling running directly inside your IDE, triggering scans and remediations immediately as new code is introduced. That way, vulnerable code never makes it into a commit in the first place. Your git history stays clean. Your PRs don't get blocked because the security issues are caught and fixed in the flow before the developer even stages the change. And you dramatically reduce the need for expensive human-in-the-loop reviews, because if the vulnerability never makes it into a PR, nobody needs to triage it, and nobody's pipeline gets blocked at 4:30 PM on a Friday.

### IDE-first security vs CI-first security

With [Snyk Studio](/product/studio/), this is exactly how it works. Security guardrails intercept insecure code _before the developer even accepts the AI suggestion_. The AI assistant runs `snyk_code_scan` on new code in real time, and if security issues are found, it fixes them right there in the flow. It works directly in Cursor and every other major AI coding assistant. No CI pipeline block, context switch, or cluttered git history.

#### Why layered security is necessary

Now imagine running _both_: Snyk Studio at the IDE layer catching the vast majority of issues at the point of creation, and Cursor's security agents at the CI layer as a safety net for anything that slips through. You get defense in depth, with most of the work handled silently in the IDE and the expensive human reviews reserved for genuinely complex cases. Given what BaxBench tells us about the insecurity rate of AI-generated code (62% of solutions from top models contain vulnerabilities or are incorrect), this kind of layered protection isn't a nice-to-have. It's essential.

And even beyond the CI question, a security _program_ is much more than CI checks. It's centralized dashboards aggregating risk across hundreds of repositories. Its SAST findings correlated with DAST results, confirming that the same endpoint is exploitable at runtime. It's your SCA engine identifying that the ORM library you're using has a known CVE that bypasses parameterization in certain edge cases, and connecting that to the SAST finding in the same controller method. Individually, each of those is a data point. Together, correlated on the same platform, they tell you exactly what's happening, why, and what to fix first. A code scanner, even an autonomous one with four agents and impressive PR throughput, doesn't answer those questions. A security platform does.

## Validation, not competition (and we're already integrated)

I [wrote a few weeks ago](/articles/anthropic-launches-claude-code-security/) about Anthropic's Claude Code Security launch and made the case that AI coding platforms investing in security is validation, not disruption. The same logic applies here: When the biggest names in AI development tooling start building security features, it means the industry has figured out that security in AI-assisted development is infrastructure, not an optional add-on.

### How Cursor and Snyk work together

Cursor and Snyk aren't ships passing in the night; Snyk is already in [Cursor's MCP Directory](https://cursor.directory/plugins/mcp-snyk). We have a [verified extension](/snyk-for-cursor/). We ship [Evo Agent Guard via Hooks](https://evo.ai.snyk.io/). Cursor is our [AI Innovation Partner of the Year](/news/snyk-recognizes-top-global-partners-for-securing-the-shift-to-autonomous/) as of two weeks ago. This isn't an adversarial relationship; it's the two-tier architecture in action. Think of it this way: AI agents are the researchers, discovering vulnerabilities and proposing fixes with speed and creativity. Deterministic validation is a peer review that independently confirms that the findings are real and the fixes are sound.

#### The two-tier security architecture

You wouldn't publish a paper without peer review, and you shouldn't ship a security fix without deterministic validation. Cursor provides the research layer (agent orchestration, webhook triggers, automated PR generation). Snyk provides the peer review, governance, and breadth of coverage across the entire software supply chain.

And this is already working in the real world: [Labelbox runs Cursor + Snyk together](/blog/from-two-years-to-two-weeks-how-labelbox-erased-its-security-debt-with-snyks/) in production and was able to clear a multi-year vulnerability backlog. Cursor automates the remediation workflows; Snyk ensures those fixes are real and enterprise-grade.

## The agentic supply chain is the new attack surface

Take a step back from Cursor's specific implementation and look at what's actually happening across the industry. Over the past year, an entirely new software supply chain has emerged, and it's growing fast: MCP servers, agent skills, automation templates, AI tool plugins, and custom model configurations. Call it the _agentic supply chain_. It's the collection of components that AI-powered development tools depend on to function, and right now, almost no one is securing them.

This isn't a theoretical concern. In January 2026, Snyk's research team [discovered hundreds of malicious skills on ClawHub](/articles/your-ai-skills-are-the-new-agentic-attack-surface/), the first major supply-chain attack targeting AI agent ecosystems. Think about that in the context of what Cursor just open-sourced: automation templates that run with access to your codebase, your CI pipelines, your Slack channels, and your GitHub repos. An MCP server deployed as a Lambda function that processes every security finding in your organization. These are powerful, privileged components. And the ecosystem for distributing and discovering them (marketplaces, template galleries, open source repos) is growing much faster than the security practices around it.

The traditional software supply chain took decades to develop the tooling we rely on today: package registries with signature verification, SBOMs, license scanners, and vulnerability databases. The agentic supply chain lacks that infrastructure yet, and it's already being adopted at scale. Every organization installing MCP servers, importing automation templates, or connecting agent skills to their development environment is extending their attack surface in ways that code-level scanning, no matter how sophisticated, simply doesn't address.

This is exactly the problem [Evo by Snyk](https://evo.ai.snyk.io/) was built to solve. Evo is our agentic security orchestration system designed for the AI-native development landscape: AI threat modeling that builds live threat models from your code, AI red teaming that runs continuous adversarial testing against your models and agents, AI-SPM so you know exactly which AI models and frameworks are running across your organization (including the "shadow AI" that security teams don't even know about), and Agent Scanning for visibility into all toolchains with real-time guardrails.

When you're running autonomous security agents across your codebase, you need to secure those agents too. The tools in your agentic supply chain are every bit as critical as the npm packages in your `node_modules`, and they deserve the same rigor.

## What's next: the questions this raises

Rather than wrapping up with a thesis I've already written about, let me end with the forward-looking questions that Cursor's announcement opens up. Because I think this is more interesting than looking backward.

### The Cursor Automations template marketplace is a new distribution surface

Security automation templates are becoming a marketplace category alongside code review and testing templates. That's a meaningful shift in how security tooling gets distributed. It's no longer just IDE extensions and CI integrations; it's composable agent workflows that teams can install and customize. As this ecosystem matures, the interesting question is how deterministic validation gets wired into these agent workflows natively, so the LLM reasoning and the independent verification aren't separate steps but part of the same loop.

### Every major AI coding platform now has a security story

Claude Code Security launched three weeks ago. Cursor just open-sourced four production agents. GitHub Copilot has been adding security features steadily. At some point, "Does your AI coding tool have built-in security?" stops being a differentiator and starts being table stakes. The real differentiator becomes the quality and depth of the security intelligence underneath. That's an ecosystem play, not a features play, and it's exactly where Snyk has been investing.

### The prompt simplicity question cuts both ways

If a 15-line prompt can catch 200+ real vulnerabilities per week, what happens when models get even better? On one hand, the detection capability of these lightweight agent templates will improve rapidly. On the other hand, the code being generated by those same models will also increase in volume and complexity, which means the attack surface grows proportionally. The security teams that will win are the ones building layered architectures that can scale with both the detection capability _and_ the expanding attack surface.

### The human-in-the-loop question is evolving fast

Cursor keeps humans in the loop today, and that's the right call. But the pressure to fully automate will intensify as models improve and as development velocity continues to accelerate. The question for security teams isn't "will we eventually trust agents to act autonomously?" It's "what validation infrastructure do we need in place before we're comfortable removing the human from the loop?" Deterministic validation, audit trails, and policy governance aren't just enterprise checkboxes; they're the prerequisites for safe autonomy.

## Try it yourself

[**Snyk Studio**](/product/studio/) is free, and setup takes minutes. It works in Cursor (along with virtually every other AI coding assistant). You'll get deterministic scanning and the `/snyk-fix` remediation command running in your IDE in about five minutes. If you want to see layered security in practice, this is the fastest path.

[**Evo by Snyk**](https://evo.ai.snyk.io/) is where you go when you need to secure the AI stack itself: threat modeling, red teaming, AI-SPM, agent scanning, and agentic security orchestration. If your organization is adopting AI coding tools at scale (and let's be real, you probably are), Evo gives you the visibility and guardrails to do it safely.

**Cursor's automation templates** are [open source on GitHub](https://github.com/mcpeak/cursor-security-automation). If you're a Cursor user, they're worth exploring. And if you're running them alongside Snyk, you'll get the best of both worlds: agent-powered automation with enterprise-grade validation underneath.

The pieces are all here. Time to put them together.

GUIDE

## Unifying Control for Agentic AI With Evo By Snyk

Evo by Snyk gives security and engineering leaders a unified, natural-language orchestration for AI security. Discover how Evo coordinates specialized agents to deliver end-to-end protection across your AI lifecycle.  

[Get the guide](https://snyk.io/lp/unifying-control-agentic-ai-evo-by-snyk/ "Get the guide")

Posted in:

[AI](/blog/?topic=ai)[Application Security](/blog/?topic=application-security)[Code Security](/blog/?topic=code-security)[DevSecOps](/blog/?topic=devsecops)[Supply Chain Security](/blog/?topic=supply-chain-security)[Vulnerability Insights](/blog/?topic=vulnerability-insights)

## Embedded Content