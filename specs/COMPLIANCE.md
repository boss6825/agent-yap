# Compliance

> The one-line ship gate and the G1–G7 gate definitions. Enforced by the
> `.githooks/pre-push` hook (installed in Phase 3) and, later, by CI.

## Metadata
- status: active
- owner: @vivek.d
- last-verified: 2026-07-18

## The ship gate (one mechanical rule)

> A push/PR passes iff it updates a `specs/features/**/compliance.md` **OR** its
> last commit message contains `GATE bypass: <reason>`.

- The compliance entry is **append-only**, newest first, one block per PR (see
  `specs/features/_templates/compliance.md`).
- A **minimal** entry for a small change is a header + one summary line + one
  signature. The gate checks **existence, not quality**. Never fabricate signatures.
- **Bypass is a feature, not a failure.** An urgent push may bypass with a
  reason; the hook logs it and the merge records it in `specs/compliance/BYPASSES.md`
  as OPEN. A later PR carrying `correction-of: PR #N` closes it. Audit review
  triggers if ≥3 entries stay OPEN for >14 days.

## The 7 gates (documentation structure; not all CI-enforced yet)

| Gate | Meaning | This repo |
|---|---|---|
| **G1 spec** | A spec exists for the change (C1) | Required for Tier 4 |
| **G2 plan/ADR** | Plan written; ADR if a hard-to-reverse decision | Required in RIGOR |
| **G3 review** | Design review signed by a **non-author** | **Solo substitution** (below) |
| **G4 blast-radius** | Diff ⊆ May-Modify (C8) | Checked per slice |
| **G5 tests** | Tests green in CI | **Substituted**: `npm run build` + `npm run lint` green (C10, ADR-005) |
| **G6 accept** | PR approval + acceptance boxes checked | Human act |
| **G7 learn** | Learning/knowledge captured when applicable (C-hotfix mandatory) | `specs/learnings/`, `knowledge/` |

## Solo adaptation of G3

The non-author reviewer is an **adversarial agent run in a fresh session**, plus
your own signature after a **cooling period** (next morning). Keep the
`review.md` file and signature block unchanged — when teammate #2 arrives, only
the signer changes.

## Scaling ladder (what tightens with headcount)

- **Solo (now):** pre-push compliance gate; agent hooks; `knowledge:` prefix;
  learnings; bypass ledger. CI advisory. G3 = adversarial agent + self-sign.
- **+1 person:** real non-author G3; branch protection; required
  `compliance-check` + build in CI; PR review required.
- **Team:** signature-vs-author CI verification; bypass-audit SLA; GTM plane.
