// Show which channels are authorized and verify each token works.
//
// Usage: node scripts/youtube/whoami.mjs

import { readdirSync, existsSync } from "node:fs";
import { TOKEN_DIR, api } from "./lib.mjs";

if (!existsSync(TOKEN_DIR)) {
  console.log("No channels authorized yet. Run scripts/youtube/authorize.mjs <channelKey> first.");
  process.exit(0);
}

const files = readdirSync(TOKEN_DIR).filter((name) => name.endsWith(".json"));
if (files.length === 0) {
  console.log("No channels authorized yet. Run scripts/youtube/authorize.mjs <channelKey> first.");
  process.exit(0);
}

for (const file of files) {
  const channelKey = file.replace(/\.json$/, "");
  try {
    const me = await api(channelKey, "/youtube/v3/channels", {
      query: { part: "snippet,statistics", mine: "true" },
    });
    const item = me.items?.[0];
    if (!item) {
      console.log(`${channelKey}: token valid, but no YouTube channel on this Google account.`);
      continue;
    }
    console.log(`${channelKey}:`);
    console.log(`  Channel:     ${item.snippet.title}`);
    console.log(`  Channel ID:  ${item.id}`);
    console.log(`  Subscribers: ${item.statistics?.subscriberCount ?? "?"}`);
    console.log(`  Videos:      ${item.statistics?.videoCount ?? "?"}`);
  } catch (err) {
    console.log(`${channelKey}: FAILED — ${err.message}`);
  }
}
