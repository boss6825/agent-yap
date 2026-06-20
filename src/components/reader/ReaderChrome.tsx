"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { NavManifest, NavSlide } from "@/lib/content";
import { chapterAccent } from "@/lib/chapter-color";
import { setNavDirection } from "@/components/reader/nav-direction";
import { Wordmark } from "@/components/Wordmark";
import { SearchPanel } from "@/components/SearchPanel";
import { AskPanel } from "@/components/AskPanel";

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconButton({
  label,
  onClick,
  children,
  hint,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={hint ? `${label} (${hint})` : label}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-ink-2/70 px-3 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-paper"
    >
      {children}
    </button>
  );
}

export function ReaderChrome({
  manifest,
  children,
}: {
  manifest: NavManifest;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tocOpen, setTocOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  const byHref = useMemo(() => {
    const m = new Map<string, NavSlide>();
    for (const s of manifest.slides) m.set(s.href, s);
    return m;
  }, [manifest]);

  const current = byHref.get(pathname);
  const index = current?.globalIndex ?? 0;
  const total = manifest.total;
  const prev = manifest.slides[index - 1];
  const next = manifest.slides[index + 1];
  const accent = chapterAccent(current?.chapterNumber ?? 1);

  const anyOverlay = tocOpen || searchOpen || askOpen;

  const go = useCallback(
    (target: NavSlide | undefined, dir: 1 | -1) => {
      if (!target) return;
      setNavDirection(dir);
      router.push(target.href);
    },
    [router],
  );

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
      if (typing) return;

      if (e.key === "/" && !anyOverlay) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if ((e.key === "t" || e.key === "T") && !anyOverlay) {
        e.preventDefault();
        setTocOpen((v) => !v);
        return;
      }
      if (anyOverlay) return; // overlays handle their own keys / Escape

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(next, 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(prev, -1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, anyOverlay]);

  // Touch swipe.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || anyOverlay) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) go(next, 1);
      else go(prev, -1);
    }
    touch.current = null;
  };

  const progress = total > 1 ? ((index + 1) / total) * 100 : 100;

  return (
    <div
      className="flex min-h-dvh flex-col bg-ink"
      style={{ ["--accent" as string]: accent.hex }}
    >
      {/* progress rail */}
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-ink-2">
        <div
          className="h-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* top bar */}
      <header className="fixed inset-x-0 top-1 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Wordmark size="sm" />

        <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
          <span
            className="grid h-6 min-w-6 place-items-center rounded-md px-1 font-display text-xs font-bold"
            style={{ background: accent.hex, color: accent.on }}
          >
            {current?.chapterNumber ?? 1}
          </span>
          <span className="truncate text-muted">{current?.chapterTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton label="Search" hint="/" onClick={() => setSearchOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="hidden md:inline">Search</span>
          </IconButton>
          <IconButton label="Ask the docs" onClick={() => setAskOpen(true)}>
            <span aria-hidden>✦</span>
            <span className="hidden md:inline">Ask</span>
          </IconButton>
          <IconButton label="Contents" hint="t" onClick={() => setTocOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="hidden md:inline">Contents</span>
          </IconButton>
        </div>
      </header>

      {/* slide stage (scrolls vertically; the slide template centers content) */}
      <main
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </main>

      {/* side arrows (desktop) */}
      <button
        type="button"
        onClick={() => go(prev, -1)}
        disabled={!prev}
        aria-label="Previous slide"
        className="group fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-2/70 p-3 text-muted backdrop-blur transition-all hover:border-accent hover:text-paper disabled:pointer-events-none disabled:opacity-25 lg:grid"
      >
        <Chevron dir="left" />
      </button>
      <button
        type="button"
        onClick={() => go(next, 1)}
        disabled={!next}
        aria-label="Next slide"
        className="group fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 place-items-center rounded-full border border-line bg-ink-2/70 p-3 text-muted backdrop-blur transition-all hover:border-accent hover:text-paper disabled:pointer-events-none disabled:opacity-25 lg:grid"
      >
        <Chevron dir="right" />
      </button>

      {/* bottom control bar */}
      <footer className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-line bg-ink/85 px-4 py-3 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={() => go(prev, -1)}
          disabled={!prev}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-paper disabled:opacity-25"
        >
          <Chevron dir="left" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-3 font-mono text-xs text-faint">
          <span className="tabular-nums text-muted">
            {String(index + 1).padStart(2, "0")}
            <span className="text-faint"> / {total}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => go(next, 1)}
          disabled={!next}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-paper transition-colors hover:text-accent disabled:opacity-25"
        >
          <span className="hidden sm:inline">{next ? "Next" : "End"}</span>
          <Chevron dir="right" />
        </button>
      </footer>

      {/* contents drawer */}
      <AnimatePresence>
        {tocOpen && (
          <TableOfContents
            manifest={manifest}
            currentHref={pathname}
            onClose={() => setTocOpen(false)}
          />
        )}
      </AnimatePresence>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AskPanel open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}

function TableOfContents({
  manifest,
  currentHref,
  onClose,
}: {
  manifest: NavManifest;
  currentHref: string;
  onClose: () => void;
}) {
  const currentChapter = manifest.slides.find(
    (s) => s.href === currentHref,
  )?.chapterSlug;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed inset-y-0 right-0 z-50 flex w-[min(420px,90vw)] flex-col border-l border-line bg-ink-2"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="font-display text-lg font-bold">Contents</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contents"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-ink-3 hover:text-paper"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {manifest.chapters.map((c) => {
            const accent = chapterAccent(c.number);
            const isCurrent = c.slug === currentChapter;
            return (
              <div key={c.slug} className="mb-1">
                <Link
                  href={c.slides[0].href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-ink-3 ${
                    isCurrent ? "bg-ink-3" : ""
                  }`}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-md font-display text-xs font-bold"
                    style={{ background: accent.hex, color: accent.on }}
                  >
                    {c.number}
                  </span>
                  <span className="font-display text-sm font-semibold text-paper">
                    {c.title}
                  </span>
                </Link>
                {isCurrent && (
                  <ul className="mb-2 ml-7 mt-1 border-l border-line pl-3">
                    {c.slides.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          onClick={onClose}
                          className={`block rounded-md px-2 py-1 text-sm transition-colors hover:text-paper ${
                            s.href === currentHref
                              ? "font-semibold text-accent"
                              : "text-muted"
                          }`}
                          style={
                            s.href === currentHref
                              ? ({ ["--accent" as string]: accent.hex } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {s.sectionIndex === 0 ? "Overview" : s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </motion.aside>
    </>
  );
}
