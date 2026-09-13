"use client";

import { useShaderMotion } from "@/components/reader/shaders/motion-pref";

/** Quiet "still" mark — action is to freeze the backdrop. */
function StillGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <rect
        x="4.5"
        y="6.5"
        width="15"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Spark — action is to restore motion. */
function SparkGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 3.5 13.2 9 18.5 12 13.2 15 12 20.5 10.8 15 5.5 12 10.8 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NoDistractionToggle({
  className = "reader-icon-btn",
}: {
  className?: string;
}) {
  const { noDistraction, toggleNoDistraction } = useShaderMotion();
  const label = noDistraction ? "Show animations" : "No distraction";

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-pressed={noDistraction}
      title={label}
      onClick={toggleNoDistraction}
    >
      {noDistraction ? <SparkGlyph /> : <StillGlyph />}
    </button>
  );
}
