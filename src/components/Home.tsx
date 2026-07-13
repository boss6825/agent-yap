"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SearchPanel } from "@/components/SearchPanel";
import { AskPanel } from "@/components/AskPanel";
import { initHomeFx } from "@/components/home/fx";

export interface HomeChapter {
  number: number;
  title: string;
  blurb: string;
  href: string;
  slideCount: number;
}

export interface HomeData {
  title: string;
  description: string;
  total: number;
  startHref: string;
  chapters: HomeChapter[];
}

const STRATA = [
  { name: "Working context", desc: "what the model sees right now", bg: "#3A3A3E" },
  { name: "Episodic traces", desc: "what happened, run by run", bg: "#2E2E32" },
  { name: "Semantic knowledge", desc: "facts distilled from experience", bg: "#242428" },
  { name: "Procedural skills", desc: "strategies that survived", bg: "#1C1C1E" },
];

const AGENT_CAPTIONS = [
  "Alone, an agent is just a loop with tools.",
  "Given a shared goal, structure emerges: an orchestrator, specialists, delegation.",
  "Orchestration is deciding what each model sees, does, and reports back.",
];

export function Home({ data }: { data: HomeData }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    if (!rootRef.current) return;
    return initHomeFx(rootRef.current);
  }, []);

  const firstChapter = data.chapters[0];

  return (
    <div ref={rootRef} className="w-full bg-canvas text-ink">
      {/* ============ NAV ============ */}
      <nav
        id="yap-nav"
        className="glass-dark fixed inset-x-0 top-0 z-[100] h-[52px] transition-colors duration-500"
      >
        <div className="mx-auto flex h-[52px] max-w-[1200px] items-center justify-between gap-6 px-6">
          <a
            href="#hero"
            data-nav-text="1"
            className="flex h-11 items-center font-display text-[17px] font-semibold tracking-[-0.2px] text-snow transition-colors duration-500"
          >
            Agent YAP
          </a>
          <div className="hidden items-center gap-2 min-[735px]:flex">
            <a
              href="#philosophy"
              data-nav-text="1"
              className="flex h-11 items-center px-3 text-xs text-snow transition-colors duration-500"
            >
              Philosophy
            </a>
            <a
              href="#curriculum"
              data-nav-text="1"
              className="flex h-11 items-center px-3 text-xs text-snow transition-colors duration-500"
            >
              Curriculum
            </a>
            <Link
              href={data.startHref}
              data-nav-text="1"
              className="flex h-11 items-center px-3 text-xs text-snow transition-colors duration-500"
            >
              Reader
            </Link>
            <button
              type="button"
              data-nav-text="1"
              onClick={() => setSearchOpen(true)}
              className="flex h-11 cursor-pointer items-center px-3 text-xs text-snow transition-colors duration-500"
            >
              Search
            </button>
            <button
              type="button"
              data-nav-text="1"
              onClick={() => setAskOpen(true)}
              className="flex h-11 cursor-pointer items-center px-3 text-xs text-snow transition-colors duration-500"
            >
              Ask
            </button>
          </div>
          <Link
            href={data.startHref}
            className="flex h-8 items-center rounded-pill bg-blue px-4 text-xs text-white transition-transform active:scale-95"
          >
            Start learning
          </Link>
        </div>
      </nav>

      {/* ============ 1. HERO ============ */}
      <section
        id="hero"
        data-navtheme="dark"
        className="relative h-svh min-h-[640px] overflow-hidden bg-night"
      >
        <div id="hero-media" className="absolute inset-x-0 top-[-8%] h-[116%]">
          <Image
            src="/assets/snow-mountain.jpg"
            alt="Dark snowy mountain range seen from above"
            fill
            priority
            sizes="100vw"
            className="animate-kenburns object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.15)_45%,rgba(0,0,0,0.30)_100%)]" />
        <div
          id="hero-copy"
          className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-[13vh] text-center"
        >
          <h1
            id="hero-head"
            className="m-0 max-w-[980px] font-display text-[clamp(40px,7.4vw,80px)] font-semibold leading-[1.04] tracking-[-0.015em] text-snow"
          >
            Understand agents from the inside.
          </h1>
          <p
            id="hero-sub"
            className="mt-6 max-w-[560px] text-[21px] leading-[1.4] text-snow/70"
          >
            RAG, context engineering, memory, orchestration, and coding agent
            internals. Taught at the depth practitioners actually need.
          </p>
          <Link
            id="hero-cta"
            href={data.startHref}
            className="mt-9 inline-flex min-h-11 items-center rounded-pill bg-blue px-7 py-[13px] text-[17px] text-white transition-transform active:scale-95"
          >
            Start learning
          </Link>
        </div>
      </section>

      {/* ============ 2. MANIFESTO ============ */}
      <section
        id="philosophy"
        data-navtheme="light"
        className="bg-canvas px-6 py-[clamp(120px,18vh,200px)]"
      >
        <div className="mx-auto max-w-[980px]">
          <p
            data-rise="0"
            className="mb-7 text-xs font-semibold uppercase tracking-[0.10em] text-ink-2"
          >
            The premise
          </p>
          <h2
            data-lines="1"
            className="m-0 max-w-[920px] font-display text-[clamp(32px,4.6vw,52px)] font-semibold leading-[1.12] tracking-[-0.01em] text-ink"
          >
            Most courses stop at the architecture diagram. Agent YAP teaches
            what happens underneath: the retrieval, the memory, the loops, and
            the failures.
          </h2>
          <p
            data-rise="0.1"
            className="mt-12 max-w-[640px] text-[21px] leading-[1.5] text-ink-2"
          >
            Written for people who already ship with LLMs and want to
            understand their systems well enough to fix them when they break.
          </p>
        </div>
      </section>

      {/* ============ 3. MULTI-AGENT SCENE ============ */}
      <section data-navtheme="dark" className="bg-night">
        <div id="agent-pin" className="relative h-screen overflow-hidden bg-night">
          <canvas id="agent-canvas" className="absolute inset-0 z-[1]" />
          <div className="pointer-events-none absolute inset-x-0 top-[11vh] z-[2] px-6 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.10em] text-snow/45">
              Multi-agent systems
            </p>
            <h2
              data-scramble="1000"
              className="m-0 font-display text-[clamp(32px,5vw,56px)] font-semibold leading-[1.07] tracking-[-0.015em] text-snow"
            >
              Many agents. One system.
            </h2>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-[9vh] z-[2] h-[52px]">
            {AGENT_CAPTIONS.map((caption, i) => (
              <p
                key={i}
                data-agent-caption={i}
                className="absolute inset-0 m-0 px-6 text-center text-[17px] leading-[1.47] text-snow/65 transition-opacity duration-500"
                style={{ opacity: i === 0 ? 1 : 0 }}
              >
                {caption}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 4. CLOUD INTERSTITIAL ============ */}
      <section
        data-navtheme="dark"
        className="relative h-[92vh] min-h-[520px] overflow-hidden bg-night"
      >
        <div data-parallax="1" className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-[-12%] h-[124%] w-full">
            <Image
              src="/assets/cloud-sea.jpg"
              alt="A sea of clouds at sunset seen from above"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-black/[0.28]" />
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <h2
            data-cloud-text="1"
            data-scramble="1100"
            className="m-0 max-w-[820px] text-center font-display text-[clamp(28px,4.2vw,48px)] font-semibold leading-[1.14] tracking-[-0.01em] text-snow"
          >
            Rise above surface-level understanding.
          </h2>
        </div>
      </section>

      {/* ============ 5. CURRICULUM ============ */}
      <section
        id="curriculum"
        data-navtheme="light"
        className="bg-canvas px-6 py-[clamp(120px,16vh,180px)]"
      >
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[980px]">
            <p
              data-rise="0"
              className="mb-6 text-xs font-semibold uppercase tracking-[0.10em] text-ink-2"
            >
              Curriculum
            </p>
            <h2
              data-scramble="1000"
              className="m-0 font-display text-[clamp(32px,4.6vw,48px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink"
            >
              {data.chapters.length} chapters. No hand-waving.
            </h2>
            <p data-rise="0.1" className="mt-6 max-w-[620px] text-[21px] leading-[1.5] text-ink-2">
              {data.title}: a sequence of slide-based chapters. Read one in an
              evening. Reference it for years.
            </p>
          </div>
          <div className="mt-[72px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
            {data.chapters.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                data-rise="0"
                className="flex min-h-[280px] flex-col rounded-card bg-canvas-2 p-8 px-8 transition-[background,transform] duration-[400ms] ease-out hover:-translate-y-1 hover:bg-canvas-3 active:scale-[0.98]"
              >
                <span className="text-xs font-semibold tracking-[0.08em] text-ink-2">
                  {String(c.number).padStart(2, "0")}
                </span>
                <span className="mt-3.5 font-display text-2xl font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
                  {c.title}
                </span>
                <span className="mt-3.5 flex-1 text-[17px] leading-[1.47] text-ink-2">
                  {c.blurb}
                </span>
                <span className="mt-7 flex items-center justify-between">
                  <span className="text-xs text-ink-2">{c.slideCount} slides</span>
                  <span className="text-sm text-blue">Read chapter</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 6. MEMORY STRATA ============ */}
      <section data-navtheme="dark" className="bg-night">
        <div id="strata-pin" className="relative h-screen overflow-hidden bg-night">
          <div className="absolute inset-x-0 top-[10vh] z-[2]">
            <div className="mx-auto max-w-[980px] px-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.10em] text-snow/45">
                Agentic memory
              </p>
              <h2
                data-scramble="1000"
                className="m-0 font-display text-[clamp(32px,5vw,56px)] font-semibold leading-[1.07] tracking-[-0.015em] text-snow"
              >
                Memory is sediment.
              </h2>
              <p className="mt-5 max-w-[560px] text-[19px] leading-[1.5] text-snow/60">
                Every run deposits a layer. Good agents compress experience into
                strata and let retrieval cut through all of them.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 top-[34vh] right-[16%] z-[3] w-0.5">
            <span
              id="strata-query-label"
              className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-[0.08em] text-blue-bright"
            >
              retrieval
            </span>
            <div id="strata-query" className="absolute inset-x-0 bottom-0 top-[26px] bg-blue-bright" />
          </div>
          <div className="absolute inset-x-0 bottom-0 z-[1] flex h-[46vh] flex-col">
            {STRATA.map((s) => (
              <div
                key={s.name}
                data-stratum={s.name}
                className="flex flex-1 items-center gap-6 overflow-hidden border-t border-white/10 px-[clamp(24px,8vw,120px)]"
                style={{ background: s.bg }}
              >
                <span className="min-w-[clamp(140px,22vw,220px)] text-[17px] font-semibold text-snow">
                  {s.name}
                </span>
                <span className="text-sm text-snow/55">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 7. MOUNTAIN DIVIDER / CTA ============ */}
      <section
        data-navtheme="dark"
        className="relative h-screen min-h-[560px] overflow-hidden bg-night"
      >
        <div data-parallax="1" className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-[-12%] h-[124%] w-full">
            <Image
              src="/assets/snow-mountain.jpg"
              alt="Dark snowy mountain range with cloud pouring over a ridge"
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.10)_100%)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-end px-6 pb-[15vh] text-center">
          <h2
            data-scramble="1100"
            className="m-0 max-w-[900px] font-display text-[clamp(36px,5.5vw,64px)] font-semibold leading-[1.07] tracking-[-0.015em] text-snow"
          >
            The climb is the curriculum.
          </h2>
          <Link
            href={data.startHref}
            className="mt-9 inline-flex min-h-11 items-center rounded-pill bg-blue px-7 py-[13px] text-[17px] text-white transition-transform active:scale-95"
          >
            Start with Chapter 1
          </Link>
        </div>
      </section>

      {/* ============ 8. READER PREVIEW ============ */}
      <section
        data-navtheme="light"
        className="bg-canvas-2 px-6 py-[clamp(120px,16vh,180px)]"
      >
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-[clamp(40px,6vw,96px)]">
          <div className="min-w-[300px] flex-1">
            <p
              data-rise="0"
              className="mb-6 text-xs font-semibold uppercase tracking-[0.10em] text-ink-2"
            >
              The reader
            </p>
            <h2
              data-scramble="1000"
              className="m-0 font-display text-[clamp(32px,4.2vw,48px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink"
            >
              Built for reading, not scrolling.
            </h2>
            <p data-rise="0.1" className="mt-6 max-w-[480px] text-[17px] leading-[1.47] text-ink-2">
              Chapters are screen-sized slides you move through with arrow
              keys. One idea per screen, generous type, visible progress. All
              the drama stays out here; the reader stays calm.
            </p>
            <Link
              href={data.startHref}
              data-rise="0.2"
              className="mt-5 inline-flex min-h-11 items-center text-[17px] text-blue hover:underline"
            >
              Open the reader
            </Link>
          </div>
          <Link href={firstChapter?.href ?? data.startHref} data-rise="0.15" className="min-w-[320px] flex-[1.2]">
            <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-card bg-canvas p-[clamp(28px,4vw,48px)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-transform duration-[400ms] hover:-translate-y-1">
              <div className="absolute left-0 top-0 h-[3px] w-1/3 bg-blue" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                {data.title} · Chapter {firstChapter?.number ?? 1}
              </span>
              <span className="mt-[18px] font-display text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.15] tracking-[-0.01em] text-ink">
                {firstChapter?.title}
              </span>
              <span className="mt-3.5 line-clamp-3 max-w-[420px] text-sm leading-[1.5] text-ink-2">
                {firstChapter?.blurb}
              </span>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs text-ink-2">
                  01 / {String(data.total).padStart(2, "0")}
                </span>
                <div className="flex gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-canvas-2 text-[17px] text-ink">
                    ‹
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-pill bg-canvas-2 text-[17px] text-ink">
                    ›
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ============ 9. FOOTER ============ */}
      <footer data-navtheme="light" className="bg-canvas px-6 pb-16 pt-12">
        <div className="mx-auto flex max-w-[980px] flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-ink-2">
            Agent YAP. Built for practitioners. © 2026
          </span>
          <div className="flex items-center gap-7">
            <a href="#philosophy" className="text-xs text-blue hover:underline">
              Philosophy
            </a>
            <a href="#curriculum" className="text-xs text-blue hover:underline">
              Curriculum
            </a>
            <Link href={data.startHref} className="text-xs text-blue hover:underline">
              Reader
            </Link>
          </div>
        </div>
      </footer>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AskPanel open={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
