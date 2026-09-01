"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { AskPanel } from "@/components/AskPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubjectShelf } from "@/components/SubjectShelf";
import type { ShelfData } from "@/lib/shelf";
import { lastReadOverall, useProgress } from "@/lib/progress";

/**
 * `/read` — the library.
 *
 * It used to redirect to the first slide of the only book, which stopped being
 * an answer the moment there was more than one subject. It now shows the same
 * shelf the landing page does, without the cinematics: this is the page you
 * come back to, so it opens on the content instead of on a scroll sequence.
 */
export function Library({ shelf }: { shelf: ShelfData }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const progress = useProgress();
  const lastRead = lastReadOverall(progress);
  const resumeTitle = lastRead
    ? shelf.sections
        .flatMap((s) => s.entries)
        .find((e) => e.slug === lastRead.bookSlug)?.title
    : undefined;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="glass-light sticky top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-6">
          <Link
            href="/"
            className="flex h-11 items-center font-display text-[17px] font-semibold tracking-[-0.2px] text-ink"
          >
            Agent YAP
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              title="Search (/)"
              className="flex h-11 cursor-pointer items-center px-2.5 text-xs text-ink-2 transition-colors hover:text-ink"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setAskOpen(true)}
              className="flex h-11 cursor-pointer items-center px-2.5 text-xs text-ink-2 transition-colors hover:text-ink"
            >
              Ask
            </button>
            <ThemeToggle className="ml-1 text-ink-2 hover:bg-canvas-2 hover:text-ink" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-5 pb-24 pt-12 sm:px-6 sm:pt-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
          Library
        </p>
        <h1 className="m-0 max-w-[820px] font-display text-[clamp(30px,4.4vw,44px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
          Every subject, in one place.
        </h1>
        <p className="mt-4 max-w-[620px] text-[17px] leading-[1.5] text-ink-2">
          {shelf.bookCount} subjects, {shelf.chapterCount} chapters,{" "}
          {shelf.slideCount} slides. Pick one up where you left it, or start
          somewhere new.
        </p>

        {lastRead && (
          <Link
            href={lastRead.href}
            className="mt-8 flex items-center justify-between gap-4 rounded-card border border-hairline bg-canvas-2 px-5 py-4 transition-colors hover:bg-canvas-3"
          >
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-ink-2">
                Continue where you left off
              </span>
              <span className="mt-1 block truncate font-display text-[17px] font-semibold text-ink">
                {resumeTitle ?? "Keep reading"}
              </span>
            </span>
            <span className="shrink-0 text-sm text-blue">Resume →</span>
          </Link>
        )}

        <div className="mt-[clamp(48px,7vh,72px)]">
          <SubjectShelf data={shelf} />
        </div>
      </main>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AskPanel open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
