# Commit — TOMBSTONE

> This is not a skill. Agents stage; humans commit and push (C9).

## What to do instead
1. Run the deterministic gate → **`/check`** (build → lint → validate.sh →
   breaking-change scan). It must be green.
2. For Tier 4, stage the ship artifacts → **`/ship`** (compliance entry, PR draft
   with `Updates #N`, never `Closes #N`).
3. The **human** performs the actual `git commit` / push.

Remember the ship gate: a push needs a `specs/features/**/compliance.md` update
OR `GATE bypass: <reason>` in the last commit. Never fabricate a signature.
