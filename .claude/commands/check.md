# Check — the T-gate + canonical constitution rule set (all tiers)
**Arguments:** $ARGUMENTS

## When to use
The deterministic trust gate (T). Run for every tier before commit: Tier 0 chores
route straight here; Tiers 1–4 end here before `/ship` or commit. **This file is
the SINGLE home of the constitution checks C1..C10** — every other skill cites
these IDs, never restates them.

## When NOT to use
- Adversarial/human-judgment review → `/challenge` (A-gate, provisional).
- You want to draft the PR / compliance entry → `/ship` (runs after a green `/check`).

## Preamble
Read: the diff, `specs/CONSTITUTION.md`, `specs/WORKFLOW.md`. Trust attaches here
and only here (WORKFLOW producer model). An agent's opinion is not a pass; the
tools' exit codes are.

## The constitution rule set (canonical — C1..C10)
Defined here; cited by ID elsewhere.

| ID | Rule | How `/check` verifies it |
|---|---|---|
| **C1** Spec-First | Tier-4 change has a spec in `specs/features/**`; no hand-edited generated output | presence check + diff scan |
| **C2** Lane Discipline | Diff stays within the actor's lane (frontend: `src/app` except `api`, `src/components`; backend: `src/app/api/**`, `src/lib/{search,ask}.ts`, `.env.example`) | diff path scan |
| **C3** Content SoT | Only `src/lib/content.ts` parses `content/`; no re-parsing elsewhere; book = `index.md` + `chapter-NN-*.md` | diff scan for markdown parsing outside content.ts |
| **C4** API Contract binding | Backend matches `docs/api-contract.md`; frontend consumes only promised fields | contract-touch flag → RIGOR |
| **C5** Content voice | No em dashes in on-site `content/`; practitioner tone | grep for em dash in changed `content/**` |
| **C6** Frontend design workflow | UI/component/page edits ran Skills → MCP → Skills (AGENTS.md) | manual attest in `/challenge`/`/ship` |
| **C7** Stack-Current | Next.js 16 / React 19 / Tailwind v4 APIs verified, not recalled | build type-check catches stale APIs |
| **C8** Blast Radius | `git diff --name-only` ⊆ spec May-Modify | diff vs spec |
| **C9** Humans hold the trigger | No push/merge/close/deploy by agent; `Updates #N`, never `Closes #N` | `/check` never pushes |
| **C10** Testable Properties | ≥2 P-IDs; verified by type/build/manual (ADR-005, no runner) | build + lint = the trust gate |

## Phase 1: Detect affected surface
> **Normative:** From `git diff --name-only`, classify the change (frontend / backend
> / content / contract / danger-list) to know which checks bite.
Gate: surface classified.

## Phase 2: Run the gate, short-circuit on first failure
> **Normative:** Run **in order**, stopping at the first failure:
> 1. `npm run build` (type-check + static prerender of ALL slides — the real T-gate)
> 2. `npm run lint`
> 3. `knowledge/validate.sh` **if it exists** (link graph + staleness). If absent,
>    print "knowledge/validate.sh not installed — advisory skip" and continue.
> 4. **Breaking-change scan** — diff touches `docs/api-contract.md`,
>    `src/lib/content.ts`, `generateStaticParams`/the SSG slide route, or the
>    book-discovery convention → flag as breaking / RIGOR.
> **Normative:** There is NO test runner. Never invent a test step or its output (ADR-005).
Gate: build + lint green; validate.sh green-or-absent; breaking-change scan reported.

## Phase 3: Constitution scan (C1..C10)
> **Normative:** Walk the table above against the diff. Report each as pass / n-a /
> fail with the offending path. Any fail blocks the gate.
Gate: no C-rule failing.

## Phase 4: Report
> **Normative:** Emit a pass/fail summary per step + per C-rule. Do not commit or
> push (C9). New mechanical gates run **advisory** (print, exit 0) until proven
> green on a clean `main`, then promoted to required.
Gate: green → route to `/ship` (Tier 4) or commit (Tier 0–3). Red → back to the fix.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "Lint is nitpicky, skip it" | Lint is a T-gate step. Green means green, all steps. |
| "I'll add a test step to look rigorous" | No runner exists (ADR-005). A fake test step is fabricated evidence. |
| "validate.sh isn't there, so /check is broken" | It advisory-skips if absent and says so. Build + lint still gate. |
| "Build's green, ship it" | Build ≠ constitution. Walk C1..C10; breaking-change scan too. |
| "This restates C4 better" | C-rules are defined ONLY here. Other skills cite the ID. |

## Red Flags
- Any invented test command or its output.
- Continuing past a red step instead of short-circuiting.
- `/check` pushing, merging, or closing anything.

## Exit Criteria
- [ ] Affected surface classified from the diff
- [ ] build → lint → validate.sh(if present) → breaking-change scan run in order, short-circuited on first fail
- [ ] C1..C10 walked against the diff (pass / n-a / fail with paths)
- [ ] Pass/fail summary emitted; nothing committed or pushed
