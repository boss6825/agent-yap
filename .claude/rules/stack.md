---
paths: ["**/*.tsx", "**/*.ts"]
---

# TypeScript / stack rules

- **Stack-current, not memory-current (C7).** Verify Next.js 16 / React 19 /
  Tailwind v4 APIs against `node_modules/next/dist/docs/` or via `find-docs` /
  Context7 before writing framework code. Treat training data as stale; heed
  deprecation notices.
- **Lane discipline (C2).** Frontend and backend own disjoint file sets;
  `src/lib/content.ts` and `docs/api-contract.md` are exclusive-access. See
  `AGENTS.md` and `specs/CONSTITUTION.md` for the exact boundaries — do not edit
  across the lane without coordination.
