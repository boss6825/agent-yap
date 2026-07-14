



# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.



# Agent YAP

A public website that serves a markdown knowledge base ("Architecture and
System Design for AI Agents") as a **slide reader**: each chapter is split into
one-page sections the reader pages through left/right.

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
- **Content:** `content/<book>/` markdown. Parsed by `src/lib/content.ts` into
books → chapters → slides. That module is the single source of truth — import
from it, don't re-parse markdown.
- **Frontend (Claude-owned):** the slide reader, landing page, and search/ask
UI under `src/app` and `src/components`.
- **Backend (Codex-owned):** two route handlers — full-text **search** and an
AI **"Ask the docs"** RAG endpoint. The exact contract is in
`docs/api-contract.md` — follow it precisely.



## Lanes (avoid collisions)

- Backend work lives in `src/app/api/**`, `src/lib/search.ts`, `src/lib/ask.ts`,
and `.env.example`. Do not modify `src/lib/content.ts` or the reader UI.
- Dependencies are already installed (incl. `@anthropic-ai/sdk`).



## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also validates types/static params)
- `npm run lint` — eslint

---



# Frontend design workflow

- Skip the frontend design workflow only when the prompt explicitly says to skip it .

Applies to every agent in this repo. Stop writing UI from training memory when
skills + MCP are available.

**Order: Skills (process) → MCP (ground truth) → Skills (critique).** Do not
reorder. If a tool is unavailable, say so — do not silently fall back to
training data.

Skip this entire workflow only when the prompt says to skip the frontend flow.

## When it triggers

New/restyled UI component or page, animation/scroll work, or any edit under
`components/`, `app/`, `pages/`, or `ui/`. Mandatory for those tasks — do not wait
for the user to ask for “good design.”

## Checklist (run in order)

Skip a step when it does not apply; state which and why. Not every skill is
required on every task — skip ones the model judges unnecessary.

1. **design-an-interface** — New component/page from scratch: plan before coding.
2. **shadcn MCP** — Search for a matching primitive. Use it if found; else say
  “no shadcn match found” before custom code.
3. **Context7 / find-docs** — Current framework/library docs (React, Next.js,
  Tailwind v4, etc.). Use Context7 MCP or the `find-docs` skill (Context7 CLI).
   Only when uncertain or debugging stale-API bugs — mandatory if you are not
   100% sure the API is current.
4. **frontend-design + web-design-guidelines + vercel-react-best-practices** —
  Layout, semantics, performance while building.
5. **design-taste-frontend + high-end-visual-design + premium-frontend-ui** —
  Visual quality pass (spacing, type, color, hierarchy).
6. **gsap-animation / gsap-framer-scroll-animation** — Only if motion/scroll is
  required; otherwise skip.
7. **Chrome DevTools MCP** — Render and verify layout, console, responsive
  breakpoints before calling user-facing UI done.
8. **accessibility** — Contrast, focus, keyboard, ARIA basics on rendered output.
9. **impeccable** — Final critique only; does not replace steps 4–8.



## Trust order

1. shadcn MCP → 2. installed skills → 3. training knowledge (last resort; flag it).



## MCP servers


| Server          | Use for                                                    |
| --------------- | ---------------------------------------------------------- |
| shadcn          | Component patterns (every new UI piece)                    |
| Context7        | Current library/framework docs (when uncertain / API bugs) |
| Chrome DevTools | Visual + runtime check before “done”                       |
| Playwright      | Behavior / E2E when appearance alone is not enough         |
| Figma           | Only when a Figma link/file is provided                    |




## Skills inventory

Global (`~/.cursor/skills`, `~/.agents/skills`, `~/.claude/skills`):
`find-docs`, `frontend-design`, `web-design-guidelines`,
`vercel-react-best-practices`, `design-taste-frontend`, `high-end-visual-design`,
`design-an-interface`, `ui-ux-pro-max` (high risk), `premium-frontend-ui`,
`gsap-animation`, `gsap-framer-scroll-animation`, `shadcn`, `tailwind-v4-shadcn`,
`accessibility`, `emil-design-eng`, `impeccable` (med risk).

Project: `apple-design`, plus Figma plugin skills when relevant.

## Done means

- Chrome DevTools check passed (step 7)
- impeccable found no blocking issues (step 9)

