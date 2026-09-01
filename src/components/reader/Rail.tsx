"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { NavManifest, NavSlide } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import { getChapterArt } from "@/lib/art";
import { SubjectMark } from "@/components/SubjectMark";
import type { ReaderBook } from "@/lib/shelf";
import { lastReadInBook, useProgress } from "@/lib/progress";

/**
 * Left contents rail — the IDE-style file tree of the reader.
 * Chapters expand to slide lists; the current chapter stays expanded.
 * Progress decoration (checks / rings) hooks in via the optional props
 * so the tree renders fine before any progress exists.
 *
 * The header doubles as the subject switcher. With six books on the site,
 * "which book am I in" and "take me to another one" are the same question, and
 * answering it here means never leaving the reader to change subject. Each row
 * links to that book's own resume point rather than its first slide, so
 * switching away and back is lossless.
 */
export function Rail({
  manifest,
  currentHref,
  mobileOpen,
  onNavigate,
  onClose,
  readHrefs,
  subjects,
}: {
  manifest: NavManifest;
  currentHref: string;
  /** True while the rail is showing as a mobile overlay (drives focus). */
  mobileOpen: boolean;
  /** Called after a slide link is clicked (shell closes the mobile overlay). */
  onNavigate: () => void;
  /** Called on Escape / the mobile close button. */
  onClose: () => void;
  /** Hrefs the reader has already seen (slice 2 wires this up). */
  readHrefs?: ReadonlySet<string>;
  /** Every book on the site, in shelf order, for the subject switcher. */
  subjects: ReaderBook[];
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const progress = useProgress();
  const currentChapter = useMemo(
    () => manifest.slides.find((s) => s.href === currentHref)?.chapterSlug,
    [manifest, currentHref],
  );

  // Chapters carry a `[start, count)` range into `manifest.slides` instead of
  // their own copy of the slide objects, so resolve the ranges once per
  // manifest rather than on every navigation re-render.
  const slidesByChapter = useMemo(() => {
    const byChapter = new Map<string, NavSlide[]>();
    for (const c of manifest.chapters) {
      byChapter.set(c.slug, manifest.slides.slice(c.start, c.start + c.count));
    }
    return byChapter;
  }, [manifest]);

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(currentChapter ? [currentChapter] : []),
  );

  // Keep the chapter being read expanded as the reader pages across chapters.
  // State is adjusted during render (React's documented previous-render
  // pattern) instead of in an effect.
  const [lastChapter, setLastChapter] = useState(currentChapter);
  if (currentChapter !== lastChapter) {
    setLastChapter(currentChapter);
    if (currentChapter && !expanded.has(currentChapter)) {
      const next = new Set(expanded);
      next.add(currentChapter);
      setExpanded(next);
    }
  }

  // Keep the active slide visible as navigation moves it out of view.
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentHref]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // The switcher is the innermost layer, so it unwinds first: Escape
      // should not close the whole rail out from under someone who only
      // opened the subject list.
      if (switcherOpen) setSwitcherOpen(false);
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, switcherOpen]);

  // When opened as a mobile overlay, move focus into the rail (a11y);
  // the shell restores focus to the toggle button on close.
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (mobileOpen && !window.matchMedia("(min-width: 1024px)").matches) {
      closeRef.current?.focus();
    }
  }, [mobileOpen]);

  const toggleChapter = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const art = currentChapter ? getChapterArt(currentChapter) : undefined;

  return (
    <div className="relative flex h-full w-[min(320px,85vw)] flex-col lg:w-[300px]">
      {/* Chapter art fills the whole rail; the scrim keeps the tree readable
          in both themes while letting the artwork show through. */}
      {art && (
        <div aria-hidden className="absolute inset-0">
          <Image
            key={art.file}
            src={art.file}
            alt=""
            fill
            sizes="320px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-canvas/70" />
        </div>
      )}

      <div className="relative border-b border-hairline">
        <div className="flex items-center gap-1.5 px-2.5 py-3">
          <button
            type="button"
            onClick={() => setSwitcherOpen((v) => !v)}
            aria-expanded={switcherOpen}
            aria-controls="rail-subjects"
            title="Switch subject"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-canvas-2/80"
          >
            <SubjectMark
              slug={manifest.bookSlug}
              className="h-[18px] w-[18px] shrink-0 text-ink-2"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[15px] font-semibold text-ink">
                {manifest.bookTitle}
              </span>
              <span className="block text-xs text-ink-2">
                {manifest.chapters.length} chapters · {manifest.total} slides
              </span>
            </span>
            <svg
              viewBox="0 0 12 12"
              aria-hidden
              className={`h-3 w-3 shrink-0 text-ink-2 transition-transform duration-200 ${
                switcherOpen ? "rotate-180" : ""
              }`}
            >
              <path
                d="M2.5 4.5 6 8l3.5-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close contents"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-canvas-2 hover:text-ink lg:hidden"
          >
            ✕
          </button>
        </div>

        {switcherOpen && (
          <div
            id="rail-subjects"
            className="scrollbar-thin max-h-[46vh] overflow-y-auto border-t border-hairline px-2.5 py-2"
          >
            <ul>
              {subjects.map((subject) => {
                const resume = lastReadInBook(progress, subject.slug);
                const current = subject.slug === manifest.bookSlug;
                return (
                  <li key={subject.slug}>
                    <Link
                      href={resume?.href ?? subject.href}
                      onClick={() => {
                        setSwitcherOpen(false);
                        onNavigate();
                      }}
                      aria-current={current ? "true" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                        current
                          ? "bg-blue/10 font-semibold text-blue"
                          : "text-ink-2 hover:bg-canvas-2/70 hover:text-ink"
                      }`}
                    >
                      <SubjectMark
                        slug={subject.slug}
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {subject.title}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-ink-2">
                        {resume ? "resume" : subject.slideCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href="/read"
              onClick={() => setSwitcherOpen(false)}
              className="mt-1 flex items-center gap-2.5 rounded-lg border-t border-hairline px-2.5 py-2 pt-2.5 text-[13px] text-blue transition-colors hover:bg-canvas-2/70"
            >
              All subjects
            </Link>
          </div>
        )}
      </div>

      <nav
        aria-label="Book contents"
        className="scrollbar-thin relative flex-1 overflow-y-auto px-2.5 py-3"
      >
        {manifest.chapters.map((c) => {
          const slides = slidesByChapter.get(c.slug) ?? [];
          const isOpen = expanded.has(c.slug);
          const isCurrent = c.slug === currentChapter;
          const readCount = readHrefs
            ? slides.reduce((n, s) => n + (readHrefs.has(s.href) ? 1 : 0), 0)
            : 0;
          const done = readHrefs ? readCount === c.count : false;

          return (
            <div key={c.slug} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggleChapter(c.slug)}
                aria-expanded={isOpen}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-canvas-2/80 ${
                  isCurrent ? "bg-canvas-2/80" : ""
                }`}
              >
                <svg
                  viewBox="0 0 12 12"
                  aria-hidden
                  className={`h-3 w-3 shrink-0 text-ink-2 transition-transform duration-200 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                >
                  <path
                    d="M4 2.5 8 6l-4 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="w-5 shrink-0 text-right text-[11px] font-semibold tabular-nums text-ink-2">
                  {String(c.number).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-ink">
                  {chapterDisplayTitle(c.title)}
                </span>
                {readHrefs && (
                  <ChapterMeter
                    read={readCount}
                    total={c.count}
                    done={done}
                  />
                )}
              </button>

              {isOpen && (
                <ul className="ml-[30px] mt-0.5 border-l border-hairline pb-1.5 pl-2.5">
                  {slides.map((s) => {
                    const active = s.href === currentHref;
                    const read = readHrefs?.has(s.href) ?? false;
                    return (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          onClick={onNavigate}
                          ref={active ? activeRef : undefined}
                          aria-current={active ? "page" : undefined}
                          className={`group flex items-center gap-2 rounded-lg px-2 py-[5px] text-[13px] leading-snug transition-colors ${
                            active
                              ? "bg-blue/10 font-semibold text-blue"
                              : "text-ink-2 hover:bg-canvas-2/70 hover:text-ink"
                          }`}
                        >
                          <ReadMark read={read} active={active} />
                          <span className="min-w-0 flex-1 truncate">
                            {s.sectionIndex === 0 ? "Overview" : s.title}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/** Small check / dot marker in front of every slide row. */
function ReadMark({ read, active }: { read: boolean; active: boolean }) {
  if (read) {
    return (
      <svg
        viewBox="0 0 12 12"
        aria-hidden
        className={`h-3 w-3 shrink-0 ${active ? "text-blue" : "text-blue/70"}`}
      >
        <path
          d="M2.5 6.5 5 9l4.5-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <span
      aria-hidden
      className={`h-[5px] w-[5px] shrink-0 rounded-pill ${
        active ? "bg-blue" : "bg-ink-2/40 group-hover:bg-ink-2"
      }`}
    />
  );
}

/** Per-chapter completion: tiny ring + count, quiet until something is read. */
function ChapterMeter({
  read,
  total,
  done,
}: {
  read: number;
  total: number;
  done: boolean;
}) {
  if (read === 0) {
    return (
      <span className="shrink-0 text-[10px] tabular-nums text-ink-2/70">
        {total}
      </span>
    );
  }
  const r = 5;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, read / total);
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className="text-[10px] tabular-nums text-ink-2">
        {read}/{total}
      </span>
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 -rotate-90" aria-hidden>
        <circle
          cx="7"
          cy="7"
          r={r}
          fill="none"
          stroke="var(--color-hairline)"
          strokeWidth="2"
        />
        <circle
          cx="7"
          cy="7"
          r={r}
          fill="none"
          stroke="var(--color-blue)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          className="transition-[stroke-dasharray] duration-500"
        />
        {done && (
          <circle cx="7" cy="7" r="2" fill="var(--color-blue)" />
        )}
      </svg>
    </span>
  );
}
