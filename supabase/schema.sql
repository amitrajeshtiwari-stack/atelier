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
