import { HeroStage } from "@/components/three/hero-stage";
import { StaggeredText } from "@/components/motion/staggered-text";
import { ArrowDown } from "lucide-react";

export default function HomePage() {
  return (
    <article>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="grain relative flex min-h-[100svh] flex-col justify-center overflow-hidden">
        {/* 3D monolith cluster, lazy + capability-gated, behind content */}
        <div aria-hidden="true" className="absolute inset-0">
          <HeroStage />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 md:px-10">
          <p className="eyebrow">
            Journal · Issue Nº 01 — November MMXXVI
          </p>

          <StaggeredText
            as="h1"
            text="A spatial journal for patient ideas"
            delay={0.25}
            className="text-display mt-6 max-w-[16ch]"
          />

          <p className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ink-soft">
            Essays on design, engineering, and the quiet craft of building
            digital things that last — set in type, arranged in space, and
            lit like a gallery.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4">
            <a
              href="/journal"
              className="group inline-flex min-h-11 items-center gap-3 rounded-full bg-ink px-7 text-sm text-paper transition-colors duration-300 hover:bg-accent-strong"
            >
              Read the journal
            </a>
            <a
              href="/about"
              className="inline-flex min-h-11 items-center rounded-full border border-line px-7 text-sm text-ink-soft transition-colors duration-300 hover:border-accent hover:text-ink"
            >
              About the atelier
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
        >
          <span className="eyebrow text-[0.5625rem]">Scroll</span>
          <span className="relative block h-12 w-px overflow-hidden bg-line">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-hint bg-accent" />
          </span>
          <ArrowDown className="size-3 text-ink-faint" strokeWidth={1.5} />
        </div>
      </section>

      {/* ── Epigraph ───────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
          <p className="font-display text-2xl leading-snug text-ink-soft italic md:text-3xl">
            “The page is a room. The type is furniture. A journal worth
            reading should feel like standing inside it.”
          </p>
          <p className="eyebrow mt-8">From the editor’s foreword</p>
        </div>
      </section>
    </article>
  );
}
