"use client";

/**
 * Reading progress — localStorage only, by design (plan.md Phase 2: no accounts,
 * no server-side progress). The whole module no-ops when storage is unavailable,
 * and consumers render a neutral zero-state until after mount so server HTML and
 * the first client render always match (P-READER-002, P-READER-003).
 */
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "agent-yap:progress:v1";

export interface ProgressData {
  version: 1;
  /** Canonical route of the most recently read slide. */
  lastHref: string | null;
  lastReadAt: number | null;
  /** bookSlug → href → epoch ms first marked read. Grows monotonically. */
  read: Record<string, Record<string, number>>;
}

function emptyProgress(): ProgressData {
  return { version: 1, lastHref: null, lastReadAt: null, read: {} };
}

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Defensive parse: any corruption or version mismatch resets to zero-state. */
function parseProgress(raw: string | null): ProgressData {
  if (!raw) return emptyProgress();
  try {
    const data = JSON.parse(raw) as Partial<ProgressData>;
    if (
      !data ||
      data.version !== 1 ||
      typeof data.read !== "object" ||
      data.read === null
    ) {
      return emptyProgress();
    }
    return {
      version: 1,
      lastHref: typeof data.lastHref === "string" ? data.lastHref : null,
      lastReadAt: typeof data.lastReadAt === "number" ? data.lastReadAt : null,
      read: data.read as ProgressData["read"],
    };
  } catch {
    return emptyProgress();
  }
}

let cached: ProgressData | null = null;
const listeners = new Set<() => void>();
let storageListenerBound = false;

function load(): ProgressData {
  if (cached) return cached;
  cached = parseProgress(storage()?.getItem(STORAGE_KEY) ?? null);
  return cached;
}

function notify() {
  for (const cb of listeners) cb();
}

function persist(data: ProgressData) {
  cached = data;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Quota / private mode: progress lives only in memory for this session.
  }
  notify();
}

function bindCrossTabSync() {
  if (storageListenerBound || typeof window === "undefined") return;
  storageListenerBound = true;
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    cached = parseProgress(e.newValue);
    notify();
  });
}

/** Idempotent: re-marking a read slide only updates the resume pointer. */
export function markSlideRead(bookSlug: string, href: string): void {
  const data = load();
  const already = data.read[bookSlug]?.[href] !== undefined;
  const now = Date.now();
  persist({
    version: 1,
    lastHref: href,
    lastReadAt: now,
    read: already
      ? data.read
      : {
          ...data.read,
          [bookSlug]: { ...data.read[bookSlug], [href]: now },
        },
  });
}

export function getLastRead(): { href: string; at: number } | null {
  const data = load();
  return data.lastHref && data.lastReadAt
    ? { href: data.lastHref, at: data.lastReadAt }
    : null;
}

function subscribe(cb: () => void): () => void {
  bindCrossTabSync();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ProgressData {
  return load();
}

function getServerSnapshot(): ProgressData | null {
  return null;
}

/**
 * Live progress for client components. Server HTML and the hydration render
 * see `null` (neutral zero-state — no mismatch); immediately after hydration
 * the real snapshot applies, and it stays in sync with writes from this tab
 * and, via the `storage` event, other tabs.
 */
export function useProgress(): ProgressData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
