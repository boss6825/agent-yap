# redesign-2026

Planning artifacts for turning Agent YAP from a reading site into a learning
platform with self-assessment. **Research and design only — no `src/` or
`content/` file was modified to produce any of this.**

Branch: `feature/learning-platform-v2`. Nothing on `main` is touched.

**Start here → [00-MASTER-PLAN.md](00-MASTER-PLAN.md).**

## The one-paragraph version

The site has 196,509 teachable words and **75% of them are unreachable** — seven of
eight content folders fail the discovery rule in `src/lib/content.ts`. It also
already contains **490 authored multiple-choice questions with distractors and
answers**, which do not render because `Markdown.tsx` has no `rehype-raw`. So the
plan is: fix the renderer, wire the library, then build the assessment layer on
questions that already exist. The flagship exercise type is **trace debugging** —
click the first step where an authored agent trace went wrong — because it is
deterministic without executing anything, it is impossible on LeetCode, and it is
the actual job.

## Contents

| File | What it is |
|---|---|
| [00-MASTER-PLAN.md](00-MASTER-PLAN.md) | **The synthesis.** Findings, thesis, journey, build order, independent vision, open decisions. |
| [research/01-content-inventory.md](research/01-content-inventory.md) | Content audit + 20-module taxonomy + `modules.json` + verified gaps |
| [research/02-code-ux-audit.md](research/02-code-ux-audit.md) | Code/UX audit with file:line, design-token extraction, scale failures |
| [research/03-prior-decisions.md](research/03-prior-decisions.md) | Decision ledger; which non-goals survive |
| [research/04-competitors-practice.md](research/04-competitors-practice.md) | 20 assessment platforms; 18 deterministic grading mechanisms |
| [research/05-competitors-reading.md](research/05-competitors-reading.md) | 22 minimal reading sites; navigation at scale |
| [research/06-visual-identity.md](research/06-visual-identity.md) | The stale-photograph problem and the system that replaces it |
| [research/07-assessment-system.md](research/07-assessment-system.md) | The assessment design: types, data model, grading, mastery, authoring |
| [research/08-onboarding-and-templates.md](research/08-onboarding-and-templates.md) | Onboarding screen-by-screen; the five learner templates |
| [research/09-ia-and-flows.md](research/09-ia-and-flows.md) | Site map, URL contract, seven user flows, state architecture |
| [research/10-independent-vision.md](research/10-independent-vision.md) | 15 unconstrained ideas; differentiation thesis; business model |
| [research/11-claude-design-prompts.md](research/11-claude-design-prompts.md) | Design-system brief + six copy-paste prompts for claude.ai/design |
| [research/12-adversarial-review.md](research/12-adversarial-review.md) | The case against; KEEP/CUT/DEFER; failure modes |
| [research/13-delivery-plan.md](research/13-delivery-plan.md) | Week 1, M1–M7, gates, kill criteria, FEATURE-STATUS rows, rollback |

## Provenance

Reports 01–06 and 08 were produced by a 13-agent research workflow (browser and web
research against ~45 live sites, full read of `content/` and `src/`). Reports 07,
09–13 and the master plan were written in the main session after the workflow's
design phase hit a session limit. Reports 07 and 09–13 read 01–06 and 08 and
explicitly rule on the places where those reports contradict each other — see
[research/12-adversarial-review.md](research/12-adversarial-review.md) §1.

## Status

Nothing here is approved or scheduled. Per `specs/WORKFLOW.md`, each initiative
still enters at `/define` or `/prd-to-spec`; report 13 §4 lists the five feature
specs required and their order.
