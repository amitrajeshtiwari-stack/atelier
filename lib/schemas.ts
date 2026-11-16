import { z } from "zod";
/* ── Enums ──────────────────────────────────────────────────────────── */

export const NOTICE_STATUS = ["live", "closed", "archived"] as const;
export const NOTICE_KINDS = [
  "recruitment",
  "result",
  "admit-card",
  "answer-key",
  "admission",
] as const;
export const NOTICE_APPLY_MODES = ["online", "offline"] as const;

/* ── Gazette notices (mirror supabase/gazette.sql) ──────────────────── */

export const noticeFactSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(400),
});

export const noticeRowSchema = z.object({
  id: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slug"),
  title: z.string().min(1).max(200),
  department: z.string().min(1).max(120),
  kind: z.enum(NOTICE_KINDS),
  apply_mode: z.enum(NOTICE_APPLY_MODES),
  summary: z.string().min(1).max(600),
  facts: z.array(noticeFactSchema),
  official_url: z.url(),
  apply_last_date: z.iso.datetime({ offset: true }).nullable(),
  vacancy_count: z.number().int().min(1).max(1_000_000).nullable(),
  series_slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slug"),
  source: z.string().url(),
  status: z.enum(NOTICE_STATUS),
  created_at: z.string(),
  updated_at: z.string(),
});

export type NoticeStatus = (typeof NOTICE_STATUS)[number];
export type NoticeKind = (typeof NOTICE_KINDS)[number];
export type NoticeApplyMode = (typeof NOTICE_APPLY_MODES)[number];
export type NoticeFact = z.infer<typeof noticeFactSchema>;
export type NoticeRow = z.infer<typeof noticeRowSchema>;

/* ── Helpers ───────────────────────────────────────────────────────── */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

/** Client-side staleness guard for realtime notice INSERT payloads. */
export function parseNoticeRow(raw: unknown): NoticeRow {
  return noticeRowSchema.parse(raw);
}
