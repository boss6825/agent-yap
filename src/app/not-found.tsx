import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="glass-light fixed inset-x-0 top-0 z-50 h-[52px]">
        <div className="mx-auto flex h-[52px] max-w-[1200px] items-center px-6">
          <Wordmark size="md" />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
          404 — off the deck
        </p>
        <h1 className="mt-4 max-w-[720px] font-display text-[clamp(36px,5.5vw,56px)] font-semibold leading-[1.08] tracking-[-0.015em] [text-wrap:balance]">
          That slide doesn’t exist.
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-[1.47] text-ink-2">
          The page you’re after isn’t part of the knowledge base — but the
          whole field guide is one click away.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-pill bg-blue px-7 py-[13px] text-[17px] text-white transition-transform active:scale-95"
          >
            Back home
          </Link>
          <Link
            href="/read"
            className="inline-flex min-h-11 items-center text-[17px] text-blue hover:underline"
          >
            Start reading →
          </Link>
        </div>
      </main>
    </div>
  );
}
