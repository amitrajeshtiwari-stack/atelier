import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GUIDES } from "@/lib/guides";
import { Reveal } from "@/components/motion/reveal";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  path: "/guides",
  title: "Guides — reading a recruitment notice properly",
  description:
    "Short, plain-language guides to applying for Indian government jobs: reading a notification, documents, deadlines, fees, age relaxation, admit cards and avoiding scams.",
});

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <Reveal>
        <p className="eyebrow">Reference desk</p>
        <h1 className="mt-5 max-w-[24ch] text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
          How to read the paperwork
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {GUIDES.length} short guides to the part of a government recruitment
          that no notification explains: what a deadline really means, which
          documents decide an application, and how to tell an official notice
          from an imitation. Written here, for readers here.
        </p>
      </Reveal>

      <div className="mt-16 border-t border-line">
        {GUIDES.map((guide, index) => (
          <Reveal key={guide.slug} delay={Math.min(index * 0.03, 0.2)}>
            <Link
              href={`/guides/${guide.slug}`}
              className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 border-b border-line py-7 transition-colors duration-300 hover:bg-accent-soft/40 sm:grid-cols-[3rem_7rem_1fr_auto] sm:gap-x-8 sm:py-8"
            >
              <span className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="eyebrow hidden text-[0.5625rem] sm:block">
                {guide.eyebrow}
              </span>
              <span>
                <span className="block font-display text-xl leading-snug text-ink sm:text-2xl">
                  {guide.title}
                </span>
                <span className="mt-2 block max-w-[60ch] text-sm leading-relaxed text-ink-soft">
                  {guide.lede}
                </span>
              </span>
              <span className="col-start-2 mt-3 flex items-center gap-3 font-mono text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase sm:col-start-auto sm:mt-0">
                {guide.readingMinutes} min
                <ArrowUpRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  strokeWidth={1.5}
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-16 max-w-[58ch]">
        <p className="text-sm leading-relaxed text-ink-soft">
          These guides are general explanations, not legal or recruitment
          advice. Where a guide and an official notification disagree, the
          notification governs — see the{" "}
          <Link
            href="/disclaimer"
            className="text-ink underline decoration-line underline-offset-4"
          >
            disclaimer
          </Link>
          .
        </p>
      </Reveal>
    </div>
  );
}
