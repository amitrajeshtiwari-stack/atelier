import { z } from "zod";
/* ── Enums ──────────────────────────────────────────────────────────── */

export const POST_STATUS = ["draft", "published"] as const;
export const REACTION_KINDS = ["like", "insight", "bookmark"] as const;
export const NOTICE_STATUS = ["live", "closed", "archived"] as const;
export const NOTICE_KINDS = [
  "recruitment",
  "result",
  "admit-card",
  "answer-key",
  "admission",
] as const;
export const NOTICE_APPLY_MODES = ["online", "offline"] as const;

/* ── Row schemas (mirror the SQL schema) ────────────────────────────── */

export const profileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(40),
  avatar_url: z.url().nullable(),
  bio: z.string().max(400).nullable(),
});

export const postRowSchema = z.object({
  id: z.string().uuid(),
  author_id: z.string().uuid(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slug"),
  title: z.string().min(1).max(160),
  subtitle: z.string().max(200).nullable(),
  excerpt: z.string().min(1).max(400),
  content_md: z.string().min(1),
  cover_image_url: z.url().nullable(),
  category: z.enum(["Design", "Engineering", "Culture", "Notes"]),
  tags: z.array(z.string().max(30)),
  status: z.enum(POST_STATUS),
  reading_time: z.number().int().min(1).max(120),
  published_at: z.iso.datetime({ offset: true }).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Shape used all over the UI: row + author display info. */
export const postPublicSchema = postRowSchema.extend({
  author_name: z.string(),
  featured: z.boolean(),
});

export const commentRowSchema = z.object({
  id: z.string().uuid(),
  post_id: z.string().uuid(),
  author_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  body: z.string().min(1).max(2000),
  created_at: z.string(),
});

export const commentPublicSchema = commentRowSchema.extend({
  author_name: z.string(),
  author_avatar: z.url().nullable(),
});

export const reactionRowSchema = z.object({
  post_id: z.string().uuid(),
  user_id: z.string().uuid(),
  kind: z.enum(REACTION_KINDS),
  created_at: z.string(),
});

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

/* ── API input schemas (route handlers + realtime payloads) ─────────── */

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  parent_id: z.string().uuid().nullable().default(null),
});

export const toggleReactionSchema = z.object({
  post_id: z.string().uuid(),
  kind: z.enum(REACTION_KINDS),
});

export const subscribeSchema = z.object({
  email: z.email().trim().max(254),
});

export const slugSchema = z
  .string()
  .trim()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slug");
export const upsertPostSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(200).nullable().default(null),
  excerpt: z.string().trim().max(400).default(""),
  content_md: z.string().default(""),
  cover_image_url: z.url().nullable().default(null),
  category: z.enum(["Design", "Engineering", "Culture", "Notes"]).default("Notes"),
  tags: z.array(z.string().trim().max(30)).max(8).default([]),
  status: z.enum(POST_STATUS).default("draft"),
  slug: slugSchema,
  reading_time: z.number().int().min(1).max(120).default(1),
});

export type PostStatus = (typeof POST_STATUS)[number];
export type ReactionKind = (typeof REACTION_KINDS)[number];
export type NoticeStatus = (typeof NOTICE_STATUS)[number];
export type NoticeKind = (typeof NOTICE_KINDS)[number];
export type NoticeApplyMode = (typeof NOTICE_APPLY_MODES)[number];
export type NoticeFact = z.infer<typeof noticeFactSchema>;
export type NoticeRow = z.infer<typeof noticeRowSchema>;
export type PostRow = z.infer<typeof postRowSchema>;
export type PostPublic = z.infer<typeof postPublicSchema>;
export type CommentRow = z.infer<typeof commentRowSchema>;
export type CommentPublic = z.infer<typeof commentPublicSchema>;
export type UpsertPostInput = z.infer<typeof upsertPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

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

/** ~220 wpm floor at 1 minute. */
export function readingTimeOf(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

/** Client-side staleness guard for realtime INSERT payloads. */
export function parsePostRow(raw: unknown): PostRow {
  return postRowSchema.parse(raw);
}

/** Client-side staleness guard for realtime notice INSERT payloads. */
export function parseNoticeRow(raw: unknown): NoticeRow {
  return noticeRowSchema.parse(raw);
}
