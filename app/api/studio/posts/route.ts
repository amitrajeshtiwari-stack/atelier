import { NextResponse } from "next/server";
import { readingTimeOf, upsertPostSchema } from "@/lib/schemas";
import type { UpsertPostInput } from "@/lib/schemas";
import { ensureProfile } from "@/lib/profiles";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/database.types";

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/studio/posts — every post owned by the signed-in editor,
 * drafts included (RLS: "authors can read… their own posts" via the
 * author policies). Drives the Studio post list.
 */
export async function GET() {
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

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}

/**
 * POST /api/studio/posts  body: upsertPostSchema
 * Creates a post owned by the signed-in editor. Publishing here means
 * `status: "published"` — published_at is stamped server-side, never
 * trusted from the client.
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

  const parsed = upsertPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const profile = await ensureProfile(supabase, user);
  if (!profile) {
    return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
  }

  // Slug must be unique — check first for a friendly 409, and let the
  // constraint catch the lost race.
  const { data: slugTaken } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();
  if (slugTaken) {
    return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  }

  const publishing = input.status === "published";
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      slug: input.slug,
      title: input.title,
      subtitle: input.subtitle,
      excerpt: input.excerpt || input.content_md.slice(0, 160),
      content_md: input.content_md,
      cover_image_url: input.cover_image_url,
      category: input.category,
      tags: input.tags,
      status: input.status,
      reading_time: input.reading_time || readingTimeOf(input.content_md),
      published_at: publishing ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    const conflict = error?.code === "23505";
    return NextResponse.json(
      { error: conflict ? "slug_taken" : error?.message ?? "insert_failed" },
      { status: conflict ? 409 : 400 }
    );
  }

  return NextResponse.json({ post: data }, { status: 201 });
}

/**
 * PUT /api/studio/posts?id=<uuid>  body: partial upsertPostSchema
 * Updates one of the editor's own posts (RLS enforces ownership). When
 * status flips draft → published, published_at is stamped only if the
 * post never had a date, so republishing keeps its original position.
 */
export async function PUT(request: Request) {
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

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !isUuid.test(id)) {
    return NextResponse.json({ error: "invalid_post_id" }, { status: 400 });
  }

  const parsed = upsertPostSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const patch: Partial<UpsertPostInput> = parsed.data;

  // Fetch first: ownership check happens implicitly via RLS, and the
  // published_at logic needs the current state.
  const { data: existing } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // updated_at is maintained by the posts_touch_updated_at trigger.
  const updates: Database["public"]["Tables"]["posts"]["Update"] = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.subtitle !== undefined) updates.subtitle = patch.subtitle;
  if (patch.excerpt !== undefined) updates.excerpt = patch.excerpt;
  if (patch.content_md !== undefined) updates.content_md = patch.content_md;
  if (patch.cover_image_url !== undefined) updates.cover_image_url = patch.cover_image_url;
  if (patch.category !== undefined) updates.category = patch.category;
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.slug !== undefined) updates.slug = patch.slug;
  if (patch.status !== undefined) updates.status = patch.status;

  if (patch.content_md !== undefined) {
    updates.reading_time =
      patch.reading_time ?? readingTimeOf(patch.content_md);
  } else if (patch.reading_time !== undefined) {
    updates.reading_time = patch.reading_time;
  }

  if (patch.status === "published") {
    const hadDate =
      typeof existing.published_at === "string" && existing.published_at.length > 0;
    updates.published_at = hadDate ? existing.published_at : new Date().toISOString();
  } else if (patch.status === "draft") {
    // Unpublishing keeps the original date — re-publishing restores it.
    if (typeof existing.published_at === "string" && existing.published_at) {
      updates.published_at = existing.published_at;
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", id)
    .eq("author_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    const conflict = error?.code === "23505";
    return NextResponse.json(
      { error: conflict ? "slug_taken" : error?.message ?? "update_failed" },
      { status: conflict ? 409 : 400 }
    );
  }

  return NextResponse.json({ post: data });
}
