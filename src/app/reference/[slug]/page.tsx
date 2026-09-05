import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReference, getReferences } from "@/lib/content";
import { Markdown } from "@/components/Markdown";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * A single-page reference, e.g. `/reference/glossary`.
 *
 * Route is generic on purpose: a reference is any content folder whose
 * `index.md` names a `body` file, so adding the next one is a folder and a
 * frontmatter line, not another page under `src/app`.
 */
export function generateStaticParams() {
  return getReferences().map((reference) => ({ slug: reference.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reference = getReference(slug);
  if (!reference) return {};
  return { title: reference.title, description: reference.description };
}

export default async function ReferencePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const reference = getReference(slug);
  if (!reference) notFound();

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="glass-light sticky top-0 z-50 border-b border-hairline">
        <div className="mx-auto flex h-[52px] max-w-[820px] items-center justify-between gap-4 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-11 shrink-0 items-center font-display text-[17px] font-semibold tracking-[-0.2px] text-ink"
            >
              Agent YAP
            </Link>
            <span aria-hidden className="text-ink-2">
              /
            </span>
            <span className="truncate text-xs text-ink-2">{reference.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/read"
              className="flex h-11 items-center px-2.5 text-xs text-ink-2 transition-colors hover:text-ink"
            >
              Library
            </Link>
            <ThemeToggle className="ml-1 text-ink-2 hover:bg-canvas-2 hover:text-ink" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-5 pb-28 pt-12 sm:px-6 sm:pt-16">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.10em] text-ink-2">
          Reference
        </p>
        <h1 className="m-0 font-display text-[clamp(30px,4.4vw,44px)] font-semibold leading-[1.1] tracking-[-0.01em] text-ink">
          {reference.title}
        </h1>
        <p className="mt-4 max-w-[640px] text-[17px] leading-[1.5] text-ink-2">
          {reference.description}
        </p>

        {/* Anchors are the whole point of this page, so headings get ids and
            `scroll-mt` keeps them clear of the sticky header on a jump. */}
        <div className="mt-12 [&_h1]:scroll-mt-20 [&_h2]:scroll-mt-20 [&_h3]:scroll-mt-20 [&_h4]:scroll-mt-20">
          <Markdown headingIds>{reference.markdown}</Markdown>
        </div>
      </main>
    </div>
  );
}
