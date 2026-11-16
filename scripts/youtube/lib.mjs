// Shared plumbing for the YouTube uploader CLI (scripts/youtube).
// Plain Node, zero dependencies: global fetch + the resumable upload protocol.
//
// Token model: one OAuth refresh token per channel, stored in
// .youtube-tokens/<channelKey>.json (gitignored). Each channel is authorized
// once via scripts/youtube/authorize.mjs, then uploads never need a browser.

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { open } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(HERE, "..", "..");
export const TOKEN_DIR = path.join(REPO_ROOT, ".youtube-tokens");

export const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload", // resumable video uploads
  "https://www.googleapis.com/auth/youtube.force-ssl", // thumbnails, playlists, channel info
];

// --- env / credentials -------------------------------------------------------

// Loads KEY=VALUE lines from .env.local so plain `node` runs pick up secrets
// the same way `next dev` does. Existing process env always wins.
export function loadEnvFile() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(match[1] in process.env)) process.env[match[1]] = value;
  }
}

export function requireCredentials() {
  loadEnvFile();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      "Missing Google OAuth client credentials.\n" +
        "Add these two lines to .env.local (see scripts/youtube/README.md):\n" +
        "  GOOGLE_CLIENT_ID=...\n" +
        "  GOOGLE_CLIENT_SECRET=...",
    );
    process.exit(1);
  }
  return { clientId, clientSecret };
}

// --- channels ----------------------------------------------------------------

export function loadChannels() {
  return JSON.parse(readFileSync(path.join(HERE, "channels.json"), "utf8"));
}

export function resolveChannel(channelKey) {
  const channels = loadChannels();
  const channel = channels[channelKey];
  if (!channel) {
    console.error(
      `Unknown channel "${channelKey}". Known keys: ${Object.keys(channels).join(", ")}`,
    );
    process.exit(1);
  }
  return { channelKey, ...channel };
}

// --- tokens ------------------------------------------------------------------

export function tokenPath(channelKey) {
  return path.join(TOKEN_DIR, `${channelKey}.json`);
}

export function loadToken(channelKey) {
  const file = tokenPath(channelKey);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

export function saveToken(channelKey, token) {
  mkdirSync(TOKEN_DIR, { recursive: true });
  writeFileSync(tokenPath(channelKey), JSON.stringify(token, null, 2));
}

// --- OAuth / API -------------------------------------------------------------

const accessCache = new Map(); // channelKey -> { token, expiresAtMs }

export async function getAccessToken(channelKey) {
  const cached = accessCache.get(channelKey);
  if (cached && cached.expiresAtMs > Date.now() + 30_000) return cached.token;

  const token = loadToken(channelKey);
  if (!token?.refresh_token) {
    console.error(`Channel "${channelKey}" is not authorized yet.`);
    console.error(`Run: node scripts/youtube/authorize.mjs ${channelKey}`);
    process.exit(1);
  }

  const { clientId, clientSecret } = requireCredentials();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const detail = await describeError(res);
    if (res.status === 400 && /invalid_grant/.test(detail)) {
      console.error(`The refresh token for "${channelKey}" was rejected (revoked or expired).`);
      console.error(`Re-authorize once: node scripts/youtube/authorize.mjs ${channelKey}`);
      process.exit(1);
    }
    throw new Error(`Token refresh failed: ${detail}`);
  }
  const json = await res.json();
  accessCache.set(channelKey, {
    token: json.access_token,
    expiresAtMs: Date.now() + (json.expires_in ?? 3600) * 1000,
  });
  return json.access_token;
}

// Thin wrapper over a Google REST call with auth + readable errors.
export async function api(channelKey, pathname, { query = {}, method = "GET", body, contentType } = {}) {
  const url = new URL(`https://www.googleapis.com${pathname}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const accessToken = await getAccessToken(channelKey);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": contentType ?? "application/json; charset=UTF-8" } : {}),
    },
    body:
      typeof body === "string" || body instanceof Uint8Array
        ? body
        : body
          ? JSON.stringify(body)
          : undefined,
  });
  if (!res.ok) {
    throw new Error(`YouTube API ${res.status} on ${pathname}: ${await describeError(res)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function describeError(res) {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text);
    const err = json?.error;
    if (err?.message) {
      const reasons = err.errors?.map((e) => e.reason).filter(Boolean).join(", ");
      return reasons ? `${err.message} [${reasons}]` : err.message;
    }
  } catch {
    // not JSON
  }
  return text.slice(0, 500) || `HTTP ${res.status}`;
}

// --- resumable upload --------------------------------------------------------

// Step 1: register the upload and get a session URL.
export async function createResumableSession(channelKey, metadata, size, mimeType) {
  const accessToken = await getAccessToken(channelKey);
  const url = new URL("https://www.googleapis.com/upload/youtube/v3/videos");
  url.searchParams.set("uploadType", "resumable");
  url.searchParams.set("part", "snippet,status");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(size),
      "X-Upload-Content-Type": mimeType,
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) {
    throw new Error(`Could not start the upload (HTTP ${res.status}): ${await describeError(res)}`);
  }
  const location = res.headers.get("location");
  if (!location) throw new Error("YouTube did not return an upload session URL.");
  return location;
}

// Step 2: stream the file in 8 MiB chunks; retry transient 5xx with resume.
export async function resumableUploadFile(uploadUrl, filePath, label = "video") {
  const size = statSync(filePath).size;
  const CHUNK = 8 * 1024 * 1024;
  const fd = await open(filePath, "r");
  try {
    let offset = 0;
    let attempts = 0;
    while (offset < size) {
      const end = Math.min(offset + CHUNK, size) - 1;
      const length = end - offset + 1;
      const buf = Buffer.alloc(length);
      await fd.read(buf, 0, length, offset);

      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${offset}-${end}/${size}`,
          "Content-Length": String(length),
        },
        body: buf,
      });

      if (res.status === 200 || res.status === 201) {
        showProgress(size, size, label);
        process.stdout.write("\n");
        return await res.json();
      }
      if (res.status === 308) {
        attempts = 0;
        offset = end + 1;
        showProgress(offset, size, label);
        continue;
      }
      if (res.status >= 500 || res.status === 429) {
        if (++attempts > 5) {
          throw new Error(`Upload kept failing (HTTP ${res.status}) around byte ${offset}.`);
        }
        await sleep(1000 * 2 ** (attempts - 1));
        const state = await resumeStatus(uploadUrl, size);
        if (state.done) {
          showProgress(size, size, label);
          process.stdout.write("\n");
          return state.resource;
        }
        offset = state.offset;
        continue;
      }
      throw new Error(`Upload failed (HTTP ${res.status}): ${await describeError(res)}`);
    }
  } finally {
    await fd.close();
  }
  throw new Error("Upload ended without a confirmation response from YouTube.");
}

// Ask the session how many bytes it already has (after a network hiccup).
async function resumeStatus(uploadUrl, size) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Range": `bytes */${size}`, "Content-Length": "0" },
  });
  if (res.status === 308) {
    const range = res.headers.get("range"); // e.g. "bytes=0-12345"
    const end = range ? Number(range.split("-")[1]) : -1;
    return { offset: end + 1 };
  }
  if (res.status === 200 || res.status === 201) {
    return { done: true, resource: await res.json() };
  }
  throw new Error(`Resumable session lost (HTTP ${res.status}). Start the upload again.`);
}

// --- small helpers -----------------------------------------------------------

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function showProgress(done, total, label) {
  const pct = Math.floor((done / total) * 100);
  const mb = (total / (1024 * 1024)).toFixed(1);
  process.stdout.write(`\rUploading ${label}: ${pct}% of ${mb} MB   `);
}
