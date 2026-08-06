# Workflow

> The change-management pipeline for Agent YAP: tier routing, the H/A/T producer
> model, the Tier-4 spec-driven pipeline, and the RIGOR/LITE dial.
> Constitution rules are cited by ID (see [CONSTITUTION.md](CONSTITUTION.md)).

## Metadata
- status: active
- owner: @boss6825
- last-verified: 2026-07-18

## Change tiers (route by trigger, not judgment)

| Tier | Trigger | Pipeline | Required evidence |
|---|---|---|---|
| **0 Chore** | "fix lint", "bump dep", "update docs" | `/check` → commit | build + lint pass |
| **1 Fix** | "fix this bug", error trace | `/fix` → `/check` → commit | failing reproduction first, then green build |
| **2 Hotfix** | "production", "urgent", "customers hit" | `/fix --urgent` → commit → deploy | reproduction + build; **mandatory** follow-up learning (`specs/learnings/`) |
| **3 Refactor** | "clean up", "rename", "restructure" | `/refactor` → `/check` | build green before AND after; zero behavior change |
| **4 Feature** | "add", "implement", "new", any behavior change | full pipeline below | everything |

**Tier-4 spec gate:** before feature work, check `specs/features/` for an
existing spec. Exists → `/plan` against it. Missing → enter at `/define` (C1).

## Producer model (trust attaches only at T-gates)

- **H** — human, accountable.
- **A** — agent; output is **PROVISIONAL**. An agent's "all clear" clears nothing.
- **T** — deterministic tool (build/lint). **Trust attaches here and only here.**

## The Tier-4 pipeline (spec-driven development)

```
/define (H) → /spec (A) → /plan (A) → /red (A) → /implement (A)
   → /prove (A) → /challenge (A) → /check (T) → /ship (A+H) → /knowledge-sync (A)
```

| Step | Produces | Gate |
|---|---|---|
| **/define** | Requirements brief in chat (persona, trigger, success, failure, ≥1 explicit not-in-scope). No file. | Human confirms |
| **/spec** | `spec.md` from `TEMPLATE.md`: behavior, I/O contracts, error table, **≥2 testable invariants (P-IDs)**, acceptance criteria, examples, out-of-scope, **blast radius** (C8) | Testability + ID-collision + overlap checks |
| **/plan** | `plan.md`: vertical slices with file lists; refreshes `review.md` in RIGOR | Human reviews; RIGOR → signed `review.md` before code |
| **/red** | Spec-derived acceptance checks, one per P-ID. **LITE/N-A here** (no test runner): record acceptance criteria as manual reproductions instead. Brownfield drift → log for human adjudication | Reproductions named per P-ID |
| **/implement** | Code, slice by slice. Reads `plan.md` **read-only — STOPS if missing**. Per-slice blast-radius check: `git diff --name-only` ⊆ May-Modify (C8) | Each slice builds |
| **/prove** | Property checks from invariants. **LITE/N-A** until a runner exists; document how each P-ID is verified (type system / build / manual) | 100% of P-IDs covered or justified |
| **/challenge** | Adversarial review; Critical findings block. A-gate — provisional (C9) | All Critical resolved |
| **/check** | The **T-gate** and single home of the constitution checks (C1..C10): build → lint → knowledge/validate.sh → breaking-change scan, short-circuit on first failure | Everything green |
| **/ship** | Appends `compliance.md` entry, flips spec status, generates runbook in-PR, drafts PR body. **Never pushes/merges/closes** (C9) | Human review + push |
| **/knowledge-sync** | Updates `knowledge/` for drift this feature introduced | `validate.sh` passes |

## The RIGOR / LITE dial

A change runs **RIGOR** (full pipeline incl. signed `review.md`) iff ANY of:

1. it is **Tier 4**; OR
2. the diff touches the **danger list** (below); OR
3. the blast radius **crosses more than one module boundary**.

Otherwise **LITE**: `/check` + advisory scans.

### Agent YAP danger list (this repo has no money/auth/tenancy — the risks are structural)

- `src/lib/content.ts` — the single source of truth; breaking it breaks every
  book, slide, and the static build (C3).
- `docs/api-contract.md` — the frozen frontend/backend contract (C4).
- Any change that **crosses the frontend/backend lane boundary** (C2).
- `generateStaticParams` / the SSG slide-route surface under
  `src/app/read/[book]/[chapter]/[slide]/` — a break fails the production build.
- The book-discovery convention (`index.md` + `chapter-NN-*.md`).

New mechanical gates ship **advisory** (print findings, exit 0) and are promoted
to **required** only after proving green on a clean `main`.

## Status & issue conventions

- **GitHub Issues** = work items. **`specs/PROGRESS.md`** = pipeline/task
  progress. **`FEATURE-STATUS.md`** = product-level truth.
- A row flips ✅ Done only after a **code audit** (C9). PRs: `Updates #N — …`,
  never `Closes #N`.

## The diagnostic loop (fix the artifact, not the output)

| Symptom | Fix |
|---|---|
| Wrong behavior built | Refine `spec.md`, re-run pipeline |
| Wrong stack idiom / style | Add an example to `specs/conventions/` |
| Broke an architectural rule | Add/strengthen a Constitution principle + its enforcement |
| Agent got lost navigating | Fix the map: `CLAUDE.md`, indexes, `knowledge/` |
| Same mistake twice | Capture a learning (`/learn`) or promote to convention/hook |
| Multi-step task done inconsistently | Write a playbook in `specs/technical/playbooks/` |
