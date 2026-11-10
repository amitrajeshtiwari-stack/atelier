import "server-only";
import { demoPostBySlug, demoPosts, isDemoMode } from "@/lib/demo-content";
import type { CommentPublic, PostPublic } from "@/lib/schemas";
import {
  commentPublicSchema,
  type CommentRow,
  type PostRow,
} from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side data access. Queries are uncached (legacy caching model):
 * pages opt into freshness with their own `export const revalidate`
 * segment config, per the editorial-content requirement.
 *
 * When Supabase credentials are absent (fresh checkout) the functions
 * transparently fall back to demo content, so the whole UI is
 * reviewable without a database.
 */

type PostJoin = { profile: { username: string } | null };

function toPublic(row: PostRow & PostJoin, index: number): PostPublic {
  const { profile, ...rest } = row;
  return {
    ...rest,
    author_name: profile?.username ?? "Anonymous",
    // The newest post leads the journal as the featured 3D card.
    featured: index === 0,
  };
}

/** Journal index — all published posts, newest first. */
export async function getPublishedPosts(): Promise<PostPublic[]> {
  if (isDemoMode()) return demoPosts();

  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoPosts();

  const { data, error } = await supabase
    .from("posts")
    .select("*, profile:profiles ( username )")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data) return demoPosts();

  return data.map((row, index) =>
    toPublic(row as unknown as PostRow & PostJoin, index)
  );
}

/** A single published entry plus its comment thread, oldest first. */
export async function getPostBySlug(
  slug: string
): Promise<{ post: PostPublic; comments: CommentPublic[] } | null> {
  if (isDemoMode()) {
    const post = demoPostBySlug(slug);
    return post ? { post, comments: [] } : null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const post = demoPostBySlug(slug);
    return post ? { post, comments: [] } : null;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*, profile:profiles ( username )")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;

  // The hand-written Database types can't fully model embedded joins, so
  // trust the wire shape, cast, and zod-validate the mapped result below.
  const row = data as unknown as PostRow & PostJoin;

  const { data: rawComments, error: commentsError } = await supabase
    .from("comments")
    .select(
      "id, post_id, author_id, parent_id, body, created_at, profile:profiles ( username, avatar_url )"
    )
    .eq("post_id", row.id)
    .order("created_at", { ascending: true });

  void commentsError; // a failed comment fetch must not kill the page

  const comments = ((rawComments ?? []) as unknown as Array<
    CommentRow & { profile?: { username?: string; avatar_url?: string | null } }
  >).map((cr) => {
    const { profile, ...rest } = cr;
    return commentPublicSchema.parse({
      ...rest,
      author_name: profile?.username ?? "Anonymous",
      author_avatar: profile?.avatar_url ?? null,
    });
  });

  return { post: toPublic(row, 0), comments };
}
