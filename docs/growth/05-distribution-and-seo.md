# Distribution and SEO Playbook

> Channel-by-channel plan. Evidence and citations live in
> `docs/growth/01-gtm-research.md`; this file is what we DO. Ordering
> principle: fix the funnel before buying traffic with launches; a launch into
> a site with no cards, no analytics, and one book wastes its one-time spike.

## Positioning (decide once, use everywhere)

**"The field guide you return to while building agents."** Technology-agnostic
systems design, readable in slides, searchable, and askable. For practitioners
building agents, not for "learn AI" beginners. Every launch title, OG
description, and social bio uses this frame: the Exercism case shows a
mispositioned headline fills the site with the wrong audience.

## Channel 1: Search (SEO)

The library is documentation-shaped: hundreds of one-idea-per-URL slides.
That is a long-tail machine once the surface is crawlable.

1. Foundation shipped on `claude/growth-quick-wins-gx0t42`: sitemap, robots,
   metadataBase. Merge, set `NEXT_PUBLIC_SITE_URL`, submit the sitemap in
   Search Console.
2. Multiply indexed surface by integrating dormant books (CR-2026-011):
   181 slides live today, roughly 600+ after integration, zero new writing.
3. Per-slide canonical + OG (CR-2026-012 second slice, RIGOR) so 600 pages
   dedupe and preview correctly.
4. Glossary entries as individual pages (with CR-2026-007 explore mode): each
   term is a "what is X" query magnet: agent loop, context engineering,
   agentic RAG, MCP.
5. No thin programmatic pages. The anti-pattern for a trust-first brand.

## Channel 2: AI assistants (GEO)

Our audience asks ChatGPT/Claude/Perplexity before they ask Google. Being the
cited source is the new ranking.

- Shipped: `llms.txt` + `llms-full.txt` (index + full text). Honest caveat
  from research: no major engine documents consuming llms.txt yet; we treat it
  as near-zero-cost future-proofing, not a ranking lever.
- What actually gets cited: crawlable canonical URLs, self-contained sections
  under clear headings, freshness stamps. Slides are already one idea per URL;
  the changelog (CR-2026-014) adds the freshness signal.
- Measure it: track `chatgpt.com`, `perplexity.ai`, `claude.ai` referrers once
  analytics (CR-2026-010) lands, and check whether assistant answers cite us
  for 10 benchmark questions ("what is context engineering", "how do coding
  agent harnesses manage context") quarterly.

## Channel 3: Open source as distribution

roadmap.sh turned a content repo into a top-10-starred GitHub property that
feeds the site. Our content is already markdown in a repo.

- **Human decision needed:** make the repo public (or split `content/` into a
  public repo if the app should stay private). Without public, this channel is
  closed.
- If public: contribution guide for corrections/additions, "edit this chapter"
  links from the reader, a README that reads as a landing page. Show HN and
  every social post then compound into stars (roughly 1.4 stars per HN upvote
  per the research).
- Exercism warning applies: open source will crowdsource typo fixes and even
  chapters, but never the marketing itself. Budget founder/agent time for GTM
  regardless.

## Channel 4: Social (the ByteByteGo motion)

Our slide format is a native carousel format; ByteByteGo built ~600k followers
posting system-design diagrams before monetizing attention into a newsletter.

- Cadence over volume: 2-3 posts/week, each a single strong idea from a
  chapter, cross-posted near-identically to LinkedIn and X (research: LinkedIn
  alone was ~half of ByteByteGo's social traffic; do not skip it).
- Format: 5-8 slide carousel (export of actual reader slides once CR-2026-012
  shape exists; screenshots until then) + a one-paragraph practitioner take +
  canonical link to the exact slide.
- The quiz-of-the-day (CR-2026-013) doubles as a social object: post the
  question, link `/daily` for the answer.
- No engagement-bait voice. Same practitioner tone as the chapters; the
  content rules in `specs/conventions/content.md` apply to posts too.

## Channel 5: Launches (one-time spikes, spent deliberately)

Sequence, per the research playbook:

1. **Soft launches first** (Reddit r/LLMDevs, r/AI_Agents, lobste.rs; X/LinkedIn
   posts): one book each, as a value post ("I wrote/curated a free 17-chapter
   guide to coding-agent harness internals"), not a product pitch. Watch which
   framing converts before the HN spend.
2. **Show HN** when: 3+ books live, OG cards render, analytics on, repo public
   (ideally). Title modest and concrete, e.g. "Show HN: A free field guide to
   AI agent architecture, served as a slide reader". Lead with the harness
   book angle if soft launches say so. Tue-Thu 9-12 ET, answer every technical
   comment in hour one.
3. **Product Hunt** afterwards if desired; lower fit for this audience.
4. Each future book integration and the quarterly "state of agents" chapter is
   a fresh, smaller launch moment (aggregators + social + changelog/RSS).

## Channel 6: Newsletter (later, earn it first)

The strongest retention asset in every case study, and premature for us.
Prerequisites: RSS + changelog shipping updates worth emailing about, and a
lead magnet (cheat-sheet PDF per book, compiled from existing content, the
ByteByteGo move). Revisit after the launch sequence; log a CR when there is a
list to build with.

## What we deliberately skip

- Browser extension (daily.dev's moat, wrong effort/return for us).
- Paid ads, SEO content farms, engagement-bait threads.
- Video/YouTube pipeline for now (plan.md non-goal; revisit only if carousels
  prove the appetite).

## Measurement (all of this is blind until CR-2026-010 lands)

Weekly dashboard: unique visitors, top referrers (with AI-assistant referrers
broken out), top entry slides, return-visitor share, chapter completions
(rings), daily-challenge answers, GitHub stars (if public), newsletter subs
(when it exists). Review monthly against `docs/growth/00-master-plan.md`
phase gates.
