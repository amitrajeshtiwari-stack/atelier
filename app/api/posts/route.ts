import { NextResponse } from "next/server";
import { postPublicSchema } from "@/lib/schemas";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

/**
 * GET /api/posts — published posts, newest first (public).
 * Used by the Journal surface to refetch after a realtime INSERT arrives,
 * so a live entry appears without a full page reload.
 */
export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*, profile:profiles!posts_author_id_fkey ( username )")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const posts = (data ?? []).map((row, index) => {
    // The hand-written Database types can't model embedded joins; cast and
    // zod-validate instead.
    const r = row as { profile: { username?: string } | null } & Record<string, unknown>;
    return postPublicSchema.parse({
      ...r,
      profile: undefined,
      author_name: r.profile?.username ?? "Anonymous",
      featured: index === 0,
    });
  });

  return NextResponse.json({ posts });
}
