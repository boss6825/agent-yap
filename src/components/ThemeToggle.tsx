"use client";

/** Icon toggle for the site-wide light/dark theme.
 *
 * Deliberately holds no React state: which icon is visible is decided by
 * plain CSS keyed off `[data-theme]` on <html> (see globals.css). That keeps
 * this in sync with the no-flash boot script in layout.tsx without ever
 * risking a server/client render mismatch. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const html = document.documentElement;
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage unavailable (private mode, etc.) — theme just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle color theme"
      className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-pill transition-colors duration-300 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="theme-icon-sun h-[17px] w-[17px]"
      >
        <path d="M20.4 14.7A8.6 8.6 0 0 1 9.3 3.6a.75.75 0 0 0-.9-1A10.1 10.1 0 1 0 21.4 15.6a.75.75 0 0 0-1-.9Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="theme-icon-moon h-[18px] w-[18px]"
      >
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.55 1.55M18.25 18.25l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.55-1.55M18.25 5.75l1.55-1.55" />
      </svg>
    </button>
  );
}
