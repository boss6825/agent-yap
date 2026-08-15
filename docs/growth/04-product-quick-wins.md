# Product Quick Wins (grounded in a code audit, 2026-07-18)

> Small, high-leverage product changes that support growth. Each row is tagged
> with the change tier from `CLAUDE.md`, the lane from `AGENTS.md`, and a
> RIGOR/LITE guess per `specs/WORKFLOW.md`. This file records findings and
> priorities; anything Tier 4 still enters the pipeline at `/define` or from an
> existing CR in `docs/pm/feedback/`.

## Audit summary (what exists vs. what is missing)

Audited on branch point `6dc96aa`. The reader itself is in good shape: keyboard
and swipe navigation, progress bar, TOC drawer, dark mode, per-slide
`generateMetadata`, and a title template in `src/app/layout.tsx`.

What was missing for discovery and growth:

| Gap | Status |
|---|---|
| `metadataBase` (OG/Twitter URLs cannot resolve without it) | Shipped, see below |
| `robots.ts`, `sitemap.ts` | Shipped, see below |
| `llms.txt` / `llms-full.txt` (AI-assistant discovery) | Shipped, see below |
| Open Graph image (cards render text-only everywhere) | Open, high priority |
| Analytics (no way to measure anything) | Open, high priority |
| Share / copy-link affordance on slides | Open |
| Reading-position resume ("continue where you left off") | Open, covered by CR-2026-004 |
| Per-slide canonical URLs | Open, touches the SSG slide route (RIGOR) |
| RSS / updates feed | Open |
| Web manifest + icons | Open, low |
| Landing images are 7.9 MB and 6.8 MB source files (`public/assets/`) | Open, mitigated by `next/image` at serve time; still repo and cold-cache weight |

## Shipped on branch `claude/growth-quick-wins-gx0t42` (user-authorized quick win)

One commit, verified with `npm run build` + `npm run lint` + curl against
`npm run start`:

- `src/lib/site.ts`: canonical origin helper. Resolution order:
  `NEXT_PUBLIC_SITE_URL`, then Vercel envs, then `http://localhost:3005`.
- `src/app/sitemap.ts`: landing page + all 181 canonical slide URLs from
  `src/lib/content.ts`. Redirect routes (`/read`, `/read/[book]`) excluded.
- `src/app/robots.ts`: allow all, disallow `/api/`, point at the sitemap.
- `src/app/llms.txt/route.ts`: llmstxt.org index (book description + one line
  per chapter with its blurb and canonical URL).
- `src/app/llms-full.txt/route.ts`: complete chapter text in one markdown file
  (about 131 KB today) so AI assistants can ingest and cite the whole base.
- `src/app/layout.tsx`: `metadataBase`, `og:url`, `og:siteName`.

**Deploy note:** set `NEXT_PUBLIC_SITE_URL=https://<production-domain>` in the
deployment environment. `.env.example` is backend lane property, so adding the
variable there needs a coordinated backend commit (see `AGENTS.md` lanes).

## Next up, ranked

| # | Change | Why it matters | Tier | Lane | Dial |
|---|---|---|---|---|---|
| 1 | Privacy-friendly analytics (Plausible, Umami, or Vercel Analytics) | Every growth decision below is blind without baseline traffic, referrer, and per-chapter read data. No cookies banner burden if the tool is cookieless. | 4 (small) | frontend | LITE |
| 2 | Static OG image, then per-chapter `opengraph-image` | Social cards are the first impression in every share; text-only cards waste every link posted. | 4 (small) | frontend | LITE |
| 3 | Share / copy-link button in reader chrome | Slides are already canonical URLs; a one-tap share turns readers into distribution. | 4 (small) | frontend | LITE |
| 4 | RSS/Atom feed of new chapters + a `/changelog` page | Feeds the newsletter loop and gives aggregators something to poll. | 4 | frontend | LITE |
| 5 | Per-slide canonical + OG on the slide route | Correct dedup signals for 181 indexed pages. | 4 | frontend | **RIGOR** (edits the SSG slide route, on the WORKFLOW danger list) |
| 6 | Compress landing images to web-sized sources | Repo hygiene and cold-cache LCP; `next/image` already serves optimized variants. | 0 | frontend | n/a |
| 7 | `manifest.ts` + icons | Installability polish; cheap but low leverage. | 4 (small) | frontend | LITE |

Items 1 to 4 are CR'd in `docs/pm/feedback/` (CR-2026-010, CR-2026-012,
CR-2026-014). Item 5 should ride along whichever spec first touches the slide
route. Items 6 and 7 are chore-sized.

## Explicitly not quick wins

- Quiz blocks, progress rings, widgets: already planned and CR'd
  (CR-2026-001 to CR-2026-005); they go through the Tier-4 pipeline.
- Auth, server-side progress, leaderboards: `plan.md` non-goals. See
  `docs/growth/03-gamification-design.md` for what we do instead.
