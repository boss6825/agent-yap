"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Persistence for decorative shader motion.
 *
 * localStorage `yap-shader-motion`:
 *   "on"  — user explicitly wants animations
 *   "off" — no-distraction (static reading, no moving backgrounds)
 *   unset — default ON, unless `prefers-reduced-motion: reduce` (auto-off)
 *
 * An explicit "on" wins over reduced motion, because the navbar control is
 * the product requirement.
 */
export const SHADER_MOTION_STORAGE_KEY = "yap-shader-motion";

const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

function readStored(): "on" | "off" | null {
  try {
    const value = window.localStorage.getItem(SHADER_MOTION_STORAGE_KEY);
    if (value === "on" || value === "off") return value;
  } catch {
    // Private mode / blocked storage.
  }
  return null;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function computeAnimationsOn(): boolean {
  const stored = readStored();
  if (stored === "on") return true;
  if (stored === "off") return false;
  return !prefersReducedMotion();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === SHADER_MOTION_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  let mq: MediaQueryList | null = null;
  const onMq = () => onStoreChange();
  try {
    mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", onMq);
  } catch {
    mq = null;
  }
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
    mq?.removeEventListener("change", onMq);
  };
}

function persist(next: "on" | "off") {
  try {
    window.localStorage.setItem(SHADER_MOTION_STORAGE_KEY, next);
  } catch {
    // Preference still applies for this session via the in-memory emit.
  }
  emit();
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function useShaderMotion() {
  const animationsOn = useSyncExternalStore(
    subscribe,
    computeAnimationsOn,
    () => true,
  );
  const hydrated = useHydrated();

  const setAnimationsOn = useCallback((next: boolean) => {
    persist(next ? "on" : "off");
  }, []);

  const setNoDistraction = useCallback((next: boolean) => {
    persist(next ? "off" : "on");
  }, []);

  const toggleNoDistraction = useCallback(() => {
    persist(computeAnimationsOn() ? "off" : "on");
  }, []);

  return {
    hydrated,
    animationsOn,
    noDistraction: !animationsOn,
    setAnimationsOn,
    setNoDistraction,
    toggleNoDistraction,
  };
}

export function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener("visibilitychange", onChange);
      return () => document.removeEventListener("visibilitychange", onChange);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}
