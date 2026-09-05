/**
 * Pixel-faithful replica of Paper frame 4D4-0 (A · Studio — Light).
 * Dummy copy is intentional so /dev/themes/light can be screenshot at 1440×900.
 */
export function LightReader() {
  return (
    <div
      className="sys-reader sys-reader--preview"
      data-reader-theme="light"
      data-reader-family="system"
    >
      <div className="sys-reader__progress">
        <div className="sys-reader__progress-fill" style={{ width: "11%" }} />
      </div>

      <header className="sys-reader__bar">
        <div className="sys-reader__brand-group">
          <span className="sys-reader__icon-btn" aria-hidden>
            <SidebarGlyph />
          </span>
          <span className="sys-reader__brand">Agent YAP</span>
        </div>
        <span className="sys-reader__chapter-label">
          Chapter 1 · Anatomy of an AI Agent
        </span>
        <div className="sys-reader__actions">
          <span className="sys-reader__text-btn">Search</span>
          <span className="sys-reader__text-btn">Chat</span>
          <span className="sys-reader__counter">01 / 199</span>
          <span className="sys-reader__icon-btn" aria-hidden>
            <SunIcon />
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
          <nav className="sys-reader__nav" aria-label="Book contents">
            <div className="sys-reader__chapter-block">
              <div className="sys-reader__chapter-row sys-reader__chapter-row--open">
                <ChevronDown />
                <span className="sys-reader__chapter-num">01</span>
                <span className="sys-reader__chapter-title">
                  Anatomy of an AI Agent
                </span>
                <span className="sys-reader__meter">
                  <span className="sys-reader__meter-count">5/7</span>
                  <Ring frac={5 / 7} />
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
              <CollapsedChapter num="05" title="Context Engineering & Memory" total="13" />
              <CollapsedChapter num="06" title="Prompt Architecture" total="11" />
              <CollapsedChapter num="07" title="Retrieval: RAG vs Tools" total="8" />
              <CollapsedChapter
                num="08"
                title="Streaming and Real-Time"
                count="1/12"
                frac={1 / 12}
              />
            </div>
          </nav>
        </aside>

        <main className="sys-reader__stage">
          <div className="sys-reader__stage-scroll" style={{ paddingBottom: 56 }}>
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
            <div className="sys-reader__dashes">
              <span className="sys-reader__dash sys-reader__dash--on" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
              <span className="sys-reader__dash" />
            </div>
            <div className="sys-reader__nav-btns">
              <span className="sys-reader__circle sys-reader__circle--prev">
                <ChevronLeft />
              </span>
              <span className="sys-reader__circle sys-reader__circle--next">
                <ChevronRight />
              </span>
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
    <div className={cls}>
      <span className="sys-reader__mark">
        {check ? <Check faded={!active} /> : <span className="sys-reader__dot" />}
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
      <ChevronRightSmall />
      <span className="sys-reader__chapter-num">{num}</span>
      <span className="sys-reader__chapter-title">{title}</span>
      <span className="sys-reader__meter">
        {count ? (
          <>
            <span className="sys-reader__meter-count">{count}</span>
            {frac != null ? <Ring frac={frac} /> : null}
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

function Ring({ frac }: { frac: number }) {
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

function Check({ faded }: { faded?: boolean }) {
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

function SunIcon() {
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
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.4" y1="5.4" x2="7.1" y2="7.1" />
        <line x1="16.9" y1="16.9" x2="18.6" y2="18.6" />
        <line x1="16.9" y1="7.1" x2="18.6" y2="5.4" />
        <line x1="5.4" y1="18.6" x2="7.1" y2="16.9" />
      </g>
    </svg>
  );
}

function SidebarGlyph() {
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

function ChevronDown() {
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

function ChevronRightSmall() {
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

function ChevronLeft() {
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

function ChevronRight() {
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
