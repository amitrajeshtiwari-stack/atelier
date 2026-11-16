# YouTube uploader (self-hosted, replaces Zapier for uploads)

Uploads videos straight to YouTube via the YouTube Data API v3 — no Zapier, no
task limits. Supports **multiple channels from different Google accounts** in
one place: one refresh token per channel, stored locally in
`.youtube-tokens/` (gitignored).

## One-time setup (per machine)

### 1. Create Google Cloud credentials

1. Go to <https://console.cloud.google.com>, create a project (e.g. `kaz-uploader`).
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **APIs & Services → OAuth consent screen** → External → add your two Google
   accounts as test users. **Important:** publish the app ("In production")
   when possible — refresh tokens for apps stuck in "Testing" mode expire
   after 7 days.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   type **Desktop app**. Copy the client ID and secret.

### 2. Store the credentials

Add to `.env.local` (already gitignored):

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 3. Authorize each channel (once, in that channel's browser login)

```sh
node scripts/youtube/authorize.mjs theinfiniteproject
node scripts/youtube/authorize.mjs goldenerra
```

Sign in with the Google account that owns that channel. Verify both with:

```sh
node scripts/youtube/whoami.mjs
```

## Uploading

```sh
node scripts/youtube/upload.mjs <channelKey> <videoFile> [options]
```

Common options: `--title`, `--desc` / `--desc-file`, `--tags "a,b"`,
`--thumb out/thumb.jpg`, `--privacy public|unlisted|private`,
`--schedule 2026-11-20T15:00:00Z` (publishes later; forces private until then),
`--kids true|false|na`, `--category 22`, `--playlist PLxxxxxx`, `--lang en`.

Examples:

```sh
# immediate public upload
node scripts/youtube/upload.mjs theinfiniteproject out/final.mp4 \
  --title "What happens if you never sleep?" --privacy public

# scheduled upload with thumbnail, description from file
node scripts/youtube/upload.mjs goldenerra out/final.mp4 \
  --title "Why the ocean is louder at night" --desc-file out/desc.md \
  --thumb out/thumb.jpg --schedule 2026-11-21T16:00:00Z
```

Defaults per channel (privacy, category, made-for-kids) live in
`channels.json`. Category ids: 22 People & Blogs, 24 Entertainment,
27 Education, 26 Howto & Style, 28 Science & Technology.

## Quota notes

- Each upload costs ~1,600 quota units; a fresh Google Cloud project gets
  10,000 units/day → roughly **6 uploads/day per project**. If you need more,
  request a quota increase (or use a second GCP project).
- Resumable upload: 8 MiB chunks, retries transient 5xx automatically — safe
  for flaky connections.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `redirect_uri_mismatch` during authorize | Recreate the OAuth client as type **Desktop app**; nothing to configure by hand. |
| `invalid_grant` on upload | Token revoked/expired — re-run `authorize.mjs` for that channel. |
| Tokens keep dying weekly | Fixed (Nov 2026): app published to production, homepage + privacy policy hosted at theinfiniteproject1-dotcom.github.io/kaz-uploader-site. If it ever regresses to "Testing", this is the cause. |
| `quotaExceeded` | Daily project quota gone; see notes above. |
