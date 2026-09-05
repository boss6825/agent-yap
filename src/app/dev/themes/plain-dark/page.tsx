import type { Metadata } from "next";
import {
  ChapterRing,
  ChevronDownGlyph,
  ChevronRightGlyph,
  NavChevronLeft,
  NavChevronRight,
  SidebarToggleGlyph,
  SlideCheck,
} from "@/components/reader/chrome/SystemReaderChrome";
import "@/styles/themes/plain-dark.css";

export const metadata: Metadata = {
  title: "Plain dark theme preview",
  robots: { index: false, follow: false },
};

/**
 * Pixel replica of Paper node 491-0 (plain dark). 1440×900.
 * Same layout as /dev/themes/light — color-only, moon instead of sun.
 */
export default function PlainDarkThemePreviewPage() {
  return (
    <div
      className="sys-reader sys-reader--preview"
      data-theme="plain-dark"
      data-reader-theme="dark"
      data-reader-family="system"
    >
      <a className="sys-reader__skip" href="#plain-dark-stage">
        Skip to slide
      </a>

      <div
        className="sys-reader__progress"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={11}
      >
        <div className="sys-reader__progress-fill" style={{ width: "11%" }} />
      </div>

      <header className="sys-reader__bar">
        <div className="sys-reader__brand-group">
          <button
            type="button"
            className="sys-reader__icon-btn"
            aria-label="Toggle contents"
            aria-expanded="true"
            aria-controls="plain-dark-toc"
          >
            <SidebarToggleGlyph />
          </button>
          <span className="sys-reader__brand">Agent YAP</span>
        </div>
        <span className="sys-reader__chapter-label">
          Chapter 1 · Anatomy of an AI Agent
        </span>
        <div className="sys-reader__actions">
          <button type="button" className="sys-reader__text-btn">
            Search
          </button>
          <button type="button" className="sys-reader__text-btn">
            Chat
          </button>
          <span className="sys-reader__counter">01 / 199</span>
          <span className="sys-reader__icon-btn" aria-label="Dark mode" role="img">
            <MoonGlyph />
          </span>
        </div>
      </header>

      <div className="sys-reader__body">
        <aside className="sys-reader__sidebar" aria-label="Contents">
          <div className="sys-reader__sidebar-head">
            <div className="sys-reader__book-title">
              Architecture &amp; System
              <br />
              Design for AI Agents
            </div>
            <div className="sys-reader__book-meta">18 CHAPTERS · 199 SLIDES</div>
          </div>
          <nav
            id="plain-dark-toc"
            className="sys-reader__nav"
            aria-label="Book contents"
          >
            <div className="sys-reader__chapter-block">
              <div className="sys-reader__chapter-row sys-reader__chapter-row--open">
                <ChevronDownGlyph />
                <span className="sys-reader__chapter-num">01</span>
                <span className="sys-reader__chapter-title">
                  Anatomy of an AI Agent
                </span>
                <span className="sys-reader__meter">
                  <span className="sys-reader__meter-count">5/7</span>
                  <ChapterRing frac={5 / 7} />
                </span>
              </div>
              <div className="sys-reader__slides">
                <SlideRow active check>
                  Overview
                </SlideRow>
                <SlideRow check>What is an agent?</SlideRow>
                <SlideRow check>The core loop</SlideRow>
                <SlideRow check>Tools &amp; actions</SlideRow>
                <SlideRow check>Memory &amp; context</SlideRow>
                <SlideRow>Where agents fail</SlideRow>
                <SlideRow>Chapter recap</SlideRow>
              </div>
            </div>

            <div className="sys-reader__chapter-stack">
              <CollapsedChapter
                num="02"
                title="The Agent Loop Pattern"
                count="7/10"
                frac={7 / 10}
              />
              <CollapsedChapter
                num="03"
                title="Tool Design"
                count="5/13"
                frac={5 / 13}
              />
              <CollapsedChapter
                num="04"
                title="Model-Provider Abstraction"
                count="4/10"
                frac={4 / 10}
              />
              <CollapsedChapter
                num="05"
                title="Context Engineering & Memory"
                total="13"
              />
              <CollapsedChapter num="06" title="Prompt Architecture" total="11" />
              <CollapsedChapter
                num="07"
                title="Retrieval: RAG vs Tools"
                total="8"
              />
              <CollapsedChapter
                num="08"
                title="Streaming and Real-Time"
                count="1/12"
                frac={1 / 12}
              />
            </div>
          </nav>
        </aside>

        <main id="plain-dark-stage" className="sys-reader__stage">
          <div
            className="sys-reader__stage-scroll"
            style={{ paddingBottom: 56 }}
          >
            <article className="sys-reader__article">
              <p className="sys-reader__eyebrow">
                CHAPTER 01 · ANATOMY OF AN AI AGENT
              </p>
              <h1 className="sys-reader__title">Anatomy of an AI Agent</h1>
              <p className="sys-reader__lede">
                Before you can design an agent, you need a clear mental model of
                its parts. This chapter lays out that anatomy and the vocabulary
                the rest of the folder uses — every term here recurs throughout,
                so it&apos;s worth getting precise.
              </p>
            </article>
          </div>

          <footer className="sys-reader__footer">
            <span className="sys-reader__hint">← → arrow keys work too</span>
            <div className="sys-reader__dashes" aria-hidden>
              <span className="sys-reader__dash sys-reader__dash--on" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
            </div>
            <div className="sys-reader__nav-btns">
              <button
                type="button"
                className="sys-reader__circle sys-reader__circle--prev"
                aria-label="Previous slide"
                disabled
              >
                <NavChevronLeft />
              </button>
              <button
                type="button"
                className="sys-reader__circle sys-reader__circle--next"
                aria-label="Next slide"
              >
                <NavChevronRight />
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function SlideRow({
  children,
  active = false,
  check = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  check?: boolean;
}) {
  const cls = [
    "sys-reader__slide-row",
    active ? "sys-reader__slide-row--active" : "",
    !check && !active ? "sys-reader__slide-row--todo" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} aria-current={active ? "page" : undefined}>
      <span className="sys-reader__mark">
        {check ? (
          <SlideCheck faded={!active} />
        ) : (
          <span className="sys-reader__dot" />
        )}
      </span>
      <span className="sys-reader__slide-label">{children}</span>
    </div>
  );
}

function CollapsedChapter({
  num,
  title,
  count,
  total,
  frac,
}: {
  num: string;
  title: string;
  count?: string;
  total?: string;
  frac?: number;
}) {
  return (
    <div className="sys-reader__chapter-row">
      <ChevronRightGlyph />
      <span className="sys-reader__chapter-num">{num}</span>
      <span className="sys-reader__chapter-title">{title}</span>
      <span className="sys-reader__meter">
        {count ? (
          <>
            <span className="sys-reader__meter-count">{count}</span>
            {frac != null ? <ChapterRing frac={frac} /> : null}
          </>
        ) : (
          <span className="sys-reader__meter-count sys-reader__meter-count--faint">
            {total}
          </span>
        )}
      </span>
    </div>
  );
}

function MoonGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a.75.75 0 0 0-.9-1A10.1 10.1 0 1 0 21.4 15.6a.75.75 0 0 0-1-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}
