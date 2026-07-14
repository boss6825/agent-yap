"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { NavManifest, NavSlide } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import { setNavDirection } from "@/components/reader/nav-direction";
import { SearchPanel } from "@/components/SearchPanel";
import { AskPanel } from "@/components/AskPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

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

  const pad = (n: number) => String(n).padStart(2, "0");
  const progress = total > 0 ? ((index + 1) / total) * 100 : 100;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      {/* progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-canvas-2">
        <div
          className="h-0.5 bg-blue transition-[width] duration-[400ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* top chrome */}
      <header className="glass-light fixed inset-x-0 top-0.5 z-50 h-[52px]">
        <div className="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between gap-6 px-6">
          <Link
            href="/"
            className="flex h-11 items-center font-display text-[17px] font-semibold tracking-[-0.2px] text-ink"
          >
            Agent YAP
          </Link>
          <span className="hidden truncate text-xs text-ink-2 sm:block">
            {manifest.bookTitle} · Chapter {current?.chapterNumber ?? 1} ·{" "}
            {chapterDisplayTitle(current?.chapterTitle ?? "")}
          </span>
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
              title="Ask the docs"
              className="flex h-11 cursor-pointer items-center px-2.5 text-xs text-ink-2 transition-colors hover:text-ink"
            >
              Ask
            </button>
            <button
              type="button"
              onClick={() => setTocOpen(true)}
              title="Contents (t)"
              className="flex h-11 cursor-pointer items-center px-2.5 text-xs text-ink-2 transition-colors hover:text-ink"
            >
              Contents
            </button>
            <span className="min-w-[56px] text-right text-xs tabular-nums text-ink-2">
              {pad(index + 1)} / {pad(total)}
            </span>
            <ThemeToggle className="ml-1 text-ink-2 hover:bg-canvas-2 hover:text-ink" />
          </div>
        </div>
      </header>

      {/* slide stage */}
      <main
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </main>

      {/* bottom chrome */}
      <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-50 h-[92px] bg-[linear-gradient(to_top,var(--color-canvas)_60%,transparent)]">
        <div className="pointer-events-auto mx-auto flex h-[92px] max-w-[1200px] items-center justify-between px-6">
          <span className="text-xs text-ink-2">← → arrow keys work too</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => go(prev, -1)}
              disabled={!prev}
              aria-label="Previous slide"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill bg-canvas-2 text-[19px] text-ink transition-[opacity,transform] duration-300 hover:bg-canvas-3 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(next, 1)}
              disabled={!next}
              aria-label="Next slide"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill bg-canvas-2 text-[19px] text-ink transition-[opacity,transform] duration-300 hover:bg-canvas-3 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
            >
              ›
            </button>
          </div>
        </div>
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
        className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="glass-light fixed inset-y-0 right-0 z-[70] flex w-[min(420px,90vw)] flex-col border-l border-hairline"
      >
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
          <span className="font-display text-[17px] font-semibold text-ink">
            Contents
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contents"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-canvas-2 hover:text-ink"
          >
            ✕
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {manifest.chapters.map((c) => {
            const isCurrent = c.slug === currentChapter;
            return (
              <div key={c.slug} className="mb-1">
                <Link
                  href={c.slides[0].href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-canvas-2 ${
                    isCurrent ? "bg-canvas-2" : ""
                  }`}
                >
                  <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-ink-2">
                    {String(c.number).padStart(2, "0")}
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    {chapterDisplayTitle(c.title)}
                  </span>
                </Link>
                {isCurrent && (
                  <ul className="mb-2 ml-[26px] mt-1 border-l border-hairline pl-3">
                    {c.slides.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          onClick={onClose}
                          className={`block rounded-lg px-2 py-1 text-sm transition-colors ${
                            s.href === currentHref
                              ? "font-semibold text-blue"
                              : "text-ink-2 hover:text-ink"
                          }`}
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
