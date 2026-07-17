# Sprint-sync — reconcile code ↔ FEATURE-STATUS ↔ issues (Maintenance)
**Arguments:** $ARGUMENTS  <!-- --dry-run (default) | --execute -->

## When to use
Periodically, to reconcile three sources of truth: the **code** (reality),
**`FEATURE-STATUS.md`** (product status), and **GitHub issues** (work items) —
catching stale rows, phantom ✅ Done, and orphaned issues.

## When NOT to use
- A single feature's pipeline stage → `specs/PROGRESS.md` / `/feature-status`.
- Writing new status → happens here, but only after confirmation.

## Preamble
Read: `FEATURE-STATUS.md` (+ its agent instructions), `specs/WORKFLOW.md` (status
conventions), open issues via `gh`. Default mode is **dry-run**.

## Phase 1: Fan out per-row audits (read-only subagents)
> **Normative:** For each `FEATURE-STATUS.md` row, dispatch a **read-only subagent**
> (Explore-type) to audit the claimed code location against reality: does the code
> exist, build, and match the status? Aggregate results. Subagents read only — they
> propose, never write.
> **Advisory:** Batch independent audits in parallel.
Gate: every row has an audit verdict (matches / stale / phantom-Done / missing).

## Phase 2: Build the change set (dry-run)
> **Normative:** Produce a proposed diff: rows to flip (with the audit evidence),
> issues to open/link, `Updates #N` references. **✅ Done requires a passing code
> audit** (C9) — never flip to Done on issue close alone.
> **Normative:** Present the change set and STOP. Do not write in `--dry-run`.
Gate: change set presented for human review.

## Phase 3: Execute only on confirmation
> **Normative:** Only with `--execute` AND explicit human go-ahead, apply the
> `FEATURE-STATUS.md` edits. Do NOT close issues or push (C9) — draft issue
> comments/links for the human. Use `Updates #N`, never `Closes #N`.
Gate: edits applied only post-confirmation; no issue closed, nothing pushed.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "Issue is closed, mark it Done" | ✅ Done needs a code audit, not an issue state (C9). |
| "Just apply the changes, they're obvious" | Dry-run then confirm. Status is product truth; don't edit it silently. |
| "I'll audit rows myself inline" | Fan out to read-only subagents — parallel, isolated, no accidental writes. |
| "Close the stale issues while here" | Closing issues is a human act (C9). Draft, don't close. |

## Red Flags
- Flipping ✅ Done without audit evidence.
- Writing in dry-run mode.
- Closing/pushing anything.

## Exit Criteria
- [ ] Per-row audits fanned out to read-only subagents; verdicts aggregated
- [ ] Change set presented (dry-run) with audit evidence
- [ ] Edits applied only on `--execute` + human confirmation
- [ ] No issues closed, nothing pushed (C9); `Updates #N` convention respected
