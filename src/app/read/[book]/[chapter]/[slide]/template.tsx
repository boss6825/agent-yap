"use client";

import { motion } from "framer-motion";
import { getNavDirection } from "@/components/reader/nav-direction";

/**
 * Re-mounts on every slide navigation (Next.js templates do), so each slide
 * animates in with the design's calm rise: 16px up + fade, nudged slightly
 * toward the direction of travel.
 */
export default function SlideTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const dir = getNavDirection();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: dir * 24 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex min-h-full items-center justify-center px-6 pb-24 pt-10 sm:px-10"
    >
      {children}
    </motion.div>
  );
}
