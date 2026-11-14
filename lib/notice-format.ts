import type { NoticeRow } from "@/lib/schemas";

/**
 * Gazette plate formatting — shared by the index rows and the notice
 * detail. Dates render in IST (the house clock of Indian recruitment),
 * tabular so the plate reads like a gazette index.
 */

const IST_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const IST_DATETIME = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

export function formatNoticeDate(iso: string): string {
  return IST_DATE.format(new Date(iso));
}

export function formatNoticeDateTime(iso: string): string {
  return IST_DATETIME.format(new Date(iso));
}

export function formatVacancies(count: number): string {
  return count.toLocaleString("en-IN");
}

export type NoticeState = "live" | "soon" | "closed";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Visual state of a notice on the plate: live, closing soon, closed. */
export function noticeState(notice: NoticeRow, now = Date.now()): NoticeState {
  if (notice.status === "closed") return "closed";
  if (!notice.apply_last_date) return "live";
  return new Date(notice.apply_last_date).getTime() < now
    ? "closed"
    : new Date(notice.apply_last_date).getTime() - now < SEVEN_DAYS_MS
      ? "soon"
      : "live";
}

export const NOTICE_STATE_LABEL: Record<NoticeState, string> = {
  live: "Accepting applications",
  soon: "Closing soon",
  closed: "Applications closed",
};

/** Gazette index number from the row id — stable, small-caps friendly. */
export function noticeIndex(id: string): string {
  const digits = id.replace(/\D/g, "").slice(-4);
  return `№ ${digits.padStart(4, "0")}`;
}
