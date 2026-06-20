"use client";

import { useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { SearchPanel } from "@/components/SearchPanel";
import { AskPanel } from "@/components/AskPanel";
import { chapterAccent } from "@/lib/chapter-color";

export interface HomeChapter {
  number: number;
  title: string;
  blurb: string;
  href: string;
  slideCount: number;
}

export interface HomeData {
  title: string;
  description: string;
  total: number;
  startHref: string;
  chapters: HomeChapter[];
}

export function Home({ data }: { data: HomeData }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip">
      {/* ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-dotgrid opacity-60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-violet/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-20 -z-10 h-[30rem] w-[30rem] rounded-full bg-lime/15 blur-[120px]"
      />

      {/* header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Wordmark size="md" />
        <nav className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 items-center gap-1.5 rounded-full border border-line bg-ink-2/60 px-3.5 text-sm text-muted transition-colors hover:border-paper hover:text-paper sm:inline-flex"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Search
          </button>
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-ink-2/60 px-3.5 text-sm text-muted transition-colors hover:border-lime hover:text-paper"
          >
            <span aria-hidden>✦</span> Ask
          </button>
          <Link
            href={data.startHref}
            className="inline-flex h-9 items-center rounded-full bg-lime px-4 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            Start reading
          </Link>
        </nav>
      </header>

      {/* hero */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-10 pt-12 sm:px-8 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted">
          <span className="text-lime">✦</span> A field guide to agent architecture
        </span>

        <h1 className="mt-6 text-balance font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl">
          The hard part of an AI agent{" "}
          <span className="relative whitespace-nowrap text-lime">
            isn’t the model.
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-lg text-muted sm:text-xl">
          {data.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={data.startHref}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-lime px-6 text-base font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            Start reading
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <button
            type="button"
            onClick={() => setAskOpen(true)}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-ink-2 px-6 text-base font-semibold text-paper transition-colors hover:border-lime"
          >
            <span className="text-lime" aria-hidden>✦</span> Ask the docs
          </button>
        </div>

        <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm text-faint">
          <div className="flex items-baseline gap-2">
            <dt className="text-2xl font-bold text-paper">{data.chapters.length}</dt>
            <dd>chapters</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-2xl font-bold text-paper">{data.total}</dt>
            <dd>one-page slides</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-2xl font-bold text-paper">←→</dt>
            <dd>read at your pace</dd>
          </div>
        </dl>
      </section>

      {/* marquee */}
      <div className="relative my-6 select-none overflow-hidden border-y border-line py-3">
        <div className="flex w-max animate-marquee gap-6 whitespace-nowrap font-display text-sm font-semibold uppercase tracking-wider text-faint">
          {[...data.chapters, ...data.chapters].map((c, i) => (
            <span key={i} className="flex items-center gap-6">
              <span style={{ color: chapterAccent(c.number).hex }}>✦</span>
              {c.title}
            </span>
          ))}
        </div>
      </div>

      {/* chapters */}
      <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            The chapters
          </h2>
          <p className="hidden max-w-xs text-right text-sm text-muted sm:block">
            Read straight through, or jump to the decision you’re facing.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.chapters.map((c) => {
            const accent = chapterAccent(c.number);
            return (
              <Link
                key={c.href}
                href={c.href}
                style={{ ["--accent" as string]: accent.hex }}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-line bg-ink-2 p-5 transition-all hover:-translate-y-1 hover:border-accent"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ background: accent.hex }}
                />
                <div className="flex items-center justify-between">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl font-display text-base font-bold"
                    style={{ background: accent.hex, color: accent.on }}
                  >
                    {c.number}
                  </span>
                  <span className="font-mono text-xs text-faint">
                    {c.slideCount} slides
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold leading-tight text-paper">
                  {c.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{c.blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-accent">
                  Read
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* footer */}
      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
          <Wordmark size="sm" />
          <p className="text-sm text-faint">
            {data.title} · a slide-by-slide field guide.
          </p>
          <Link
            href={data.startHref}
            className="text-sm font-semibold text-lime hover:underline"
          >
            Start reading →
          </Link>
        </div>
      </footer>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AskPanel open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
