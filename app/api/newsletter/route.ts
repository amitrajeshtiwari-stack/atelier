import { NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/schemas";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

/**
 * POST /api/newsletter  body: { email }
 * Idempotent subscribe: a known address is a success (200, already:true),
 * never an error — the UI treats both as "you're on the list".
 *
 * Without Supabase credentials (demo mode) the subscribe is acknowledged
 * but not persisted, flagged with demo:true.
 */
export async function POST(request: Request) {
  const parsed = subscribeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_email", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseRouteHandlerClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const email = parsed.data.email.toLowerCase();
  const { error } = await supabase.from("subscribers").insert({ email });

  if (error) {
    // Unique violation ⇒ already subscribed, which is a success.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, already: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
