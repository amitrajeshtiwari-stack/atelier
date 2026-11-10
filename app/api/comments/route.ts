import { NextResponse } from "next/server";
import {
  commentPublicSchema,
  commentRowSchema,
  createCommentSchema,
} from "@/lib/schemas";
import type { CommentPublic, CommentRow } from "@/lib/schemas";
import { ensureProfile, type ProfileStub } from "@/lib/profiles";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/database.types";

type TypedClient = SupabaseClient<Database>;

const COMMENT_SELECT =
  "id, post_id, author_id, parent_id, body, created_at, profile:profiles!comments_author_id_fkey ( username, avatar_url )";

/** Row + embedded author → wire shape the UI consumes (zod-validated). */
function toCommentPublic(
  row: Record<string, unknown>,
  profile: ProfileStub | null
): CommentPublic {
  const avatar = profile?.avatar_url;
  return commentPublicSchema.parse({
    ...row,
    profile: undefined,
    author_name: profile?.username || "Anonymous",
    // Only pass a real URL through; anything malformed degrades to null.
    author_avatar: avatar && /^https?:\/\//.test(avatar) ? avatar : null,
  });
}

async function listComments(
  supabase: TypedClient,
  postId: string
): Promise<CommentPublic[]> {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => {
    const r = row as { profile?: { username?: string; avatar_url?: string | null } | null };
    const profile: ProfileStub = {
      username: r.profile?.username ?? "",
      avatar_url: r.profile?.avatar_url ?? null,
    };
    return toCommentPublic(row as unknown as CommentRow & Record<string, unknown>, profile);
  });
}

/**
 * GET /api/comments?post_id=<uuid> — comments for a post, oldest first.
 * Readable by anyone (RLS: only comments on published posts).
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const postId = new URL(request.url).searchParams.get("post_id");
  if (!postId || !commentRowSchema.shape.post_id.safeParse(postId).success) {
    return NextResponse.json({ error: "invalid_post_id" }, { status: 400 });
  }

  return NextResponse.json({ comments: await listComments(supabase, postId) });
}

/**
 * POST /api/comments?post_id=<uuid>  body: { body, parent_id? }
 * Creates a comment for the signed-in reader. Input validated with the
 * shared Zod schema; RLS still enforces authorship server-side
 * (defense in depth — never trust the route alone).
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const postId = new URL(request.url).searchParams.get("post_id");
  if (!postId || !commentRowSchema.shape.post_id.safeParse(postId).success) {
    return NextResponse.json({ error: "invalid_post_id" }, { status: 400 });
  }

  const parsed = createCommentSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { body, parent_id } = parsed.data;

  const profile = await ensureProfile(supabase, user);
  if (!profile) {
    return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: user.id, parent_id, body })
    .select(COMMENT_SELECT)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 400 });
  }

  return NextResponse.json(
    { comment: toCommentPublic(data as unknown as Record<string, unknown>, profile) },
    { status: 201 }
  );
}
