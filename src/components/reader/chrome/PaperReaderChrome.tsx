import type { ReactNode } from "react";

export type PaperSectionState = "active" | "visited" | "unvisited";

export type PaperSection = {
  id: string;
  title: string;
  state: PaperSectionState;
};

export type PaperChapter = {
  number: string;
  title: string;
  count: string;
  current?: boolean;
  open?: boolean;
  sections?: PaperSection[];
};

export type PaperReaderChromeProps = {
  brand?: string;
  bookTitle: string;
  bookMeta: string;
  headerChapter: string;
  pageIndex: string;
  progressWidth: string;
  progressValue: number;
  progressMax: number;
  chapters: PaperChapter[];
  eyebrow: string;
  title: string;
  dropCap: string;
  body: string;
  slideMarkers: number;
  currentSlide: number;
};

function ContentsGlyph() {
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

function SunGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line x1="12" y1="2.5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="21.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="2.5" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="19" y1="12" x2="21.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="5.4" y1="5.4" x2="7.1" y2="7.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16.9" y1="16.9" x2="18.6" y2="18.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16.9" y1="7.1" x2="18.6" y2="5.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="5.4" y1="18.6" x2="7.1" y2="16.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronOpen() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
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

function ChevronClosed() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
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

function ChevronLeft() {
  return (
    <svg width="8" height="14" viewBox="0 0 9 15" aria-hidden>
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

function ChevronRight() {
  return (
    <svg width="8" height="13" viewBox="0 0 9 15" aria-hidden>
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

function Mark({ state }: { state: PaperSectionState }) {
  return (
    <span className="pr-mark-slot">
      <span className={`pr-mark is-${state}`} />
    </span>
  );
}

function countClass(count: string): string {
  return count.includes("/") ? "pr-chapter-count" : "pr-chapter-count is-idle";
}

/**
 * Paper-family reader chrome: Georgia, square markers, pill Next.
 * Theme colors come from `--reader-*` tokens on an ancestor
 * `[data-reader-theme]` + `[data-reader-family="paper"]`.
 */
export function PaperReaderChrome({
  brand = "Agent YAP",
  bookTitle,
  bookMeta,
  headerChapter,
  pageIndex,
  progressWidth,
  progressValue,
  progressMax,
  chapters,
  eyebrow,
  title,
  dropCap,
  body,
  slideMarkers,
  currentSlide,
}: PaperReaderChromeProps) {
  const dots: ReactNode[] = [];
  for (let i = 0; i < slideMarkers; i += 1) {
    const current = i === currentSlide;
    dots.push(
      <li key={i}>
        <span
          className={current ? "pr-dot is-current" : "pr-dot"}
          aria-current={current ? "true" : undefined}
        />
      </li>,
    );
  }

  return (
    <div className="pr">
      <a className="pr-skip" href="#pr-slide">
        Skip to slide
      </a>

      <div
        className="pr-progress"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={1}
        aria-valuenow={progressValue}
        aria-valuemax={progressMax}
        aria-valuetext={`Slide ${String(progressValue).padStart(2, "0")} of ${progressMax}`}
      >
        <div className="pr-progress__fill" style={{ width: progressWidth }} />
      </div>

      <header className="pr-bar">
        <div className="pr-brand">
          <button
            type="button"
            className="pr-icon-btn"
            aria-label="Table of contents"
            aria-expanded="true"
            aria-controls="pr-contents"
          >
            <ContentsGlyph />
          </button>
          <span className="pr-wordmark">{brand}</span>
        </div>
        <p className="pr-chapter-label">{headerChapter}</p>
        <div className="pr-tools">
          <button type="button" className="pr-tool">
            Search
          </button>
          <button type="button" className="pr-tool">
            Chat
          </button>
          <span className="pr-page-index">{pageIndex}</span>
          <button
            type="button"
            className="pr-icon-btn"
            aria-label="Appearance: paper light"
          >
            <SunGlyph />
          </button>
        </div>
      </header>

      <div className="pr-body">
        <aside className="pr-sidebar" aria-label="Contents">
          <div className="pr-sidebar-head">
            <p className="pr-book-title">{bookTitle}</p>
            <p className="pr-book-meta">{bookMeta}</p>
          </div>
          <nav id="pr-contents" className="pr-nav" aria-label="Chapters">
            <ul className="pr-chapter-list">
              {chapters.map((chapter) => {
                const open = Boolean(chapter.open || chapter.current);
                return (
                  <li
                    key={chapter.number}
                    className={
                      chapter.current ? "pr-chapter is-current" : "pr-chapter"
                    }
                  >
                    <button
                      type="button"
                      className="pr-chapter-row"
                      aria-expanded={open}
                      aria-current={chapter.current ? "true" : undefined}
                    >
                      <span className="pr-chevron">
                        {open ? <ChevronOpen /> : <ChevronClosed />}
                      </span>
                      <span className="pr-chapter-num">{chapter.number}</span>
                      <span className="pr-chapter-title">{chapter.title}</span>
                      <span className={countClass(chapter.count)}>
                        {chapter.count}
                      </span>
                    </button>
                    {open && chapter.sections ? (
                      <ul className="pr-sections">
                        {chapter.sections.map((section) => (
                          <li key={section.id}>
                            <a
                              href="#pr-slide"
                              className={`pr-section is-${section.state}`}
                              aria-current={
                                section.state === "active" ? "page" : undefined
                              }
                            >
                              <Mark state={section.state} />
                              {section.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="pr-stage">
          <article id="pr-slide" className="pr-article">
            <p className="pr-eyebrow">{eyebrow}</p>
            <h1 className="pr-title">{title}</h1>
            <p className="pr-lede">
              <span className="pr-drop">{dropCap}</span><span className="pr-copy">{body}</span>
            </p>
          </article>

          <footer className="pr-footer">
            <p className="pr-hint">use ← and → to turn the page</p>
            <ol className="pr-dots" aria-label="Slides in this chapter">
              {dots}
            </ol>
            <div className="pr-actions">
              <button type="button" className="pr-prev" aria-label="Previous slide">
                <ChevronLeft />
              </button>
              <button type="button" className="pr-next" aria-label="Next slide">
                Next
                <ChevronRight />
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
