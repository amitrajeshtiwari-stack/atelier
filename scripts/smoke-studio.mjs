import { createClient } from "@supabase/supabase-js";

import { readFileSync } from "node:fs";
const env = readFileSync(".env.local","utf8").split("\n");
const get = (k) => env.find(l=>l.startsWith(k+"=")).slice(k.length+1).trim();
const supabase = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: "editor@atelier.press",
  password: "atelier-demo-2026",
});
if (authErr || !auth.user) { console.error("✗ sign-in failed:", authErr?.message); process.exit(1); }
console.log("✓ signed in as", auth.user.email);

// 1. Create a draft (RLS: authors can create their own posts)
const slug = "studio-smoke-" + Date.now();
const { data: created, error: createErr } = await supabase.from("posts").insert({
  author_id: auth.user.id, slug, title: "Studio smoke test",
  excerpt: "smoke", content_md: "smoke content",
  category: "Notes", tags: [], status: "draft", reading_time: 1, published_at: null,
}).select("*").single();
if (createErr || !created) { console.error("✗ draft insert failed:", createErr?.message); process.exit(1); }
console.log("✓ draft created", created.id, created.status);

// 2. Publish (RLS: authors can update their own posts)
const { error: pubErr } = await supabase.from("posts")
  .update({ status: "published", published_at: new Date().toISOString() })
  .eq("id", created.id).eq("author_id", auth.user.id);
console.log(pubErr ? `✗ publish failed: ${pubErr.message}` : "✓ published");

// 3. Unpublish
const { error: unpubErr } = await supabase.from("posts")
  .update({ status: "draft" }).eq("id", created.id);
console.log(unpubErr ? `✗ unpublish failed: ${unpubErr.message}` : "✓ unpublished");

// 4. Delete (RLS: authors can delete their own posts)
const { error: delErr } = await supabase.from("posts").delete().eq("id", created.id);
console.log(delErr ? `✗ delete failed: ${delErr.message}` : "✓ deleted");

// 5. Verify anon cannot read the (already deleted) draft or write posts
const anon = createClient(get("NEXT_PUBLIC_SUPABASE_URL"), get("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
const { error: anonWriteErr } = await anon.from("posts").insert({
  author_id: auth.user.id, slug: "should-fail", title: "nope", excerpt: "x", content_md: "x", category: "Notes",
});
console.log(anonWriteErr ? `✓ anon insert correctly rejected (${anonWriteErr.message.slice(0, 40)})` : "✗ ANON INSERT ALLOWED — RLS BROKEN");

await supabase.auth.signOut();
process.exit(0);
