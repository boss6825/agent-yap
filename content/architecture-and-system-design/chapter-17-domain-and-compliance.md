# Chapter 17 — Domain-Specific and Regulated-Industry Agents

General-purpose agent patterns get you most of the way, but agents for *regulated professional domains* — law, medicine, finance, accounting — carry extra obligations. The cost of a confident wrong answer is high, the users are experts who will notice errors, and the work product may end up in court, a chart, or an audit. This chapter covers what changes when you build an agent for a domain where being wrong has consequences.

## The defining constraint: trust requires verifiability

In consumer settings, a plausible answer is often good enough. In professional settings, an answer the expert *cannot verify* is worse than no answer, because acting on an unverifiable claim is a liability. So the organizing principle for domain agents is: **every consequential claim must be traceable to a source the expert can check.** This single requirement drives most of the design differences below.

## Grounding and citation as first-class features

For a domain agent, citations aren't a nice-to-have — they're the product. Design so that:

- **The model only asserts what it can ground.** Instruct it to base claims on retrieved source content, never on training-data recall, and to refuse or hedge when it lacks a source. "Do not fabricate" is a load-bearing rule, not boilerplate.
- **Citations are precise and verbatim.** A citation should point to an exact location (page, section, paragraph) and quote the source verbatim, so the expert can confirm it in seconds. Approximate or paraphrased citations defeat the purpose. (This is why tool-based reading with location markers often beats lossy retrieval for these domains — Chapter 7.)
- **Citations are machine-checkable.** Use an emitted citation protocol (Chapter 6) that your code can parse *and validate* — confirm the quoted text actually appears at the cited location before showing it. Catching a hallucinated citation automatically is a powerful safety net.
- **The UI makes verification effortless.** Click a citation, jump to the exact place in the source, see the quote highlighted. Lowering the cost of checking is what makes the agent usable for careful professionals.

## Fit the professional's actual workflow

Domain experts have established workflows and artifacts, and an agent that ignores them feels foreign. Meet them where they are:

- **Produce the artifacts they use.** Lawyers live in tracked changes; an agent that proposes redlines they can accept or reject one by one fits their process, while one that silently rewrites a contract is useless to them. Clinicians, accountants, and analysts each have their own native formats and review rituals — produce those.
- **Propose, don't impose.** For consequential changes, the agent proposes and the human commits (the accept/reject pattern). This keeps the professional in control and accountable, which is both a trust and a liability requirement.
- **Encode domain conventions.** Formatting, numbering, terminology, and structure that the domain expects should be applied deterministically (Chapter 3), and the prompt should encode the *consequences* of actions in domain terms (Chapter 6) — e.g. "renumber and update every cross-reference when you change a numbered clause." This embedded expertise is what separates a credible tool from a generic one.

## Audit trails and record-keeping

Regulated work must often be reconstructable after the fact — who did what, when, based on what. The data-model patterns from Chapter 9 become compliance requirements:

- **Immutable, sourced versions.** Every state of an artifact is preserved, each labeled with how it arose (uploaded, agent-generated, agent-edited, human-accepted, human-rejected). This *is* an audit trail.
- **Complete turn records.** The conversation event log captures what the agent did, what it read, and what it produced — a defensible record of the agent's reasoning and actions.
- **Resolution tracking.** When a human accepts or rejects an agent suggestion, that decision and its timestamp are recorded, so accountability is clear.

Design these in from the start; retrofitting an audit trail is painful and often incomplete.

## Data protection and confidentiality

Professional data is confidential by law or contract (privilege, PHI, MNPI, client confidentiality):

- **Strict isolation and access control** (Chapter 11), often beyond the baseline — a leak across clients/matters/patients can be a regulatory event, not just a bug.
- **Encryption** at rest and in transit, and careful handling of where data flows — including *to the model provider*. Know your provider's data-handling terms; some domains require that content not be retained or used for training, which may dictate provider choice, enterprise agreements, or BYOK so the customer's own provider relationship governs the data.
- **Data residency and retention** rules may constrain where you store data and for how long, and may require deletion workflows.
- **Minimize exposure.** Send the model what the task needs, not everything; redact where feasible.

These constraints can shape architecture decisions as much as performance does.

## Appropriate confidence and boundaries

Domain agents must be careful about the *kind* of statements they make:

- **Distinguish information from advice.** Many domains draw a legal line between providing information and giving professional advice (legal, medical, financial). The agent should inform and assist the professional, not purport to replace their judgment, and should be explicit about that boundary where appropriate.
- **Calibrate confidence.** Hedge when the sources are ambiguous; don't manufacture certainty. Surfacing uncertainty is more valuable than false confidence to an expert who will rely on the output.
- **Stay within scope.** Define what the agent does and doesn't do, and have it decline gracefully outside that scope rather than improvising in high-stakes territory.

## Domain integrations

Professional domains have authoritative external systems — case-law databases, court dockets, medical references, market-data feeds, regulatory filings. Integrating them (as tools, Chapter 3) makes the agent far more useful, but with care:

- **Cite the authoritative source,** not the model's memory of it.
- **Distinguish kinds of sources** with different authority (e.g. binding precedent vs. live case status; primary vs. secondary references) and guide the model to use each correctly.
- **Distill and cap** large authoritative payloads before they reach the model (Chapter 7), but preserve the source link so the expert can go to the original.
- **Cache** these often slow, rate-limited, sometimes costly services (Chapter 9).

## Evaluation with domain rigor

The evaluation discipline (Chapter 15) needs domain-specific teeth:

- **Citation-accuracy checks** — verify cited quotes exist at cited locations; flag any that don't.
- **Domain-expert review** in the loop for quality, especially for high-stakes outputs, because automated graders can't fully judge professional correctness.
- **Regression sets drawn from real cases**, including the subtle errors that matter in the domain (a wrong cross-reference, a misread clause, a missed exception).
- **Track grounding/faithfulness as a primary metric**, not an afterthought.

## Compliance as an ongoing practice

Compliance isn't a one-time checkbox:

- **Know the regimes** that apply (data protection, sector rules, professional-conduct rules) and design to them.
- **Keep the documentation** — audit trails, access logs, data-flow records — that demonstrates compliance when asked.
- **Plan for review and change** — regulations and professional standards evolve; the system must be adaptable, and the prompt/rules version-controlled and reviewable.

## The throughline

A regulated-domain agent is a general agent plus a relentless commitment to **verifiability, fit, and accountability**: every claim traceable to a checkable source; outputs in the professional's own artifacts and workflow with the human in control; a complete immutable audit trail; strict confidentiality and data handling; calibrated, in-scope confidence; and evaluation rigorous enough to trust. The patterns from the earlier chapters all still apply — these are the additional, non-negotiable obligations that come with building for people whose work has consequences.

---

Next: [Chapter 18 — Reference architecture and a design checklist](chapter-18-reference-architecture.md)

---

## Review

### Quick Check

1. The organizing principle for regulated-domain agents is:
   * A) Always use the most powerful model
   * B) Every consequential claim must be traceable to a source the expert can check
   * C) Minimize latency above all else
   * D) Never refuse a request
   <details><summary>Answer</summary>B) Every consequential claim must be traceable to a checkable source - verifiability is what makes the agent trustworthy in professional settings.</details>

2. What makes a citation "machine-checkable" in this chapter?
   * A) It uses a hyperlink to the source
   * B) It is written in plain prose
   * C) An emitted protocol your code parses and validates by confirming the quoted text appears at the cited location
   * D) A human reads it aloud
   <details><summary>Answer</summary>C) A parseable, validated protocol - confirming the quoted text actually appears at the cited location catches hallucinated citations automatically.</details>

3. A legal agent needs to change a contract. Which approach fits the professional's workflow?
   * A) Silently rewrite the contract
   * B) Email the contract to all parties
   * C) Refuse to touch contracts entirely
   * D) Propose redlines the lawyer can accept or reject one by one
   <details><summary>Answer</summary>D) Propose redlines the lawyer can accept or reject - propose, do not impose, keeping the professional in control and accountable.</details>

4. Your domain requires that content not be retained or used for training by the provider. What might this dictate?
   * A) Using a larger context window
   * B) Provider choice, enterprise agreements, or BYOK so the customer's own provider relationship governs the data
   * C) Turning off streaming
   * D) Storing everything in plaintext
   <details><summary>Answer</summary>B) Provider choice, enterprise agreements, or BYOK - data-handling terms can shape architecture as much as performance does.</details>

5. For an expert, an answer they cannot verify is:
   * A) Better than no answer because it saves time
   * B) Equivalent to a verified answer
   * C) Worse than no answer, because acting on an unverifiable claim is a liability
   * D) Acceptable if the model is confident
   <details><summary>Answer</summary>C) Worse than no answer - an unverifiable claim is a liability, which is why verifiability drives the design.</details>

### Coding Challenge

**Validate citations against the source**

Write `validate_citations(pages, citations)` that confirms each cited quote appears verbatim at its cited page and flags the ones that do not, so a hallucinated citation is caught before it reaches the expert.

<details>
<summary>Python Solution</summary>

```python
def validate_citations(pages, citations):
    """Confirm each cited quote appears verbatim at its cited page; flag the rest."""
    report = []
    for c in citations:
        page_text = pages.get(c["page"], "")
        report.append({
            "page": c["page"],
            "quote": c["quote"],
            "valid": c["quote"] in page_text,
        })
    return report


pages = {1: "The term is five years.", 3: "Either party may terminate."}
citations = [
    {"page": 1, "quote": "five years"},           # valid
    {"page": 3, "quote": "auto-renews forever"},  # hallucinated
]
for r in validate_citations(pages, citations):
    print(r)
```

</details>

<details>
<summary>JavaScript Solution</summary>

```javascript
function validateCitations(pages, citations) {
  return citations.map((c) => ({
    page: c.page,
    quote: c.quote,
    valid: (pages[c.page] || "").includes(c.quote),
  }));
}

const pages = { 1: "The term is five years.", 3: "Either party may terminate." };
const citations = [
  { page: 1, quote: "five years" },          // valid
  { page: 3, quote: "auto-renews forever" }, // hallucinated
];
console.log(validateCitations(pages, citations));
```

</details>
