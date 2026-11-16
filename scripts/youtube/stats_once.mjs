// One-off: pull channel + per-video stats for both channels.
import { api, loadChannels } from "./lib.mjs";

const out = {};
for (const key of Object.keys(loadChannels())) {
  try {
    const ch = await api(key, "/youtube/v3/channels", { query: { part: "snippet,statistics,contentDetails", mine: "true" } });
    const c = ch.items?.[0];
    const channel = c
      ? {
          title: c.snippet.title,
          id: c.id,
          subs: c.statistics.subscriberCount,
          views: c.statistics.viewCount,
          videos: c.statistics.videoCount,
          created: c.snippet.publishedAt?.slice(0, 10),
        }
      : null;

    // uploads playlist -> video ids
    let videos = [];
    if (c?.statistics.videoCount > 0) {
      const uploadsPlaylist = c.contentDetails?.relatedPlaylists?.uploads;
      const pls = uploadsPlaylist
        ? await api(key, "/youtube/v3/playlistItems", { query: { part: "contentDetails", playlistId: uploadsPlaylist, maxResults: 50 } })
        : { items: [] };
      const ids = pls.items.map((i) => i.contentDetails.videoId).join(",");
      if (ids) {
        const vs = await api(key, "/youtube/v3/videos", { query: { part: "snippet,statistics,status", id: ids } });
        videos = vs.items.map((v) => ({
          id: v.id,
          title: v.snippet.title.slice(0, 60),
          published: v.snippet.publishedAt?.slice(0, 16).replace("T", " "),
          privacy: v.status.privacyStatus,
          publishAt: v.status.publishAt?.slice(0, 16).replace("T", " ") || null,
          views: v.statistics.viewCount ?? "0",
          likes: v.statistics.likeCount ?? "0",
          comments: v.statistics.commentCount ?? "0",
        }));
      }
    }
    out[key] = { channel, videos };
  } catch (e) {
    out[key] = { error: String(e).slice(0, 300) };
  }
}
console.log(JSON.stringify(out, null, 1));
