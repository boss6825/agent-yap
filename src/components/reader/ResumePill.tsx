"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Quiet "continue where you left off" affordance, shown only when the reader
 * lands at the start of the book while saved progress points elsewhere.
 */
export function ResumePill({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.5 }}
      className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-pill border border-hairline bg-canvas-2 py-1 pl-4 pr-1 shadow-sm">
        <Link
          href={href}
          className="flex min-w-0 items-center gap-2 py-1.5 text-[13px] text-ink-2 transition-colors hover:text-ink"
        >
          <span className="shrink-0">Continue where you left off</span>
          <span className="min-w-0 truncate font-medium text-ink">
            {title}
          </span>
          <span aria-hidden className="shrink-0 text-blue">
            →
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss resume suggestion"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-pill text-ink-2 transition-colors hover:bg-canvas-3 hover:text-ink"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
