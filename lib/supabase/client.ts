"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/supabase/database.types";

/** Singleton browser client for realtime channels and mutations. */
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
