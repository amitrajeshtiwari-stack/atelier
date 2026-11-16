// Channel + video performance stats for every authorized channel.
//
// Usage:   node scripts/youtube/stats.mjs [videoCount] [commentCount]
// Default: 10 recent videos, 5 recent comments per channel.

import { readdirSync, existsSync } from "node:fs";
import { TOKEN_DIR, api } from "./lib.mjs";

const videoCount = Number(process.argv[2] ?? 10);
const commentCount = Number(process.argv[3] ?? 5);

if (!existsSync(TOKEN_DIR)) {
  console.log("No channels authorized yet.");
  process.exit(0);
}
const keys = readdirSync(TOKEN_DIR).filter((name) => name.endsWith(".json")).map((name) => name.replace(/\.json$/, ""));
if (keys.length === 0) {
  console.log("No channels authorized yet.");
  process.exit(0);
}

const fmt = (n) => (n ?? 0).toLocaleString("en-US");

for (const key of keys) {
  const ch = await api(key, "/youtube/v3/channels", {
    query: { part: "snippet,statistics,contentDetails", mine: "true" },
  });
  const c = ch.items?.[0];
  if (!c) {
    console.log(`${key}: token valid, but no YouTube channel on this Google account.`);
    continue;
  }
  const s = c.statistics ?? {};
  console.log(`\n=== ${c.snippet.title} (${key}) — ${c.snippet.customUrl ?? ""} ===`);
  console.log(`Subscribers: ${fmt(s.subscriberCount)}  |  Views: ${fmt(s.viewCount)}  |  Videos: ${fmt(s.videoCount)}`);

  // Recent videos with stats
  const uploads = c.contentDetails?.relatedPlaylists?.uploads;
  if (uploads) {
    const pl = await api(key, "/youtube/v3/playlistItems", {
      query: { part: "contentDetails", playlistId: uploads, maxResults: String(videoCount) },
    });
    const ids = (pl.items ?? []).map((i) => i.contentDetails?.videoId).filter(Boolean);
    if (ids.length) {
      const vids = await api(key, "/youtube/v3/videos", {
        query: { part: "snippet,statistics,status", id: ids.join(",") },
      });
      console.log("\nRecent videos (newest first):");
      for (const v of vids.items ?? []) {
        const st = v.statistics ?? {};
        const when = (v.snippet.publishedAt ?? "").slice(0, 10);
        console.log(
          `  • ${v.snippet.title}  [${when}]  👁 ${fmt(st.viewCount)}  👍 ${fmt(st.likeCount)}  💬 ${fmt(st.commentCount)}  (${v.status?.privacyStatus ?? "?"})`,
        );
      }
    }
  }

  // Latest comments across the channel
  const threads = await api(key, "/youtube/v3/commentThreads", {
    query: { part: "snippet", allThreadsRelatedToChannelId: c.id, order: "time", maxResults: String(commentCount) },
  });
  const items = threads.items ?? [];
  if (items.length) {
    console.log(`\nLatest comments:`);
    for (const t of items) {
      const top = t.snippet.topLevelComment?.snippet ?? {};
      console.log(`  • ${top.authorDisplayName ?? "?"} (${(top.publishedAt ?? "").slice(0, 10)}): ${(top.textOriginal ?? "").slice(0, 140)}`);
    }
  } else {
    console.log(`\nLatest comments: none yet`);
  }
}
console.log("");
