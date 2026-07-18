"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { NavManifest, NavSlide } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import { setNavDirection } from "@/components/reader/nav-direction";
import { Rail } from "@/components/reader/Rail";
import { SearchPanel } from "@/components/SearchPanel";
import { AskPanel } from "@/components/AskPanel";
import { ThemeToggle } from "@/components/ThemeToggle";

const RAIL_PREF_KEY = "agent-yap:rail-open";

function isDesktop(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

/** True while the user is typing somewhere shortcuts must not fire. */
function isTypingTarget(el: Element | null): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el instanceof HTMLElement && el.isContentEditable)
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

  // null = "auto": open when docked on desktop, closed as a mobile overlay.
  const [railOpen, setRailOpen] = useState<boolean | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const railToggleRef = useRef<HTMLButtonElement>(null);
  const stageScrollRef = useRef<HTMLDivElement>(null);

  // Restore the remembered desktop rail preference after mount.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RAIL_PREF_KEY);
      if (stored !== null && isDesktop()) setRailOpen(stored === "1");
    } catch {
      // Storage unavailable — keep the auto behavior.
    }
  }, []);

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

  const anyModal = searchOpen || askOpen;

  const toggleRail = useCallback(() => {
    setRailOpen((v) => {
      const effective = v ?? isDesktop();
      const nextOpen = !effective;
      try {
        if (isDesktop()) {
          window.localStorage.setItem(RAIL_PREF_KEY, nextOpen ? "1" : "0");
        }
      } catch {
        // Preference just won't persist.
      }
      return nextOpen;
    });
  }, []);

  const closeRailOverlay = useCallback(() => {
    if (!isDesktop()) {
      setRailOpen(false);
      railToggleRef.current?.focus();
    }
  }, []);

  const go = useCallback(
    (target: NavSlide | undefined, dir: 1 | -1) => {
      if (!target) return;
      setNavDirection(dir);
      router.push(target.href);
    },
    [router],
  );

  // Reset the stage scroll position on every slide change.
  useEffect(() => {
    stageScrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.isComposing || isTypingTarget(document.activeElement)) return;

      if (e.key === "/" && !anyModal) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if ((e.key === "t" || e.key === "T") && !anyModal) {
        e.preventDefault();
        toggleRail();
        return;
      }
      // Modals and the mobile rail overlay own the remaining keys.
      if (anyModal || (railOpen === true && !isDesktop())) return;

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
  }, [next, prev, go, anyModal, railOpen, toggleRail]);

  // Touch swipe.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || anyModal || (railOpen === true && !isDesktop())) return;
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
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      {/* progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-canvas-2">
        <div
          className="h-0.5 bg-blue transition-[width] duration-[400ms] ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* top chrome */}
      <header className="glass-light z-40 h-[52px] shrink-0 border-b border-hairline">
        <div className="flex h-full items-center justify-between gap-4 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              ref={railToggleRef}
              type="button"
              onClick={toggleRail}
              title="Contents (t)"
              aria-label="Toggle contents"
              aria-expanded={railOpen ?? undefined}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-ink-2 transition-colors hover:bg-canvas-2 hover:text-ink"
            >
              <svg viewBox="0 0 20 20" aria-hidden className="h-[18px] w-[18px]">
                <rect
                  x="2.5"
                  y="3.5"
                  width="15"
                  height="13"
                  rx="2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1="7.5"
                  y1="3.5"
                  x2="7.5"
                  y2="16.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </button>
            <Link
              href="/"
              className="flex h-11 shrink-0 items-center font-display text-[17px] font-semibold tracking-[-0.2px] text-ink"
            >
              Agent YAP
            </Link>
          </div>

          <span className="hidden min-w-0 truncate text-xs text-ink-2 md:block">
            Chapter {current?.chapterNumber ?? 1} ·{" "}
            {chapterDisplayTitle(current?.chapterTitle ?? "")}
          </span>

          <div className="flex shrink-0 items-center gap-1">
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
            <span className="min-w-[56px] text-right text-xs tabular-nums text-ink-2">
              {pad(index + 1)} / {pad(total)}
            </span>
            <ThemeToggle className="ml-1 text-ink-2 hover:bg-canvas-2 hover:text-ink" />
          </div>
        </div>
      </header>

      {/* body: rail | stage */}
      <div className="relative flex min-h-0 flex-1">
        {/* mobile scrim */}
        {railOpen === true && (
          <div
            onClick={closeRailOverlay}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          aria-label="Contents rail"
          className={`glass-light fixed inset-y-0 left-0 z-50 overflow-hidden transition-transform duration-300 ease-out lg:static lg:z-auto lg:translate-x-0 lg:transition-[width] ${
            railOpen === true ? "translate-x-0" : "-translate-x-full"
          } ${
            railOpen === false
              ? "lg:w-0 lg:border-r-0"
              : "lg:w-[300px] lg:border-r lg:border-hairline"
          } border-r border-hairline`}
        >
          <Rail
            manifest={manifest}
            currentHref={pathname}
            mobileOpen={railOpen === true}
            onNavigate={closeRailOverlay}
            onClose={closeRailOverlay}
          />
        </aside>

        {/* slide stage */}
        <main
          className="relative min-w-0 flex-1"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div
            ref={stageScrollRef}
            className="h-full overflow-y-auto overflow-x-hidden"
          >
            {children}
          </div>

          {/* floating nav */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-5 pb-4 sm:px-7">
            <span className="hidden text-xs text-ink-2 sm:block">
              ← → arrow keys work too
            </span>
            <div className="pointer-events-auto flex gap-2.5">
              <button
                type="button"
                onClick={() => go(prev, -1)}
                disabled={!prev}
                aria-label="Previous slide"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill border border-hairline bg-canvas-2 text-[19px] text-ink shadow-sm transition-[opacity,transform] duration-300 hover:bg-canvas-3 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(next, 1)}
                disabled={!next}
                aria-label="Next slide"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-pill border border-hairline bg-canvas-2 text-[19px] text-ink shadow-sm transition-[opacity,transform] duration-300 hover:bg-canvas-3 active:scale-95 disabled:pointer-events-none disabled:opacity-35"
              >
                ›
              </button>
            </div>
          </div>
        </main>
      </div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AskPanel open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
