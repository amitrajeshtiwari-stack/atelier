// Upload a video to one of the configured channels.
//
// Usage:
//   node scripts/youtube/upload.mjs <channelKey> <videoFile> [options]
//
// Options:
//   --title "..."                video title (max 100 chars)
//   --desc "..."                 description text (max 5000 chars)
//   --desc-file path.md          read the description from a file instead
//   --tags "a,b,c"               comma-separated tags
//   --thumb path.jpg|png         custom thumbnail
//   --privacy public|unlisted|private   (default: channels.json)
//   --schedule 2026-11-20T15:00:00Z     premiere later (forces private until then)
//   --kids true|false|na         made-for-kids declaration (default: channels.json)
//   --category 22                YouTube category id (default: channels.json)
//   --playlist PLxxxxxxxx        add the uploaded video to this playlist
//   --lang en                    metadata language
//
// Examples:
//   node scripts/youtube/upload.mjs theinfiniteproject ~/Movies/short.mp4 \
//     --title "What happens if you never sleep?" --privacy public
//
//   node scripts/youtube/upload.mjs goldenerra ~/Movies/short.mp4 \
//     --title "..." --desc-file out/desc.md --thumb out/thumb.jpg \
//     --schedule 2026-11-20T15:00:00Z

import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import {
  resolveChannel,
  requireCredentials,
  api,
  createResumableSession,
  resumableUploadFile,
} from "./lib.mjs";

// --- argument parsing --------------------------------------------------------

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[++i];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = "true";
      i--;
    } else {
      flags[key] = next;
    }
  }
  return { positional, flags };
}

const { positional, flags } = parseArgs(process.argv.slice(2));

const channelKey = positional[0];
const videoFile = positional[1];
if (!channelKey || !videoFile) {
  console.error("Usage: node scripts/youtube/upload.mjs <channelKey> <videoFile> [options]");
  process.exit(1);
}

const channel = resolveChannel(channelKey);
requireCredentials(); // fail fast with a clear message

if (!existsSync(videoFile)) {
  console.error(`Video file not found: ${videoFile}`);
  process.exit(1);
}
const VIDEO_EXTS = new Set([".mp4", ".mov", ".webm", ".m4v", ".mpeg", ".avi", ".wmv", ".flv"]);
const videoMimeByExt = {
  ".mp4": "video/mp4",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mpeg": "video/mpeg",
  ".avi": "video/x-msvideo",
  ".wmv": "video/x-ms-wmv",
  ".flv": "video/x-flv",
};
const ext = path.extname(videoFile).toLowerCase();
const mimeType = videoMimeByExt[ext];
if (!mimeType || !VIDEO_EXTS.has(ext)) {
  console.error(`Unsupported video extension "${ext}". Expected one of: ${[...VIDEO_EXTS].join(" ")}`);
  process.exit(1);
}

// --- build metadata ----------------------------------------------------------

const title = flags.title ?? "";
if (!title.trim()) {
  console.error("Missing --title \"...\"");
  process.exit(1);
}
if (title.length > 100) {
  console.error(`Title is ${title.length} chars; YouTube allows at most 100.`);
  process.exit(1);
}

let description = flags.desc ?? "";
if (flags["desc-file"]) {
  if (!existsSync(flags["desc-file"])) {
    console.error(`Description file not found: ${flags["desc-file"]}`);
    process.exit(1);
  }
  description = readFileSync(flags["desc-file"], "utf8");
}
if (description.length > 5000) {
  console.error(`Description is ${description.length} chars; YouTube allows at most 5000.`);
  process.exit(1);
}

const tags = (flags.tags ?? "")
  .split(",")
  .map((tag) => tag.trim())
  .filter(Boolean);
for (const tag of tags) {
  if (tag.length > 100) console.error(`Warning: tag "${tag.slice(0, 40)}…" exceeds 100 chars and will be ignored by YouTube.`);
}

// Scheduling: publishAt only works while privacyStatus is "private".
let privacy = flags.privacy ?? channel.defaultPrivacy ?? "public";
let publishAt;
if (flags.schedule) {
  const when = new Date(flags.schedule);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now() + 60_000) {
    console.error(`--schedule must be a future date, e.g. 2026-11-20T15:00:00Z (got "${flags.schedule}").`);
    process.exit(1);
  }
  publishAt = when.toISOString();
  if (privacy !== "private") {
    console.error(`Note: scheduled videos must stay private until the set time; forcing privacy "private".`);
    privacy = "private";
  }
}

const kidsFlag = (flags.kids ?? String(channel.defaultMadeForKids ?? false)).toLowerCase();
const kids = kidsFlag === "na" ? undefined : kidsFlag === "true";

const categoryId = flags.category ?? channel.defaultCategory ?? "22";
const defaultLanguage = flags.lang ?? channel.defaultLanguage;
// AI-disclosure: altered/synthetic content flag. Defaults from channel config
// (both channels are fully AI-generated), overridable with --synthetic true|false.
const synthetic = (flags.synthetic ?? String(channel.defaultSyntheticMedia ?? true)).toLowerCase() === "true";

const metadata = {
  snippet: {
    title,
    description,
    ...(tags.length ? { tags } : {}),
    categoryId,
    ...(defaultLanguage ? { defaultLanguage } : {}),
  },
  status: {
    privacyStatus: privacy,
    ...(kids !== undefined ? { selfDeclaredMadeForKids: kids } : {}),
    ...(publishAt ? { publishAt } : {}),
    ...(synthetic ? { containsSyntheticMedia: true } : {}),
  },
};

// --- upload ------------------------------------------------------------------

const size = statSync(videoFile).size;
console.log(`Channel:   ${channel.label} (${channelKey})`);
console.log(`Video:     ${videoFile} (${(size / (1024 * 1024)).toFixed(1)} MB)`);
console.log(`Title:     ${title}`);
console.log(`Privacy:   ${privacy}${publishAt ? ` → public at ${publishAt}` : ""}`);
console.log("");

const uploadUrl = await createResumableSession(channelKey, metadata, size, mimeType);
const uploaded = await resumableUploadFile(uploadUrl, videoFile, path.basename(videoFile));
const videoId = uploaded.id;
console.log(`Uploaded. Video ID: ${videoId}`);

// --- optional extras ---------------------------------------------------------

if (flags.thumb) {
  const thumbExt = path.extname(flags.thumb).toLowerCase();
  const thumbMime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" }[thumbExt];
  if (!thumbMime || !existsSync(flags.thumb)) {
    console.error(`Warning: thumbnail "${flags.thumb}" not usable (missing file or not jpg/png) — skipped.`);
  } else {
    await api(channelKey, "/upload/youtube/v3/thumbnails/set", {
      query: { videoId },
      method: "POST",
      body: readFileSync(flags.thumb),
      contentType: thumbMime,
    });
    console.log("Thumbnail set.");
  }
}

if (flags.playlist) {
  await api(channelKey, "/youtube/v3/playlistItems", {
    query: { part: "snippet" },
    method: "POST",
    body: {
      snippet: {
        playlistId: flags.playlist,
        resourceId: { kind: "youtube#video", videoId },
      },
    },
  });
  console.log(`Added to playlist ${flags.playlist}.`);
}

console.log("");
console.log(`Watch:   https://youtu.be/${videoId}   (once public)`);
console.log(`Studio:  https://studio.youtube.com/video/${videoId}/edit`);
