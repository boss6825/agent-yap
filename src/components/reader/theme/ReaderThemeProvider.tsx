"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  READER_THEME_STORAGE_KEY,
  applyReaderTheme,
  isReaderTheme,
  nextReaderTheme,
  type ReaderTheme,
} from "@/components/reader/theme/theme-types";

type ReaderThemeContextValue = {
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
  cycleTheme: () => void;
};

const ReaderThemeContext = createContext<ReaderThemeContextValue | null>(null);

function readStoredTheme(): ReaderTheme {
  try {
    const stored = window.localStorage.getItem(READER_THEME_STORAGE_KEY);
    if (isReaderTheme(stored)) return stored;
  } catch {
    // Private mode / blocked storage.
  }
  return "light";
}

const themeListeners = new Set<() => void>();

function subscribeTheme(onStoreChange: () => void) {
  themeListeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === READER_THEME_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function persistTheme(theme: ReaderTheme) {
  applyReaderTheme(theme, document.documentElement);
  try {
    window.localStorage.setItem(READER_THEME_STORAGE_KEY, theme);
  } catch {
    // Theme still applies for this session.
  }
  for (const cb of themeListeners) cb();
}

export function ReaderThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    () => "light" as const,
  );

  const setTheme = useCallback((next: ReaderTheme) => {
    persistTheme(next);
  }, []);

  const cycleTheme = useCallback(() => {
    persistTheme(nextReaderTheme(theme));
  }, [theme]);

  const value = useMemo(
    () => ({ theme, setTheme, cycleTheme }),
    [theme, setTheme, cycleTheme],
  );

  return (
    <ReaderThemeContext.Provider value={value}>
      {children}
    </ReaderThemeContext.Provider>
  );
}

export function useReaderTheme(): ReaderThemeContextValue {
  const ctx = useContext(ReaderThemeContext);
  if (!ctx) {
    throw new Error("useReaderTheme must be used within ReaderThemeProvider");
  }
  return ctx;
}

const THEME_LABEL: Record<ReaderTheme, string> = {
  light: "Light",
  dark: "Dark",
  sepia: "Sepia",
  "sepia-dark": "Sepia dark",
};

export function ReaderThemeCycleButton({
  className = "sys-reader__icon-btn",
}: {
  className?: string;
}) {
  const { theme, cycleTheme } = useReaderTheme();
  const next = nextReaderTheme(theme);
  return (
    <button
      type="button"
      className={className}
      onClick={cycleTheme}
      aria-label={`Theme: ${THEME_LABEL[theme]}. Switch to ${THEME_LABEL[next]}`}
      title={`Theme: ${THEME_LABEL[theme]}`}
    >
      <ThemeGlyph theme={theme} />
    </button>
  );
}

function ThemeGlyph({ theme }: { theme: ReaderTheme }) {
  if (theme === "dark" || theme === "sepia-dark") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a.75.75 0 0 0-.9-1A10.1 10.1 0 1 0 21.4 15.6a.75.75 0 0 0-1-.9Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (theme === "sepia") {
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
