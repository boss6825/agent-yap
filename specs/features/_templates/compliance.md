# Compliance Log — <feature>
> Spec: specs/features/<area>/<slug>/spec.md · Never edit past entries; correct
> by appending a new entry with `correction-of: PR #NNNN`. Newest first.

## PR #<n> — <title>
date: YYYY-MM-DD · tier: 0-4 · author: @handle · spec-version: <spec.md commit SHA>
summary: <one line>

### Gates
- G1 spec: signed-off-by: @handle on DATE
- G2 plan: signed-off-by / n-a
- G3 review: signed-off-by: @<non-author, or adversarial-agent + self> on DATE
- G4 blast-radius: respected (diff ⊆ May-Modify)
- G5 build+lint: `npm run build` + `npm run lint` green — <run note / n-a>
- G6 accept: pr-review: <URL>
- G7 learn: <learning/knowledge path> / n-a

### Deviations
- skip: <gate> — <reason>; co-signed-by: @<senior>   <!-- omit section if none -->
