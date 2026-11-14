-- ═══════════════════════════════════════════════════════════════════════
-- Atelier — gazette.sql
-- The Gazette: India government-job openings filed as notices.
-- Applied via: node scripts/run-sql.mjs supabase/gazette.sql
-- Notices are written only by the ingest pipeline (direct Postgres
-- connection, outside RLS); visitors get anonymous read access.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Enums ──────────────────────────────────────────────────────────────
create type public.notice_status as enum ('live', 'closed', 'archived');
create type public.notice_kind as enum
  ('recruitment', 'result', 'admit-card', 'answer-key', 'admission');

-- ── notices ───────────────────────────────────────────────────────────
create table public.notices (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null check (char_length(title) between 1 and 200),
  department      text not null
                    check (char_length(department) between 1 and 120),
  kind            public.notice_kind not null default 'recruitment',
  apply_mode      text not null check (apply_mode in ('online', 'offline')),
  summary         text not null check (char_length(summary) between 1 and 600),
  facts           jsonb not null default '[]'::jsonb,
  official_url    text not null check (official_url like 'http%'),
  apply_last_date timestamptz,
  vacancy_count   int check (vacancy_count is null or vacancy_count between 1 and 1000000),
  series_slug     text not null
                    check (series_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  source          text not null check (source like 'http%'),
  status          public.notice_status not null default 'live',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index notices_feed_idx on public.notices (created_at desc)
  where status <> 'archived';
create index notices_series_idx on public.notices (series_slug, created_at desc);

alter table public.notices enable row level security;

-- The Gazette is a public noticeboard: every non-archived notice reads
-- anonymously. Writes happen through the service role / ingest pipeline.
create policy "non-archived notices are readable by anyone"
  on public.notices for select
  using (status <> 'archived');

-- Keep updated_at honest across ingest upserts.
create trigger notices_touch_updated_at
  before update on public.notices
  for each row execute function public.touch_updated_at();

-- ── Realtime ──────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notices'
  ) then
    alter publication supabase_realtime add table public.notices;
  end if;
end $$;

-- Full old-row payloads make UPDATE/DELETE events usable client-side.
alter table public.notices replica identity full;

-- ═══════════════════════════════════════════════════════════════════════
-- Seed — six real openings filed from the live feed (Nov 2026).
-- "Join now" always lands on the OFFICIAL government portal, never the
-- aggregator. Idempotent: upsert on slug.
-- ═══════════════════════════════════════════════════════════════════════

insert into public.notices
  (slug, title, department, kind, apply_mode, summary, facts,
   official_url, apply_last_date, vacancy_count, series_slug, source, status)
values
  ('army-tiger-canteen-satwari-jammu-recruitment-2026',
   'Army Tiger Canteen Satwari Jammu — MTS, Billing Operator & Accountant (20 Posts)',
   'Indian Army', 'recruitment', 'offline',
   'Army Tiger Canteen, Satwari (J&K) invites offline applications from all-India candidates for 20 contractual posts: 12 MT Sales Attendant/Billing Operator (10+2 with computer knowledge), 06 Labour (10th pass), 01 Accountant (ex-servicemen), 01 Housekeeper. Selection by scrutiny, interview, skill test and medical. Send by ordinary or speed post to OIC Canteen, Tiger Canteen Satwari, Jammu-180003.',
   '[{"label":"Application start","value":"13 November 2026"},
     {"label":"Application fee","value":"Rs 0 for all categories"},
     {"label":"Age limit","value":"18 to 50 years (65 for Accountant)"},
     {"label":"Qualification","value":"10th for Labour, 10+2 for MTS/Billing, ex-servicemen for Accountant"}]'::jsonb,
   'https://joinindianarmy.nic.in/',
   '2026-11-20 23:59:59+05:30', 20,
   'indian-army-civilian-2026', 'https://rojgarkikhoj.com/feed/', 'live'),

  ('bsf-capf-si-ldce-notification-2026',
   'CAPF Sub-Inspector (GD) LDCE 2026 — 1,167 Posts Across BSF, CRPF, ITBP & SSB',
   'Border Security Force', 'recruitment', 'online',
   'Limited Departmental Competitive Examination for 1,167 Sub-Inspector (GD) posts across four forces: ITBP 430, CRPF 377, BSF 235, SSB 125. Open to serving Constable (GD/Tradesmen), HC (GD) and ASI (GD) with 4 years regular service and a bachelor degree in any stream. Selection: computer-based test (200 marks), physical standards, physical efficiency, medical and document verification.',
   '[{"label":"Application window","value":"12 Nov to 31 Dec 2026"},
     {"label":"Application fee","value":"Rs 0 for all categories"},
     {"label":"Age limit","value":"18 to 32 years (37 for SC/ST)"},
     {"label":"Exam pattern","value":"CBT, 200 marks, 210 minutes, minus 0.25 marking"}]'::jsonb,
   'https://bsf.mha.gov.in/',
   '2026-12-31 23:59:59+05:30', 1167,
   'capf-si-gd-ldce-2026', 'https://rojgarkikhoj.com/feed/', 'live'),

  ('dsssb-mts-recruitment-2026-notice',
   'DSSSB Advt 06/2026 — 1,075 MTS & 185 Junior Engineer (Electrical) Posts',
   'Delhi Subordinate Services Selection Board', 'recruitment', 'online',
   'Delhi SSB advertises 1,260 tentative vacancies under Advt 06/2026: 185 Junior Engineer (Electric/Electrical, Post Code 809/26) and 1,075 Multi-Tasking Staff including MTS General Duty and MTS-Aaya (Female), Post Code 810/26. Online applications only through the Board portal; no other mode is accepted. Submit well before the closing date to avoid heavy-load failures.',
   '[{"label":"Last date online","value":"11 December 2026"},
     {"label":"Vacancies","value":"1,075 MTS + 185 JE (Electrical)"},
     {"label":"Mode","value":"Online only, via DSSSB portal"}]'::jsonb,
   'https://dsssb.delhi.gov.in/',
   '2026-12-11 23:59:59+05:30', 1260,
   'dsssb-advt-06-2026', 'https://rojgarkikhoj.com/feed/', 'live'),

  ('jkssb-junior-engineer-civil-recruitment-2026',
   'JKSSB Junior Engineer (Civil) 2026 — 458 Posts, Apply Online',
   'J&K Services Selection Board', 'recruitment', 'online',
   'J&K Services Selection Board recruits 458 Junior Engineer (Civil) posts. Online applications close 29 December 2026; admit cards are released about a week before the exam date on the Board website. Read the official notification for post-wise eligibility and the departmental reservation rules before applying.',
   '[{"label":"Last date online","value":"29 December 2026"},
     {"label":"Vacancies","value":"458 Junior Engineer (Civil)"},
     {"label":"Admit card","value":"About one week before exam"}]'::jsonb,
   'https://jkssb.nic.in/',
   '2026-12-29 23:59:59+05:30', 458,
   'jkssb-je-2026', 'https://rojgarkikhoj.com/feed/', 'live'),

  ('india-post-office-chennai-recruitment-2026',
   'India Post MMS Chennai — 24 Staff Car Driver (Ordinary Grade) Posts',
   'India Post', 'recruitment', 'offline',
   'Tamil Nadu Circle, Mail Motor Service Chennai invites offline applications for 24 Staff Car Driver (Ordinary Grade) posts: Chennai 15, Coimbatore 3, Salem West 3, Madurai 2, Tiruchirappalli 1. Fill the prescribed form in Hindi, English or Tamil without corrections and send by Speed Post only to reach MMS Chennai before 5 pm on 30 November 2026. Selection follows the Annexure-I exam pattern and syllabus.',
   '[{"label":"Last date","value":"30 November 2026, 5:00 pm"},
     {"label":"Vacancies","value":"24 across five TN divisions"},
     {"label":"How to send","value":"Speed Post only to MMS Chennai"}]'::jsonb,
   'https://www.indiapost.gov.in/',
   '2026-11-30 17:00:00+05:30', 24,
   'india-post-tn-2026', 'https://rojgarkikhoj.com/feed/', 'live'),

  ('echs-leh-recruitment-2026',
   'ECHS Station HQ Leh — Clerk, Medical Officer, Nursing Assistant & 7 Other Posts',
   'Ex-Servicemen Contributory Health Scheme', 'recruitment', 'offline',
   'ECHS Station HQ Leh recruits 10 contractual posts, one vacancy each: Medical Officer, Dental Officer, Nursing Assistant, Pharmacist, Lab Technician, Dental Assistant, Clerk, Chowkidar, Female Attendant and Safaiwala. Submit the application form in duplicate with self-attested documents by 20 November 2026; applications received after this date are not accepted.',
   '[{"label":"Last date","value":"20 November 2026"},
     {"label":"Vacancies","value":"10 posts, one each"},
     {"label":"Basis","value":"Contractual engagement"}]'::jsonb,
   'https://www.echs.gov.in/',
   '2026-11-20 23:59:59+05:30', 10,
   'echs-2026', 'https://rojgarkikhoj.com/feed/', 'live')

on conflict (slug) do update set
  title           = excluded.title,
  department      = excluded.department,
  kind            = excluded.kind,
  apply_mode      = excluded.apply_mode,
  summary         = excluded.summary,
  facts           = excluded.facts,
  official_url    = excluded.official_url,
  apply_last_date = excluded.apply_last_date,
  vacancy_count   = excluded.vacancy_count,
  series_slug     = excluded.series_slug,
  source          = excluded.source,
  status          = excluded.status;
