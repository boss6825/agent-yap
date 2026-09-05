"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

export const THEME_IDS = [
  "plain-light",
  "plain-dark",
  "sepia-light",
  "sepia-dark",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeFamily = "plain" | "sepia";

export const THEME_STORAGE_KEY = "yap-theme";
export const LEGACY_THEME_STORAGE_KEY = "yap-reader-theme";
export const SITE_THEME_STORAGE_KEY = "theme";

const LEGACY_MAP: Record<string, ThemeId> = {
  light: "plain-light",
  dark: "plain-dark",
  sepia: "sepia-light",
  "sepia-dark": "sepia-dark",
  "plain-light": "plain-light",
  "plain-dark": "plain-dark",
  "sepia-light": "sepia-light",
};

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" && (THEME_IDS as readonly string[]).includes(value)
  );
}

export function familyForTheme(theme: ThemeId): ThemeFamily {
  return theme === "sepia-light" || theme === "sepia-dark" ? "sepia" : "plain";
}

/** Older CSS files still key off light | dark | sepia | sepia-dark. */
export function legacyThemeId(theme: ThemeId): "light" | "dark" | "sepia" | "sepia-dark" {
  switch (theme) {
    case "plain-dark":
      return "dark";
    case "sepia-light":
      return "sepia";
    case "sepia-dark":
      return "sepia-dark";
    default:
      return "light";
  }
}

export function nextTheme(theme: ThemeId): ThemeId {
  const i = THEME_IDS.indexOf(theme);
  return THEME_IDS[(i + 1) % THEME_IDS.length];
}

export function parseStoredTheme(value: string | null): ThemeId | null {
  if (!value) return null;
  if (isThemeId(value)) return value;
  return LEGACY_MAP[value] ?? null;
}

export function applyTheme(theme: ThemeId, root: HTMLElement = document.documentElement) {
  const family = familyForTheme(theme);
  root.setAttribute("data-theme", theme);
  root.setAttribute("data-theme-family", family);
  root.setAttribute("data-reader-theme", legacyThemeId(theme));
  root.setAttribute("data-reader-family", family === "sepia" ? "paper" : "system");
  root.style.setProperty("--reader-family", family);
}

function readStoredTheme(): ThemeId {
  try {
    const next =
      parseStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY)) ??
      parseStoredTheme(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY));
    if (next) return next;
  } catch {
    // Private mode / blocked storage.
  }
  return "plain-light";
}

function restoreSiteTheme() {
  try {
    const site = window.localStorage.getItem(SITE_THEME_STORAGE_KEY);
    const dark =
      site === "dark" ||
      (site !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    document.documentElement.removeAttribute("data-theme-family");
    document.documentElement.removeAttribute("data-reader-theme");
    document.documentElement.removeAttribute("data-reader-family");
    document.documentElement.style.removeProperty("--reader-family");
  } catch {
    document.documentElement.setAttribute("data-theme", "light");
  }
}

type ThemeContextValue = {
  theme: ThemeId;
  family: ThemeFamily;
  setTheme: (theme: ThemeId) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeListeners = new Set<() => void>();

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY || e.key === LEGACY_THEME_STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function emitTheme() {
  for (const cb of themeListeners) cb();
}

function persistTheme(theme: ThemeId) {
  applyTheme(theme, document.documentElement);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, legacyThemeId(theme));
  } catch {
    // Theme still applies for this session.
  }
  emitTheme();
}

function getServerTheme(): ThemeId {
  return "plain-light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    getServerTheme,
  );

  useEffect(() => {
    persistTheme(theme);
    return () => {
      restoreSiteTheme();
    };
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    persistTheme(next);
  }, []);

  const cycleTheme = useCallback(() => {
    persistTheme(nextTheme(theme));
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      family: familyForTheme(theme),
      setTheme,
      cycleTheme,
    }),
    [theme, setTheme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export const THEME_LABEL: Record<ThemeId, string> = {
  "plain-light": "Plain light",
  "plain-dark": "Plain dark",
  "sepia-light": "Sepia light",
  "sepia-dark": "Sepia dark",
};

/**
 * Compact 4-mode control. Default icon is the Paper sun for plain-light.
 * Other agents only need to keep using this — no JSX changes for tokens.
 */
export function ThemeSwitcher({ className = "reader-icon-btn" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="theme-switcher" ref={wrapRef}>
      <button
        type="button"
        className={className}
        aria-label={`Theme: ${THEME_LABEL[theme]}. Open theme menu`}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Theme: ${THEME_LABEL[theme]}`}
        onClick={() => setOpen((v) => !v)}
      >
        <ThemeGlyph theme={theme} />
      </button>
      {open ? (
        <ul className="theme-switcher__menu" role="listbox" aria-label="Color theme">
          {THEME_IDS.map((id) => (
            <li key={id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={id === theme}
                className={
                  id === theme
                    ? "theme-switcher__option theme-switcher__option--on"
                    : "theme-switcher__option"
                }
                onClick={() => {
                  setTheme(id);
                  setOpen(false);
                }}
              >
                <ThemeGlyph theme={id} />
                {THEME_LABEL[id]}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ThemeGlyph({ theme }: { theme: ThemeId }) {
  if (theme === "plain-dark" || theme === "sepia-dark") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a.75.75 0 0 0-.9-1A10.1 10.1 0 1 0 21.4 15.6a.75.75 0 0 0-1-.9Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (theme === "sepia-light") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v13.2H8.2A2.2 2.2 0 0 1 6 18V4.5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M6 18a2.2 2.2 0 0 1 2.2-2.2H18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return <SunGlyph />;
}

export function SunGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.4" y1="5.4" x2="7.1" y2="7.1" />
        <line x1="16.9" y1="16.9" x2="18.6" y2="18.6" />
        <line x1="16.9" y1="7.1" x2="18.6" y2="5.4" />
        <line x1="5.4" y1="18.6" x2="7.1" y2="16.9" />
      </g>
    </svg>
  );
}

/**
 * Inline boot script for the reader layout. Prevents a flash of the wrong
 * palette before ThemeProvider hydrates. Maps the legacy storage key too.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var k="yap-theme";var t=localStorage.getItem(k)||localStorage.getItem("yap-reader-theme");var map={light:"plain-light",dark:"plain-dark",sepia:"sepia-light","sepia-dark":"sepia-dark","plain-light":"plain-light","plain-dark":"plain-dark","sepia-light":"sepia-light"};if(!t||(t!=="plain-light"&&t!=="plain-dark"&&t!=="sepia-light"&&t!=="sepia-dark"))t=map[t]||"plain-light";var f=(t==="sepia-light"||t==="sepia-dark")?"sepia":"plain";var l=t==="plain-dark"?"dark":t==="sepia-light"?"sepia":t==="sepia-dark"?"sepia-dark":"light";var r=document.documentElement;r.setAttribute("data-theme",t);r.setAttribute("data-theme-family",f);r.setAttribute("data-reader-theme",l);r.setAttribute("data-reader-family",f==="sepia"?"paper":"system");r.style.setProperty("--reader-family",f);}catch(e){}})();`;
