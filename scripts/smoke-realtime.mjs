import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { readFileSync } from "node:fs";

const env = readFileSync(".env.local","utf8").split("\n");
const get = (k) => env.find(l=>l.startsWith(k+"=")).slice(k.length+1).trim();
const url = get("NEXT_PUBLIC_SUPABASE_URL");
const key = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const dbUrl = get("DATABASE_URL");

const supabase = createClient(url, key);
const events = [];
const rawLog = [];

const channel = supabase
  .channel("smoke3:comments")
  .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, (p) => {
    events.push(p);
    console.log("EVENT:", JSON.stringify(p).slice(0, 220));
  })
  .subscribe((status) => {
    console.log("status:", status);
    if (status !== "SUBSCRIBED") return;
    (async () => {
      const c = new pg.Client({ connectionString: dbUrl, ssl:{rejectUnauthorized:false} });
      await c.connect();
      const postId = "c1a10001-0000-4000-8000-000000000001";
      const r = await c.query(
        `insert into comments (post_id, author_id, body) values ('${postId}', '11111111-1111-4111-8111-111111111111', $1) returning id`,
        ["Realtime smoke test — please ignore"]
      );
      console.log("✓ inserted comment", r.rows[0].id);
      await c.end();
    })().catch((e) => console.error("insert failed:", e.message));
  });

// Attach raw frame logging once the socket is live.
const attach = () => {
  const ws = supabase.realtime.socketAdapter?.socket?.conn;
  if (ws) {
    ws.addEventListener("message", (e) => {
      rawLog.push(String(e.data));
      console.log("RAW:", String(e.data).slice(0, 260));
    });
    console.log("✓ raw listener attached");
    return;
  }
  setTimeout(attach, 100);
};
attach();

await new Promise((resolve) => setTimeout(resolve, 15000));
console.log("events:", events.length, "| raw frames:", rawLog.length);
supabase.removeChannel(channel);
process.exit(events.length ? 0 : 1);
