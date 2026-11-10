import type { Metadata } from "next";
import { DEMO_AUTHOR } from "@/lib/demo-content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "The atelier behind Atelier — a one-editor journal on design, engineering, and patient software.",
};

/** "m.calloway" → "M. Calloway" */
const displayName = (username: string) =>
  username
    .split(/[.\-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const PRINCIPLES = [
  {
    title: "The page is a room",
    body: "Every layout is a room with doors and corridors. If the reader gets lost, the architecture failed — not the reader.",
  },
  {
    title: "Motion means something",
    body: "Movement explains: weight, consequence, origin. Decoration that animates for its own sake is noise with a budget.",
  },
  {
    title: "Slow by choice",
    body: "No infinite feeds, no autoplay, no dark patterns. The atelier ships once a month and answers every letter.",
  },
  {
    title: "Print discipline, web honesty",
    body: "Grid, rhythm, and margins learned from print; live data, realtime, and reachability kept from the web.",
  },
];

export default function AboutPage() {
  const name = displayName(DEMO_AUTHOR.username);
  const bio = DEMO_AUTHOR.bio ?? "Editor of Atelier.";

  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="About the Atelier"
        title="A one-editor journal with a gallery's manners"
        lede="Atelier is written, typeset, and lit by a single hand. Essays on design, engineering, and the quiet craft of building digital things that last."
      />

      {/* ── The editor ────────────────────────────────────────────────── */}
      <Reveal className="mt-20">
        <div className="grid items-start gap-10 rounded-[var(--radius-card)] border border-line bg-elevated p-8 shadow-soft md:grid-cols-[auto_1fr] md:p-10">
          <div className="flex size-20 items-center justify-center rounded-full border border-accent/50 bg-accent-soft font-display text-2xl text-accent-strong">
            {name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </div>
          <div>
            <p className="font-display text-2xl tracking-tight text-ink">
              {name}
            </p>
            <p className="eyebrow mt-1">Editor-in-chief</p>
            <div className="mt-5 max-w-[62ch] space-y-4 text-[0.9375rem] leading-relaxed text-ink-soft">
              {bio
                .split("\n\n")
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
            <p className="mt-6 text-sm text-ink-faint">
              Letters welcome — editor@atelier.press
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── Principles ────────────────────────────────────────────────── */}
      <section className="mt-24">
        <p className="eyebrow">House rules</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p.title} delay={Math.min(i * 0.06, 0.2)}>
              <div className="h-full rounded-[var(--radius-card)] border border-line bg-elevated p-7 shadow-soft">
                <h3 className="font-display text-xl tracking-tight text-ink">
                  {p.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Colophon ──────────────────────────────────────────────────── */}
      <Reveal className="mt-24">
        <div className="rounded-[var(--radius-card)] border border-line p-8 md:p-10">
          <p className="eyebrow">Colophon</p>
          <p className="mt-5 max-w-[64ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            Set in <span className="text-ink">Fraunces</span> and{" "}
            <span className="text-ink">Geist</span>. Scenes modeled in{" "}
            <span className="text-ink">Three.js</span>, lit with procedural
            studio lighting, and paused the moment you look away. The journal
            runs on <span className="text-ink">Next.js</span> and{" "}
            <span className="text-ink">Supabase</span> — Postgres with
            row-level security, realtime publication for the live feed, and
            storage for the covers. Everything you read is committed, versioned,
            and reproducible.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
