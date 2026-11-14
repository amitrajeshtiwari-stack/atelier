# Atelier

A spatial, editorial 3D journal — essays set in type, arranged in space,
and lit like a gallery. Built with Next.js (App Router), Three.js
(@react-three/fiber), Supabase (Postgres + RLS + Realtime + Storage), and
Tailwind v4.

## Quick start

```bash
npm install
```

Create `.env.local` in the project root:

```bash
# Dashboard → Connect → Data API (publishable key)
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# Dashboard → Connect → Connection string → URI (server-side only)
DATABASE_URL=postgresql://postgres:<password>@db.<your-ref>.supabase.co:5432/postgres
```

```bash
npm run dev        # http://localhost:3000
```

Without credentials the app still boots and reads generated demo content
(`lib/demo-posts.json`) — every surface is reviewable with no database.

## The Gazette

Atelier's second wing: a daily plate of India government-job openings,
filed automatically and deliberately **not** a copy of the aggregator
sites it reads. No filters, no hosted forms, no fee-gated PDFs — a quiet
gazette index where every notice ends in a **Join now** button pointing
at the *official* government portal (`.gov.in` / `.nic.in` only), never
the feed it was learned from.

```bash
node scripts/run-sql.mjs supabase/gazette.sql   # notices table, RLS, realtime publication
node scripts/ingest-gazette.mjs                 # one filing run (add --dry to audit first)
```

- **Surfaces** — `/gazette` (ruled index plate: department, vacancies,
  apply mode, state chip, tabular last dates; live "new notice" pill via
  Realtime) and `/gazette/[slug]` (brief description, at-a-glance facts,
  Join now → official portal, related-updates series, disclaimer,
  `JobPosting` JSON-LD).
- **Ingest** — `scripts/ingest-gazette.mjs` reads the configured RSS
  feeds, extracts last date / fee / age / vacancies / the
  "Official website" href, and upserts idempotently (slug = source
  article URL). Extracted links are filtered to government domains;
  notices without a confident official link are skipped, not guessed.
  Notices past their window are auto-closed on the next run.
- **Automation** — `.github/workflows/gazette-ingest.yml` files the
  plate daily at 03:00 IST (and on demand via `workflow_dispatch`).
  Add `DATABASE_URL` as a repository secret; no other secret is needed
  because the ingest writes through the direct Postgres connection,
  outside RLS, exactly like `run-sql.mjs`. Adapters are pluggable —
  extend `SOURCES` at the top of the script.
- **Visitor-facing guarantee** — Atelier hosts nothing: no application
  forms, no downloads, no fees. It is a noticeboard that hands you the
  official door.

## Database setup (one-time)

Apply the schema and seed straight to Postgres — **not** through the
Dashboard SQL editor, which truncates long pastes and splits statements on
`;` inside string literals:

```bash
node scripts/run-sql.mjs supabase/schema.sql     # tables, RLS, realtime publication, storage
node scripts/run-sql.mjs supabase/apply-part2.sql # reactions/subscribers/events + demo content + editor account
```

The runner executes statements one at a time (each auto-commits), reports
the exact failing statement, and notifies PostgREST to reload its schema
cache. Idempotent — safe to re-run.

**Demo login** (created by `apply-part2.sql`):
`editor@atelier.press` / `atelier-demo-2026`

## Surfaces

| Route | What it does |
| --- | --- |
| `/` | Hero — lazy 3D monolith cluster, capability-gated, pauses off-screen |
| `/journal` | Live feed: featured tilt card, filter pills, realtime "new entry" pill |
| `/journal/[slug]` | Entry page: ambient 3D scene, 68ch reading column, TOC, reading progress, live reactions + realtime comments with presence |
| `/gazette` | Government-job notices: ruled index plate, live "new notice" pill, no filters |
| `/gazette/[slug]` | Notice detail: brief description, facts table, Join now → official portal, series timeline, JobPosting JSON-LD |
| `/about` | The editor, house rules, colophon |
| `/archive` | Complete index grouped by month |
| `/studio` | Auth-gated writing desk: autosave drafts, slug + reading-time derivation, cover upload, publish/unpublish |

## API routes

| Endpoint | Behavior |
| --- | --- |
| `GET /api/posts` | Published posts, newest first (public) |
| `GET /api/notices` | Gazette notices, newest first (public; realtime refetch) |
| `GET/POST /api/comments?post_id=<uuid>` | List / create comments (create requires a session; RLS enforces authorship) |
| `GET/POST /api/reactions?post_id=<uuid>` | Counts + personal state / toggle a reaction (toggle requires a session) |
| `POST /api/newsletter` | Idempotent subscribe — duplicates return `already: true` |
| `GET/POST/PUT /api/studio/posts` | Own posts incl. drafts (session required; RLS enforces ownership) |

Every payload crosses the wire through shared Zod schemas
(`lib/schemas.ts`) — the same shapes validate client, server, and
realtime events.

## Architecture notes

- **3D is lazy everywhere** — scenes load `ssr: false`, drop to a static
  gradient without WebGL or under `prefers-reduced-motion`, pause their
  frameloop when off-screen or the tab is hidden, and cap `dpr` at 1.75.
  The studio lighting is a procedural `Lightformer` environment — zero
  network fetches.
- **Realtime is room, not ticker** — one channel per surface
  (`lib/use-realtime.ts`), postgres_changes flushed at most every 250ms,
  presence for the reading room, teardown on unmount.
- **RLS is the real gate** — the API routes authenticate and validate;
  the database refuses anything the policies don't allow.
- **Caching model** — `cacheComponents: false`; pages opt into freshness
  with per-route `export const revalidate`.
- **Content pipeline** — `scripts/demo-posts.source.mjs` is the single
  source of prose; `node scripts/gen-seed.mjs` emits both the SQL seed
  and the demo JSON so they never drift. Prose deliberately avoids
  semicolons (they break the Dashboard SQL editor).

## Quality gates

```bash
npx tsc --noEmit   # strict typecheck
npx eslint .       # react-hooks v6 + next rules
npm run build      # production build
```

## Handy scripts

```bash
node scripts/run-sql.mjs <file.sql>   # apply SQL directly to Postgres
node scripts/ingest-gazette.mjs       # file today's Gazette notices from RSS feeds
node scripts/gen-seed.mjs             # regenerate seed.sql + demo JSON
node scripts/smoke-realtime.mjs       # insert a comment; assert the event arrives
node scripts/smoke-studio.mjs         # sign in; verify the RLS write path
node scripts/notify-reload.mjs        # nudge PostgREST's schema cache
node scripts/check-policies.mjs       # dump RLS policies + RLS flags
```
