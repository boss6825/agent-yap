# Change Requests (`docs/pm/feedback/`)

This folder is the **intent plane's** front door: every idea, request, or
signal that might one day become a feature enters here as a Change Request
(CR) before it is allowed anywhere near a spec. A CR is the cheapest possible
discipline against building for imaginary users — even when the user is you.

## Lifecycle

```
logged  →  triaged  →  promoted (→ PRD)
                    ╰→  rejected / parked
```

- **logged** — captured verbatim-ish from a signal. No judgement yet.
- **triaged** — reviewed during the weekly cadence; demand weighed.
- **promoted** — graduated to a PRD (`docs/pm/prd/<slug>.md`). Promotion is a
  **human act**, never automatic.
- **rejected / parked** — the default resting state (see below). The `Notes`
  section records *why*, because future-you will re-receive the same idea.

### Reject-by-default

**The default outcome of triage is reject/park.** A CR graduates only on
**repeated, weighted demand** — not on how exciting the idea felt at 2am. This
is the anti-feature-creep valve, and it matters most when you are solo and
every idea is your own. Let the rule work *on* you.

### Dedupe-on-entry

Before creating a new CR, check whether an existing one already captures the
request. **Repeat demand updates the existing CR** (bump `source_weight` and/or
`customer_count`, append to `Signal`) — it does **not** spawn a new file. One
request, one CR, however many times it recurs.

### Bugs are not CRs

A CR is a request for *new or changed behaviour*. A **bug** — something that
already exists and is broken — is not a CR. Route bugs to the fix tier, not the
PM loop. If in doubt: "is the intended behaviour already specced?" If yes, it's
a bug.

## Graduating raw signal

Raw, ungoverned dumps live in `docs/raw/`. Convert them into CRs with the
`/signal-to-cr` skill, which dedupes against this folder and separates
bug-from-request on the way in.

## CR frontmatter schema

| Field | Meaning |
|---|---|
| `cr_id` | `CR-YYYY-NNN`, sequential, immutable once assigned. |
| `slug` | kebab-case traceability key — the **same slug** threads CR → PRD → spec → `FEATURE-STATUS.md` row. |
| `source` | `call \| support \| analytics \| founder-idea \| partner`. |
| `source_weight` | `1-5` — how much this source's demand counts. |
| `customer_count` | distinct customers who asked. `0` is the honest value for your own ideas. |
| `revenue_impact` | `none \| retention \| expansion \| new-segment` — one line. |
| `hypothesis` | `"We believe <who> needs <what> because <evidence>"`. |
| `status` | `logged \| triaged \| promoted \| rejected`. |
| `linked` | list of related CR ids and the PRD path once promoted. |

## CR template

Copy this shape exactly. Solo, a CR can be six lines — but it **must** carry
its full frontmatter, because the pipeline and future teammates key off the
status fields and IDs.

```markdown
---
cr_id: CR-2026-001
slug: <kebab-case-traceability-key>
source: <call | support | analytics | founder-idea | partner>
source_weight: <1-5, how much this source's demand counts>
customer_count: <how many distinct customers asked — 0 is honest for own ideas>
revenue_impact: <none | retention | expansion | new-segment — one line>
hypothesis: <"We believe <who> needs <what> because <evidence>">
status: logged | triaged | promoted | rejected
linked: [<other CR ids, PRD path once promoted>]
---

# <one-line request in the requester's words>

## Signal
<verbatim-ish evidence: quotes, ticket links, dates>

## Notes
<triage reasoning; on rejection, WHY — future-you will re-receive this request>
```
