import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getNotices } from "@/lib/notices";
import { formatNoticeDate } from "@/lib/notice-format";
import { GazetteBoard } from "@/components/gazette/gazette-board";
import { FlagMark } from "@/components/gazette/flag-mark";
import { Reveal } from "@/components/motion/reveal";
import { GUIDES } from "@/lib/guides";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  openGraphFor,
  twitterFor,
} from "@/lib/site";

const HOME_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: openGraphFor({ path: "/", title: HOME_TITLE }),
  twitter: twitterFor({ title: HOME_TITLE }),
};

// Editorial freshness: the front page revalidates at most every minute.
export const revalidate = 60;

const STEPS = [
  {
    title: "Filed daily",
    body: "The plate is refreshed every morning from public recruitment announcements — new openings appear as they are announced.",
  },
  {
    title: "Brief, then facts",
    body: "Every notice opens to a short description and the details that matter: vacancies, fees, age limit, last date.",
  },
  {
    title: "Join at the source",
    body: "The Join now button always leads to the official government portal. We host no forms, no fees, no downloads.",
  },
];

export default async function HomePage() {
  const notices = await getNotices();
  const latest = notices.slice(0, 8);
  const today = formatNoticeDate(new Date().toISOString());

  // Publication-level structured data: tells search engines what this
  // site is, what it is called, and which URL is canonical for it.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en-IN",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/og.png`,
        description: SITE_TAGLINE,
      },
    ],
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── Front-page masthead ───────────────────────────────────────── */}
      <section className="relative isolate mx-auto max-w-6xl px-6 pb-16 pt-24 md:px-10 md:pt-32">
        <Reveal>
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-6">
            <p className="eyebrow">Government job openings · India</p>
            <p className="font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint uppercase tabular-nums">
              Edition of {today} · IST
            </p>
          </div>

          {/* The flag hangs from the rule, its left edge on the text
              margin, its cloth waving toward the free right end and
              dissolving into the paper. */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 -z-10 w-[20rem] opacity-30 md:w-[32rem] md:opacity-40 dark:opacity-25 dark:saturate-125"
            >
              <div className="flag-sway">
                <FlagMark className="block w-full drop-shadow-[0_26px_44px_rgba(28,25,20,0.16)]" />
              </div>
              {/* Fades the cloth into the paper on the right and bottom
                  only, keeping the left edge crisp against the margin. */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(125% 120% at 0% 0%, transparent 42%, var(--paper) 84%)",
                }}
              />
            </div>

            <h1 className="mt-10 max-w-[20ch] text-display">
              Openings, in the order they were announced
            </h1>
            <p className="mt-8 max-w-[56ch] text-lg leading-relaxed text-ink-soft">
              A daily plate of government job notifications — departments,
              vacancies, last dates, at a glance. No filters, no forms: open a
              notice for its brief, then join through the official government
              website.
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
                href="/about"
                className="inline-flex min-h-11 items-center rounded-full border border-line px-7 text-sm text-ink-soft transition-colors duration-300 hover:border-accent hover:text-ink"
              >
                How it works
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Latest notices ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <Reveal>
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="eyebrow">Latest filings</h2>
            <Link
              href="/gazette"
              className="font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint uppercase transition-colors duration-300 hover:text-ink"
            >
              Full plate · {notices.length} notices
            </Link>
          </div>
        </Reveal>
        <GazetteBoard initialNotices={latest} />
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10">
          <p className="eyebrow">How this works</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={Math.min(i * 0.08, 0.2)}>
                <div className="h-full border-t border-line pt-6">
                  <p className="font-mono text-[0.625rem] tracking-[0.18em] text-accent-strong">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 font-display text-xl tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          {/* ── Reference desk ─────────────────────────────────────────── */}
          <Reveal className="mt-24">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <p className="eyebrow">Reference desk</p>
              <Link
                href="/guides"
                className="font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint uppercase transition-colors duration-300 hover:text-ink"
              >
                All guides
              </Link>
            </div>
            <ul>
              {GUIDES.slice(0, 3).map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="group flex flex-col gap-2 border-b border-line py-6 transition-colors duration-300 hover:bg-accent-soft/40 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8"
                  >
                    <span>
                      <span className="block font-display text-lg text-ink">
                        {guide.title}
                      </span>
                      <span className="mt-1 block max-w-[56ch] text-sm text-ink-soft">
                        {guide.description}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 font-mono text-[0.625rem] tracking-[0.12em] text-ink-faint uppercase">
                      {guide.readingMinutes} min
                      <ArrowUpRight
                        className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={1.5}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-16 max-w-[74ch] text-xs leading-relaxed text-ink-faint">
              {SITE_NAME} is an independent publication. Briefs are written here
              from each department&rsquo;s own announcement; the official
              notification always governs and every entry links to it. We host no
              applications and charge nothing. See the{" "}
              <Link href="/disclaimer" className="underline underline-offset-4 hover:text-ink">
                disclaimer
              </Link>
              ,{" "}
              <Link href="/editorial" className="underline underline-offset-4 hover:text-ink">
                editorial policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-ink">
                privacy policy
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
