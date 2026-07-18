# PRDs (`docs/pm/prd/`)

A PRD captures the **WHY** before the *what* is formalized into a spec. It is
where a promoted Change Request becomes a coherent product direction: intent,
observable success criteria, explicit non-goals, and requirements with stable
IDs that thread all the way through to the eventual spec.

## Lifecycle

```
draft  →  approved  →  converted (spec: pointer added)
```

- **draft** — being written and argued with. Freely edited.
- **approved** — committed to build. See the approval rule below.
- **converted** — `/prd-to-spec` has run; the PRD flips to `converted`, gains a
  `spec:` pointer, and is **retained as history only — stop editing it.** From
  that moment the spec is the contract and the PRD is intent/history.

### Approval is a deliberate status flip — on a different day

Approval is a **human act**: you change `status: draft` to `status: approved`.
Do it **on a different day than you drafted it.** That cooling period is your
substitute for a second opinion when solo — an idea that still looks right
after a night's sleep is worth building. An adversarial agent review of the
draft ("attack the hypothesis and success criteria") is a strong addition
before you flip the status.

## Requirements → spec traceability

Requirements carry stable IDs (`R-A1`, `R-B2`, …). Those IDs thread into the
spec unchanged, so a spec section can always be traced back to the intent that
justified it. The PRD `slug` is the traceability key shared across
CR → PRD → spec → `FEATURE-STATUS.md` row — keep it reusable as the eventual
spec slug.

## PRD template

Copy this shape exactly. Solo, a PRD can be one page — but it must carry its
frontmatter and the mandatory sections (Intent, Success criteria, Out of scope,
Open questions).

```markdown
---
prd_id: PRD-<slug>
status: draft | approved | converted
author: "@handle"
date: YYYY-MM-DD
# after conversion add:  spec: specs/features/<area>/<slug>/spec.md
---

# PRD: <Feature name>

## Intent
<one paragraph: the problem, and for whom>

## Background & prior art
<what exists today; explicit "must not modify" notes that seed the spec's blast radius>

## Personas
| Persona | Situation | Need |
|---|---|---|

## Requirements                    <!-- stable IDs; these thread into the spec -->
### A. <requirement group>
- **R-A1**: <requirement>
- **R-A2**: …
### B. …

## Lifecycle / states              <!-- mermaid stateDiagram-v2 when applicable -->

## Success criteria
<observable outcomes, not features>

## Out of scope

## Open questions
- **Q1**: <question> — answered/deferred(owner)
- **Q2**: …

## Constraints & compliance notes
```
