/**
 * Per-subject marks for the shelf.
 *
 * These are diagrams, not icons. Each one draws the actual shape of its
 * subject in the same vocabulary the landing page already animates in
 * `home/fx.ts`: thin strokes, nodes, edges. Memory is sediment cut by a
 * retrieval line; multi-agent is a hub with spokes; both are the still frame
 * of a scene further down the same page. A generic icon set would say nothing
 * about the content and would look imported from somewhere else.
 *
 * Everything strokes `currentColor` so one mark works on a saturated featured
 * tile and on a quiet card, in either theme, with no per-variant artwork.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Layered system: surfaces stacked, wired together. */
function ArchitectureMark() {
  return (
    <g {...STROKE}>
      <rect x="7" y="6" width="34" height="8" rx="3" />
      <rect x="7" y="20" width="34" height="8" rx="3" />
      <rect x="7" y="34" width="34" height="8" rx="3" />
      <path d="M24 14v6M24 28v6" />
    </g>
  );
}

/** A bounded window: some of what arrives is kept, some is pushed back out. */
function ContextMark() {
  return (
    <g {...STROKE}>
      <rect x="13" y="12" width="22" height="24" rx="4" />
      <path d="M18 20h12M18 25h8M18 30h10" />
      <path d="M4 24h7M8 21l3 3-3 3" />
      <path d="M44 16h-7M40 13l-3 3 3 3" />
    </g>
  );
}

/** Sediment: every run deposits a layer, retrieval cuts down through them. */
function MemoryMark() {
  return (
    <g {...STROKE}>
      <rect x="6" y="11" width="36" height="6" rx="2" />
      <rect x="6" y="21" width="36" height="6" rx="2" />
      <rect x="6" y="31" width="36" height="6" rx="2" />
      <path d="M33 6v36" />
    </g>
  );
}

/** The retrieval loop: ask, fetch, judge, ask again. */
function RagMark() {
  return (
    <g {...STROKE}>
      <path d="M38 24a14 14 0 1 1-6.6-11.9" />
      <path d="M31 5.5v7h-7" />
      <rect x="18" y="18" width="12" height="12" rx="3" />
    </g>
  );
}

/** Orchestrator and specialists: one hub, four delegates. */
function MultiAgentMark() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="24" r="5.5" />
      <path d="M20.2 20.2 13 13M27.8 20.2 35 13M20.2 27.8 13 35M27.8 27.8 35 35" />
      <circle cx="11" cy="11" r="3" />
      <circle cx="37" cy="11" r="3" />
      <circle cx="11" cy="37" r="3" />
      <circle cx="37" cy="37" r="3" />
    </g>
  );
}

/** The harness: a shell wrapped around the model, holding the prompt. */
function HarnessMark() {
  return (
    <g {...STROKE}>
      <rect x="6" y="10" width="36" height="28" rx="6" />
      <path d="M16 19l5 5-5 5" />
      <path d="M26 29h7" />
    </g>
  );
}

/** Definitions: a term, then the line that explains it. */
function GlossaryMark() {
  return (
    <g {...STROKE}>
      <path d="M11 9v30" />
      <path d="M17 15h10M17 21h20" />
      <path d="M17 29h13M17 35h17" />
    </g>
  );
}

/** Anything without a mark of its own: three ideas, connected. */
function DefaultMark() {
  return (
    <g {...STROKE}>
      <circle cx="12" cy="34" r="4" />
      <circle cx="24" cy="13" r="4" />
      <circle cx="36" cy="34" r="4" />
      <path d="M15 31.4 21.2 16M26.8 16 33 31.4M16 34h16" />
    </g>
  );
}

const MARKS: Record<string, () => React.ReactElement> = {
  "architecture-and-system-design": ArchitectureMark,
  "context-engineering": ContextMark,
  "agentic-memory": MemoryMark,
  rag: RagMark,
  "multi-agent": MultiAgentMark,
  "coding-agents-and-harnesses": HarnessMark,
  glossary: GlossaryMark,
};

/** Decorative by default: the card's own text already names the subject. */
export function SubjectMark({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Mark = MARKS[slug] ?? DefaultMark;
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <Mark />
    </svg>
  );
}
