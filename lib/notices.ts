import "server-only";
import type { NoticeRow } from "@/lib/schemas";
import { noticeRowSchema } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/server";

/**
 * Gazette data access. Notices are read anonymously — the ingest
 * pipeline writes them, so there is no author join here. Queries are
 * uncached; pages opt into freshness with `export const revalidate`.
 *
 * When Supabase credentials are absent (fresh checkout) the functions
 * fall back to a small demo plate so the Gazette is reviewable without
 * a database.
 */

const day = (iso: string) => new Date(iso).toISOString();

const DEMO_NOTICES: NoticeRow[] = [
  {
    id: "c1a20001-0000-4000-8000-000000000001",
    slug: "army-tiger-canteen-satwari-jammu-recruitment-2026",
    title:
      "Army Tiger Canteen Satwari Jammu — MTS, Billing Operator & Accountant (20 Posts)",
    department: "Indian Army",
    kind: "recruitment",
    apply_mode: "offline",
    summary:
      "Army Tiger Canteen, Satwari (J&K) invites offline applications for 20 contractual posts: 12 MT Sales Attendant/Billing Operator (10+2 with computer knowledge), 06 Labour (10th pass), 01 Accountant (ex-servicemen), 01 Housekeeper. Send by ordinary or speed post to OIC Canteen, Tiger Canteen Satwari, Jammu-180003.",
    facts: [
      { label: "Application start", value: "13 November 2026" },
      { label: "Application fee", value: "Rs 0 for all categories" },
      { label: "Age limit", value: "18 to 50 years (65 for Accountant)" },
    ],
    official_url: "https://joinindianarmy.nic.in/",
    apply_last_date: "2026-11-20T23:59:59+05:30",
    vacancy_count: 20,
    series_slug: "indian-army-civilian-2026",
    source: "https://rojgarkikhoj.com/feed/",
    status: "live",
    created_at: day("2026-11-13T16:41:31+00:00"),
    updated_at: day("2026-11-13T16:41:31+00:00"),
  },
  {
    id: "c1a20001-0000-4000-8000-000000000002",
    slug: "bsf-capf-si-ldce-notification-2026",
    title:
      "CAPF Sub-Inspector (GD) LDCE 2026 — 1,167 Posts Across BSF, CRPF, ITBP & SSB",
    department: "Border Security Force",
    kind: "recruitment",
    apply_mode: "online",
    summary:
      "Limited Departmental Competitive Examination for 1,167 Sub-Inspector (GD) posts: ITBP 430, CRPF 377, BSF 235, SSB 125. Open to serving Constable (GD/Tradesmen), HC (GD) and ASI (GD) with 4 years regular service and a bachelor degree. Selection: CBT (200 marks), physical standards, physical efficiency, medical and document verification.",
    facts: [
      { label: "Application window", value: "12 Nov to 31 Dec 2026" },
      { label: "Application fee", value: "Rs 0 for all categories" },
      { label: "Age limit", value: "18 to 32 years (37 for SC/ST)" },
    ],
    official_url: "https://bsf.mha.gov.in/",
    apply_last_date: "2026-12-31T23:59:59+05:30",
    vacancy_count: 1167,
    series_slug: "capf-si-gd-ldce-2026",
    source: "https://rojgarkikhoj.com/feed/",
    status: "live",
    created_at: day("2026-11-11T16:51:37+00:00"),
    updated_at: day("2026-11-11T16:51:37+00:00"),
  },
  {
    id: "c1a20001-0000-4000-8000-000000000003",
    slug: "dsssb-mts-recruitment-2026-notice",
    title: "DSSSB Advt 06/2026 — 1,075 MTS & 185 Junior Engineer (Electrical) Posts",
    department: "Delhi Subordinate Services Selection Board",
    kind: "recruitment",
    apply_mode: "online",
    summary:
      "Delhi SSB advertises 1,260 tentative vacancies under Advt 06/2026: 185 Junior Engineer (Electric/Electrical, Post Code 809/26) and 1,075 Multi-Tasking Staff including MTS General Duty and MTS-Aaya (Female), Post Code 810/26. Online applications only through the Board portal.",
    facts: [
      { label: "Last date online", value: "11 December 2026" },
      { label: "Vacancies", value: "1,075 MTS + 185 JE (Electrical)" },
    ],
    official_url: "https://dsssb.delhi.gov.in/",
    apply_last_date: "2026-12-11T23:59:59+05:30",
    vacancy_count: 1260,
    series_slug: "dsssb-advt-06-2026",
    source: "https://rojgarkikhoj.com/feed/",
    status: "live",
    created_at: day("2026-11-10T18:20:00+00:00"),
    updated_at: day("2026-11-10T18:20:00+00:00"),
  },
  {
    id: "c1a20001-0000-4000-8000-000000000004",
    slug: "jkssb-junior-engineer-civil-recruitment-2026",
    title: "JKSSB Junior Engineer (Civil) 2026 — 458 Posts, Apply Online",
    department: "J&K Services Selection Board",
    kind: "recruitment",
    apply_mode: "online",
    summary:
      "J&K Services Selection Board recruits 458 Junior Engineer (Civil) posts. Online applications close 29 December 2026; admit cards are released about a week before the exam date on the Board website.",
    facts: [
      { label: "Last date online", value: "29 December 2026" },
      { label: "Vacancies", value: "458 Junior Engineer (Civil)" },
    ],
    official_url: "https://jkssb.nic.in/",
    apply_last_date: "2026-12-29T23:59:59+05:30",
    vacancy_count: 458,
    series_slug: "jkssb-je-2026",
    source: "https://rojgarkikhoj.com/feed/",
    status: "live",
    created_at: day("2026-11-08T15:05:00+00:00"),
    updated_at: day("2026-11-08T15:05:00+00:00"),
  },
  {
    id: "c1a20001-0000-4000-8000-000000000005",
    slug: "india-post-office-chennai-recruitment-2026",
    title: "India Post MMS Chennai — 24 Staff Car Driver (Ordinary Grade) Posts",
    department: "India Post",
    kind: "recruitment",
    apply_mode: "offline",
    summary:
      "Tamil Nadu Circle, Mail Motor Service Chennai invites offline applications for 24 Staff Car Driver (Ordinary Grade) posts across five divisions. Fill the prescribed form in Hindi, English or Tamil without corrections and send by Speed Post only to reach MMS Chennai before 5 pm on 30 November 2026.",
    facts: [
      { label: "Last date", value: "30 November 2026, 5:00 pm" },
      { label: "Vacancies", value: "24 across five TN divisions" },
    ],
    official_url: "https://www.indiapost.gov.in/",
    apply_last_date: "2026-11-30T17:00:00+05:30",
    vacancy_count: 24,
    series_slug: "india-post-tn-2026",
    source: "https://rojgarkikhoj.com/feed/",
    status: "live",
    created_at: day("2026-11-06T14:40:00+00:00"),
    updated_at: day("2026-11-06T14:40:00+00:00"),
  },
  {
    id: "c1a20001-0000-4000-8000-000000000006",
    slug: "echs-leh-recruitment-2026",
    title:
      "ECHS Station HQ Leh — Clerk, Medical Officer, Nursing Assistant & 7 Other Posts",
    department: "Ex-Servicemen Contributory Health Scheme",
    kind: "recruitment",
    apply_mode: "offline",
    summary:
      "ECHS Station HQ Leh recruits 10 contractual posts, one vacancy each: Medical Officer, Dental Officer, Nursing Assistant, Pharmacist, Lab Technician, Dental Assistant, Clerk, Chowkidar, Female Attendant and Safaiwala. Submit the application in duplicate with self-attested documents by 20 November 2026.",
    facts: [
      { label: "Last date", value: "20 November 2026" },
      { label: "Vacancies", value: "10 posts, one each" },
    ],
    official_url: "https://www.echs.gov.in/",
    apply_last_date: "2026-11-20T23:59:59+05:30",
    vacancy_count: 10,
    series_slug: "echs-2026",
    source: "https://rojgarkikhoj.com/feed/",
    status: "live",
    created_at: day("2026-11-04T12:15:00+00:00"),
    updated_at: day("2026-11-04T12:15:00+00:00"),
  },
];

/** Gazette index — every non-archived notice, newest first. */
export async function getNotices(): Promise<NoticeRow[]> {
  if (!hasSupabaseEnv) return DEMO_NOTICES;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return DEMO_NOTICES;

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error || !data) return DEMO_NOTICES;

  return (data as unknown as NoticeRow[]).map((row) =>
    noticeRowSchema.parse(row)
  );
}

/** A single non-archived notice by slug. */
export async function getNoticeBySlug(
  slug: string
): Promise<NoticeRow | null> {
  if (!hasSupabaseEnv) {
    return DEMO_NOTICES.find((n) => n.slug === slug) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return DEMO_NOTICES.find((n) => n.slug === slug) ?? null;

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("slug", slug)
    .neq("status", "archived")
    .maybeSingle();

  if (error || !data) return null;
  return noticeRowSchema.parse(data as unknown as NoticeRow);
}

/** Earlier notices in the same series, for the related-updates timeline. */
export async function getNoticesInSeries(
  seriesSlug: string,
  excludeSlug: string
): Promise<NoticeRow[]> {
  if (!hasSupabaseEnv) {
    return DEMO_NOTICES.filter(
      (n) => n.series_slug === seriesSlug && n.slug !== excludeSlug
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return DEMO_NOTICES.filter(
      (n) => n.series_slug === seriesSlug && n.slug !== excludeSlug
    );
  }

  const { data, error } = await supabase
    .from("notices")
    .select("*")
    .eq("series_slug", seriesSlug)
    .neq("slug", excludeSlug)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as unknown as NoticeRow[]).map((row) =>
    noticeRowSchema.parse(row)
  );
}
