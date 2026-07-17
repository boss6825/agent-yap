# Knowledge-sync — reconcile knowledge/ with the code (Maintenance)
**Arguments:** $ARGUMENTS  <!-- optional: a module name to scope the sync -->

## When to use
After a feature/refactor changes a module's structure or a flow, to update the
`knowledge/` layer (modules, flows, concepts, invariants) so it stays accurate.
The last step of the Tier-4 pipeline.

## When NOT to use
- Retrieving/querying knowledge → `/knowledge-query`.
- Product-level status → `/feature-status` / `/sprint-sync`.

## Preamble
Read: `05-knowledge-layer.md` (kit) if referenced, `.claude/rules/docs.md`
(Mermaid-first, `knowledge:` commit prefix, root-relative links), the affected
module source, `knowledge/` (note: may not be installed yet — see Phase 0).

## Phase 0: Layer presence
> **Normative:** If `knowledge/` is empty/absent (Phase-4 knowledge layer not yet
> bootstrapped), STOP and report that knowledge-sync is a no-op until the layer is
> bootstrapped (kit Prompt D). Do not scaffold it ad hoc here.
Gate: `knowledge/` exists with content, else exit with a clear report.

## Phase 1: Coverage audit
> **Normative:** For the changed module(s), check that a `knowledge/modules/<m>.md`
> exists and its Responsibility/Boundaries/Relationships still match the code.
> Flows that traverse the module must still name real methods/events.
Gate: gaps and stale nodes listed.

## Phase 2: Drift classification
> **Normative:** Classify each finding: **accurate** (no change), **stale** (code
> moved on — update), or **invented** (claims not in code as of HEAD — delete or
> mark TBD). Accuracy rule: stale/invented knowledge is worse than none.
> **Advisory:** Mine git history for the WHY when updating Design Decisions.
Gate: every finding classified.

## Phase 3: Update, Mermaid-first
> **Normative:** Apply updates. Diagrams are fenced ```mermaid blocks (docs rule),
> not images. Links are repo-root-relative. Preserve module↔flow bidirectionality;
> no orphan concepts/invariants.
Gate: nodes updated; link graph intact.

## Phase 4: Validate & commit prefix
> **Normative:** Run `knowledge/validate.sh` if present (frontmatter + link graph +
> staleness) until clean. Knowledge commits use the `knowledge:` prefix. Do not
> push (C9).
Gate: `validate.sh` green (or reported absent); staged with `knowledge:` prefix.

## Anti-Rationalization
| Excuse | Rebuttal |
|---|---|
| "I'll sync docs later" | Later is how knowledge rots. Sync in the same change (diagnostic loop). |
| "Close enough to the code" | Stale knowledge is worse than none. Match HEAD or mark TBD. |
| "Screenshot the diagram" | Mermaid-first (docs rule). Fenced blocks, not images. |
| "Skip validate.sh" | It guards the link graph + staleness. Run it if present. |

## Red Flags
- Knowledge claims not verifiable in code as of HEAD.
- Orphan concepts/invariants or a broken module↔flow link.
- Knowledge commit without the `knowledge:` prefix.

## Exit Criteria
- [ ] Layer present (else reported no-op)
- [ ] Coverage audited; drift classified (accurate/stale/invented)
- [ ] Nodes updated Mermaid-first with root-relative links, graph intact
- [ ] `validate.sh` green or reported absent; `knowledge:` prefix; not pushed
