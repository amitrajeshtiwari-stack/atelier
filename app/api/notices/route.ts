import { NextResponse } from "next/server";
import { noticeRowSchema } from "@/lib/schemas";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

/**
 * GET /api/notices — Gazette notices, newest first (public, anonymous).
 * Used by the /gazette surface to refetch after a realtime INSERT
 * arrives, so a newly filed notice appears without a full page reload.
 */
export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notices = (data ?? []).map((row) =>
    noticeRowSchema.parse(row as unknown as Record<string, unknown>)
  );

  return NextResponse.json({ notices });
}
