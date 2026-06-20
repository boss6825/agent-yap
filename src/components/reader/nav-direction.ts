"use client";

/**
 * Tiny client-side singleton recording the last navigation direction so the
 * slide transition (template.tsx) can slide in from the correct side.
 * +1 = moving forward (next), -1 = moving back (prev).
 */
let direction: 1 | -1 = 1;

export function setNavDirection(d: 1 | -1) {
  direction = d;
}

export function getNavDirection(): 1 | -1 {
  return direction;
}
