import type { ReactNode, RefObject } from "react";
import Link from "next/link";

/** Shared SVG marks for the system-family (light/dark) reader chrome. */

export function SidebarToggleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
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
  );
}

export function ChevronDownGlyph() {
  return (
    <svg
      className="sys-reader__chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
    >
      <path
        d="M2.5 4 6 8l3.5-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightGlyph() {
  return (
    <svg
      className="sys-reader__chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden
    >
      <path
        d="M4.5 2.5 8 6l-3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavChevronLeft() {
  return (
    <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden>
      <path
        d="M7.5 1.5 1.5 7.5l6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NavChevronRight() {
  return (
    <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden>
      <path
        d="M1.5 1.5 7.5 7.5l-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SlideCheck({ faded = false }: { faded?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M2.5 6.5 5 9l4.5-6"
        fill="none"
        stroke={faded ? "var(--reader-check-done)" : "var(--reader-accent)"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChapterRing({ frac }: { frac: number }) {
  const r = 5;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, frac));
  return (
    <svg
      className="sys-reader__ring"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden
    >
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="var(--reader-ring-track)"
        strokeWidth="2"
      />
      <circle
        cx="7"
        cy="7"
        r={r}
        fill="none"
        stroke="var(--reader-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${c * clamped} ${c}`}
      />
    </svg>
  );
}

export function SystemProgressTrack({ percent }: { percent: number }) {
  return (
    <div className="sys-reader__progress" aria-hidden>
      <div
        className="sys-reader__progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function SystemTopBar({
  railToggleRef,
  railExpanded,
  onToggleRail,
  chapterLabel,
  indexLabel,
  totalLabel,
  chatOpen,
  onSearch,
  onChat,
  themeControl,
}: {
  railToggleRef: RefObject<HTMLButtonElement | null>;
  railExpanded: boolean | undefined;
  onToggleRail: () => void;
  chapterLabel: string;
  indexLabel: string;
  totalLabel: string;
  chatOpen: boolean;
  onSearch: () => void;
  onChat: () => void;
  themeControl: ReactNode;
}) {
  return (
    <header className="sys-reader__bar">
      <div className="sys-reader__brand-group">
        <button
          ref={railToggleRef}
          type="button"
          className="sys-reader__icon-btn"
          onClick={onToggleRail}
          title="Contents (t)"
          aria-label={railExpanded ? "Collapse contents" : "Expand contents"}
          aria-expanded={railExpanded}
        >
          <SidebarToggleGlyph />
        </button>
        <Link href="/" className="sys-reader__brand">
          Agent YAP
        </Link>
      </div>
      <span className="sys-reader__chapter-label">{chapterLabel}</span>
      <div className="sys-reader__actions">
        <button
          type="button"
          className="sys-reader__text-btn"
          onClick={onSearch}
          title="Search (/)"
        >
          Search
        </button>
        <button
          type="button"
          className="sys-reader__text-btn"
          onClick={onChat}
          title="Chat with this page"
          aria-pressed={chatOpen}
          aria-expanded={chatOpen}
        >
          Chat
        </button>
        <span className="sys-reader__counter">
          {indexLabel} / {totalLabel}
        </span>
        {themeControl}
      </div>
    </header>
  );
}

export function SystemFooter({
  dashCount,
  dashActive,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
}: {
  dashCount: number;
  dashActive: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const dashes = Math.max(1, dashCount);
  const shrink = dashes > 9;
  return (
    <footer className="sys-reader__footer">
      <span className="sys-reader__hint">← → arrow keys work too</span>
      <div className="sys-reader__dashes" aria-hidden>
        {Array.from({ length: dashes }, (_, i) => (
          <span
            key={i}
            className={
              i === dashActive
                ? "sys-reader__dash sys-reader__dash--on"
                : "sys-reader__dash"
            }
            style={shrink ? { width: 14 } : undefined}
          />
        ))}
      </div>
      <div className="sys-reader__nav-btns">
        <button
          type="button"
          className="sys-reader__circle sys-reader__circle--prev"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label="Previous slide"
        >
          <NavChevronLeft />
        </button>
        <button
          type="button"
          className="sys-reader__circle sys-reader__circle--next"
          onClick={onNext}
          disabled={!hasNext}
          aria-label="Next slide"
        >
          <NavChevronRight />
        </button>
      </div>
    </footer>
  );
}
