"use client";

/**
 * Bridge between the server-rendered slide page and client chrome (chat panel).
 * The slide page mounts <SlideContextBridge> which publishes the current
 * slide's plain fields here; consumers read via useSyncExternalStore, so a
 * panel mounted before OR after the slide always sees the latest snapshot.
 * Same module-singleton pattern as nav-direction.ts.
 */
export interface SlideContext {
  href: string;
  title: string;
  chapterNumber: number;
  chapterTitle: string;
  markdown: string;
}

let current: SlideContext | null = null;
const listeners = new Set<() => void>();

export function setSlideContext(ctx: SlideContext): void {
  current = ctx;
  for (const cb of listeners) cb();
}

export function getSlideContext(): SlideContext | null {
  return current;
}

export function getServerSlideContext(): SlideContext | null {
  return null;
}

export function subscribeSlideContext(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
