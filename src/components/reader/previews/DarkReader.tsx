"use client";

import Link from "next/link";

const SLIDES = [
  { id: "overview", title: "Overview", state: "active" as const },
  { id: "what", title: "What is an agent?", state: "done" as const },
  { id: "loop", title: "The core loop", state: "done" as const },
  { id: "tools", title: "Tools & actions", state: "done" as const },
  { id: "memory", title: "Memory & context", state: "done" as const },
  { id: "fail", title: "Where agents fail", state: "todo" as const },
  { id: "recap", title: "Chapter recap", state: "todo" as const },
];

const CHAPTERS = [
  { num: "02", name: "The Agent Loop Pattern", fraction: "7/10", dash: 22 },
  { num: "03", name: "Tool Design", fraction: "5/13", dash: 12 },
  { num: "04", name: "Model-Provider Abstraction", fraction: "4/10", dash: 12.6 },
  { num: "05", name: "Context Engineering & Memory", fraction: "13", dash: 0 },
  { num: "06", name: "Prompt Architecture", fraction: "11", dash: 0 },
  { num: "07", name: "Retrieval: RAG vs Tools", fraction: "8", dash: 0 },
  { num: "08", name: "Streaming and Real-Time", fraction: "1/12", dash: 2.6 },
];

const THEME_HOPS = [
  { label: "Light", href: "/dev/themes/light" },
  { label: "Sepia", href: "/dev/themes/sepia" },
  { label: "Sepia Dark", href: "/dev/themes/sepia-dark" },
] as const;

function Check({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 6.5 5 9l4.5-6"
        fill="none"
        stroke={dimmed ? "var(--reader-check-done)" : "var(--reader-accent)"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressRing({ dash }: { dash: number }) {
  return (
    <svg
      className="rdr-ring"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="var(--reader-ring-track)"
        strokeWidth="2"
      />
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="var(--reader-progress-fill)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${dash} 31.4`}
      />
    </svg>
  );
}

function ThemeHop() {
  return (
    <nav className="rdr-hop" aria-label="Theme previews">
      <span className="rdr-hop-label">Theme</span>
      <button type="button" aria-current="page">
        Dark
      </button>
      {THEME_HOPS.map((item) => (
        <button
          key={item.href}
          type="button"
          onClick={() => {
            window.location.href = item.href;
          }}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function DarkReader() {
  return (
    <div className="rdr-page">
      <div
        className="rdr-root"
        data-reader-theme="dark"
        data-reader-family="system"
      >
        <a className="rdr-skip" href="#rdr-main">
          Skip to slide
        </a>

        <div className="rdr-chrome-top">
          <div
            className="rdr-progress"
            role="progressbar"
            aria-label="Reading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={11}
          >
            <div className="rdr-progress-fill" />
          </div>

          <header className="rdr-bar">
            <div className="rdr-brand">
              <button
                type="button"
                className="rdr-icon-btn"
                aria-label="Toggle contents"
                aria-expanded="true"
                aria-controls="rdr-toc"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
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
              <Link className="rdr-wordmark" href="/">
                Agent YAP
              </Link>
            </div>

            <p className="rdr-location">
              Chapter 1{"\u00a0"}·{"\u00a0"}Anatomy of an AI Agent
            </p>

            <div className="rdr-bar-actions">
              <button type="button" className="rdr-text-btn">
                Search
              </button>
              <button type="button" className="rdr-text-btn">
                Chat
              </button>
              <span className="rdr-counter">01 / 199</span>
              <button
                type="button"
                className="rdr-theme-icon"
                aria-label="Dark mode"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M20.5 14.8A8.2 8.2 0 0 1 9.2 3.5a8.2 8.2 0 1 0 11.3 11.3z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          </header>
        </div>

        <div className="rdr-body">
          <aside className="rdr-sidebar" aria-label="Contents">
            <div className="rdr-sidebar-head">
              <div className="rdr-book-title">
                {"Architecture & System\nDesign for AI Agents"}
              </div>
              <div className="rdr-book-meta">18 chapters · 199 slides</div>
            </div>

            <nav id="rdr-toc" className="rdr-toc" aria-label="Book contents">
              <div className="rdr-chapter">
                <button
                  type="button"
                  className="rdr-chapter-row is-open"
                  aria-expanded="true"
                >
                  <svg
                    className="rdr-chevron"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 4 6 8l3.5-4"
                      fill="none"
                      stroke="var(--reader-text-muted)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="rdr-chapter-num">01</span>
                  <span className="rdr-chapter-name">Anatomy of an AI Agent</span>
                  <span className="rdr-chapter-progress">
                    <span className="rdr-fraction">5/7</span>
                    <ProgressRing dash={22.4} />
                  </span>
                </button>

                <div className="rdr-slides">
                  {SLIDES.map((slide) => (
                    <a
                      key={slide.id}
                      className={
                        slide.state === "active"
                          ? "rdr-slide is-active"
                          : slide.state === "todo"
                            ? "rdr-slide is-todo"
                            : "rdr-slide"
                      }
                      href={`#${slide.id}`}
                      aria-current={slide.state === "active" ? "page" : undefined}
                    >
                      <span className="rdr-slide-mark">
                        {slide.state === "todo" ? (
                          <span className="rdr-dot" />
                        ) : (
                          <Check dimmed={slide.state === "done"} />
                        )}
                      </span>
                      {slide.title}
                    </a>
                  ))}
                </div>
              </div>

              <div className="rdr-chapter-stack">
                {CHAPTERS.map((chapter) => (
                  <button
                    key={chapter.num}
                    type="button"
                    className="rdr-chapter-row"
                    aria-expanded="false"
                  >
                    <svg
                      className="rdr-chevron"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      aria-hidden="true"
                    >
                      <path
                        d="M4.5 2.5 8 6l-3.5 3.5"
                        fill="none"
                        stroke="var(--reader-text-faint)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="rdr-chapter-num">{chapter.num}</span>
                    <span className="rdr-chapter-name">{chapter.name}</span>
                    <span className="rdr-chapter-progress">
                      <span
                        className={
                          chapter.dash === 0
                            ? "rdr-fraction is-empty"
                            : "rdr-fraction"
                        }
                      >
                        {chapter.fraction}
                      </span>
                      {chapter.dash > 0 ? (
                        <ProgressRing dash={chapter.dash} />
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          </aside>

          <main id="rdr-main" className="rdr-stage">
            <div className="rdr-slide-copy">
              <p className="rdr-eyebrow">
                Chapter 01 · Anatomy of an AI Agent
              </p>
              <h1 className="rdr-title">Anatomy of an AI Agent</h1>
              <p className="rdr-lede">
                Before you can design an agent, you need a clear mental model of
                its parts. This chapter lays out that anatomy and the vocabulary
                the rest of the folder uses — every term here recurs throughout,
                so it&apos;s worth getting precise.
              </p>
            </div>

            <div className="rdr-footer">
              <p className="rdr-hint">← → arrow keys work too</p>
              <div
                className="rdr-dashes"
                aria-hidden="true"
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    className={i === 0 ? "rdr-dash is-on" : "rdr-dash"}
                  />
                ))}
              </div>
              <div className="rdr-pager">
                <button
                  type="button"
                  className="rdr-nav-btn is-prev"
                  aria-label="Previous slide"
                >
                  <svg
                    width="9"
                    height="15"
                    viewBox="0 0 9 15"
                    aria-hidden="true"
                  >
                    <path
                      d="M7.5 1.5 1.5 7.5l6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rdr-nav-btn is-next"
                  aria-label="Next slide"
                >
                  <svg
                    width="9"
                    height="15"
                    viewBox="0 0 9 15"
                    aria-hidden="true"
                  >
                    <path
                      d="M1.5 1.5 7.5 7.5l-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
      <ThemeHop />
    </div>
  );
}
