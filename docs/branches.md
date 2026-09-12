# Long-lived branches

> Why each non-`main` branch still exists. Not an ADR: branch purpose is
> operational memory, not a product decision. Drop the row when the branch
> is deleted. Do not record ahead/behind counts, agent names, or closed work.

`main` is the live site. Everything below is an exception.

| Branch | Why it exists |
|---|---|
| `legacy` | First-generation site, frozen on purpose. Deployed on Vercel as **legacy1**. Keep. |
| `cursor/reader-four-themes-3857` | Four-theme reader revamp (plain light / plain dark / sepia light / sepia dark). **Not merged:** frontend bugs, including pages that do not render. Fix on this branch before any PR to `main`. |
| `frontend/new` | Claude's earlier reader restyle that `cursor/reader-four-themes-3857` continues from. Not the merge candidate. |
| `claude/yaps` | Leftover tip of merged [PR #8](https://github.com/boss6825/agent-yap/pull/8). Already on `main`. Ignore. |
