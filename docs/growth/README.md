# `docs/growth/` — Reach, Distribution, and GTM

> Produced in the 2026-07-18 growth research session (deep-research run over
> ~15 web sources plus a code and content audit of this repo). Goal set by the
> founder: make Agent YAP one of the most-used sites for studying agentic AI
> while keeping it simple and minimalist.

## How this folder relates to the rest of the repo

- `plan.md` (repo root) owns **content delivery** (reader, interactivity).
  This folder owns **reach**: who finds the site, how, and why they return.
- Feature-shaped ideas born here are logged as CRs in `docs/pm/feedback/`
  (CR-2026-009 through CR-2026-014) and flow through the normal PM loop.
  Nothing in this folder bypasses `specs/WORKFLOW.md`; these are plans and
  research, not specs.
- Status of shipped/planned growth features: `FEATURE-STATUS.md`, section
  "Discovery & Growth".

## Files

| File | What it holds |
|---|---|
| `00-master-plan.md` | **Start here.** The how-we-do-this file: phases, priorities, owners, metrics. |
| `01-gtm-research.md` | Cited findings from the deep-research run: how comparable sites actually grew. |
| `02-content-strategy.md` | Content inventory, integration order for the dormant modules, freshness engine. |
| `03-gamification-design.md` | LeetCode-mechanic decomposition and the moderated design that fits our constraints. |
| `04-product-quick-wins.md` | Code-audit findings; what shipped on `claude/growth-quick-wins-gx0t42`; ranked next steps. |
| `05-distribution-and-seo.md` | Channel playbook: SEO/GEO, launches, social, community. |

## Related branches

- `claude/ai-learning-platform-research-gx0t42`: this folder, the CRs, and
  board/navigation updates (planning only, no product code).
- `claude/growth-quick-wins-gx0t42`: the founder-authorized SEO/discovery
  implementation (sitemap, robots, llms.txt, metadataBase). Kept separate so
  planning and code review independently.
