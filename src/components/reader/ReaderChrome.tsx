"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { NavManifest, NavSlide } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import { setNavDirection } from "@/components/reader/nav-direction";
import { AmbientBackdrop } from "@/components/reader/AmbientBackdrop";
import { ChatPanel } from "@/components/reader/ChatPanel";
import { Rail } from "@/components/reader/Rail";
import type { ReaderBook } from "@/lib/shelf";
import { ResumePill } from "@/components/reader/ResumePill";
import { SearchPanel } from "@/components/SearchPanel";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  getLastRead,
  getLastReadOverall,
  markSlideRead,
  useProgress,
} from "@/lib/progress";

const RAIL_PREF_KEY = "agent-yap:rail-open";

/** Browsers leave a couple of lines on screen when they page down; so do we. */
const PAGE_SCROLL_RATIO = 0.9;

/**
 * What the resume pill should offer: this book's own saved position, or — when
 * this book has none — the book the reader was actually last in.
 */
type ResumeSuggestion =
  | { kind: "in-book"; href: string }
  | { kind: "cross-book"; href: string; bookTitle: string };

function isDesktop(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

/** The stored rail preference never notifies — reads happen on re-render. */
function noopSubscribe(): () => void {
  return () => {};
}

/** Desktop-only preference; mobile always starts with the rail closed. */
function readStoredRailPref(): "0" | "1" | null {
  try {
    if (!isDesktop()) return null;
    const stored = window.localStorage.getItem(RAIL_PREF_KEY);
    return stored === "0" || stored === "1" ? stored : null;
  } catch {
    return null;
  }
}

function getServerRailPref(): null {
  return null;
}

/**
 * Whether the rail is docked rather than an overlay. The `lg:` breakpoint in
 * the rail's own classes is the source of truth; this mirrors it in JS because
 * `inert` cannot be expressed in CSS.
 */
const DOCKED_QUERY = "(min-width: 1024px)";

function subscribeDocked(onChange: () => void): () => void {
  const mq = window.matchMedia(DOCKED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getDockedSnapshot(): boolean {
  return window.matchMedia(DOCKED_QUERY).matches;
}

/**
 * The server has no viewport. Returning `false` makes the first paint agree
 * with the mobile-first CSS (rail off-screen), so `inert` is correct in the
 * SSR HTML and does not flip during hydration.
 */
function getServerDocked(): boolean {
  return false;
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
  books = [],
  children,
}: {
  manifest: NavManifest;
  /** Every book on the site, in shelf order. Names a resume target that lives
   *  outside `manifest`, and fills the rail's subject switcher. Optional so the
   *  chrome still renders without it; the cross-book pill simply stays silent
   *  and the switcher lists only the current book. */
  books?: ReaderBook[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // null = "auto": open when docked on desktop, closed as a mobile overlay.
  const [railOpen, setRailOpen] = useState<boolean | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const railToggleRef = useRef<HTMLButtonElement>(null);
  const stageScrollRef = useRef<HTMLDivElement>(null);

  // Explicit toggles win; otherwise the stored desktop preference applies;
  // otherwise "auto" (CSS: open when docked on desktop, closed on mobile).
  const storedRailPref = useSyncExternalStore(
    noopSubscribe,
    readStoredRailPref,
    getServerRailPref,
  );
  const railState =
    railOpen ?? (storedRailPref === null ? null : storedRailPref === "1");

  const isDocked = useSyncExternalStore(
    subscribeDocked,
    getDockedSnapshot,
    getServerDocked,
  );

  // What the CSS actually paints: docked desktop shows the rail unless it was
  // explicitly closed; below `lg` it shows only when explicitly opened. `null`
  // is the "auto" case, which is why this cannot be `railState === true`.
  const railVisible = isDocked ? railState !== false : railState === true;

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

  // Reading progress (localStorage; undefined until mounted — neutral SSR HTML).
  const progress = useProgress();
  const readHrefs = useMemo(() => {
    if (!progress) return undefined;
    return new Set(Object.keys(progress.read[manifest.bookSlug] ?? {}));
  }, [progress, manifest.bookSlug]);

  // Mark the slide read after a short dwell (idempotent; StrictMode-safe).
  useEffect(() => {
    if (!current) return;
    const href = current.href;
    const id = setTimeout(() => markSlideRead(manifest.bookSlug, href), 1200);
    return () => clearTimeout(id);
  }, [current, manifest.bookSlug]);

  // Resume pointer captured once on mount, before dwell-marking moves it;
  // cleared as soon as the reader navigates anywhere (they're oriented).
  // The pointer is per book now, so this book's href is always resolvable
  // against this book's manifest. When the reader has never read this book but
  // has a position elsewhere, offer that book instead of silently rendering
  // nothing (SOL-13 / audit §3.9).
  const [resume, setResume] = useState<ResumeSuggestion | null>(null);
  const initialPath = useRef(pathname);
  // Props arrive fresh from the server on every render; snapshot what the
  // one-shot lookup needs so the effect below genuinely runs once.
  const resumeInputs = useRef({ bookSlug: manifest.bookSlug, books });
  useEffect(() => {
    const { bookSlug, books: shelf } = resumeInputs.current;
    const inBook = getLastRead(bookSlug);
    if (inBook) {
      if (inBook.href !== initialPath.current) {
        setResume({ kind: "in-book", href: inBook.href });
      }
      return;
    }
    const elsewhere = getLastReadOverall();
    if (!elsewhere || elsewhere.bookSlug === bookSlug) return;
    const book = shelf.find((b) => b.slug === elsewhere.bookSlug);
    if (book) {
      setResume({ kind: "cross-book", href: elsewhere.href, bookTitle: book.title });
    }
  }, []);
  useEffect(() => {
    if (pathname !== initialPath.current) setResume(null);
  }, [pathname]);

  const resumePill = useMemo(() => {
    // Same product rule as before: only on the first slide of a book.
    if (!resume || current?.globalIndex !== 0 || resume.href === pathname) {
      return null;
    }
    if (resume.kind === "cross-book") {
      return {
        href: resume.href,
        lead: "You were last reading",
        destination: resume.bookTitle,
      };
    }
    const slide = byHref.get(resume.href);
    // A pointer this book's manifest no longer knows (renamed chapter, edited
    // content): stay silent rather than link the reader into a 404.
    if (!slide) return null;
    return {
      href: slide.href,
      lead: "Continue where you left off",
      destination:
        slide.sectionIndex === 0
          ? chapterDisplayTitle(slide.chapterTitle)
          : slide.title,
    };
  }, [resume, current, pathname, byHref]);

  const anyModal = searchOpen;

  const toggleRail = useCallback(() => {
    const effective = railState ?? isDesktop();
    const nextOpen = !effective;
    try {
      if (isDesktop()) {
        window.localStorage.setItem(RAIL_PREF_KEY, nextOpen ? "1" : "0");
      }
    } catch {
      // Preference just won't persist.
    }
    setRailOpen(nextOpen);
  }, [railState]);

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
      // Modals and mobile overlays own the remaining keys.
      if (anyModal || ((railState === true || chatOpen) && !isDesktop())) return;

      // Space is page-down, never next-slide. Whatever holds focus — a Review
      // disclosure, a nav button, the scrollable diagram box — owns its own
      // Space, so step in only when focus is nowhere: the stage is an inner
      // overflow container, and the browser will not page one that neither
      // holds focus nor contains it.
      if (e.key === " ") {
        const stage = stageScrollRef.current;
        const active = document.activeElement;
        const focusIsNowhere =
          !active ||
          active === document.body ||
          active === document.documentElement;
        if (stage && focusIsNowhere) {
          e.preventDefault();
          const page = stage.clientHeight * PAGE_SCROLL_RATIO;
          stage.scrollBy({ top: e.shiftKey ? -page : page });
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(next, 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(prev, -1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, anyModal, railState, chatOpen, toggleRail]);

  // Touch swipe.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (
      !touch.current ||
      anyModal ||
      ((railState === true || chatOpen) && !isDesktop())
    )
      return;
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
  const progressPct = total > 0 ? ((index + 1) / total) * 100 : 100;

  return (
    <div className="flex h-dvh flex-col bg-canvas text-ink">
      {/* progress bar */}
      <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-canvas-2">
        <div
          className="h-0.5 bg-blue transition-[width] duration-[400ms] ease-out"
          style={{ width: `${progressPct}%` }}
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
              aria-expanded={railState ?? undefined}
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
              onClick={() => setChatOpen((v) => !v)}
              title="Chat with this page"
              aria-expanded={chatOpen}
              className={`flex h-11 cursor-pointer items-center px-2.5 text-xs transition-colors hover:text-ink ${
                chatOpen ? "text-ink" : "text-ink-2"
              }`}
            >
              Chat
            </button>
            <span className="min-w-[56px] text-right text-xs tabular-nums text-ink-2">
              {pad(index + 1)} / {pad(total)}
            </span>
            <ThemeToggle className="ml-1 text-ink-2 hover:bg-canvas-2 hover:text-ink" />
          </div>
        </div>
      </header>

      {/* body: rail | stage over the ambient shader layer */}
      <div className="relative flex min-h-0 flex-1">
        <AmbientBackdrop />

        {/* mobile scrim */}
        {railState === true && (
          <div
            onClick={closeRailOverlay}
            aria-hidden
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          aria-label="Contents rail"
          // Translated off-screen rather than unmounted, so without `inert` Tab
          // walks the entire chapter tree and the subject switcher while none
          // of it is visible.
          inert={!railVisible}
          className={`glass-light fixed inset-y-0 left-0 z-50 overflow-hidden transition-transform duration-300 ease-out lg:relative lg:z-10 lg:translate-x-0 lg:transition-[width] ${
            railState === true ? "translate-x-0" : "-translate-x-full"
          } ${
            railState === false
              ? "lg:w-0 lg:border-r-0"
              : "lg:w-[300px] lg:border-r lg:border-hairline"
          } border-r border-hairline`}
        >
          <Rail
            manifest={manifest}
            currentHref={pathname}
            mobileOpen={railState === true}
            onNavigate={closeRailOverlay}
            onClose={closeRailOverlay}
            readHrefs={readHrefs}
            subjects={books}
          />
        </aside>

        {/* slide stage: a glass card over the shader */}
        <main
          className="relative z-10 min-w-0 flex-1 p-2.5 sm:p-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="glass-card relative h-full overflow-hidden rounded-[24px] border border-hairline">
            <div
              ref={stageScrollRef}
              className="h-full overflow-y-auto overflow-x-hidden"
            >
              {children}
            </div>

            {resumePill && (
              <ResumePill
                href={resumePill.href}
                lead={resumePill.lead}
                destination={resumePill.destination}
              />
            )}

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
          </div>
        </main>

        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
