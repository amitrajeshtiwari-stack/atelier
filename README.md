# Gazette

A daily, automated noticeboard of **India government job openings**. One
quiet plate: every opening filed as it is announced, with a brief, the
facts that matter, and a **Join now** button that leads to the *official*
government portal — never an agent, never a paywall, never us.

Built with Next.js (App Router), Supabase (Postgres + RLS + Realtime), and
Tailwind v4. Typographically quiet — utility-first editorial design.

## Quick start

```bash
npm install
```

Create `.env.local` in the project root:

```bash
# Dashboard → Connect → Data API (publishable key)
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

# Dashboard → Connect → Connection pooling → URI (server-side + CI;
# the direct db.<ref>.supabase.co host is IPv6-only, so GitHub
# Actions runners need the IPv4-compatible pooler host)
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

# Public origin of the deployed site. Canonical links, the sitemap, robots
# and social cards all derive from it, so set it once at deploy time.
# Falls back to http://localhost:3000 when unset.
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

```bash
npm run dev        # http://localhost:3000
```

## Database setup (one-time)

Apply SQL straight to Postgres — **not** through the Dashboard SQL editor,
which truncates long pastes and splits statements on `;` inside string
literals:

```bash
node scripts/run-sql.mjs supabase/schema.sql    # core tables, RLS, realtime, storage
node scripts/run-sql.mjs supabase/gazette.sql   # notices table, RLS, realtime, seed notices
```

The runner executes statements one at a time (each auto-commits), reports
the exact failing statement, and notifies PostgREST to reload its schema
cache. Idempotent — safe to re-run.

## Surfaces

| Route | What it does |
| --- | --- |
| `/` | Gazette front page — masthead, edition date, latest filings, how-it-works |
| `/gazette` | The full plate: every notice on record, newest first, live "new notice" pill, no filters |
| `/gazette/[slug]` | Notice detail: brief, at-a-glance facts, Join now → official portal, series timeline, JobPosting JSON-LD |
| `/archive` | Every opening ever filed, grouped by month |
| `/about` | What the Gazette is, the visitor's guarantee, house rules |

## API routes

| Endpoint | Behavior |
| --- | --- |
| `GET /api/notices` | Gazette notices, newest first (public; realtime refetch) |

Payloads cross the wire through shared Zod schemas (`lib/schemas.ts`) —
the same shapes validate client, server, and realtime events.

## The ingest (automation)

```bash
node scripts/ingest-gazette.mjs             # one filing run
node scripts/ingest-gazette.mjs --dry       # audit extraction before writing
```

- Reads public recruitment RSS feeds (adapters in `SOURCES` at the top of
  the script — pluggable).
- Extracts last date, fee, age limit, vacancy count, and the
  "Official website" href; **links are filtered to `.gov.in`/`.nic.in`
  hosts** — a notice without a confident official link is skipped, never
  guessed.
- Idempotent upserts: slug = source article URL, so re-running the same
  feed updates in place. Notices past their window auto-close.
- Writes through the direct Postgres connection (outside RLS), so the
  database policies stay simple: visitors read, the pipeline writes.

`.github/workflows/gazette-ingest.yml` files the plate daily at 03:00 IST
(`workflow_dispatch` for manual runs). Requires one repository secret:
`DATABASE_URL`. Realtime INSERT events reach the open site immediately —
the live pill appears without a reload.

## Architecture notes

- **No filters, by design** — the plate reads top to bottom; nothing is
  hidden behind tabs or dropdowns.
- **Realtime is room, not ticker** — one channel per surface
  (`lib/use-realtime.ts`), postgres_changes flushed at most every 250ms,
  teardown on unmount.
- **RLS is the real gate** — notices are anonymous-readable unless
  archived; writes happen only through the ingest pipeline.
- **Caching model** — pages opt into freshness with per-route
  `export const revalidate` (front page and plate: 60s, archive: 300s).

## Quality gates

```bash
npx tsc --noEmit   # strict typecheck
npx eslint .       # react-hooks v6 + next rules
npm run build      # production build
```

## Handy scripts

```bash
node scripts/run-sql.mjs <file.sql>   # apply SQL directly to Postgres
node scripts/ingest-gazette.mjs       # file today's notices from RSS feeds
node scripts/notify-reload.mjs        # nudge PostgREST's schema cache
node scripts/check-policies.mjs       # dump RLS policies + RLS flags
```

`scripts/youtube/` belongs to a separate documentary-video workflow —
see `scripts/youtube/README.md`.
