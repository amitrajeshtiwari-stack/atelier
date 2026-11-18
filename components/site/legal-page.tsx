import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";

/**
 * The house layout for policy pages: eyebrow, display heading, standing
 * date, a numbered index on wide screens, and a measured text column.
 * Keeping these pages on one layout is what makes them read as part of
 * the publication rather than boilerplate bolted on for a reviewer.
 */
export function LegalPage({
  eyebrow,
  title,
  lede,
  updated,
  index,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  updated: string;
  index?: Array<{ id: string; label: string }>;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-[26ch] text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
          {title}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-ink-soft">
          {lede}
        </p>
        <p className="mt-8 font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint uppercase tabular-nums">
          Last updated {updated}
        </p>
      </Reveal>

      <div
        className={`mt-14 border-t border-line pt-12 ${
          index && index.length > 0
            ? "gap-16 md:grid md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]"
            : ""
        }`}
      >
        {index && index.length > 0 ? (
          <nav aria-label="On this page" className="hidden md:block">
            <p className="eyebrow text-[0.625rem]">On this page</p>
            <ol className="mt-4 space-y-2.5 text-sm">
              {index.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex gap-3 text-ink-soft transition-colors duration-200 hover:text-ink"
                  >
                    <span className="pt-0.5 font-mono text-[0.625rem] text-ink-faint tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className="legal-prose max-w-[68ch]">{children}</div>
      </div>
    </article>
  );
}
