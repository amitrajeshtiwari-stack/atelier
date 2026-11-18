import type { Metadata } from "next";
import Link from "next/link";
import { getNotices } from "@/lib/notices";
import type { NoticeRow } from "@/lib/schemas";
import {
  NOTICE_STATE_LABEL,
  formatNoticeDate,
  noticeState,
} from "@/lib/notice-format";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { openGraphFor, twitterFor } from "@/lib/site";

const PAGE_TITLE = "Archive — every opening, kept in order";
const PAGE_DESCRIPTION =
  "The complete Gazette archive: every government job opening ever filed, grouped by month.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/archive" },
  openGraph: openGraphFor({
    path: "/archive",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  }),
  twitter: twitterFor({ title: PAGE_TITLE, description: PAGE_DESCRIPTION }),
};

export const revalidate = 300;

/** Group notices under "November 2026"-style month banners. */
function groupByMonth(notices: NoticeRow[]): Array<{
  label: string;
  notices: NoticeRow[];
}> {
  const groups = new Map<string, NoticeRow[]>();
  for (const notice of notices) {
    const label = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date(notice.created_at));
    const bucket = groups.get(label);
    if (bucket) bucket.push(notice);
    else groups.set(label, [notice]);
  }
  return [...groups.entries()].map(([label, list]) => ({ label, notices: list }));
}

export default async function ArchivePage() {
  const notices = await getNotices();
  const groups = groupByMonth(notices);

  return (
    <div className="mx-auto max-w-4xl px-6 pb-32 pt-20 md:px-10 md:pt-28">
      <SectionHeading
        eyebrow="The Archive"
        title="Every opening, kept in order"
        lede="The complete record — every notice the Gazette has filed, grouped by the month it appeared. For the returning reader."
      />

      <div className="mt-16">
        {groups.map((group, gi) => (
          <Reveal key={group.label} delay={Math.min(gi * 0.05, 0.15)}>
            <section className="mt-12 first:mt-0">
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <h2 className="font-display text-xl tracking-tight text-ink">
                  {group.label}
                </h2>
                <span className="text-xs text-ink-faint tabular-nums">
                  {group.notices.length}{" "}
                  {group.notices.length === 1 ? "notice" : "notices"}
                </span>
              </div>
              <ol>
                {group.notices.map((notice) => (
                  <li
                    key={notice.slug}
                    className="group border-b border-line/60 py-4"
                  >
                    <Link
                      href={`/gazette/${notice.slug}`}
                      className="flex min-h-11 flex-wrap items-baseline gap-x-4 gap-y-1 transition-colors duration-300"
                    >
                      <time
                        dateTime={notice.created_at}
                        className="w-24 shrink-0 text-xs text-ink-faint tabular-nums"
                      >
                        {formatNoticeDate(notice.created_at)}
                      </time>
                      <span className="min-w-0 flex-1 font-display text-lg tracking-tight text-ink transition-colors duration-300 group-hover:text-accent-strong">
                        {notice.title}
                      </span>
                      <span className="font-mono text-[0.625rem] tracking-[0.14em] text-ink-faint uppercase">
                        {notice.department}
                      </span>
                      <span className="hidden w-24 text-right text-xs text-ink-faint tabular-nums sm:block">
                        {NOTICE_STATE_LABEL[noticeState(notice)]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
