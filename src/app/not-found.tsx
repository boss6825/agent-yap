import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-5 py-4 sm:px-8">
        <Wordmark size="md" />
      </header>
      <main className="bg-dotgrid flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-lime">
          404 — off the deck
        </p>
        <h1 className="mt-4 text-balance font-display text-5xl font-bold tracking-tight sm:text-6xl">
          That slide doesn’t exist.
        </h1>
        <p className="mt-4 max-w-md text-muted">
          The page you’re after isn’t part of the knowledge base — but the whole
          field guide is one click away.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-full bg-lime px-6 font-bold text-ink transition-transform hover:-translate-y-0.5"
          >
            Back home
          </Link>
          <Link
            href="/read"
            className="inline-flex h-12 items-center rounded-full border border-line bg-ink-2 px-6 font-semibold text-paper transition-colors hover:border-lime"
          >
            Start reading →
          </Link>
        </div>
      </main>
    </div>
  );
}
