// One-time per-channel authorization.
//
// Usage:   node scripts/youtube/authorize.mjs <channelKey>
// Example: node scripts/youtube/authorize.mjs theinfiniteproject
//
// Opens a browser; sign in with the Google account that owns the channel and
// approve. The refresh token is stored in .youtube-tokens/<channelKey>.json.
// Repeat once per channel (different Google accounts per your setup).

import http from "node:http";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import { SCOPES, loadChannels, resolveChannel, requireCredentials, saveToken, api } from "./lib.mjs";

const channelKey = process.argv[2];
if (!channelKey) {
  console.error("Usage: node scripts/youtube/authorize.mjs <channelKey>");
  console.error(`Channel keys: ${Object.keys(loadChannels()).join(", ")}`);
  process.exit(1);
}
const channel = resolveChannel(channelKey);
const { clientId, clientSecret } = requireCredentials();

// Local loopback server to catch the OAuth redirect (RFC 8252 desktop flow).
let resolveCode;
let rejectCode;
const pending = new Promise((resolve, reject) => {
  resolveCode = resolve;
  rejectCode = reject;
});

const state = crypto.randomUUID();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    "<html><body style='font-family: sans-serif; text-align: center; padding-top: 4em'>" +
      "<h2>Authorized &#10003;</h2><p>You can close this tab and return to the terminal.</p>" +
      "</body></html>",
  );
  if (url.searchParams.get("state") !== state) {
    rejectCode(new Error("OAuth state mismatch — the response did not come from our request."));
    return;
  }
  const error = url.searchParams.get("error");
  if (error) {
    rejectCode(new Error(`Google returned "${error}" (likely consent screen or client setup).`));
    return;
  }
  const code = url.searchParams.get("code");
  if (code) resolveCode(code);
});
const port = await new Promise((resolve) =>
  server.listen(0, "127.0.0.1", () => resolve(server.address().port)),
);
const redirectUri = `http://127.0.0.1:${port}`;

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPES.join(" "));
authUrl.searchParams.set("access_type", "offline"); // get a refresh token
authUrl.searchParams.set("prompt", "consent"); // always return refresh_token
authUrl.searchParams.set("state", state);

console.log(`Authorizing "${channelKey}" (${channel.label}).`);
console.log("Sign in with the Google account that owns this channel.\n");
console.log("If the browser does not open, paste this URL manually:\n");
console.log(authUrl.toString() + "\n");
spawn("open", [authUrl.toString()], { detached: true }).unref();

const code = await pending;
server.close();

// Exchange the authorization code for tokens.
const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  }),
});
if (!tokenRes.ok) {
  const text = await tokenRes.text();
  console.error(`Token exchange failed (HTTP ${tokenRes.status}): ${text.slice(0, 500)}`);
  process.exit(1);
}
const tokens = await tokenRes.json();
if (!tokens.refresh_token) {
  console.error("Google did not return a refresh token. Re-run this script with the");
  console.error("account's access revoked first (https://myaccount.google.com/permissions).");
  process.exit(1);
}
saveToken(channelKey, {
  refresh_token: tokens.refresh_token,
  scope: tokens.scope,
  obtained_at: new Date().toISOString(),
});
console.log(`Saved refresh token for "${channelKey}".\n`);

// Verify by reading back the channel identity.
const me = await api(channelKey, "/youtube/v3/channels", {
  query: { part: "snippet,statistics", mine: "true" },
});
const item = me.items?.[0];
if (!item) {
  console.error("Authorized, but no YouTube channel is attached to this Google account.");
  process.exit(1);
}
console.log(`Connected channel: ${item.snippet.title}`);
console.log(`Channel ID: ${item.id}`);
console.log(`Subscribers: ${item.statistics?.subscriberCount ?? "?"}`);
console.log(`\n"${channelKey}" is ready for uploads.`);
