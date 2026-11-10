import { NextResponse } from "next/server";
import { toggleReactionSchema } from "@/lib/schemas";
import type { ReactionKind } from "@/lib/schemas";
import { ensureProfile } from "@/lib/profiles";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

type ReactionCounts = Record<ReactionKind, number>;

function emptyCounts(): ReactionCounts {
  return { like: 0, insight: 0, bookmark: 0 };
}

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/reactions?post_id=<uuid> — public counts plus, for a signed-in
 * reader, which kinds they've already left (drives the active toggle state).
 */
export async function GET(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const postId = new URL(request.url).searchParams.get("post_id");
  if (!postId || !isUuid.test(postId)) {
    return NextResponse.json({ error: "invalid_post_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("reactions")
    .select("kind, user_id")
    .eq("post_id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const counts = emptyCounts();
  for (const row of data ?? []) {
    counts[row.kind as ReactionKind] += 1;
  }

  let mine: ReactionKind[] = [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    mine = (data ?? [])
      .filter((row) => row.user_id === user.id)
      .map((row) => row.kind as ReactionKind);
  }

  return NextResponse.json({ counts, mine });
}

/**
 * POST /api/reactions  body: { post_id, kind }
 * Toggle semantics: if this reader already left that kind on the post it's
 * removed, otherwise upserted. idempotent under RLS ("users manage only
 * their own reactions") — the route never chooses rows by trust.
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

  const parsed = toggleReactionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { post_id, kind } = parsed.data;

  const profile = await ensureProfile(supabase, user);
  if (!profile) {
    return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
  }

  // reactions.user_id → profiles.id; without the row the toggle can't land.
  const { data: existing } = await supabase
    .from("reactions")
    .select("kind")
    .eq("post_id", post_id)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", user.id)
      .eq("kind", kind);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ active: false });
  }

  const { error } = await supabase
    .from("reactions")
    .insert({ post_id, user_id: user.id, kind });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ active: true }, { status: 201 });
}
