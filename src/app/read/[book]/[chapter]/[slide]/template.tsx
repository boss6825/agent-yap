"use client";

import { motion } from "framer-motion";
import { getNavDirection } from "@/components/reader/nav-direction";

/**
 * Re-mounts on every slide navigation (Next.js templates do), so each slide
 * animates in. It slides from the left or right depending on travel direction,
 * and centers the slide (tall slides scroll within the stage).
 */
export default function SlideTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const dir = getNavDirection();
  return (
    <motion.div
      initial={{ opacity: 0, x: dir * 56 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="grid min-h-full place-items-center px-5 pb-28 pt-24 sm:px-10 lg:px-24"
    >
      {children}
    </motion.div>
  );
}
