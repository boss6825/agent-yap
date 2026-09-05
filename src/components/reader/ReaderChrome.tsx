"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { NavManifest, NavSlide } from "@/lib/content";
import { chapterDisplayTitle } from "@/lib/display";
import { setNavDirection } from "@/components/reader/nav-direction";
import { ChatPanel } from "@/components/reader/ChatPanel";
import { Rail } from "@/components/reader/Rail";
import { ResumePill } from "@/components/reader/ResumePill";
import {
  SystemFooter,
  SystemProgressTrack,
  SystemTopBar,
} from "@/components/reader/chrome/SystemReaderChrome";
import {
  ReaderThemeCycleButton,
  useReaderTheme,
} from "@/components/reader/theme/ReaderThemeProvider";
import { familyForTheme } from "@/components/reader/theme/theme-types";
import { SearchPanel } from "@/components/SearchPanel";
import { getLastRead, markSlideRead, useProgress } from "@/lib/progress";

const RAIL_PREF_KEY = "agent-yap:rail-open";

function isDesktop(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches
  );
}

function noopSubscribe(): () => void {
  return () => {};
}

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
  const { theme } = useReaderTheme();

  const [railOpen, setRailOpen] = useState<boolean | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const railToggleRef = useRef<HTMLButtonElement>(null);
  const stageScrollRef = useRef<HTMLDivElement>(null);

  const storedRailPref = useSyncExternalStore(
    noopSubscribe,
    readStoredRailPref,
    getServerRailPref,
  );
  const railState =
    railOpen ?? (storedRailPref === null ? null : storedRailPref === "1");

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
  const currentChapter = useMemo(
    () =>
      manifest.chapters.find((c) => c.slug === current?.chapterSlug) ??
      manifest.chapters[0],
    [manifest, current],
  );

  const progress = useProgress();
  const readHrefs = useMemo(() => {
    if (!progress) return undefined;
    return new Set(Object.keys(progress.read[manifest.bookSlug] ?? {}));
  }, [progress, manifest.bookSlug]);

  useEffect(() => {
    if (!current) return;
    const href = current.href;
    const id = setTimeout(() => markSlideRead(manifest.bookSlug, href), 1200);
    return () => clearTimeout(id);
  }, [current, manifest.bookSlug]);

  const [resumeHref, setResumeHref] = useState<string | null>(null);
  const initialPath = useRef(pathname);
  useEffect(() => {
    const last = getLastRead();
    if (last && last.href !== initialPath.current) setResumeHref(last.href);
  }, []);
  useEffect(() => {
    if (pathname !== initialPath.current) setResumeHref(null);
  }, [pathname]);
  const resumeTarget =
    resumeHref && current?.globalIndex === 0 && resumeHref !== pathname
      ? byHref.get(resumeHref)
      : undefined;

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

  useEffect(() => {
    stageScrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

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
      if (anyModal || ((railState === true || chatOpen) && !isDesktop())) return;

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
  }, [next, prev, go, anyModal, railState, chatOpen, toggleRail]);

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
  const chapterTitle = chapterDisplayTitle(current?.chapterTitle ?? "");
  const desktopOpen = railState !== false;
  const mobileOpen = railState === true;

  return (
    <div
      className="sys-reader"
      data-reader-theme={theme}
      data-reader-family={familyForTheme(theme)}
    >
      <a href="#reader-stage" className="sys-reader__skip">
        Skip to slide
      </a>
      <SystemProgressTrack percent={progressPct} />
      <SystemTopBar
        railToggleRef={railToggleRef}
        railExpanded={railState ?? undefined}
        onToggleRail={toggleRail}
        chapterLabel={`Chapter ${current?.chapterNumber ?? 1} · ${chapterTitle}`}
        indexLabel={pad(index + 1)}
        totalLabel={pad(total)}
        chatOpen={chatOpen}
        onSearch={() => setSearchOpen(true)}
        onChat={() => setChatOpen((v) => !v)}
        themeControl={<ReaderThemeCycleButton />}
      />

      <div className="sys-reader__body">
        {mobileOpen ? (
          <div
            className="sys-reader__scrim lg:hidden"
            onClick={closeRailOverlay}
            aria-hidden
          />
        ) : null}

        <aside
          aria-label="Contents rail"
          className={[
            "sys-reader__sidebar-slot",
            desktopOpen ? "" : "sys-reader__sidebar-slot--closed",
            "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[min(300px,85vw)]",
            mobileOpen
              ? "sys-reader__sidebar-slot--overlay max-lg:translate-x-0"
              : "max-lg:-translate-x-full",
          ].join(" ")}
        >
          <Rail
            manifest={manifest}
            currentHref={pathname}
            mobileOpen={mobileOpen}
            onNavigate={closeRailOverlay}
            onClose={closeRailOverlay}
            readHrefs={readHrefs}
          />
        </aside>

        <main
          id="reader-stage"
          className="sys-reader__stage"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div ref={stageScrollRef} className="sys-reader__stage-scroll">
            {children}
          </div>

          {resumeTarget ? (
            <ResumePill
              href={resumeTarget.href}
              title={
                resumeTarget.sectionIndex === 0
                  ? chapterDisplayTitle(resumeTarget.chapterTitle)
                  : resumeTarget.title
              }
            />
          ) : null}

          <SystemFooter
            dashCount={currentChapter?.slides.length ?? 1}
            dashActive={current?.sectionIndex ?? 0}
            hasPrev={!!prev}
            hasNext={!!next}
            onPrev={() => go(prev, -1)}
            onNext={() => go(next, 1)}
          />
        </main>

        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
