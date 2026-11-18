import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Notice not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70svh] max-w-6xl flex-col justify-center px-6 py-24 md:px-10">
      <p className="eyebrow">Error 404 · Filed elsewhere</p>
      <h1 className="mt-6 max-w-[22ch] text-display">
        This page has been withdrawn
      </h1>
      <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
        The notice you asked for is not on the plate. It may have been
        archived once its last date passed, or the address may be mistyped.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/gazette"
          className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-ink px-7 text-sm text-paper transition-colors duration-300 hover:bg-accent-strong"
        >
          Read the full plate
          <ArrowUpRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            strokeWidth={1.5}
          />
        </Link>
        <Link
          href="/archive"
          className="inline-flex min-h-11 items-center rounded-full border border-line px-7 text-sm text-ink-soft transition-colors duration-300 hover:border-accent hover:text-ink"
        >
          Browse the archive
        </Link>
      </div>
    </section>
  );
}
