# Task: <Area> — <Feature>
> **Status:** Pending | In Progress | Done
> **Source:** <link to PRD / CR / raw doc>

<!-- Copy this file to specs/features/<area>/<slug>/spec.md and fill it in.
     The slug MUST match the PRD slug and the FEATURE-STATUS row (traceability key). -->

## Context
- Bounded context / module:
- Related ADRs:
- Related specs:
- Existing code paths: <explicit file list the implementer starts from>

## Behavioral Definition
<!-- WHAT, not how. Input→output mappings, state tables, event→effect tables. -->

## Input Contract
<!-- Exact API signature / props / schema: field types, nullable/required. -->

## Output Contract
<!-- Success shapes + an Errors table: | Condition | Error | -->

## Properties (Invariants) — minimum 2 (C10)
### P-<MODULE>-NNN: <name>
For any <input class>, <formal statement that is specific and falsifiable>.
- Type: Invariant | Monotonicity | Totality | Concurrency | Atomicity
- Source: BR-<…> or this spec
- Verification (no test runner): type system | build | manual reproduction | future test
<!-- Register every new P-ID in specs/properties/invariants.md -->

## Pre/Post Conditions
- PRE: <state required before>
- POST: <state guaranteed after>

## Constraints
<!-- Performance, SSG/static-generation impact, content-rule (C5) impact, etc. -->

## Acceptance Criteria
- [ ] <testable assertion>

## Examples
| Input | Expected output | Notes |
|---|---|---|
<!-- happy path, edge, error — at least one of each -->

## Out of Scope
<!-- Explicit exclusions. Critical for preventing agent drift. -->

## Blast Radius (C8)
**May modify:** <file/dir list>
**Must NOT modify:** <file — reason>
**Must NOT break:** <existing behavior, the API contract, the static build, consumers>
