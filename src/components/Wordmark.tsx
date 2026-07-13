import Link from "next/link";

/** The Agent YAP wordmark: quiet Apple-style text mark. */
export function Wordmark({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const text =
    size === "lg" ? "text-[21px]" : size === "sm" ? "text-[15px]" : "text-[17px]";

  const inner = (
    <span
      className={`font-display font-semibold tracking-[-0.2px] text-ink ${text}`}
    >
      Agent YAP
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex transition-opacity hover:opacity-70">
      {inner}
    </Link>
  );
}
