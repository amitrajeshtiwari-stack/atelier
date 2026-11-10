"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/**
 * Table of contents for the article rail. IntersectionObserver decides
 * the active heading (nearest heading above the fold line); state changes
 * only ever happen inside observer callbacks, never in the effect body.
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const visible = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visible.delete(entry.target.id);
          }
        }
        // The topmost currently-visible heading wins.
        let best: { id: string; top: number } | null = null;
        for (const [id, top] of visible) {
          if (!best || top < best.top) best = { id, top };
        }
        if (best) setActiveId(best.id);
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
    );

    for (const el of targets) io.observe(el);
    return () => io.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="eyebrow text-[0.5625rem]">Contents</p>
      <ol className="mt-4 space-y-2.5 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id} className={cn(heading.level === 3 && "pl-4")}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "-ml-px block border-l py-0.5 pl-4 leading-snug transition-colors duration-200",
                activeId === heading.id
                  ? "border-accent font-medium text-ink"
                  : "border-transparent text-ink-faint hover:text-ink"
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
