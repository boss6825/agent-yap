"use client";

import { useCallback, useEffect, useId, useState } from "react";

type SlideState = "current" | "visited" | "unread";

type Slide = {
  id: string;
  title: string;
  state: SlideState;
};

type Chapter = {
  id: string;
  num: string;
  title: string;
  frac: string;
  unreadFrac?: boolean;
  slides: Slide[];
};

const BOOK_TITLE = "Architecture & System Design for AI Agents";
const INTRO =
  "efore you can design an agent, you need a clear mental model of its parts. This chapter lays out that anatomy and the vocabulary the rest of the folder uses, every term here recurs throughout, so it's worth getting precise.";

const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: "01",
    num: "01",
    title: "Anatomy of an AI Agent",
    frac: "5/7",
    slides: [
      { id: "overview", title: "Overview", state: "current" },
      { id: "what", title: "What is an agent?", state: "visited" },
      { id: "loop", title: "The core loop", state: "visited" },
      { id: "tools", title: "Tools & actions", state: "visited" },
      { id: "memory", title: "Memory & context", state: "visited" },
      { id: "fail", title: "Where agents fail", state: "unread" },
      { id: "recap", title: "Chapter recap", state: "unread" },
    ],
  },
  {
    id: "02",
    num: "02",
    title: "The Agent Loop Pattern",
    frac: "7/10",
    slides: [],
  },
  {
    id: "03",
    num: "03",
    title: "Tool Design",
    frac: "5/13",
    slides: [],
  },
  {
    id: "04",
    num: "04",
    title: "Model-Provider Abstraction",
    frac: "4/10",
    slides: [],
  },
  {
    id: "05",
    num: "05",
    title: "Context Engineering & Memory",
    frac: "13",
    unreadFrac: true,
    slides: [],
  },
  {
    id: "06",
    num: "06",
    title: "Prompt Architecture",
    frac: "11",
    unreadFrac: true,
    slides: [],
  },
  {
    id: "07",
    num: "07",
    title: "Retrieval: RAG vs Tools",
    frac: "8",
    unreadFrac: true,
    slides: [],
  },
  {
    id: "08",
    num: "08",
    title: "Streaming and Real-Time",
    frac: "1/12",
    slides: [],
  },
];

function BookMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="sd-brand__mark"
    >
      <rect
        x="2.5"
        y="3.5"
        width="15"
        height="13"
        rx="2.5"
        fill="none"
        stroke="#8A8377"
        strokeWidth="1.5"
      />
      <line
        x1="7.5"
        y1="3.5"
        x2="7.5"
        y2="16.5"
        stroke="#8A8377"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Chevron({ dir }: { dir: "down" | "right" }) {
  const d = dir === "down" ? "M2.5 4 6 8l3.5-4" : "M4.5 2.5 8 6l-3.5 3.5";
  const stroke = dir === "down" ? "#9A9184" : "#6B6459";
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="sd-chapter__chevron"
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.5 14.8A8.2 8.2 0 0 1 9.2 3.5a8.2 8.2 0 1 0 11.3 11.3z"
        fill="#9A9184"
      />
    </svg>
  );
}

function isTypingTarget(el: Element | null): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    (el instanceof HTMLElement && el.isContentEditable)
  );
}

export function SepiaDarkReader() {
  const navId = useId();
  const [chapters, setChapters] = useState(INITIAL_CHAPTERS);
  const [expanded, setExpanded] = useState("01");
  const [activeChapter, setActiveChapter] = useState("01");
  const [live, setLive] = useState("");

  const active = chapters.find((c) => c.id === activeChapter) ?? chapters[0];
  const slides = active.slides;
  const currentIndex = Math.max(
    0,
    slides.findIndex((s) => s.state === "current"),
  );
  const currentSlide = slides[currentIndex] ?? slides[0];
  const atStart = currentIndex <= 0;
  const atEnd = currentIndex >= slides.length - 1;

  const goToSlide = useCallback((chapterId: string, slideIndex: number) => {
    setChapters((prev) =>
      prev.map((chapter) => {
        if (chapter.id !== chapterId || chapter.slides.length === 0) {
          return chapter;
        }
        return {
          ...chapter,
          slides: chapter.slides.map((slide, i) => {
            if (i === slideIndex) return { ...slide, state: "current" };
            if (i < slideIndex) return { ...slide, state: "visited" };
            if (slide.state === "current") return { ...slide, state: "visited" };
            return slide;
          }),
        };
      }),
    );
    setActiveChapter(chapterId);
    setExpanded(chapterId);
  }, []);

  const goPrev = useCallback(() => {
    if (atStart) return;
    goToSlide(activeChapter, currentIndex - 1);
  }, [atStart, activeChapter, currentIndex, goToSlide]);

  const goNext = useCallback(() => {
    if (atEnd) return;
    goToSlide(activeChapter, currentIndex + 1);
  }, [atEnd, activeChapter, currentIndex, goToSlide]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.isComposing || isTypingTarget(document.activeElement)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const isOverview = currentSlide?.id === "overview";
  const heading =
    isOverview || !currentSlide ? active.title : currentSlide.title;

  return (
    <div
      className="sd-root"
      data-reader-theme="sepia-dark"
      data-reader-family="paper"
    >
      <a className="sd-skip" href="#sd-stage">
        Skip to reading
      </a>

      <div className="sd-chrome">
        <div
          className="sd-progress"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={199}
          aria-valuenow={1}
        >
          <div className="sd-progress__fill" />
        </div>

        <header className="sd-bar">
          <div className="sd-brand">
            <BookMark />
            <a className="sd-brand__name" href="/">
              Agent YAP
            </a>
          </div>

          <p className="sd-chapter-label">
            Chapter 1 · Anatomy of an AI Agent
          </p>

          <div className="sd-tools">
            <button
              type="button"
              className="sd-tools__link"
              onClick={() =>
                setLive("Search is a preview control on this theme page.")
              }
            >
              Search
            </button>
            <button
              type="button"
              className="sd-tools__link"
              onClick={() =>
                setLive("Chat is a preview control on this theme page.")
              }
            >
              Chat
            </button>
            <span className="sd-tools__count" aria-label="Slide 1 of 199">
              01 / 199
            </span>
            <span
              className="sd-tools__moon"
              role="img"
              aria-label="Warm dark paper theme"
            >
              <MoonMark />
            </span>
          </div>
        </header>
      </div>

      <div className="sd-body">
        <aside className="sd-rail" aria-label="Contents">
          <div className="sd-rail__head">
            <p className="sd-rail__title">
              Architecture &amp; System
              <br />
              Design for AI Agents
            </p>
            <p className="sd-rail__meta">18 chapters · 199 slides</p>
          </div>

          <nav id={navId} className="sd-nav" aria-label={BOOK_TITLE}>
            {chapters.map((chapter) => {
              const isActive = chapter.id === activeChapter;
              const isOpen = expanded === chapter.id;
              return (
                <div
                  key={chapter.id}
                  className="sd-chapter"
                  data-active={isActive ? "true" : "false"}
                  data-expanded={isOpen ? "true" : "false"}
                >
                  <button
                    type="button"
                    className="sd-chapter__row"
                    aria-expanded={isOpen}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => {
                      setExpanded((prev) =>
                        prev === chapter.id ? "" : chapter.id,
                      );
                      setActiveChapter(chapter.id);
                      if (chapter.slides.length > 0) {
                        const current = chapter.slides.findIndex(
                          (s) => s.state === "current",
                        );
                        goToSlide(chapter.id, current === -1 ? 0 : current);
                      }
                    }}
                  >
                    <Chevron dir={isOpen ? "down" : "right"} />
                    <span className="sd-chapter__num">{chapter.num}</span>
                    <span className="sd-chapter__name">{chapter.title}</span>
                    <span
                      className="sd-chapter__frac"
                      data-unread={chapter.unreadFrac ? "true" : undefined}
                    >
                      {chapter.frac}
                    </span>
                  </button>

                  {chapter.slides.length > 0 ? (
                    <ul className="sd-slides">
                      {chapter.slides.map((slide, i) => (
                        <li key={slide.id}>
                          <button
                            type="button"
                            className="sd-slide"
                            data-current={
                              slide.state === "current" ? "true" : "false"
                            }
                            data-state={slide.state}
                            aria-current={
                              slide.state === "current" ? "page" : undefined
                            }
                            onClick={() => goToSlide(chapter.id, i)}
                          >
                            <span className="sd-sq" aria-hidden="true">
                              <i />
                            </span>
                            <span className="sd-slide__label">{slide.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <main id="sd-stage" className="sd-stage" tabIndex={-1}>
          <article className="sd-prose">
            <p className="sd-kicker">
              Chapter 01 · Anatomy of an AI Agent
            </p>
            <h1 className="sd-title">{heading}</h1>
            {isOverview ? (
              <div className="sd-lead">
                <span className="sd-drop" aria-hidden="true">
                  B
                </span>
                <p className="sd-bodycopy">{INTRO}</p>
              </div>
            ) : (
              <p className="sd-bodycopy" style={{ marginTop: 30 }}>
                Preview slide. Use the squares or Next to return to Overview.
              </p>
            )}
          </article>

          <footer className="sd-foot">
            <p className="sd-hint">use ← and → to turn the page</p>
            <div
              className="sd-dots"
              role="img"
              aria-label={`Slide ${currentIndex + 1} of ${slides.length || 7} in this chapter`}
            >
              {(slides.length > 0 ? slides : Array.from({ length: 7 })).map(
                (slide, i) => (
                  <i
                    key={typeof slide === "object" ? slide.id : i}
                    data-on={i === currentIndex ? "true" : undefined}
                  />
                ),
              )}
            </div>
            <div className="sd-pager">
              <button
                type="button"
                className="sd-prev"
                aria-label="Previous slide"
                onClick={goPrev}
                disabled={atStart}
              >
                <svg
                  width="8"
                  height="14"
                  viewBox="0 0 9 15"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 1.5 1.5 7.5l6 6"
                    fill="none"
                    stroke="#4F4A42"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="sd-next"
                aria-label="Next slide"
                onClick={goNext}
                disabled={atEnd}
              >
                <span className="sd-next__label">Next</span>
                <svg
                  width="8"
                  height="13"
                  viewBox="0 0 9 15"
                  aria-hidden="true"
                >
                  <path
                    d="M1.5 1.5 7.5 7.5l-6 6"
                    fill="none"
                    stroke="#1A1815"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </footer>
        </main>
      </div>
      <p className="sd-live" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
