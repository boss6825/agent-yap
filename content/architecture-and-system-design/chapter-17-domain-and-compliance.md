# Chapter 17: Domain-Specific and Regulated-Industry Agents

General-purpose agent patterns get you most of the way, but agents for *regulated professional domains* (law, medicine, finance, accounting) carry extra obligations. The cost of a confident wrong answer is high, the users are experts who will notice errors, and the work product may end up in court, a chart, or an audit. This chapter covers what changes when you build an agent for a domain where being wrong has consequences.

## The defining constraint: trust requires verifiability

In consumer settings, a plausible answer is often good enough. In professional settings, an answer the expert *cannot verify* is worse than no answer, because acting on an unverifiable claim is a liability. So the organizing principle for domain agents is: **every consequential claim must be traceable to a source the expert can check.** This single requirement drives most of the design differences below.

## Grounding and citation as first-class features

For a domain agent, citations aren't a nice-to-have; they're the product. Design so that:

- **The model only asserts what it can ground.** Instruct it to base claims on retrieved source content, never on training-data recall, and to refuse or hedge when it lacks a source. "Do not fabricate" is a load-bearing rule, not boilerplate.
- **Citations are precise and verbatim.** A citation should point to an exact location (page, section, paragraph) and quote the source verbatim, so the expert can confirm it in seconds. Approximate or paraphrased citations defeat the purpose. (This is why tool-based reading with location markers often beats lossy retrieval for these domains, Chapter 7.)
- **Citations are machine-checkable.** Use an emitted citation protocol (Chapter 6) that your code can parse *and validate*: confirm the quoted text actually appears at the cited location before showing it. Catching a hallucinated citation automatically is a powerful safety net.
- **The UI makes verification effortless.** Click a citation, jump to the exact place in the source, see the quote highlighted. Lowering the cost of checking is what makes the agent usable for careful professionals.

## Fit the professional's actual workflow

Domain experts have established workflows and artifacts, and an agent that ignores them feels foreign. Meet them where they are:

- **Produce the artifacts they use.** Lawyers live in tracked changes; an agent that proposes redlines they can accept or reject one by one fits their process, while one that silently rewrites a contract is useless to them. Clinicians, accountants, and analysts each have their own native formats and review rituals: produce those.
- **Propose, don't impose.** For consequential changes, the agent proposes and the human commits (the accept/reject pattern). This keeps the professional in control and accountable, which is both a trust and a liability requirement.
- **Encode domain conventions.** Formatting, numbering, terminology, and structure that the domain expects should be applied deterministically (Chapter 3), and the prompt should encode the *consequences* of actions in domain terms (Chapter 6), e.g. "renumber and update every cross-reference when you change a numbered clause." This embedded expertise is what separates a credible tool from a generic one.

## Audit trails and record-keeping

Regulated work must often be reconstructable after the fact: who did what, when, based on what. The data-model patterns from Chapter 9 become compliance requirements:

- **Immutable, sourced versions.** Every state of an artifact is preserved, each labeled with how it arose (uploaded, agent-generated, agent-edited, human-accepted, human-rejected). This *is* an audit trail.
- **Complete turn records.** The conversation event log captures what the agent did, what it read, and what it produced: a defensible record of the agent's reasoning and actions.
- **Resolution tracking.** When a human accepts or rejects an agent suggestion, that decision and its timestamp are recorded, so accountability is clear.

Design these in from the start; retrofitting an audit trail is painful and often incomplete.

## Data protection and confidentiality

Professional data is confidential by law or contract (privilege, PHI, MNPI, client confidentiality):

- **Strict isolation and access control** (Chapter 11), often beyond the baseline: a leak across clients/matters/patients can be a regulatory event, not just a bug.
- **Encryption** at rest and in transit, and careful handling of where data flows, including *to the model provider*. Know your provider's data-handling terms; some domains require that content not be retained or used for training, which may dictate provider choice, enterprise agreements, or BYOK so the customer's own provider relationship governs the data.
- **Data residency and retention** rules may constrain where you store data and for how long, and may require deletion workflows.
- **Minimize exposure.** Send the model what the task needs, not everything; redact where feasible.

These constraints can shape architecture decisions as much as performance does.

## Appropriate confidence and boundaries

Domain agents must be careful about the *kind* of statements they make:

- **Distinguish information from advice.** Many domains draw a legal line between providing information and giving professional advice (legal, medical, financial). The agent should inform and assist the professional, not purport to replace their judgment, and should be explicit about that boundary where appropriate.
- **Calibrate confidence.** Hedge when the sources are ambiguous; don't manufacture certainty. Surfacing uncertainty is more valuable than false confidence to an expert who will rely on the output.
- **Stay within scope.** Define what the agent does and doesn't do, and have it decline gracefully outside that scope rather than improvising in high-stakes territory.

## Domain integrations

Professional domains have authoritative external systems: case-law databases, court dockets, medical references, market-data feeds, regulatory filings. Integrating them (as tools, Chapter 3) makes the agent far more useful, but with care:

- **Cite the authoritative source,** not the model's memory of it.
- **Distinguish kinds of sources** with different authority (e.g. binding precedent vs. live case status; primary vs. secondary references) and guide the model to use each correctly.
- **Distill and cap** large authoritative payloads before they reach the model (Chapter 7), but preserve the source link so the expert can go to the original.
- **Cache** these often slow, rate-limited, sometimes costly services (Chapter 9).

## Evaluation with domain rigor

The evaluation discipline (Chapter 15) needs domain-specific teeth:

- **Citation-accuracy checks**: verify cited quotes exist at cited locations; flag any that don't.
- **Domain-expert review** in the loop for quality, especially for high-stakes outputs, because automated graders can't fully judge professional correctness.
- **Regression sets drawn from real cases**, including the subtle errors that matter in the domain (a wrong cross-reference, a misread clause, a missed exception).
- **Track grounding/faithfulness as a primary metric**, not an afterthought.

## Compliance as an ongoing practice

Compliance isn't a one-time checkbox:

- **Know the regimes** that apply (data protection, sector rules, professional-conduct rules) and design to them.
- **Keep the documentation** (audit trails, access logs, data-flow records) that demonstrates compliance when asked.
- **Plan for review and change**: regulations and professional standards evolve; the system must be adaptable, and the prompt/rules version-controlled and reviewable.

## The throughline

A regulated-domain agent is a general agent plus a relentless commitment to **verifiability, fit, and accountability**: every claim traceable to a checkable source; outputs in the professional's own artifacts and workflow with the human in control; a complete immutable audit trail; strict confidentiality and data handling; calibrated, in-scope confidence; and evaluation rigorous enough to trust. The patterns from the earlier chapters all still apply; these are the additional, non-negotiable obligations that come with building for people whose work has consequences.

## Review

**Quick Check**

1. The chapter's defining constraint for regulated-domain agents is:
   - A) The agent should answer as fast as possible
   - B) Trust requires verifiability - every consequential claim must be traceable to a source the expert can check
   - C) The agent should never refuse a request
   - D) The model must be the largest available
   <details><summary>Answer</summary>B) Trust requires verifiability - in professional settings an answer the expert cannot verify is worse than no answer, so every consequential claim must trace to a checkable source.</details>

2. Why does the chapter say citations must be precise and verbatim (exact location + quoted text)?
   - A) To make responses longer
   - B) So the expert can confirm the claim in seconds; approximate or paraphrased citations defeat the purpose
   - C) Because the model cannot produce short answers
   - D) To satisfy the load balancer
   <details><summary>Answer</summary>B) A citation should point to an exact location and quote verbatim so the expert can confirm it quickly; approximate or paraphrased citations defeat the purpose of verifiability.</details>

3. A lawyer wants the agent to help revise a contract. Per the "fit the workflow" principle, the best design is one that:
   - A) Silently rewrites the contract and saves it
   - B) Proposes redlines/tracked changes the lawyer can accept or reject one by one
   - C) Emails the client directly with the new version
   - D) Refuses because contracts are too risky
   <details><summary>Answer</summary>B) Lawyers live in tracked changes; an agent that proposes redlines to accept or reject fits their process and keeps the human in control, while one that silently rewrites is useless to them.</details>

4. What does the chapter mean by making citations "machine-checkable"?
   - A) The model rates its own confidence
   - B) Your code parses the emitted citation protocol and validates that the quoted text actually appears at the cited location before showing it
   - C) A separate model rewrites every citation
   - D) Citations are stored in a spreadsheet
   <details><summary>Answer</summary>B) Use an emitted citation protocol your code can parse and validate - confirm the quoted text appears at the cited location before displaying it, catching hallucinated citations automatically.</details>

5. Regarding confidentiality and the model provider, the chapter notes that some domains require content not be retained or used for training, which may dictate:
   - A) Turning off encryption
   - B) Provider choice, enterprise agreements, or BYOK so the customer's own provider relationship governs the data
   - C) Storing all data in process memory
   - D) Sending the model everything to be safe
   <details><summary>Answer</summary>B) Data-handling terms may dictate provider choice, enterprise agreements, or BYOK, so the customer's own provider relationship governs how their data is handled.</details>

**More Questions**

6. How does the chapter reframe the data-model patterns (immutable versions, event logs, resolution tracking) for regulated work?
   - A) As optional performance optimizations
   - B) As a compliance requirement - together they form a defensible audit trail of who did what, when, and based on what
   - C) As UI decoration
   - D) As something to add only after an audit fails
   <details><summary>Answer</summary>B) In regulated work these patterns become compliance requirements: immutable sourced versions, complete turn records, and resolution tracking together form an audit trail; the chapter warns to design them in from the start because retrofitting is painful.</details>

7. The chapter distinguishes "information" from "advice." Why does this matter for a domain agent?
   - A) Advice is always faster to generate
   - B) Many domains draw a legal line between providing information and giving professional advice, so the agent should assist the professional rather than purport to replace their judgment
   - C) Information is always wrong
   - D) It has no practical effect on design
   <details><summary>Answer</summary>B) Many domains legally distinguish information from professional advice; the agent should inform and assist, be explicit about that boundary, and not purport to replace the expert's judgment.</details>

8. When integrating authoritative external systems (case-law databases, market feeds, medical references), the chapter says to:
   - A) Trust the model's memory of them to save API calls
   - B) Cite the authoritative source (not the model's memory), distinguish sources of different authority, distill/cap large payloads while preserving the source link, and cache these slow services
   - C) Always send the entire payload into context
   - D) Avoid them because they are too slow
   <details><summary>Answer</summary>B) Cite the authoritative source rather than the model's recall, distinguish kinds of sources by authority, distill and cap large payloads while preserving the link, and cache these slow, rate-limited services.</details>

9. A clinician-facing agent produces a summary but the source documents are ambiguous on a key point. The chapter's guidance on confidence is to:
   - A) Pick the most likely answer and state it confidently
   - B) Hedge and surface the uncertainty rather than manufacture certainty, since surfacing uncertainty is more valuable to an expert who will rely on the output
   - C) Refuse to produce anything at all
   - D) Ask the model to guess and label it as fact
   <details><summary>Answer</summary>B) Calibrate confidence - hedge when sources are ambiguous; surfacing uncertainty is more valuable than false confidence to an expert who will act on the output.</details>

10. What does "domain rigor" add to the standard evaluation discipline, per the chapter?
    - A) Only faster automated grading
    - B) Citation-accuracy checks, domain-expert review in the loop, regression sets drawn from real cases with subtle domain errors, and tracking grounding/faithfulness as a primary metric
    - C) Removing human review to scale
    - D) Judging outputs purely on response length
    <details><summary>Answer</summary>B) Domain evaluation adds citation-accuracy checks, expert-in-the-loop review, regression sets from real cases (including subtle errors like a wrong cross-reference), and grounding/faithfulness tracked as a primary metric.</details>

**Coding Challenge**

**Validate a citation before showing it**

The chapter says citations should be machine-checkable: your code should confirm the quoted text actually appears at the cited location before displaying it, so hallucinated citations are caught automatically. Write `validate_citation(sources, citation)` where `sources` maps a location id to its full text and `citation` has a `location` and a `quote`; return `True` only if the location exists and the quote appears verbatim in that source's text.

<details>
<summary>Python Solution</summary>

```python
def validate_citation(sources, citation):
    """Return True only if the quote appears verbatim at the cited location.

    sources:  {location_id: full_text}
    citation: {"location": location_id, "quote": text}
    """
    loc = citation.get("location")
    quote = citation.get("quote", "")
    if loc not in sources or not quote:
        return False                       # unknown location or empty quote -> reject
    return quote in sources[loc]           # verbatim substring check


sources = {
    "doc1#p3": "The tenant shall provide 30 days notice before vacating.",
    "doc1#p4": "Rent is due on the first of each month.",
}

good = {"location": "doc1#p3", "quote": "30 days notice"}
hallucinated = {"location": "doc1#p3", "quote": "60 days notice"}
bad_loc = {"location": "doc1#p9", "quote": "anything"}

print(validate_citation(sources, good))          # True
print(validate_citation(sources, hallucinated))  # False - caught
print(validate_citation(sources, bad_loc))       # False - unknown location
```

</details>

**Think About It**

1. In consumer apps, a fluent, plausible answer is usually a win. The chapter makes the startling claim that in a professional setting, an answer the expert *cannot verify* is actually *worse than no answer at all*. Why would a correct-sounding answer be worse than silence for a lawyer or clinician?
   <details><summary>Show answer</summary>Because the professional has to act on it, and acting on an unverifiable claim is a liability. If the agent stays silent, the expert simply does the work themselves; nothing is lost. But a confident, unsourced claim invites reliance — it might be wrong in a way the expert can't catch without redoing the research, and if they act on it and it's wrong, the consequence lands in a court filing, a patient chart, or an audit. So an answer that can't be checked doesn't save work, it manufactures risk. That single realization is why the whole chapter reorganizes design around traceability rather than fluency.</details>

2. A team builds a domain agent that writes beautiful, authoritative-sounding legal memos — and experts quietly stop trusting it. Nothing was obviously "wrong." What subtle failure mode is the chapter warning about, and why does producing tracked-changes redlines the human accepts or rejects fix the trust problem better than a polished finished document?
   <details><summary>Show answer</summary>The failure is that a polished, finished artifact hides the seams: the expert can't see what the agent changed, what it based each change on, or where it might have quietly invented something, so verifying it costs as much as doing it themselves — and unverifiable authority reads as untrustworthy. Redlines invert this. Each proposed change is small, attributable, and reviewable in isolation; the human stays the one who commits, which preserves both control and accountability. The agent proposes, the professional disposes. That "propose, don't impose" pattern matches how experts already work and keeps the human — not the model — answerable for the result, which is exactly what a liability-sensitive domain requires.</details>

3. Everyone agrees you should keep an audit trail. The chapter adds a sharp warning: design it in from the start, because retrofitting one is "painful and often incomplete." Why is an audit trail so much harder to bolt on afterward than, say, a new feature — what is fundamentally unrecoverable once you've skipped it?
   <details><summary>Show answer</summary>An audit trail records *history* — who did what, when, based on what — and history that wasn't captured as it happened is simply gone. You can add the logging tables tomorrow, but you can't reconstruct the state of a document three revisions ago, or which source a claim was grounded in last month, if those were overwritten rather than preserved. That's why the chapter ties the audit trail to immutable, sourced versions and a complete turn event log: the discipline has to be built into how state is written, not added as a reporting layer later. Retrofitting is incomplete because the crucial evidence — the intermediate states and their provenance — was destroyed at the moment each change was made, and no amount of later engineering brings it back.</details>

---

Next: [Chapter 18: Reference architecture and a design checklist](chapter-18-reference-architecture.md)
