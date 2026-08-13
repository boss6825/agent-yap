# 03 — Prior Decisions Ledger

> Research input for the 2026 redesign. Purpose: stop the new plan from
> silently contradicting decisions that are already binding, and stop it from
> re-litigating questions that were already answered well.
> Read on branch `feature/learning-platform-v2` at HEAD = `a92f9e0` (identical
> to `main`; the branch carries no commits, only an uncommitted content
> rewrite in the working tree). Compiled 2026-08-02.
>
> Verdict vocabulary:
> **STILL HOLDS** — keep, do not re-argue.
> **NEEDS REVISITING** — the decision was right for the product that existed;
> the new direction changes an input it depended on.
> **ALREADY VIOLATED BY REALITY** — the repo or the calendar has moved past it;
> the document is stale, not the decision.

---

## 0. Reality snapshot (facts the ledger rests on)

| Fact | Evidence |
|---|---|
| 1 of 9 folders under `content/` is a live book | only `content/architecture-and-system-design/` has `index.md` + `chapter-NN-*.md` (18 chapters) |
| `content/research papers/` has `index.md` but **zero** `chapter-NN-*.md` | silently produces no book, exactly the surprise `knowledge/invariants/book-discovery.md` warns about |
| `content/dump/` exists and is empty | new since the 2026-07-18 inventory in `docs/growth/02-content-strategy.md`; harmless, but the inventory table is now wrong |
| A content voice rewrite is **mid-flight and uncommitted** | `git status` shows ~45 modified files across `architecture-and-system-design/`, `building coding agents and harnesses/explained/`, `context engineering/`, `multi-agent/`, `rag/`, `research papers/`; untracked `.claude/skills/veritasium-storytelling/` |
| SEO foundation is merged to `main` | `src/app/sitemap.ts`, `robots.ts`, `llms.txt/route.ts`, `llms-full.txt/route.ts`, `src/lib/site.ts` all present; merge `a92f9e0` |
| Reader IDE shell shipped | `src/components/reader/{Rail,ReaderChrome,AmbientBackdrop,ChatPanel,ResumePill,SlideContextBridge}.tsx`, `src/lib/progress.ts`, `src/lib/art.ts`, `public/art/` |
| Landing photos | `public/assets/snow-mountain.jpg` (7.9 MB), `cloud-sea.jpg` (6.8 MB); referenced at `src/components/Home.tsx:138`, `:243`, `:370` (snow-mountain twice) |
| No test runner, no frontmatter parser | `package.json` has no test dep and no `gray-matter`; `src/lib/content.ts` exports only `toPlainText, getBooks, getBook, getPrimaryBook, getChapter, getSlide, getAdjacent, getAllSlides, getNavManifest` |
| Landing and `/read` hard-code one book | `getPrimaryBook()` at `src/app/page.tsx:6` and `src/app/read/page.tsx:5` |
| Slide count disagreement | `FEATURE-STATUS.md` and `docs/growth/*` say 181 slides; `OVERVIEW.md` says ~199 |

---

## 1. Decision ledger

### 1.1 Constitution rules (`specs/CONSTITUTION.md`)

| ID | Decision | Verdict | Why |
|---|---|---|---|
| **C1** Spec-first (spec-on-touch) | No Tier-4 feature without a spec; spec beats code | **STILL HOLDS** | Cheap, and the redesign is the largest Tier-4 batch this repo has seen. Note: it has been honoured exactly once (`specs/features/reader/ide-shell/`). |
| **C2** Lane discipline (Claude frontend / Codex backend) | Disjoint file ownership | **NEEDS REVISITING** | The lane table names only `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`, `.env.example` as backend. Since it was written, `src/lib/{progress,site,art,display}.ts` and `src/lib/chat/**` shipped with **no lane owner**; `src/lib/chat/gemini.ts` was Codex-authored yet sits outside the declared backend set. The redesign adds far more `src/lib/*` logic (scoring, placement, template assignment, module graph). Fix the table or retire the two-lane model into a plain exclusive-access list. |
| **C3** One source of truth for content (`src/lib/content.ts`) | Import from it, never re-parse markdown | **STILL HOLDS** — and it is the load-bearing constraint on "10-20 recombinable modules" | See §5.1: the module graph must be a sidecar, not a second parser. |
| **C4** The API contract is binding | `docs/api-contract.md` frozen | **STILL HOLDS** | The redesign has no reason to touch `/api/search` or `/api/ask`. If AI-graded free-response arrives, route it through the existing BYOK path (§5.4), not a contract change. |
| **C5** Content voice (no em dashes, practitioner-focused) | Governs `content/` | **STILL HOLDS**, scope gap | It binds `content/` only. Onboarding copy, results screens, and quiz explanations are UI strings and are currently ungoverned. The redesign will write a lot of them. |
| **C6** Frontend design workflow mandatory | Skills → MCP → Skills on every UI edit | **NEEDS REVISITING (scope, not principle)** | Run per **surface** (onboarding flow, assessment runner, results dashboard, landing), not per leaf component, or the checklist consumes the build. Say this explicitly in `AGENTS.md` rather than skipping it silently. |
| **C7** Stack-current, not memory-current | Next 16 / React 19 / Tailwind v4 | **STILL HOLDS** | Unchanged. |
| **C8** Blast-radius discipline | Spec declares May-Modify / Must-Not-Modify / Must-Not-Break | **STILL HOLDS** | The ide-shell spec is a good working example to copy. |
| **C9** Humans hold the trigger | No push/merge/close/deploy without go-ahead; ✅ only after code audit | **STILL HOLDS** | See §1.5 for the rows this rule left stale. |
| **C10** Properties are testable, ≥2 P-IDs per spec, registered globally | Registry at `specs/properties/invariants.md` | **ALREADY VIOLATED BY REALITY** | `specs/features/reader/ide-shell/spec.md` defines **P-READER-002, P-READER-003, P-CHAT-001**. The global registry lists only **P-CONTENT-001** and **P-ASK-001**. Three shipped invariants are unregistered. Fix before adding assessment P-IDs, or the registry stops being a registry. |

### 1.2 ADRs (`specs/decisions/`)

| ADR | Decision | Verdict | Why |
|---|---|---|---|
| **ADR-001** Markdown-first pipeline; `content.ts` is the only parser; no CMS/DB | **STILL HOLDS** | The redesign needs metadata, not a database. A sidecar JSON validated at build time satisfies both. |
| **ADR-002** Frontend/backend lanes via frozen contract | **NEEDS REVISITING** | Same reasoning as C2. The "backend lane" is now two frozen files and a contract nobody is changing; the ceremony outweighs the collision risk it prevents. |
| **ADR-003** One `##` = one slide, SSG-prerendered, paged | **STILL HOLDS**, with a clarification the redesign must add | The per-slide canonical URL is simultaneously the pacing device, the SEO surface (`sitemap.ts`), the GEO surface (`llms.txt`), and the citation target for `/api/ask`. Do not weaken it. Clarification: **assessment screens are not slides.** `/daily`, a placement run, a results dashboard, and a roadmap are their own routes and must not be forced into `/read/[book]/[chapter]/[slide]`. That is an extension of ADR-003, not a breach. |
| **ADR-004** Next.js 16 App Router; verify against installed docs | **STILL HOLDS** | Unchanged. |
| **ADR-005** `npm run build` + `npm run lint` are the trust gate; no test runner | **ALREADY VIOLATED BY REALITY, and the ADR predicted it** | Its stated revisit trigger, verbatim: "the first interactive feature (quiz scoring, progress state, placement logic) with real branching logic → add Vitest and promote G5 to real tests." `src/lib/progress.ts` (branching state, localStorage, `useProgress`) already shipped without one. The redesign is *entirely* scoring + placement + template assignment. **Recommendation: ADR-006 adds Vitest for pure logic only** (scoring rubric, placement mapping, template selection, prerequisite graph validation), keeping build+lint as the gate for UI and SSG. Rejected alternative: Playwright E2E now — it is slow, flaky against a shader-heavy UI, and the actual regression risk is in pure functions, not in clicks. |

### 1.3 Product decisions in `plan.md`

| Decision | Verdict | Why |
|---|---|---|
| "The H2-per-slide reader is a good skeleton and does not need restructuring" | **STILL HOLDS** | Reaffirmed by ADR-003. |
| "Engagement problems come from monotony, not from the slide format" | **STILL HOLDS, but incomplete** | Correct diagnosis for a *reading* product. The founder's new framing ("let people evaluate themselves") says the missing thing is not variety but **feedback**. Monotony-breaking (Phase 1) is necessary and no longer sufficient. |
| Phase 2 "light progress mechanics" marked **CONFIRMED** | **STILL HOLDS and is SHIPPED** | `src/lib/progress.ts`, rail rings/checkmarks, resume pill, landing "Continue reading" (`FEATURE-STATUS.md` row 23, ✅ code-audited 2026-07-19). |
| "Modes are an index plus a renderer over the same slide list; no mode gets its own content" | **STILL HOLDS — this is the single most reusable idea in the repo** | It is precisely the architecture the "10-20 recombinable modules" ask needs. Adopt the phrasing verbatim in the new plan. |
| Mode priority: roadmap > explore > podcast | **NEEDS REVISITING (reordered, not reversed)** | Onboarding + templates *is* roadmap mode promoted from "future" to "core". Explore mode is subsumed by module recombination. Podcast drops off the board. |
| Design north star: "one idea per screen, generous whitespace, interactive element front-and-centre, soft warm palette… a styling discipline, not a redesign" | **STILL HOLDS**, contradicts what shipped | The reader that actually shipped is a Cursor-style IDE shell with WebGL shaders, a glass card, and museum art. That is defensible and the founder likes the vibe, but "Brilliant-like soft warm palette" is no longer an accurate description of the product. Rewrite the north star to match reality before someone builds against the stale one. |

### 1.4 Lane / coordination rules (`AGENTS.md`, `CLAUDE.md`)

| Rule | Verdict | Why |
|---|---|---|
| `src/lib/content.ts` and `docs/api-contract.md` are exclusive-access | **STILL HOLDS** | Both are on the WORKFLOW danger list; the redesign should aim to touch neither. |
| Danger list: `content.ts`, `api-contract.md`, cross-lane changes, `generateStaticParams`/slide route, book-discovery convention | **STILL HOLDS** | Any in-slide assessment block touches the slide route → RIGOR. Budget for it. |
| Tier routing table in `CLAUDE.md` | **STILL HOLDS** | The redesign is a series of Tier-4s, not one mega-change. Slice it. |
| Ship gate: compliance entry per PR or `GATE bypass:` | **STILL HOLDS** | Bypass ledger `specs/compliance/BYPASSES.md` is empty; the gate has cost nothing so far. |
| Issue convention: `Updates #N`, never `Closes #N` | **STILL HOLDS** | Unchanged. |

### 1.5 Process artefacts that reality has outrun

| Artefact | Claim | Reality | Verdict |
|---|---|---|---|
| `specs/INDEX.md` | "Active feature specs: _(none yet)_" and "if a spec is not listed here, it does not exist to the agent" | `specs/features/reader/ide-shell/spec.md` exists, status In Progress, with a signed compliance entry | **ALREADY VIOLATED** — the shipped spec is invisible by the index's own rule |
| `FEATURE-STATUS.md` row 30 (SEO foundation) | 〰️ "flips to ✅ after merge + code audit" | Merged in `a92f9e0`; all five files present on `main` | **ALREADY VIOLATED** (favourably) — needs a code audit and a flip |
| `specs/PROGRESS.md` | `reader/ide-shell` at "ship (pre-PR)", next action "push + open PR" | Merged as PR #3 (`b3da289`), plus follow-up PR #4 | **ALREADY VIOLATED** — stale by two PRs |
| `docs/pm/prd/interactive-lessons.md` | `status: draft` | Never approved (approval requires a deliberate next-day human flip per `docs/pm/prd/README.md`). Yet CR-2026-004's contents shipped anyway | **ALREADY VIOLATED** — the PM plane was bypassed for the one thing that shipped from it |
| All 14 CRs | `status: logged` | None has ever been triaged; `docs/pm/feedback/README.md` says the default triage outcome is reject/park and promotion is a human act | **ALREADY VIOLATED** — the plane exists but has never run. See §4. |
| `docs/growth/00-master-plan.md` Gates A and B | Phase A weeks 1-2, Phase B weeks 2-6 | ~2 weeks elapsed. Gate A blocked on unanswered Q1 (production domain) and Q2 (repo public). Gate B unstarted: 7 of 8 content folders still fail book discovery | **NEEDS REVISITING** — see §5.2 |
| `OVERVIEW.md` content inventory + "~199 slides" | pre-dates `dump/`, the art pipeline, progress, chat | Stale in several places, and disagrees with `FEATURE-STATUS.md` on slide count | **NEEDS REVISITING** |
| `docs/growth/04-product-quick-wins.md` item 6 (compress the two landing photos, Tier 0) | assumes the photos stay | Founder now wants them gone | **SUPERSEDED** — see §5.5 |

---

## 2. The declared non-goals — can a self-assessment product survive under them?

`plan.md` §Non-goals, repeated verbatim as `docs/pm/prd/interactive-lessons.md` §Out of scope:

> - No auth, no server-side progress, no points/leaderboards.
> - No infinite-scroll rewrite of the reader.
> - No video content.

This is the crux. Verdicts below are per clause.

### 2.1 "No auth"

**Survivable: yes, with one named cost.**

Everything the founder asked for works without accounts. Onboarding answers, an
assigned template, per-module mastery, and a streak are all writable to
localStorage. LeetCode itself gates almost nothing behind login for the *doing*
of a problem; login exists for the *record*.

The cost is specific and should be stated out loud rather than discovered: a
self-evaluation is only motivating if the record survives. Device-bound state is
lost on a cache clear, in incognito, and on the phone-to-laptop transition, which
is exactly the transition a "read on mobile, practise on desktop" learner makes.

**Minimum viable exception: a portable progress code.** Export the whole profile
(onboarding answers + module mastery + read set) as a base64url blob the user can
copy, and an import field that accepts it. Optionally encode it in a URL fragment
(`#p=...`) so "send it to yourself" is one tap. Zero server, zero PII, zero
accounts, and it does not create a user table anyone has to operate.

**Rejected alternative:** an anonymous device ID synced to Vercel KV / Upstash.
It is a smaller UX ask than copy-paste, but it converts a static site into a
stateful service with a durable store to back up, a GDPR surface (an opaque ID
tied to behavioural data is still personal data in the EU reading), and it
directly breaches the next clause. The portable code buys ~80% of the benefit for
0% of the operational weight.

### 2.2 "No server-side progress"

**Survivable: yes for progress. No for two things the product will want.**

Two capabilities that a credible self-evaluation product wants are structurally
impossible with pure client state:

1. **Item calibration.** "Which of my questions are too easy or broken?" needs
   aggregate response data. Without it, difficulty labels are guesses and a bad
   distractor stays bad forever.
2. **Positioning.** "68% of readers get this wrong" and "you are ahead of the
   typical reader on retrieval, behind on evaluation" are the single strongest
   engagement levers self-assessment has, and they are aggregate facts.

Crucially, **neither requires server-side *user* progress.** They require an
anonymous, append-only aggregate event sink: `{question_id, chosen_option,
correct}` with no identifier and no session join. That is already sanctioned:
`CR-2026-010` explicitly proposes cookieless analytics with "(client-side event)
chapter completions".

**Minimum viable exception: rewrite the clause as "no server-side *user* state",
and allow anonymous aggregate item statistics.** The distinction is the whole
game: nothing is stored *about a person*, only *about a question*.

**Unresolved contradiction the new plan must settle.** The shipped invariant
**P-READER-002** (`specs/features/reader/ide-shell/spec.md`) says: "no progress
data is ever transmitted over the network." `CR-2026-010` wants chapter
completion events sent as client-side analytics. **These two are already in
direct conflict, before any assessment work.** Resolve it deliberately: amend
P-READER-002 to "no *identifying or per-user* progress data is transmitted;
anonymous aggregate counters are permitted", or drop the analytics event. Do not
let it be resolved by whoever writes the code first.

**Secondary consequence, accept it explicitly:** with SSG and markdown-authored
quizzes, **the answer key ships in the client bundle.** Anyone can read it. For
self-evaluation with no stakes that is fine. Write it down as a decision so
nobody later proposes server-side grading to "fix" it. If a credentialed or
scored-for-others mode ever appears, that is a different product and needs its
own ADR.

### 2.3 "No points/leaderboards"

**Survivable: yes, and this clause is doing real work. Keep it, but sharpen it.**

`docs/growth/03-gamification-design.md` already did the decomposition properly
and its conclusions stand:

| LeetCode mechanic | Fits? | Status |
|---|---|---|
| Daily challenge | yes, date-hash seeded, no account | CR-2026-013, unbuilt |
| Streak with grace rule | yes, localStorage, quiet | designed, unbuilt |
| Difficulty ladder | yes, as the prerequisite roadmap | CR-2026-006, unbuilt |
| Instant pass/fail feedback | yes, quiz blocks | CR-2026-001, unbuilt |
| XP / points economy | no, needs accounts to mean anything | rejected |
| Leaderboards / contests | no, needs liquidity; empty rooms at our scale | rejected |
| Paid streak freezes, notification pressure | no, brand-hostile | rejected |

The new tension is subtler than the one that document anticipated. The founder
now wants **self-evaluation**, and evaluation produces a **score**. A score looks
like points.

The line to draw: a **diagnostic score is a measurement** (per-module mastery,
private, resettable, decays or refreshes when you retake); **points are a
currency** (global, cumulative, irreversible, comparative). Allow the first, ban
the second. That keeps the calm brand and still answers "how good am I at this?".

**Minimum viable exception — proposed replacement text for the `plan.md`
non-goals line:**

> No accounts and no server-side user state. No XP currency, no global score, no
> leaderboards, no public comparison, no notification pressure.
> Allowed: private per-module mastery levels, a localStorage daily-challenge
> streak with a grace rule, and anonymous aggregate item statistics.

This single edit also closes the open question the master plan has been carrying
as **Q3** ("accept the moderated daily challenge and amend the non-goals, or
reject at triage") and the amendment `03-gamification-design.md` asked for.

### 2.4 "No infinite-scroll rewrite of the reader"

**Survivable: yes, trivially. Reinforce it.**

Assessment does not want infinite scroll. The per-slide canonical URL is now four
things at once (pacing, `sitemap.ts`, `llms.txt`, `/api/ask` citation target), so
this is no longer a taste call.

Two honest caveats:
- Slides already scroll. `OVERVIEW.md` records the friction: "very long `##`
  sections become tall scrollable slides." The redesign's authoring guidance
  should cap section length rather than pretend one slide is one screen.
- **Minimum viable exception (a clarification, not a breach):** assessment
  surfaces live outside `/read/**` and are free to use whatever layout suits them
  (a single scrolling results page is fine). The clause protects the *reader*,
  not the whole site.

### 2.5 "No video content"

**Survivable: yes, no exception needed.**

Nothing in self-assessment wants video. Audio (podcast mode, CR-2026-008) was
already carved out as permitted and is being killed for other reasons (§3).

One note on provenance: this clause was written against a *distribution*
question (should we run a YouTube channel, per `docs/growth/05`), not a *product*
one. If short-form video ever becomes a channel decision, it is a GTM call in
`docs/growth/`, not a violation of the product's non-goals. Keep the clause but
scope it: "no video *in the reader*".

### 2.6 Summary

| Non-goal | Survives? | Minimum viable exception |
|---|---|---|
| No auth | yes | portable progress code (export/import blob), no accounts |
| No server-side progress | yes for users, no for items | reword to "no server-side **user** state"; permit anonymous aggregate item stats; resolve the P-READER-002 vs CR-2026-010 conflict |
| No points/leaderboards | yes | permit private per-module mastery + grace-rule streak; ban currency, global score, comparison |
| No infinite scroll | yes | clarify it protects `/read/**` only; assessment routes are exempt |
| No video | yes | none; rescope to "no video in the reader" |

---

## 3. Planned-but-unbuilt inventory → absorb / supersede / kill

| # | Planned item | Source | Built? | Disposition | Reason |
|---|---|---|---|---|---|
| 20 | Quiz / MCQ fenced block | plan.md P1.1, CR-001, PRD R-A1 | no | **ABSORB — promote to the foundation** | The entire redesign rests on it. Everything else (daily challenge, placement, mastery, module recombination) reuses this one renderer. Build it first, deliberately, with a schema good enough for placement and free-response later. |
| 21 | Recap slide per chapter | plan.md P1.2, CR-002, PRD R-A2 | no | **SUPERSEDE** | A static "3 things to remember" is the weak form of the strong thing: a 3-question end-of-chapter check. Retire the recap concept and fold its intent into the chapter-end assessment. Answers PRD Q3 (auto-generate vs hand-author) by deleting the question. |
| 22 | Typography / callout / rhythm pass | plan.md P1.3, CR-003, PRD R-A3 | no | **ABSORB, downgrade** | Still worth doing, but it was justified as an *engagement* fix ("visually different slides feel like progress"). Feedback now does that job. Reclassify as craft/legibility work, and note that the IDE shell already changed the visual language it was specified against. |
| 23 | LocalStorage progress + completion rings | plan.md P2, CR-004 | **YES** | **BUILD ON** | `src/lib/progress.ts`, key `agent-yap:progress:v1`, shape `{version:1,lastHref,lastReadAt,read:{[bookSlug]:{[href]:epochMs}}}`. **Do not extend v1 with learner-profile fields** — it has no migration path and P-READER-002 promises monotonicity over that shape. Use a separate `agent-yap:profile:v1` key. |
| 24 | One interactive widget per book | plan.md P3, CR-005 | no | **PARK** | High effort, single-concept payoff, and it competes for the same fenced-block plumbing as quizzes. Revisit only after assessment ships. plan.md's own warning applies: "do not try to widget-ify everything." |
| 25 | Roadmap mode + placement quiz | plan.md future 1, CR-006 | no | **ABSORB — this IS the founder's onboarding ask, promoted from "future" to "core"** | Already correctly constrained: hand-authored prerequisite graph, "pure lookup table, no AI, no tokens", localStorage results, "recommendations only, never locks." Keep all four constraints verbatim; they are exactly right for the templates idea. |
| 26 | Explore mode (concept cards) | plan.md future 2, CR-007 | no | **ABSORB into module recombination** | Its prerequisite (deterministic tags) is the same metadata the 10-20 module graph needs. Do not build a separate card-grid mode; make the module map browsable and Explore falls out of it. |
| 27 | Podcast mode (build-time TTS) | plan.md future 3, CR-008 | no | **KILL** | plan.md itself ranked it last with the right reason: "improves consumption for existing readers rather than expanding who can use the site." It shares nothing with assessment, adds a build-time cost and a code-block-narration problem, and `docs/growth/00-master-plan.md` already parked it. Close CR-008 as rejected with that reasoning recorded. |
| 29 | Daily challenge + soft streak | CR-013, growth 03 | no | **ABSORB** | The best-designed unbuilt thing in the repo. Date-hash seeded, globally identical, answer reveals explanation plus a deep link into the exact slide, one screen and done, grace-rule streak. Take the design as written. |
| 30 | SEO / AI-discovery foundation | CR-009 | **YES, merged** | **DONE — audit and flip the row** | Still blocked on human decision Q1 (production domain) for `NEXT_PUBLIC_SITE_URL`. Nothing indexes until that is answered. |
| 31 | Cookieless analytics | CR-010 | no | **ABSORB — promote to prerequisite** | It is the prerequisite for item calibration (§2.2) as well as for every growth measurement. It is also where the P-READER-002 conflict must be resolved. |
| 32 | Share button + OG images | CR-012 | no | **KEEP, unchanged** | Independent of the redesign. Slice 1 (static OG + copy-link) is cheap; slice 2 (per-slide OG) is RIGOR because it touches the SSG slide route. |
| 33 | Updates feed (RSS + `/changelog`) | CR-014 | no | **KEEP, defer** | Cheap and it is the freshness signal for GEO, but it has no dependency on the redesign and no urgency until books actually start going live. |
| — | Book selector on the landing page | `OVERVIEW.md` recommendation 4 | no | **ABSORB — now mandatory** | `src/app/page.tsx:6` and `src/app/read/page.tsx:5` both call `getPrimaryBook()`. With 8 books the landing lies and `/read` sends everyone to book 1 slide 1. `getBooks()` already exists, so this needs no `content.ts` change. |
| — | Rate limiting on `/api/ask` | `OVERVIEW.md` recommendation 2 | no | **KEEP, raise priority before any launch** | Cost-unbounded on a public domain. Backend lane. |
| — | Compress the two landing photos | growth 04 item 6 | no | **SUPERSEDED** | See §5.5. |

---

## 4. Open CRs — one table, one recommended disposition each

All 14 are `status: logged`. None has been triaged. `docs/pm/feedback/README.md`
says triage defaults to reject/park and that promotion is a human act.
**Recommendation: run one triage session that dispositions all 14 in a single
pass, then hold the new plan to the survivors.** Otherwise the PM plane is
decoration and the redesign will simply route around it.

| CR | Slug | Weight | Ask | Recommended disposition |
|---|---|---|---|---|
| 001 | `quiz-slides` | 4 | Fenced ```quiz MCQ blocks with explanations | **PROMOTE — first spec of the redesign.** Everything depends on it. Widen the schema up front to carry placement items and a difficulty field so it is not re-cut in three months. |
| 002 | `recap-slide` | 3 | "3 things to remember" closing slide | **REJECT (superseded by 001).** Record the reason: an end-of-chapter check does the same job actively. |
| 003 | `typography-rhythm-pass` | 3 | Callouts, code styling, pull quotes | **PARK.** Real craft value, zero assessment value, and its visual premise predates the IDE shell. Re-log against the new design language. |
| 004 | `localstorage-progress` | 3 | Progress + rings + resume | **CLOSE AS DELIVERED.** Shipped and code-audited 2026-07-19. The CR never moved past `logged` while its feature shipped — that gap is the clearest evidence the PM plane is unexercised. |
| 005 | `interactive-widget` | 3 | One manipulable diagram per book | **PARK.** Revisit after assessment; competes for the same fenced-block plumbing. |
| 006 | `roadmap-mode` | 2 | Prerequisite graph + placement quiz | **PROMOTE and re-weight to 5.** This is now the founder's headline ask (onboarding + templates), not a "future mode". Its four constraints are already correct. |
| 007 | `explore-mode` | 2 | Concept card grid | **MERGE INTO 006.** Same metadata dependency; do not build two browse surfaces. |
| 008 | `podcast-mode` | 1 | Build-time TTS | **REJECT.** Record plan.md's own reasoning. |
| 009 | `seo-discovery-foundation` | 4 | sitemap/robots/metadataBase/llms.txt | **CLOSE AS DELIVERED**, with a follow-up on human decision Q1 (domain). |
| 010 | `privacy-analytics` | 4 | Cookieless analytics | **PROMOTE.** Prerequisite for item calibration and for every growth number. Its spec must resolve the P-READER-002 conflict (§2.2). |
| 011 | `dormant-content-integration` | 5 | Make 5-7 dormant modules live | **PROMOTE — highest priority in the repo, and sequence it BEFORE assessment.** See §5.2. Highest source_weight of all 14, cheapest work of all 14, unstarted. |
| 012 | `slide-shareability` | 3 | Share button + OG images | **PROMOTE slice 1 only** (static OG + copy-link). Defer slice 2 (per-slide OG, RIGOR) until something else touches the slide route. |
| 013 | `daily-challenge` | 4 | One question a day + grace streak | **PROMOTE, conditional on the non-goals amendment in §2.3.** This is master-plan Q3; answer it as part of the redesign rather than leaving it open a third month. |
| 014 | `updates-feed` | 3 | RSS + `/changelog` | **PARK until book integrations start landing.** Nothing to feed a feed with today. |

Gap worth noting: **no CR exists for onboarding, learner templates, module
decomposition, self-evaluation, or replacing the landing imagery.** The founder's
entire new direction is currently outside the intent plane. Either log them as
CR-2026-015…019 before specs are written, or acknowledge in the plan that this
redesign enters at `/define` directly and say why.

---

## 5. Things the new plan must decide (because prior work deferred them)

### 5.1 Where does module/prerequisite/tag metadata live? (PRD Q4, still open)

Facts: `src/lib/content.ts` has **no frontmatter parsing** and `package.json` has
**no `gray-matter`**. Slugs, numbers, and titles are derived from filenames and
heading structure. `content.ts` is exclusive-access and on the danger list.

**Recommendation: a sidecar JSON (for example `src/lib/curriculum/graph.json`)
plus a build-time validator script, not chapter frontmatter.**

- Beats frontmatter because frontmatter requires editing `content.ts` (danger
  list, RIGOR, risks the 181-slide static build) *and* touching ~60 chapter files
  that are simultaneously being rewritten in the working tree right now.
- The sidecar is one reviewable diff, regenerable, and diffable per PR.
- Tradeoff, stated honestly: a sidecar **drifts** when a chapter is renamed.
  Mitigate with a validator that cross-checks every referenced slug against
  `getAllSlides()` and fails `npm run build`. That converts the sidecar's one
  weakness into a build-gated invariant, which is exactly the trust model ADR-005
  endorses.

### 5.2 Sequencing: content integration before assessment, not after

`docs/growth/00-master-plan.md` puts dormant-content integration in Phase B and
quizzes alongside it. Two facts change the ordering:

1. Seven of eight folders still fail book discovery; the site is at ~22% of its
   written surface, unchanged for two weeks.
2. **A content rewrite is uncommitted in the working tree right now** (~45 files
   across five modules, plus an untracked `veritasium-storytelling` skill).

Assessment items are derived from chapter text. Authoring quiz items against
pre-rewrite text throws that work away. **Sequence: finish and commit the rewrite
→ integrate books (one PR per book, `npm run build` as the gate, never touching
`content.ts`) → then author assessment items against stable text.** The go-live
order in `docs/growth/02-content-strategy.md` (harnesses first, then context
engineering + memory, then RAG + multi-agent, then curated research papers with
Henry Shi's curator credit kept visible, glossary last) is sound; reuse it rather
than re-deriving it.

### 5.3 The single-book assumption is a hard blocker

`getPrimaryBook()` at `src/app/page.tsx:6` and `src/app/read/page.tsx:5`. The
moment book #2 goes live, the landing page under-represents the library and
`/read` misroutes. `getBooks()` already exists, so this is frontend-lane work
with no `content.ts` change. It must ship in the same window as the first
integration, not after.

### 5.4 AI in assessment: reuse BYOK, keep the default deterministic

Prior art that must not be duplicated: `src/components/reader/ChatPanel.tsx` +
`src/lib/chat/gemini.ts` already implement bring-your-own-key Gemini chat
grounded in the current slide, with `POST /api/ask` as the no-key fallback, under
invariant **P-CHAT-001** (key never leaves the browser except to Google).

If free-response or AI-explained answers are wanted: route them through the same
BYOK path. Cost stays zero, the contract stays frozen, and the product still
works with no key because the MCQ path is deterministic. This is the same posture
plan.md already chose for placement ("pure lookup table, no AI, no tokens"), so
it is consistent rather than new.

### 5.5 The two landing photos: a replacement already exists in-repo

`public/assets/snow-mountain.jpg` (7.9 MB) and `cloud-sea.jpg` (6.8 MB), used at
`src/components/Home.tsx:138`, `:243`, `:370` (snow-mountain twice, which is
literally the repetition the founder is reacting to).
`docs/growth/04-product-quick-wins.md` item 6 wanted them compressed; the founder
wants them gone. That chore is superseded by a design decision.

**The repo already has the replacement pipeline:** `scripts/fetch-art.mjs` +
`src/lib/art.ts` + `src/lib/art-manifest.json` + `public/art/` fetch and index
per-chapter CC0 public-domain artwork (The Met; AIC was abandoned mid-build
because its image CDN region-blocks, per the ide-shell G7 note). Extending that
manifest to cover landing and module imagery costs almost nothing, keeps the
calm/cinematic register, is legally clean, and removes 14.7 MB of stock photos
from the repo. It beats "commission or buy new photos" on cost, licensing, and
consistency with what the reader already shows.

---

## 6. The eight things the new plan must not re-litigate

1. Markdown on disk is the content store. No CMS, no database. (ADR-001)
2. `src/lib/content.ts` is the only parser. (C3)
3. One `##` = one slide, SSG, one canonical URL per idea. (ADR-003)
4. Modes are an index plus a renderer over the same slide list. No mode owns
   content. (plan.md)
5. Placement and scoring are deterministic lookup tables. No AI, no tokens.
   (plan.md, CR-006)
6. Progress mechanics yes, pressure mechanics no. (growth 03)
7. Positioning: "the field guide you return to while building agents", for
   practitioners, not "learn AI" beginners. (growth 01/05; the Exercism lesson)
8. Humans hold the trigger; ✅ only after a code audit; never `Closes #N`. (C9)

## 7. The six things the new plan must explicitly change

1. Amend the `plan.md` non-goals line per §2.3 (closes master-plan Q3).
2. Resolve **P-READER-002 vs CR-2026-010** (§2.2) and register P-READER-002/003
   and P-CHAT-001 in `specs/properties/invariants.md` (§1.1, C10).
3. Open **ADR-006**: add Vitest for pure assessment logic; ADR-005's own revisit
   trigger has fired (§1.2).
4. Fix or retire the lane table (C2 / ADR-002) so the new `src/lib/*` logic has
   an owner (§1.1).
5. Decide the metadata location (sidecar + build validator, §5.1) and answer
   PRD Q4.
6. Kill the single-book assumption before book #2 lands (§5.3).

---

## Source map

`plan.md` · `README.md` · `OVERVIEW.md` · `FEATURE-STATUS.md` · `AGENTS.md` ·
`CLAUDE.md` · `docs/api-contract.md` ·
`docs/growth/{README,00-master-plan,01-gtm-research,02-content-strategy,03-gamification-design,04-product-quick-wins,05-distribution-and-seo}.md` ·
`docs/pm/prd/{README,interactive-lessons}.md` ·
`docs/pm/feedback/{README,CR-2026-001..014}.md` · `docs/raw/README.md` ·
`specs/{CONSTITUTION,WORKFLOW,COMPLIANCE,INDEX,PROGRESS}.md` ·
`specs/decisions/ADR-001..005` · `specs/properties/invariants.md` ·
`specs/conventions/content.md` · `specs/compliance/BYPASSES.md` ·
`specs/learnings/README.md` ·
`specs/features/reader/ide-shell/{spec,review,compliance}.md` ·
`knowledge/concepts/{single-source-of-truth,frontend-backend-lanes}.md` ·
`knowledge/invariants/{book-discovery,grounded-answers}.md` ·
plus a code and content audit of `src/`, `content/`, `public/`, `package.json`.
