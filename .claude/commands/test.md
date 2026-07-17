# Test — TOMBSTONE (no test runner in this repo)

> This is not a skill. There is **no test runner** in Agent YAP (ADR-005).

The deterministic trust gate is **`npm run build`** (type-check + static prerender
of ALL slides) + **`npm run lint`** — run them via **`/check`**.

## Where "testing" lives here
- Verifying invariants / acceptance → **`/red`** and **`/prove`** run in **LITE /
  N-A mode**: properties are verified by the type system, the build, or documented
  **manual reproductions**. Never fabricate test evidence.
- The full deterministic gate (build → lint → validate.sh → breaking-change scan)
  → **`/check`**.
- A bug's failing reproduction → **`/fix`** (reproduction-first).

If a real test runner is ever added, revisit ADR-005 and upgrade `/red`, `/prove`,
and `/check` from N-A mode.
