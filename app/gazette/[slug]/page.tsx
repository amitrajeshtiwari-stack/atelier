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
import { applicationChecklist } from "@/lib/notice-guidance";
import { SITE_NAME, SITE_URL, openGraphFor, twitterFor } from "@/lib/site";

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
  if (!notice) return { title: "Notice not found", robots: { index: false } };

  const path = `/gazette/${notice.slug}`;
  const description = notice.summary.slice(0, 300);

  return {
    title: notice.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...openGraphFor({
        path,
        title: notice.title,
        description,
        type: "article",
      }),
      publishedTime: notice.created_at,
      modifiedTime: notice.updated_at,
    },
    twitter: twitterFor({ title: notice.title, description }),
  };
}

export default async function NoticePage({ params }: Params) {
  const { slug } = await params;
  const notice = await getNoticeBySlug(slug);
  if (!notice) notFound();

  const series = await getNoticesInSeries(notice.series_slug, notice.slug);
  const state = noticeState(notice);

  // Structured data: a JobPosting for recruitment notices (which is what
  // Google can surface), otherwise a plain Article. Both must carry a real
  // location and a canonical URL — an incomplete JobPosting is worse than
  // none at all.
  const noticeUrl = `${SITE_URL}/gazette/${notice.slug}`;

  const jsonLd =
    notice.kind === "recruitment"
      ? {
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
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressCountry: "IN",
            },
          },
          applicantLocationRequirements: {
            "@type": "Country",
            name: "India",
          },
          directApply: false,
          url: noticeUrl,
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: notice.title,
          description: notice.summary,
          datePublished: notice.created_at,
          dateModified: notice.updated_at,
          inLanguage: "en-IN",
          mainEntityOfPage: noticeUrl,
          url: noticeUrl,
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
          },
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

      {/* ── Before you apply ──────────────────────────────────────────── */}
      <Reveal className="mt-14 max-w-[68ch]">
        <p className="eyebrow">
          {notice.kind === "recruitment" ? "Before you apply" : "Before you use it"}
        </p>
        <ul className="mt-5 border-t border-line">
          {applicationChecklist({
            kind: notice.kind,
            applyMode: notice.apply_mode,
            hasFee: notice.facts.some(
              (fact) => /fee/i.test(fact.label) && !/\bRs\s?0\b/i.test(fact.value)
            ),
          }).map((item) => (
            <li
              key={item}
              className="grid grid-cols-[1.25rem_1fr] gap-x-4 border-b border-line py-3.5 text-sm leading-relaxed text-ink-soft sm:text-base"
            >
              <span aria-hidden="true" className="pt-0.5 font-mono text-xs text-accent">
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Reveal>

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

      {/* ── About this filing ────────────────────────────────────────── */}
      <Reveal className="mt-20 max-w-[68ch] border-t border-line pt-8">
        <p className="eyebrow">About this filing</p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Filed on {formatNoticeDate(notice.created_at)} from{" "}
          {notice.department}&rsquo;s own announcement. The brief, the checklist
          and the summary on this page are written by {SITE_NAME}; the official
          notification remains the record of authority and prevails wherever the
          two differ.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          {SITE_NAME} hosts no applications and charges nothing. If a detail
          here is wrong,{" "}
          <Link href="/contact" className="text-ink underline decoration-line underline-offset-4">
            tell us
          </Link>{" "}
          and we will correct it under our{" "}
          <Link href="/editorial" className="text-ink underline decoration-line underline-offset-4">
            editorial policy
          </Link>
          . See also the{" "}
          <Link href="/disclaimer" className="text-ink underline decoration-line underline-offset-4">
            disclaimer
          </Link>
          .
        </p>
      </Reveal>
    </article>
  );
}
