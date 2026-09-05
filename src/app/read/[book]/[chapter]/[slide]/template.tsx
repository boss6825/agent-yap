"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Re-mounts on every slide navigation. Fade only — the Paper chrome is plain
 * and the stage already centers the article.
 */
export default function SlideTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) return children;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
