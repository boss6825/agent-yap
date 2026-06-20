import Link from "next/link";

/** The Agent YAP wordmark: a little speech bubble (it "yaps") + the name. */
export function Wordmark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const mark = size === "lg" ? 30 : size === "sm" ? 20 : 24;

  const inner = (
    <span className="inline-flex items-center gap-2">
      <span
        className="grid place-items-center rounded-[8px] bg-lime text-ink sticker"
        style={{ width: mark, height: mark }}
        aria-hidden
      >
        <svg
          width={mark * 0.62}
          height={mark * 0.62}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 5h16v11H9l-4 4v-4H4z"
            fill="currentColor"
            opacity="0.18"
          />
          <path
            d="M4 5h16v11H9l-4 4v-4H4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="10.5" r="1.3" fill="currentColor" />
          <circle cx="12.5" cy="10.5" r="1.3" fill="currentColor" />
          <circle cx="16" cy="10.5" r="1.3" fill="currentColor" />
        </svg>
      </span>
      <span className={`font-display font-bold tracking-tight ${text}`}>
        <span className="text-muted">agent</span>
        <span className="text-paper">YAP</span>
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex transition-opacity hover:opacity-80">
      {inner}
    </Link>
  );
}
