-- ═══════════════════════════════════════════════════════════════════════
-- Atelier — schema.sql
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Uses plain SQL, no extensions beyond pgcrypto (built-in on hosted Supabase).
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ──────────────────────────────────────────────────────────────
create type public.post_status as enum ('draft', 'published');
create type public.reaction_kind as enum ('like', 'insight', 'bookmark');

-- ── profiles (extends auth.users) ─────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (char_length(username) between 1 and 40),
  avatar_url  text check (avatar_url is null or avatar_url like 'http%'),
  bio         text check (char_length(bio) <= 400),
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by anyone"
  on public.profiles for select using (true);
create policy "users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users can insert their own profile on signup"
  on public.profiles for insert with check (auth.uid() = id);

-- ── posts ─────────────────────────────────────────────────────────────
create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid not null references public.profiles (id) on delete cascade,
  slug            text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 160),
  subtitle        text check (char_length(subtitle) <= 200),
  excerpt         text not null check (char_length(excerpt) between 1 and 400),
  content_md      text not null,
  cover_image_url text
                    check (cover_image_url is null or cover_image_url like 'http%'),
  category        text not null
                    check (category in ('Design', 'Engineering', 'Culture', 'Notes')),
  tags            text[] not null default '{}'
                    check (array_length(tags, 1) is null or array_length(tags, 1) <= 8),
  status          public.post_status not null default 'draft',
  reading_time    int not null default 1
                    check (reading_time between 1 and 120),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint published_posts_must_have_timestamp
    check (status = 'draft' or published_at is not null)
);

create index posts_published_idx on public.posts (published_at desc)
  where status = 'published';
create index posts_author_idx on public.posts (author_id);

alter table public.posts enable row level security;

create policy "anyone can read published posts"
  on public.posts for select
  using (status = 'published' or auth.uid() = author_id);
create policy "authors can create their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);
create policy "authors can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
create policy "authors can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

-- Keep updated_at honest.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- ── comments (threaded) ───────────────────────────────────────────────
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  parent_id  uuid references public.comments (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

create policy "comments on published posts are readable"
  on public.comments for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (p.status = 'published' or p.author_id = auth.uid())
    )
    or author_id = auth.uid()
  );
create policy "authenticated users can comment"
  on public.comments for insert with check (auth.uid() = author_id);
create policy "authors can edit their own comments"
  on public.comments for update using (auth.uid() = author_id);
create policy "authors can delete their own comments"
  on public.comments for delete using (auth.uid() = author_id);

-- ── reactions (composite PK, upsert-able by owner) ────────────────────
create table public.reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       public.reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

create index reactions_post_idx on public.reactions (post_id, kind);

alter table public.reactions enable row level security;

create policy "reaction counts are public"
  on public.reactions for select using (true);
create policy "users manage only their own reactions"
  on public.reactions for insert with check (auth.uid() = user_id);
create policy "users can remove only their own reactions"
  on public.reactions for delete using (auth.uid() = user_id);

-- ── subscribers ───────────────────────────────────────────────────────
create table public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  created_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

-- Anon visitors may subscribe; nobody reads the list without the
-- service-role key (used by the admin later if needed).
create policy "anyone can subscribe"
  on public.subscribers for insert with check (true);

-- ── realtime_events (optional audit log) ──────────────────────────────
create table public.realtime_events (
  id         uuid primary key default gen_random_uuid(),
  type       text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.realtime_events enable row level security;
create policy "authenticated users may append events"
  on public.realtime_events for insert with check (auth.uid() is not null);

-- ── Realtime ──────────────────────────────────────────────────────────
-- Broadcast postgres_changes for the three live surfaces.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;
end $$;

-- Full old-row payloads make DELETE events usable client-side.
alter table public.reactions replica identity full;
alter table public.comments replica identity full;

-- ── Auth hookup: auto-create a profile on signup ──────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'reader-' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Storage: covers bucket ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "covers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'covers');
create policy "signed-in authors upload covers"
  on storage.objects for insert
  with check (bucket_id = 'covers' and auth.uid() is not null);
create policy "authors manage their own covers"
  on storage.objects for update
  using (bucket_id = 'covers' and owner = auth.uid());


-- ═══════════ SEED (part 2) ═══════════

-- ═════════════════════════════════════════════════════════════════════
-- Atelier — seed.sql   (GENERATED by scripts/gen-seed.mjs — do not edit)
-- Run AFTER schema.sql. Creates the demo author (via auth.users —
-- Supabase flags this as a warning; expected on a fresh project),
-- then 6 published posts, sample comments and reactions.
-- Demo login: editor@atelier.press / atelier-demo-2026
-- ═════════════════════════════════════════════════════════════════════

-- ── Demo author ──────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated',
  'editor@atelier.press',
  crypt('atelier-demo-2026', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"m.calloway","avatar_url":"https://picsum.photos/seed/editor-avatar/96/96"}'
)
on conflict (id) do nothing;

insert into public.profiles (id, username, avatar_url, bio)
values (
  '11111111-1111-4111-8111-111111111111',
  'm.calloway',
  'https://picsum.photos/seed/editor-avatar/96/96',
  $md$Editor-in-residence at the Atelier. Writes about the seam where type meets terrain.$md$
)
on conflict (id) do nothing;

-- ── Posts ────────────────────────────────────────────────────────────
insert into public.posts
  (author_id, slug, title, subtitle, excerpt, content_md, cover_image_url, category, tags, status, reading_time, published_at)
values
(
  '11111111-1111-4111-8111-111111111111',
  'the-page-is-a-room',
  $md$The page is a room$md$,
  $md$What spatial magazines teach us about reading$md$,
  $md$Websites stopped being pages the moment they stopped being documents. What if we designed them like rooms instead — with light, air and furniture?$md$,
  $md$## The document is dead, long live the space

For thirty years the web pretended to be paper. We measured line lengths in characters, folded content into columns, and built grid systems with the reverence of Swiss typographers. None of this made the web a page — it made it a page *performance*, a stage set of paper erected inside a very different material: light-driven, scroll-woven, three degrees of freedom deep.

The shift that matters is not visual. It is spatial. A printed page sits where you put it; a room keeps existing when you turn your back to it. The best editorial sites of the last decade — the ones that won the awards but, more tellingly, the ones people lingered in — all made this turn. They stopped flattering print and started borrowing from architecture.

## Three lessons from buildings

1. **Light is layout.** Rename your design tokens and watch it breathe: a heading is not a bold string, it is a *lit surface*. Contrast does the work that type size used to do.
2. **Negative space is not empty.** In a gallery, the wall between paintings is an act of curation. Margins are load-bearing.
3. **The path matters more than the map.** Nobody reads the floor plan first. They walk in, and the room shows them where to go.

> The page is a room. The type is furniture. A journal worth reading should feel like standing inside it.

## What this costs

Spatial thinking is expensive. A WebGL scene adds a whole render pipeline to a document viewer. Which is exactly why it must be *accent, never environment* — a framed sculpture in the lobby, not wallpaper in every room. Budget your geometry like an architect budgets glass: wherever it lets light in, nowhere it blocks the path.

The compromise we landed on: one hero scene that sets the mood, one ambient scene that responds to reading progress, and a thousand pages of immaculate, boring, fast text. The monument stands; the library stays quiet.$md$,
  'https://picsum.photos/seed/room/1200/800',
  'Design',
  ARRAY['typography', 'webdesign', 'spatial'],
  'published', 7, '2026-10-10T09:00:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'glass-materials-at-sixty-frames',
  $md$Glass at sixty frames a second$md$,
  $md$The engineering of physical materials on the open web$md$,
  $md$MeshPhysicalMaterial is the cheapest renderer of luxury ever shipped. Here is how we tune transmission, roughness and IOR without melting a laptop.$md$,
  $md$There is a moment in every WebGL review meeting when somebody asks the controversial question: can we afford *transmission*? Transmission — the material property that lets a surface refract the world behind it — is the difference between plastic and glass. It is also, historically, the difference between 60fps and a slideshow.

## The physics budget

A physically-plausible glass needs four numbers: transmission (0.6–0.9), roughness (~0.25), index of refraction (~1.45) and thickness (which bends nothing until you supply an environment map for it to refract). Everything else — clearcoat, iridescence, sheen — is garnish, and garnish is billed per frame.

Our tuning table, validated on an M1-class laptop at dpr ≤ 1.75:

- **Light mode:** `transmission: 0.62, roughness: 0.26` — plaster with varnish, warm and matte.
- **Dark mode:** `transmission: 0.88, roughness: 0.15, metalness: 0.35` — obsidian mirror.

The mode switch is not just a color flip. Roughness *is* the material of the room, and the room changes when the lights go down.

## Where the frames actually go

1. **The environment.** We build our studio from three emissive rectangles instead of downloading an HDR; zero network, same soft caustics on the rounded edges.
2. **The shadows.** `ContactShadows` at resolution 256, blurred 2.7 units — a soft blob costs less than a shadow map cascade and reads just as truthful under editorial copy.
3. **The composer.** Bloom at `intensity: 0.32` with a mipmap chain, noise at 0.045 opacity, vignette to darken the doorway. Postprocessing is the cheapest luxury after glass — the GPU does the work in passes that were already resident.

> Fragility is a rendering decision. The glass does not fall — the budget does. Keep the volume count under eight and the draw calls under forty, and the illusion holds at sixty frames.

The unglamorous rule underneath all of this: **pause the frameloop when the scene is off-screen.** Most scene budgets are destroyed not by complexity but by loyalty — 240 frames a second rendered to an audience of zero, four floors below the fold.$md$,
  'https://picsum.photos/seed/glass/1200/800',
  'Engineering',
  ARRAY['threejs', 'webgl', 'performance'],
  'published', 6, '2026-10-17T09:00:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'a-slow-web-manifesto',
  $md$A slow web, briefly$md$,
  $md$Against the feed, for the artifact$md$,
  $md$Inbox zero, feed infinity. The web that lasts is a shelf, not a ticker. On formats that respect the reader as a resident, not as an aggregate.$md$,
  $md$The feed is a place where time goes to flatten. Every item elbowed next to every other item; the urgent warming over the important; a growth curve measured by *time-on-page*, which is a euphemism for seconds of patience extracted.

The artifact is the opposite bet. An artifact has a publication date, a byline, a shelf. It does not fear the archive; it longs for it. And the archive does a strange thing to writing: it makes the writer better, because it removes the exit strategy. You cannot quietly delete a mediocre argument that is bound into a shelf your readers own.

## Habits of slow publications

1. **Publish less, date everything.** The date is not bookkeeping; it is honesty. The undated web evolved to trick you into believing everything is from yesterday.
2. **Design for the second visit.** Feeds are designed for the first glance; a good journal is designed for the return trip — hence tables of contents, hence anchors, hence the reading position you left last Tuesday.
3. **Write for the reprint.** If the piece cannot survive being quoted — if its paragraphs do not stand alone like rooms in a corridor — it was a post, not an essay.

> Reader, you are not a metric. You are a resident of this text. The doors stay unlocked; the lights stay low.

## The medium is the maintenance budget

Slow is a technical posture as much as an editorial one. Static shells over live islands. Revalidation measured in minutes, not milliseconds. Web fonts subset and swapped, not streamed from five CDNs. A page that still renders perfectly without JavaScript is the web equivalent of load-bearing masonry: unfashionable, dependable.

None of this is nostalgia. The feed has its place — announcements, receipts, time. But the things worth building a room to read deserve walls, a roof, and a date on the spine.$md$,
  'https://picsum.photos/seed/slow/1200/800',
  'Culture',
  ARRAY['writing', 'publishing', 'slowweb'],
  'published', 6, '2026-10-24T09:00:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'drop-caps-and-dead-behavior',
  $md$Drop caps and dead behavior$md$,
  $md$A field guide to long-form typography on screens$md$,
  $md$Drop caps, hanging punctuation, optical margins and figured pull quotes: what still works on screens, what merely survives from print, and what the renderer quietly eats.$md$,
  $md$Long-form typography on the web is a negotiation with whatever the browser renderer felt like doing this week. You declare a beautiful grid; the platform delivers 61 pixels of horizontal scroll because a code block overflowed while you were not looking. Still, the core moves of editorial typography translate beautifully — with a few adjustments.

## What translates

- **The drop cap.** Three lines deep, sized against the first paragraph's leading. The browser eats its own descendants' line-height, so set the cap's box explicitly and measure after font load, not before.
- **Hanging punctuation in principle.** Optical margin alignment remains a print luxury; the honest approximation on screens is a soft indent on quotes and code blocks so their optically-heavy left edges align to the text margin.
- **Figures with captions.** `figure > figcaption` is the one piece of print discipline HTML shipped natively. Use it; caption in the smaller cut, letterspaced small caps for "Fig. 1".

## What merely survives

Justified text, we saluted with a tear and let go — `text-wrap: balance` and generous ragged-right do the same job without the rivers. Small caps as decoration anywhere near body text: small caps belong to metadata, captions and the occasional eyebrow, where they signal *orientation* rather than ornament.

## What the renderer quietly eats

1. Orphan single words: `text-wrap: pretty` is finally shipping wide enough to invoke without guilt.
2. Ligatures lying about letter spacing in the headline cut — verify at large sizes, not at 16px.
3. Automatic hyphenation, abandoned: for long-line reading widths it is still your friend on the web, whatever the print revival says.

> A typographic system you can explain in one breath — display serif, measured rag, quiet rules — will outlive any framework that generated it. Rules age; reason does not.

The conclusion of three years of field notes is unfashionably plain: the web did not need new typography. It needed editors willing to apply the old typography and then defend the margins like property lines.$md$,
  'https://picsum.photos/seed/type/1200/800',
  'Design',
  ARRAY['typography', 'reading', 'css'],
  'published', 8, '2026-10-31T09:00:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'realtime-is-a-feeling',
  $md$Realtime is a feeling$md$,
  $md$Presence, pulses and the tenth-second heartbeat$md$,
  $md$The technical stack for presence is five lines of code. The feeling of a shared room is a design problem nobody budgets for.$md$,
  $md$The chat joins. A tiny avatar slides into the sidebar. Then someone, somewhere in a different city, reacts to the paragraph you are reading and the counter exhales upward by one. Nothing changed. Everything changed — you suddenly believe, for exactly one second, that the web is inhabited.

That belief is the actual product of realtime. The API surface that delivers it is comically small: one channel, one presence heartbeat, two subscriptions. The difficulty lives elsewhere, in two qualities that no checklist has ever captured.

## Rhythm

Counts that update instantly feel like commodities; counts that pulse feel alive. The 250ms throttle is not a performance optimization — it is an emotional one. Live streams that update on every single event become tickers; live rooms that update in gentle breaths become conversations. Pace the stream. Batch the render. Let the spring do the emoting.

## Absence handled honestly

Presence code always covers the entrance party. The craft is in the exit: the reader who closed the tab mid-scroll, the connection dropped in a tunnel. Handle those identically — a soft fade, a wide gap, and no attempt to explain. A room that pretends people never leave develops trust problems fast.

> The house lights dim, the avatars empty, the room keeps its shape. Architecture earns its keep in absence.

## The implementation, in public

1. One channel per reading room, keyed by post slug.
2. Presence: on `track`, ship nothing but a stable user-ish key and a heartbeat; on `sync`, render at most 24 avatars plus an overflow count.
3. Postgres changes: `comments` and `reactions` subscribe independently; both feed the same 250ms throttler before touching React state.
4. Cleanup in a `useEffect` return — no channel outlives its page. Ever.

The irony of realtime features is that when they work, they are invisible, and when they break, they are *reassuringly* invisible too. Budget accordingly: the demos that get scheduled after lunch all die in staging, and the products people trust ship the throttled version.$md$,
  'https://picsum.photos/seed/realtime/1200/800',
  'Engineering',
  ARRAY['realtime', 'supabase', 'presence'],
  'published', 6, '2026-11-06T09:00:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'field-notes-on-the-daily-page',
  $md$Field notes on the daily page$md$,
  $md$Four weeks of writing in public, honestly logged$md$,
  $md$Nothing narrative. Just the ledger: what shipped, what stalled, and what the margins taught me while the essay above this one was still wet.$md$,
  $md$I keep a daily page. It is not a journal in the sentimental sense — it is a ledger for a publication under construction. Four weeks in, the ledger is more honest than any stakeholder deck would be, so here it is, styled down and lightly annotated.

## Week one — the shell

Shipped the spatial shell: tokens, type ramp, the hero survey with its six glass volumes. Discovered that the font metric I trusted was measured against the wrong baseline and that the headline wrapped mid-word at 1440px. Both fixed with the same discipline: measure at the sizes you actually publish.

## Week two — the data seam

Went schema-first: RLS on every table before a single fetch existed. The constraint that writing lives in was the north star for every policy: *published is public, draft is the author's diary.* One recurring temptation, recorded here so it stays honest: quietly loosening the drafts policy so "testing is easier." Not given in to.

## Week three — the room services

Presence landed on a Tuesday. The first version updated on every event and felt like a stock ticker. The fix was not technical but editorial: throttle, batch, breathe. The feature grew up when it started lying about time.

## Week four — the reading lamp

The ambient scene learned to dim with scroll progress. The first palette went lurid; the correct move was subtractive. What remains is basically a suggestion of light behind the text — a reading lamp, not a skyline.

> The ledger keeps the writer honest. Publish the ledger: it is the only essay where you cannot dress up the accounting.

Settling into the rhythm: build the room, write in the room, show the ledger. Repeat until the shelf creaks.$md$,
  'https://picsum.photos/seed/notes/1200/800',
  'Notes',
  ARRAY['process', 'ledger'],
  'published', 4, '2026-11-09T09:00:00+00:00'
);

-- ── Sample comments ──────────────────────────────────────────────────
insert into public.comments (author_id, post_id, parent_id, body, created_at)
values
(
  '11111111-1111-4111-8111-111111111111',
  'c1a10001-0000-4000-8000-000000000001',
  null, -- top-level
  $md$Room two of the metaphor: the footnote is a side table. You keep it near because you will need it, but it never blocks the corridor.$md$,
  '2026-10-11T15:00:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'c1a10001-0000-4000-8000-000000000002',
  null, -- top-level
  $md$The memo about frameloop loyalty is quoted weekly in our office. Pausing off-screen scenes took our dashboard from 3.1W to 0.8W idle draw.$md$,
  '2026-10-18T12:30:00+00:00'
),
(
  '11111111-1111-4111-8111-111111111111',
  'c1a10001-0000-4000-8000-000000000002',
  null, -- top-level
  $md$Did you keep ContactShadows at 256 even in the hero, or drop to 128 there? Curious where you spend the difference.$md$,
  '2026-10-19T08:15:00+00:00'
);

-- ── Sample reactions (public counts) ─────────────────────────────────
insert into public.reactions (post_id, user_id, kind)
select p.id, '11111111-1111-4111-8111-111111111111', k.kind
from public.posts p
cross join (values ('like'), ('insight')) as k(kind)
where p.status = 'published'
on conflict do nothing;
