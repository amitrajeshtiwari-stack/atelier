import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/database.types";

type TypedClient = SupabaseClient<Database>;

export type ProfileStub = {
  username: string;
  avatar_url: string | null;
};

/**
 * The auth-signup trigger is intentionally absent from the applied SQL
 * (the dashboard editor mangles $$ bodies), so every authenticated write
 * that references `profiles` via a foreign key must guarantee the row
 * exists first. Idempotent, cheap (one indexed select in the hot path).
 */
export async function ensureProfile(
  client: TypedClient,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }
): Promise<ProfileStub | null> {
  const { data: existing } = await client
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing as ProfileStub;

  const derived =
    (typeof user.user_metadata?.username === "string" && user.user_metadata.username) ||
    user.email?.split("@")[0] ||
    "";
  const username =
    (derived.trim().slice(0, 40) || `reader-${user.id.slice(0, 8)}`).replace(/\s+/g, "-");

  const { data: created, error } = await client
    .from("profiles")
    .insert({ id: user.id, username, avatar_url: null })
    .select("username, avatar_url")
    .single();
  if (created && !error) return created as ProfileStub;

  // Lost a race (trigger or parallel request created it) — read again.
  const { data: reread } = await client
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  return (reread as ProfileStub) ?? null;
}
