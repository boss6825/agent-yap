"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { SubjectMark } from "@/components/SubjectMark";
import type { Accent } from "@/lib/content";
import type { ShelfBook, ShelfData, ShelfEntry } from "@/lib/shelf";
import { lastReadInBook, useProgress, type ProgressData } from "@/lib/progress";

/**
 * The subject shelf: a featured row over labelled tracks of subject cards.
 *
 * Rendered in two places from one definition — inside the landing page's
 * curriculum section and as the whole of the library at `/read` — so the two
 * can never drift on counts, ordering, or what a card says.
 *
 * Boldness is spent in exactly one place: the featured row's saturated tiles.
 * Everything under it stays on the site's quiet Apple surfaces and carries its
 * subject colour as a single hairline bar, so six accents on one page read as
 * an index rather than as noise.
 */

/**
 * Apple's system colours. Each subject keeps one for life, so the mark in the
 * featured row, the bar on its card and the rail it opens all agree.
 *
 * Passed down as a custom property rather than a class per accent: Tailwind
 * only emits classes it can see in the source, so a computed `bg-[#30B0C7]`
 * would silently produce no CSS at all.
 */
const ACCENT_HEX: Record<Accent, string> = {
  teal: "#30b0c7",
  violet: "#af52de",
  rose: "#ff2d55",
  amber: "#ff9500",
  sky: "#32ade6",
  indigo: "#5856d6",
  slate: "#8e8e93",
};

function accentVars(accent: Accent): CSSProperties {
  return { "--accent": ACCENT_HEX[accent] } as CSSProperties;
}

/** Slides marked read in a book. `undefined` until progress has loaded. */
function readCount(
  progress: ProgressData | null,
  bookSlug: string,
): number | undefined {
  if (!progress) return undefined;
  return Object.keys(progress.read[bookSlug] ?? {}).length;
}

/* --------------------------------- featured -------------------------------- */

function FeaturedTile({ book }: { book: ShelfBook }) {
  return (
    <Link
      href={book.href}
      data-rise="0"
      style={{
        ...accentVars(book.accent),
        backgroundImage:
          "linear-gradient(155deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 58%, #0b0b0f) 100%)",
      }}
      className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-card p-6 text-white transition-transform duration-[400ms] ease-out hover:-translate-y-1 active:scale-[0.98]"
    >
      {/* Amber and teal are bright enough that white type on the raw gradient
          lands near 2:1. The scrim only darkens the lower half, so the tile
          keeps its colour where the mark sits and earns its contrast where the
          words are. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.16)_46%,rgba(0,0,0,0)_78%)]"
      />
      <SubjectMark
        slug={book.slug}
        className="relative h-11 w-11 text-white/85 transition-colors duration-300 group-hover:text-white"
      />
      <span className="relative">
        <span className="block font-display text-xl font-semibold leading-[1.2] tracking-[-0.01em]">
          {book.title}
        </span>
        <span className="mt-2 block text-xs text-white/85">
          {book.chapterCount} chapters · {book.slideCount} slides
        </span>
      </span>
    </Link>
  );
}

/* ---------------------------------- cards ---------------------------------- */

function BookCard({ book }: { book: ShelfBook }) {
  const progress = useProgress();
  const resume = lastReadInBook(progress, book.slug);
  const read = readCount(progress, book.slug) ?? 0;
  const pct = book.slideCount > 0 ? (read / book.slideCount) * 100 : 0;
  const started = resume !== null && read > 0;

  return (
    <Link
      href={started ? resume.href : book.href}
      data-rise="0"
      style={accentVars(book.accent)}
      className="accent-scope group relative flex min-h-[196px] flex-col overflow-hidden rounded-card bg-canvas-2 p-6 pl-7 transition-[background,transform] duration-[400ms] ease-out hover:-translate-y-1 hover:bg-canvas-3 active:scale-[0.98]"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]"
      />
      <span className="flex items-start justify-between gap-4">
        <span className="font-display text-[19px] font-semibold leading-[1.22] tracking-[-0.01em] text-ink">
          {book.title}
        </span>
        <SubjectMark
          slug={book.slug}
          className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent)] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />
      </span>

      <span className="mt-2.5 flex-1 text-[15px] leading-[1.45] text-ink-2">
        {book.tagline}
      </span>

      <span className="mt-5 block text-xs text-ink-2">
        {book.chapterCount} chapters · {book.slideCount} slides
      </span>

      {/* Quiet until there is something to show; a full-width empty track on
          every card would read as "nothing done" rather than "not started". */}
      {read > 0 && (
        <span aria-hidden className="mt-2 block h-[3px] rounded-pill bg-canvas-3">
          <span
            className="block h-[3px] rounded-pill bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${Math.max(pct, 3)}%` }}
          />
        </span>
      )}

      <span className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--accent-ink)]">
          {started ? "Resume" : "Start learning"}
        </span>
        {read > 0 && (
          <span className="text-xs tabular-nums text-ink-2">
            {read} / {book.slideCount} read
          </span>
        )}
      </span>
    </Link>
  );
}

function ReferenceCard({ entry }: { entry: Extract<ShelfEntry, { kind: "reference" }> }) {
  return (
    <Link
      href={entry.href}
      data-rise="0"
      style={accentVars(entry.accent)}
      className="accent-scope group relative flex min-h-[196px] flex-col overflow-hidden rounded-card bg-canvas-2 p-6 pl-7 transition-[background,transform] duration-[400ms] ease-out hover:-translate-y-1 hover:bg-canvas-3 active:scale-[0.98]"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] bg-[var(--accent)]"
      />
      <span className="flex items-start justify-between gap-4">
        <span className="font-display text-[19px] font-semibold leading-[1.22] tracking-[-0.01em] text-ink">
          {entry.title}
        </span>
        <SubjectMark
          slug={entry.slug}
          className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent)] opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        />
      </span>
      <span className="mt-2.5 flex-1 text-[15px] leading-[1.45] text-ink-2">
        {entry.tagline}
      </span>
      <span className="mt-5 block text-xs text-ink-2">
        {entry.entryCount} entries · one page
      </span>
      <span className="mt-4 text-sm font-semibold text-[var(--accent-ink)]">
        Open reference
      </span>
    </Link>
  );
}

/* ---------------------------------- shelf ---------------------------------- */

export function SubjectShelf({ data }: { data: ShelfData }) {
  return (
    <div className="flex flex-col gap-[clamp(48px,7vh,72px)]">
      {data.featured.length > 0 && (
        <section aria-labelledby="shelf-featured">
          <h3
            id="shelf-featured"
            data-rise="0"
            className="mb-5 font-display text-[19px] font-semibold tracking-[-0.01em] text-ink"
          >
            Featured
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            {data.featured.map((book) => (
              <FeaturedTile key={book.slug} book={book} />
            ))}
          </div>
        </section>
      )}

      {data.sections.map((section) => (
        <section key={section.name} aria-labelledby={`shelf-${slugId(section.name)}`}>
          <h3
            id={`shelf-${slugId(section.name)}`}
            data-rise="0"
            className="mb-5 font-display text-[19px] font-semibold tracking-[-0.01em] text-ink"
          >
            {section.name}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(268px,1fr))] gap-4">
            {section.entries.map((entry) =>
              entry.kind === "book" ? (
                <BookCard key={entry.slug} book={entry} />
              ) : (
                <ReferenceCard key={entry.slug} entry={entry} />
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Track names are prose ("Context, Memory, and Retrieval"); ids are not. */
function slugId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
