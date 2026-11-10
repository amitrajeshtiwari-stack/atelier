import { z } from "zod";
import raw from "@/lib/demo-posts.json";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import type { PostPublic } from "@/lib/schemas";
import { postRowSchema } from "@/lib/schemas";

/**
 * Fallback content for the running app until Supabase credentials are
 * configured. The JSON is generated from scripts/demo-posts.source.mjs
 * (which also emits supabase/seed.sql), so prose never drifts.
 */

const postSchema = postRowSchema.omit({
  author_id: true,
  status: true,
  created_at: true,
  updated_at: true,
});

const validated = z
  .object({
    author: z.object({
      id: z.string().uuid(),
      username: z.string(),
      avatar_url: z.url().nullable(),
      bio: z.string().nullable(),
    }),
    posts: z.array(postSchema),
  })
  .parse(raw);

export const DEMO_AUTHOR = validated.author;
export const DEMO_AUTHORED_AT = new Date(
  "2026-09-08T09:00:00+00:00"
).toISOString();

const displayName = (username: string) =>
  username
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(". ");

/** Published posts, newest first — same contract as the live query. */
export function demoPosts(): PostPublic[] {
  return validated.posts.map((row, index) => ({
    ...row,
    author_id: DEMO_AUTHOR.id,
    status: "published" as const,
    author_name: displayName(DEMO_AUTHOR.username),
    // The newest post leads the journal as the featured 3D card.
    featured: index === 0,
    created_at: DEMO_AUTHORED_AT,
    updated_at: DEMO_AUTHORED_AT,
  }));
}

export function demoPostBySlug(slug: string): PostPublic | null {
  return demoPosts().find((p) => p.slug === slug) ?? null;
}

export function isDemoMode(): boolean {
  return !hasSupabaseEnv;
}
