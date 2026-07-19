# GTM Research: How Developer-Education Sites Actually Grew

> Produced 2026-07-19. Method: a deep-research workflow (5 search angles, source
> fetch, claim extraction) plus targeted follow-up searches. **Honesty note:**
> the workflow's adversarial verification pass failed on infrastructure limits
> mid-run, so claims below are labeled by confidence instead: **[multi]** =
> consistent across multiple independent sources, **[single]** = one cited
> source, unverified. Numbers are the sources' claims, not our measurements.

## Case studies

### roadmap.sh: the open-source-repo-as-distribution model

- ~10,000 GitHub stars in the first week, driven by a Hacker News post and
  Reddit reposts. **[single]**
- Grew to ~263k stars (top-10 most-starred GitHub repo), ~700k monthly
  visitors, a 250k-subscriber newsletter, 1000+ contributors. **[multi]**
- Sources: [Starter Story breakdown](https://www.starterstory.com/roadmap-sh-breakdown),
  [freeCodeCamp podcast #145](https://www.freecodecamp.org/news/roadmapsh-founder-kamran-ahmed-podcast-145/),
  [Flagsmith podcast](https://www.flagsmith.com/podcast/roadmap-sh).
- **Transfer:** the repo IS the marketing. A public, contributable content repo
  converts readers into stargazers and contributors, and GitHub stars are a
  discovery surface of their own. Our content is markdown in a repo already.

### ByteByteGo: social-first, then newsletter (closest comp to our format)

All from one detailed teardown
([Growth in Reverse](https://growthinreverse.com/bytebytego/)), so **[single]**:

- Audience built on LinkedIn/Twitter for ~5 months BEFORE the newsletter
  launched (Nov 2021 posts, Apr 2022 newsletter); ~600k social followers
  accumulated; newsletter passed 334k subscribers in under 2 years, ~1M in
  about two years (self-reported).
- Near-identical content cross-posted to LinkedIn and Twitter; LinkedIn proved
  the stronger channel (roughly half of social traffic would have been missed
  with a Twitter-only strategy).
- One flagship lead magnet (a free 158-page PDF compiled from already-published
  content) pinned and promoted everywhere as the subscription driver.
- YouTube added as a funnel extension (350k+ subs), to the point of dominating
  the system-design search results page.
- **Transfer:** ByteByteGo is diagram-per-concept system-design education,
  which is structurally our content. Our slides map 1:1 to social carousel
  frames; a cheat-sheet PDF per book is our lead-magnet equivalent. Distribute
  where the audience already is first; own a home base second.

### daily.dev: distribution surface beats content volume

- ~90% of users use the browser extension, i.e. the product occupies the
  new-tab surface and becomes a passive daily habit. **[multi]**
- ~100k DAU in Mar 2023 ([TechCrunch](https://techcrunch.com/2023/03/23/daily-dev-is-like-reddit-meets-stack-overflow/)),
  400k+ daily developers claimed today ([daily.dev](https://daily.dev/)). **[multi]**
- **Transfer (inverted):** we should not build an extension, but the lesson is
  that a recurring surface (daily challenge page, feed, newsletter) retains,
  while destination-only sites depend on the reader remembering to return.

### freeCodeCamp: multi-surface compounding over a decade

- YouTube channel hit 10M subscribers (Oct 2024) with 700+ full-length free
  courses; users logged 2B+ coding minutes in a year; ~60% yearly growth since
  2014. **[multi]** ([Wikipedia](https://en.wikipedia.org/wiki/FreeCodeCamp),
  [fCC forum](https://forum.freecodecamp.org/t/the-freecodecamp-community-youtube-channel-just-hit-10-000-000-subscribers/714131))
- **Transfer:** the publication/YouTube surfaces feed the curriculum. For us
  the analog is: chapters (home base) fed by carousels/snippets (outposts).
  Also a scale reminder: this took 10 years and a nonprofit army; we plan for
  compounding, not overnight numbers.

### Exercism: cautionary tales that map directly onto our plans

All from the founder's retrospective
([Changelog #309](https://changelog.com/podcast/309)), **[single]**:

- ~200k users with zero marketing, but the initial spike came from unplanned
  press (Wired, HN front page, Slashdot), and Wired's mispositioned headline
  ("teach you to program well enough to get a job") flooded the site with
  beginners the product was not designed for. **Positioning at launch decides
  who shows up.**
- v2 replaced linear ~110-exercise completionist tracks, which demotivated
  users because adding exercises "un-finished" them, with 15-25 core exercises
  plus optional side quests, so every user can finish a track. **Completion
  must stay reachable; our books are finite and must stay visibly finishable.**
- Human mentor review was the throughput bottleneck (~800 volunteers vs ~1,000
  needed). **Never gate progress on scarce human supply; our no-account,
  client-side design already avoids this.**
- Open source scaled content maintenance (48 language tracks) but structurally
  failed to cover design/marketing work, driving founder burnout. **Open
  source distributes content work, not GTM work.**

## Gamification: what the evidence supports

- **Retrieval practice is the anchor.** Adesope et al. 2017 meta-analysis
  (Review of Educational Research): practice testing beats restudying with
  mean effect g = 0.61; mixed formats (MCQ + short answer) strongest.
  **[multi]** ([Adesope et al.](https://journals.sagepub.com/doi/abs/10.3102/0034654316689306),
  [Learning Scientists summary](https://www.learningscientists.org/blog/2017/2/9-1))
  This is the scientific case for quiz slides (CR-2026-001) being the core
  mechanic rather than decoration.
- **Streaks work, and their dark side is documented.** Duolingo: churn down
  from 47% (2020) to 28% (2024) in Western markets; active streaks correlate
  with ~3x daily-return likelihood; when streak requirements were EASED in
  2024 (one lesson counts), 7-day streak retention rose ~40%. **[single-ish,
  widely repeated]** ([Trophy case study](https://trophy.so/blog/duolingo-gamification-case-study),
  [StriveCloud](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo))
  Criticism cluster: compulsive streak-keeping displaces learning; "the
  Duolingo Effect" names engagement metrics that do not translate to
  proficiency ([Spellings.App](https://spellings.app/blog/duolingo-effect)).
  Lesson: gentle streaks retain BETTER than harsh ones, and learning quality
  is the guardrail metric.
- **LeetCode's annual badge needs 300/365 days**, i.e. even the archetype of
  developer streaks builds in grace ([GeeksforGeeks](https://www.geeksforgeeks.org/techtips/how-to-achieve-badge-in-leetcode/)).
  Our grace-rule streak (see `docs/growth/03-gamification-design.md`) is
  consistent with the best practice of the very product the founder cited.

## AI-era discovery (GEO)

- ChatGPT Search reports ~600M monthly users and Perplexity ~100M in 2026
  sources; AI answers reduce classic click-through, so being CITED by
  assistants is a first-class channel now. **[multi]**
  ([Search Engine Land GEO guide](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142))
- **llms.txt honesty check:** adoption is ~10% of domains and no major engine
  documents using it in citation/retrieval pipelines yet. **[multi]**
  ([OrganiKPI adoption data](https://organikpi.com/blog/distribution/llms-txt-adoption-impact/))
  We shipped it anyway because cost was near zero and `llms-full.txt` is
  genuinely useful for direct LLM ingestion; we just do not claim ranking
  effects from it.
- What GEO actually rewards: crawlable canonical URLs, clear heading
  hierarchies, self-contained answers, freshness signals. Our slide model
  (one idea per URL) is unusually well-shaped for being quoted by assistants.

## Launch playbook (Hacker News first)

**[multi]** ([markepear guide](https://www.markepear.dev/blog/dev-tool-hacker-news-launch),
[daily.dev ads guide](https://business.daily.dev/resources/hacker-news-marketing-developer-tools-show-hn-launch-day-sustained-coverage/),
[syften timing guide](https://syften.com/blog/hacker-news-marketing/)):

- Show HN posts can drive 5k-50k visitors in 48h; roughly 1.4 GitHub stars per
  upvote for open-source projects.
- Timing: Tue-Thu, 9:00-12:00 ET; the first 30-60 minutes decide front-page
  fate (~30-50 upvotes in hour one).
- Titles: neutral, modest, concrete; no superlatives, no marketing voice.
- Behavior: answer comments fast and technically, as a builder; no signup
  gate on the thing you show (we have none, an advantage).
- Practical implication: launch AFTER analytics + OG cards + more books are
  live, and lead with the most differentiated book (coding-agent harness
  internals), not the generic pitch.

## Competitor landscape and our gap (2025-26)

- The space teaches agents as **courses tied to frameworks**: Hugging Face
  Agents Course (smolagents/LlamaIndex/LangGraph, free cert, leaderboard),
  DeepLearning.AI short courses (partner labs, including Anthropic),
  Anthropic Academy (Claude-specific), plus cookbook repos. **[multi]**
  ([HF course](https://huggingface.co/learn/agents-course/unit0/introduction),
  [DeepLearning.AI](https://www.deeplearning.ai/courses),
  [Scrimba roundup](https://scrimba.com/articles/best-courses-to-learn-ai-agents-and-agentic-ai-in-2026/))
- **Our gap:** a technology-agnostic, systems-first REFERENCE (read, search,
  ask, cite) rather than a course (enroll, watch, certificate). Nobody in the
  roundups owns "the field guide you return to while building." That is the
  positioning wedge, and it matches the Exercism lesson: say precisely who it
  is for (practitioners building agents), so the right crowd shows up.
