import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react";
import { getNoticeBySlug, getNoticesInSeries } from "@/lib/notices";
import {
  NOTICE_STATE_LABEL,
  formatNoticeDate,
  formatNoticeDateTime,
  formatVacancies,
  noticeState,
} from "@/lib/notice-format";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";
import { NoticePlateRow } from "@/components/gazette/notice-plate-row";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

const KIND_LABEL: Record<string, string> = {
  recruitment: "Recruitment",
  result: "Result",
  "admit-card": "Admit card",
  "answer-key": "Answer key",
  admission: "Admission",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const notice = await getNoticeBySlug(slug);
  if (!notice) return {};
  return {
    title: notice.title,
    description: notice.summary,
    openGraph: {
      title: notice.title,
      description: notice.summary,
      type: "article",
    },
  };
}

export default async function NoticePage({ params }: Params) {
  const { slug } = await params;
  const notice = await getNoticeBySlug(slug);
  if (!notice) notFound();

  const series = await getNoticesInSeries(notice.series_slug, notice.slug);
  const state = noticeState(notice);

  // JobPosting structured data — the fields search engines actually use
  // for Indian government recruitment listings.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: notice.title,
    description: notice.summary,
    datePosted: notice.created_at,
    validThrough: notice.apply_last_date ?? undefined,
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "GovernmentOrganization",
      name: notice.department,
      sameAs: notice.official_url,
    },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
    directApply: false,
    url: notice.official_url,
  };

  return (
    <article className="mx-auto max-w-6xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Masthead ──────────────────────────────────────────────────── */}
      <Reveal>
        <Link
          href="/gazette"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" strokeWidth={1.5} />
          Gazette
        </Link>
        <p className="eyebrow mt-8">{notice.department}</p>
        <h1 className="mt-4 max-w-[26ch] text-4xl leading-[1.05] tracking-tight text-ink md:text-5xl">
          {notice.title}
        </h1>

        {/* Meta plate — the notice's own stamp row */}
        <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line text-sm sm:grid-cols-4">
          {[
            ["Filed on", formatNoticeDate(notice.created_at)],
            ["Notice type", KIND_LABEL[notice.kind] ?? notice.kind],
            ["Apply via", notice.apply_mode === "online" ? "Online form" : "Offline form"],
            [
              "Vacancies",
              notice.vacancy_count ? `${formatVacancies(notice.vacancy_count)} posts` : "Not stated",
            ],
          ].map(([label, value]) => (
            <div key={label} className="bg-elevated px-4 py-3">
              <dt className="eyebrow text-[0.5625rem]">{label}</dt>
              <dd className="mt-1.5 tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.625rem] tracking-[0.12em] uppercase">
          <span
            className={cn(
              "rounded-full border px-2.5 py-1",
              state === "soon" && "border-accent/60 text-accent-strong",
              state === "live" && "border-line text-ink-soft",
              state === "closed" && "border-line text-ink-faint"
            )}
          >
            {NOTICE_STATE_LABEL[state]}
          </span>
          {notice.apply_last_date ? (
            <span className="tabular-nums text-ink-faint">
              Last date {formatNoticeDateTime(notice.apply_last_date)} IST
            </span>
          ) : null}
        </div>
      </Reveal>

      {/* ── The brief ─────────────────────────────────────────────────── */}
      <Reveal className="mt-16 max-w-[68ch]">
        <p className="eyebrow">The brief</p>
        <p className="mt-5 text-lg leading-[1.85] text-ink">{notice.summary}</p>
      </Reveal>

      {/* ── At a glance ───────────────────────────────────────────────── */}
      {notice.facts.length > 0 ? (
        <Reveal className="mt-14 max-w-[68ch]">
          <p className="eyebrow">At a glance</p>
          <dl className="mt-5 border-t border-line">
            {notice.facts.map((fact) => (
              <div
                key={fact.label}
                className="grid grid-cols-[1fr] gap-1 border-b border-line py-3.5 sm:grid-cols-[10rem_1fr] sm:gap-x-8"
              >
                <dt className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint uppercase sm:pt-1">
                  {fact.label}
                </dt>
                <dd className="text-sm leading-relaxed text-ink sm:text-base">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      ) : null}

      {/* ── Join now ──────────────────────────────────────────────────── */}
      <Reveal className="mt-16">
        <div className="max-w-[68ch] border border-accent/40 bg-accent-soft px-6 py-6 sm:px-8">
          <p className="eyebrow">Ready to apply</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {state === "closed"
              ? "The application window has closed on the official portal — check the notice board there for follow-up rounds."
              : "Applications are handled on the official government portal only. Read the official notification there before you apply."}
          </p>
          <a
            href={notice.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex min-h-12 items-center gap-2.5 bg-ink px-7 text-sm text-paper transition-colors duration-300 hover:bg-accent-strong"
          >
            Join now
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
            />
          </a>
          <p className="mt-4 flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.1em] text-ink-faint">
            <ShieldCheck className="size-3.5" strokeWidth={1.5} />
            Official portal · {new URL(notice.official_url).hostname}
          </p>
        </div>
      </Reveal>

      {/* ── Related updates in this series ───────────────────────────── */}
      {series.length > 0 ? (
        <section className="mt-24">
          <Reveal>
            <p className="eyebrow">Updates in this series</p>
          </Reveal>
          <div className="mt-6 border-b border-line">
            {series.map((n) => (
              <NoticePlateRow key={n.slug} notice={n} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <Reveal className="mt-20 max-w-[68ch] border-t border-line pt-6">
        <p className="font-mono text-[0.625rem] leading-relaxed tracking-[0.06em] text-ink-faint">
          DISCLAIMER · The Gazette reprints public recruitment announcements
          for reference only and never hosts applications. Every entry links
          to the official government portal. Details can change — always
          confirm against the official notification before paying any fee or
          submitting a form. Atelier is not affiliated with any government
          body.
        </p>
      </Reveal>
    </article>
  );
}
