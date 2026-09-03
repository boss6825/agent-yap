"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Every tabbable control, in DOM order. `disabled` and `inert` subtrees are
 * excluded by the selector; the offsetParent check drops anything a parent has
 * hidden, which is what keeps a collapsed section from swallowing the trap.
 */
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function tabbableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
}

/** Centered, animated modal with backdrop + Escape-to-close + scroll lock. */
export function Modal({
  open,
  onClose,
  children,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  /** Whatever had focus when the dialog opened, so it can be handed back. */
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      // Without this, Tab leaves an `aria-modal` dialog and walks the page
      // behind it — the content a modal exists to be in front of.
      const root = dialogRef.current;
      if (!root) return;
      const items = tabbableIn(root);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (!root.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Return focus to the trigger. The panels focus their own input on open,
      // so the browser has nowhere sensible to send focus on close otherwise —
      // it falls back to <body> and the keyboard user loses their place.
      returnFocusRef.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="relative mt-[8vh] flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-card bg-canvas text-ink shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
