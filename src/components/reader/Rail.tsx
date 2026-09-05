"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { NavManifest } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import {
  ChapterRing,
  ChevronDownGlyph,
  ChevronRightGlyph,
  SlideCheck,
} from "@/components/reader/chrome/SystemReaderChrome";

export function Rail({
  manifest,
  currentHref,
  mobileOpen,
  onNavigate,
  onClose,
  readHrefs,
}: {
  manifest: NavManifest;
  currentHref: string;
  mobileOpen: boolean;
  onNavigate: () => void;
  onClose: () => void;
  readHrefs?: ReadonlySet<string>;
}) {
  const currentChapter = useMemo(
    () => manifest.slides.find((s) => s.href === currentHref)?.chapterSlug,
    [manifest, currentHref],
  );

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(currentChapter ? [currentChapter] : []),
  );

  const [lastChapter, setLastChapter] = useState(currentChapter);
  if (currentChapter !== lastChapter) {
    setLastChapter(currentChapter);
    if (currentChapter && !expanded.has(currentChapter)) {
      const next = new Set(expanded);
      next.add(currentChapter);
      setExpanded(next);
    }
  }

  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [currentHref]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

  const chapterCount = manifest.chapters.length;
  const titleLines = wrapBookTitle(manifest.bookTitle);

  return (
    <div className="reader-sidebar" style={{ width: "100%" }}>
      <div className="reader-sidebar-head">
        <div className="flex items-start justify-between gap-2">
          <div className="reader-book-title">
            {titleLines.map((line, i) => (
              <span key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close contents"
            className="reader-icon-btn lg:hidden"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path
                d="M2 2l8 8M10 2 2 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="reader-book-meta">
          {chapterCount} CHAPTERS · {manifest.total} SLIDES
        </div>
      </div>

      <nav aria-label="Book contents" className="reader-toc">
        {manifest.chapters.map((c) => {
          const isOpen = expanded.has(c.slug);
          const readCount = readHrefs
            ? c.slides.reduce((n, s) => n + (readHrefs.has(s.href) ? 1 : 0), 0)
            : 0;
          const total = c.slides.length;
          const num = String(c.number).padStart(2, "0");

          return (
            <div key={c.slug} className="toc-chapter">
              <button
                type="button"
                onClick={() => toggleChapter(c.slug)}
                aria-expanded={isOpen}
                className={
                  isOpen
                    ? "toc-chapter-row toc-chapter-row--open"
                    : "toc-chapter-row"
                }
              >
                {isOpen ? <ChevronDownGlyph /> : <ChevronRightGlyph />}
                <span className="toc-chapter-num">{num}</span>
                <span className="toc-chapter-title">
                  {chapterDisplayTitle(c.title)}
                </span>
                <span className="toc-meter">
                  {readHrefs && readCount > 0 ? (
                    <>
                      <span className="toc-meter-count">
                        {readCount}/{total}
                      </span>
                      <ChapterRing frac={readCount / total} />
                    </>
                  ) : (
                    <span className="toc-meter-count toc-meter-count--faint">
                      {total}
                    </span>
                  )}
                </span>
              </button>

              {isOpen ? (
                <div className="toc-slides">
                  {c.slides.map((s) => {
                    const active = s.href === currentHref;
                    const read = readHrefs?.has(s.href) ?? false;
                    const rowClass = [
                      "toc-slide",
                      active ? "toc-slide--current" : "",
                      !read && !active ? "toc-slide--unseen" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={onNavigate}
                        ref={active ? activeRef : undefined}
                        aria-current={active ? "page" : undefined}
                        className={rowClass}
                      >
                        <span className="toc-mark">
                          {read || active ? (
                            <SlideCheck faded={read && !active} />
                          ) : (
                            <span className="toc-dot" />
                          )}
                        </span>
                        <span className="toc-slide-label">
                          {s.sectionIndex === 0 ? "Overview" : s.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

/** Prefer a two-line book title near the Paper break ("… System / Design …"). */
function wrapBookTitle(title: string): string[] {
  const amp = title.replace(/\band\b/i, "&");
  const idx = amp.indexOf("System");
  if (idx > 0 && amp.length > 28) {
    const cut = amp.lastIndexOf(" ", idx + "System".length);
    if (cut > 8) {
      return [amp.slice(0, cut), amp.slice(cut + 1)];
    }
  }
  return [amp];
}
