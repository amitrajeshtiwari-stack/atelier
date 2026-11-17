import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "About — how the Gazette works",
  description:
    "The Gazette is an automated, daily-updated noticeboard of India government job openings. No filters, no forms, no fees — every entry links to the official portal.",
};

const RULES = [
  {
    title: "Official portals only",
    body: "Every Join now button leads to the government's own website — a .gov.in or .nic.in address shown right under the button. We never link you to an agent, a paid downloader, or ourselves.",
  },
  {
    title: "We host nothing",
    body: "No application forms, no fee payments, no PDFs behind a paywall. The Gazette is a noticeboard — the applying happens entirely on the official portal, under that department's own rules.",
  },
  {
    title: "Filed by a machine, checked by a person",
    body: "New openings appear here every morning, drawn from public recruitment announcements. A notice is filed only once its official government link is confirmed — if a link cannot be verified, the opening is skipped, never guessed.",
  },
  {
    title: "No filters, on purpose",
    body: "The plate reads top to bottom like the paper it is. Filters hide things; a gazette's job is to show everything in the order it arrived.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="About the Gazette"
        title="A daily noticeboard for government job seekers"
        lede="One quiet page: every government job opening filed as it is announced, with a brief, the facts, and a door that opens onto the official website."
      />

      {/* ── The guarantee ─────────────────────────────────────────────── */}
      <Reveal className="mt-20">
        <div className="flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-accent/40 bg-accent-soft p-8 md:p-10">
          <ShieldCheck
            className="size-10 shrink-0 text-accent-strong"
            strokeWidth={1.25}
          />
          <div>
            <p className="font-display text-2xl tracking-tight text-ink">
              The visitor&apos;s guarantee
            </p>
            <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
              You will never be asked for money by us, never be sent to a
              middleman, and never be asked to upload a document here. The
              Gazette&apos;s only job is to make sure you hear about the opening
              and reach the official door without getting lost.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ── House rules ───────────────────────────────────────────────── */}
      <section className="mt-24">
        <p className="eyebrow">House rules</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {RULES.map((rule, i) => (
            <Reveal key={rule.title} delay={Math.min(i * 0.06, 0.2)}>
              <div className="h-full rounded-[var(--radius-card)] border border-line bg-elevated p-7 shadow-soft">
                <h3 className="font-display text-xl tracking-tight text-ink">
                  {rule.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {rule.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How the machine works ─────────────────────────────────────── */}
      <Reveal className="mt-24">
        <div className="rounded-[var(--radius-card)] border border-line p-8 md:p-10">
          <p className="eyebrow">Under the hood</p>
          <p className="mt-5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-ink-soft">
            The plate is refreshed every morning, and each notice is arranged
            so the facts an applicant needs sit in one place — last date,
            application fee, age limit, vacancy count. When a last date passes,
            the notice moves to closed, so what you read is what is still open.
            Nothing here needs an account, a subscription, or a fee: the plate
            simply shows the newest openings first, and the archive keeps the
            rest in order.
          </p>
        </div>
      </Reveal>

      {/* ── Disclaimer ────────────────────────────────────────────────── */}
      <Reveal className="mt-20 border-t border-line pt-6">
        <p className="max-w-[74ch] font-mono text-[0.625rem] leading-relaxed tracking-[0.06em] text-ink-faint">
          DISCLAIMER · The Gazette reprints public recruitment announcements
          for reference only. Details can change — always confirm against the
          official notification before paying any fee or submitting a form.
          The Gazette is not affiliated with any government body, and no
          government department endorses this site.
        </p>
      </Reveal>
    </div>
  );
}
