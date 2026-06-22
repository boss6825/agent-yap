---
name: context
description: Project context for Agent YAP, an educational site teaching AI agent engineering (RAG, context engineering, memory, multi-agent, coding agent harnesses, system design). Use when writing content, building features, or making decisions in this repository and you need goals, content rules, and current phase without folder layout details.
---

# Agent YAP — Project Context

## What this project is

An educational website that teaches **AI agent engineering** to practitioners. Topics span:

- RAG (retrieval-augmented generation, agentic RAG)
- Context engineering
- Agentic memory
- Multi-agent systems
- Coding agent internals (Claude Code, Codex, Cursor, Manus)
- Full agent system design and architecture

The guiding belief in the source material: **the model is the easy part.** Context, tools, reliability, security, and orchestration are the system design.

## How the content was made

1. Source articles, blog posts, and research papers were collected on each topic.
2. Sources were fed to Claude as input material.
3. Claude generated structured, chapter-by-chapter teaching content in markdown.

Source files still live alongside chapters in `sources/` subfolders. They were **inputs for generation only** and are **not shown on the website**.

## How content is served

- Markdown chapter files power a **Next.js slide reader**.
- Each chapter splits into small sections that fit one screen; users navigate left/right like a presentation.
- Each `##` heading becomes one slide; text under the H1 (before the first H2) is the intro slide.
- **No auth, no backend database** for content. Just markdown files rendered as slides.
- Optional API routes provide full-text search and an AI "Ask the docs" RAG assistant grounded in published content.

## Content rules (mandatory for all generated content)

- **No em dashes.** Use commas, parentheses, colons, or rewrite the sentence instead.
- **Practitioner-focused writing.** Teach engineers how things actually work under the hood. Avoid surface-level overviews, buzzwords without mechanism, and hand-wavy explanations.
- Slides should be dense but readable: one core idea per slide, concrete examples where possible.

## Current phase

- **Chapter content is complete** across all content modules (see the `context-and-map` skill for module list).
- **Active work:** adding interactive elements (MCQs, coding challenges) to increase engagement and retention.
- **Integration gap:** only `architecture-and-system-design` is wired into the live reader today (has `index.md` + `chapter-NN-*.md` naming). Other modules exist as markdown on disk and need index files / naming alignment before they appear on the site.

## Tech stack (brief)

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Content parsing lives in `src/lib/content.ts` (single source of truth for books, chapters, slides). See `AGENTS.md` for lane ownership (frontend vs backend) and commands.

## When to load the map skill

If you need folder paths, file naming conventions, or which modules are live vs draft, load the **`context-and-map`** skill instead of guessing.
