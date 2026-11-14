import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { NoticeRow } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import {
  NOTICE_STATE_LABEL,
  formatNoticeDate,
  formatVacancies,
  noticeIndex,
  noticeState,
} from "@/lib/notice-format";

const STATE_CLASS: Record<ReturnType<typeof noticeState>, string> = {
  live: "border-line text-ink-soft",
  soon: "border-accent/60 text-accent-strong",
  closed: "border-line text-ink-faint line-through decoration-line",
};

/**
 * One line of the Gazette plate — a ruled index row, utility-first:
 * index number, small-caps department, title, mode + vacancy + state
 * chips, and the tabular last date on the right. No thumbnails, no
 * filters; the whole row is the click target.
 */
export function NoticePlateRow({ notice }: { notice: NoticeRow }) {
  const state = noticeState(notice);

  return (
    <Link
      href={`/gazette/${notice.slug}`}
      className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-line py-5 transition-colors duration-300 hover:bg-accent-soft/50 md:grid-cols-[5rem_1fr_auto] md:gap-x-8"
    >
      {/* Index number — the gazette's own folio */}
      <span className="hidden font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint md:block">
        {noticeIndex(notice.id)}
      </span>

      <div className="min-w-0">
        <p className="eyebrow text-[0.5625rem]">{notice.department}</p>
        <h3 className="mt-1.5 text-base leading-snug tracking-tight text-ink transition-colors duration-300 group-hover:text-accent-strong md:text-lg">
          {notice.title}
        </h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[0.625rem] tracking-[0.08em] text-ink-faint uppercase">
          <span>{notice.apply_mode}</span>
          <span aria-hidden="true">·</span>
          {notice.vacancy_count ? (
            <>
              <span>{formatVacancies(notice.vacancy_count)} posts</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span className={cn("rounded-full border px-2 py-0.5", STATE_CLASS[state])}>
            {NOTICE_STATE_LABEL[state]}
          </span>
          {notice.apply_last_date && state !== "closed" ? (
            <span className="tabular-nums">
              Last date {formatNoticeDate(notice.apply_last_date)}
            </span>
          ) : null}
        </div>
      </div>

      <span className="hidden items-center justify-self-end font-mono text-[0.625rem] tracking-[0.18em] text-ink-faint transition-colors duration-300 group-hover:text-accent-strong md:flex">
        Read
        <ArrowUpRight
          className="ml-1 size-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={1.5}
        />
      </span>
    </Link>
  );
}
