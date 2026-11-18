/**
 * The Gazette ingest — the automated daily filings clerk.
 *
 * Reads RSS feeds, extracts the structured facts an applicant needs
 * (last date, fee, age, vacancies), and files each opening into the
 * `notices` table. Idempotent: the slug is derived from the source
 * article URL, so re-running the same feed updates in place instead of
 * duplicating. The "Join now" target is always the OFFICIAL government
 * portal found in the article — never the aggregator itself.
 *
 *   node scripts/ingest-gazette.mjs [--dry] [--limit N] [--quiet]
 *
 * DATABASE_URL is read from the environment or .env.local (same
 * resolution as run-sql.mjs). Writes bypass RLS via the direct
 * Postgres connection; realtime INSERT events fire on first filing.
 *
 * Adapters are pluggable: add a feed to SOURCES. When a feed yields no
 * confident official-URL match, the notice is skipped rather than
 * guessed — a gazette that guesses loses its reader's trust.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

/* ── config ──────────────────────────────────────────────────────────── */

const SOURCES = [
  {
    name: "rojgar-ki-khoj",
    feed: "https://rojgarkikhoj.com/feed/",
    // The aggregator's own domain — links pointing here are rejected.
    aggregator: "rojgarkikhoj.com",
  },
];

const UA =
  "AtelierGazette/1.0 (+https://atelier.local; government-notice ingest)";

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const QUIET = args.includes("--quiet");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

const log = (...m) => {
  if (!QUIET) console.log(...m);
};

/* ── DATABASE_URL (env, then .env.local) ─────────────────────────────── */

let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    const envLocal = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    databaseUrl = envLocal
      .split("\n")
      .find((l) => l.startsWith("DATABASE_URL="))
      ?.slice("DATABASE_URL=".length)
      .trim();
  } catch {
    /* no .env.local */
  }
}
if (!databaseUrl && !DRY) {
  console.error("✗ DATABASE_URL is not set");
  process.exit(1);
}

/* ── RSS parsing (zero-dep; RSS items are regular enough) ────────────── */

function decodeEntities(text) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#038;", "&")
    .replaceAll("&#8217;", "’")
    .replaceAll("&#8216;", "’")
    .replaceAll("&#8220;", "“")
    .replaceAll("&#8221;", "”")
    .replaceAll("&#8230;", "…")
    .replaceAll("&#8211;", "–")
    .replaceAll("&#8212;", "—")
    .replaceAll("&#124;", "|");
}

function unCDATA(block) {
  const m = block.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return (m ? m[1] : block).trim();
}

function parseFeed(xml) {
  const channelTitle = decodeEntities(
    xml.match(/<channel>[\s\S]*?<title>([\s\S]*?)<\/title>/)?.[1] ?? ""
  ).trim();

  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const block of itemBlocks) {
    const pick = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? decodeEntities(unCDATA(m[1])).trim() : "";
    };
    items.push({
      title: pick("title"),
      link: pick("link"),
      pubDate: pick("pubDate"),
      categories: (block.match(/<category[^>]*>([\s\S]*?)<\/category>/g) ?? [])
        .map((c) => decodeEntities(unCDATA(c)).trim()),
      contentHtml: pick("content:encoded"),
    });
  }
  return { channelTitle, items };
}

/* ── HTML → text and fact extraction ─────────────────────────────────── */

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<li[^>]*>/gi, " · ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function parseDDMMYYYY(value) {
  const m = value.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  // Midnight-to-midnight IST window on the last date.
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")} 23:59:59+05:30`;
}

/** The official-portal link: the href inside the "Official website" row,
 *  filtered to government domains and away from the aggregator. */
function extractOfficialUrl(html, aggregatorDomain) {
  const anchors = [...html.matchAll(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
  const isGov = (url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return (
        host !== aggregatorDomain &&
        !host.endsWith(".blogspot.") &&
        (/\.gov\.in$|\.nic\.in$/.test(host) || host.endsWith(".nic.in"))
      );
    } catch {
      return false;
    }
  };

  // Preferred: the anchor inside the row labelled "Official website".
  // PDFs are notifications, not portals — never the "Join now" target.
  const govAnchors = anchors
    .filter((a) => isGov(a[1]) && !/\.pdf(\?|$)/i.test(a[1]));

  const idx = html.search(/official\s+website/i);
  if (idx >= 0) {
    for (const a of govAnchors) {
      if (a.index > idx && a.index - idx < 400) return a[1];
    }
  }
  // Fallback: the shallowest government anchor (a homepage, not a deep
  // application or document link).
  const byDepth = (url) => {
    try {
      return new URL(url).pathname.split("/").filter(Boolean).length;
    } catch {
      return 99;
    }
  };
  const fallback = [...govAnchors].sort((a, b) => byDepth(a[1]) - byDepth(b[1]))[0];
  return fallback?.[1] ?? null;
}

function extractFacts(text) {
  const facts = [];

  const lastDate =
    text.match(/last\s+date[^0-9]{0,50}?(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/i)?.[1] ?? null;
  const startDate =
    text.match(/application\s+start[^0-9]{0,50}?(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})/i)?.[1] ?? null;
  const fee =
    text.match(/(?:application\s+)?fe(?:e|es)[^₹]{0,80}?₹\s?([\d,]+)\s?\//i)?.[1] ?? null;
  const maxAge =
    text.match(/maximum\s+age[^0-9]{0,40}?(\d{1,3})\s*years?/i)?.[1] ?? null;
  const minAge =
    text.match(/minimum\s+age[^0-9]{0,40}?(\d{1,3})\s*years?/i)?.[1] ?? null;

  if (startDate)
    facts.push({ label: "Application start", value: parseDDMMYYYY(startDate) ? formatReadable(startDate) : startDate });
  if (lastDate)
    facts.push({ label: "Last date", value: formatReadable(lastDate) });
  if (fee)
    facts.push({
      label: "Application fee",
      value: fee === "0" ? "Rs 0 for all categories" : `Rs ${fee}`,
    });
  if (minAge || maxAge)
    facts.push({
      label: "Age limit",
      value: [minAge ? `min ${minAge}` : null, maxAge ? `max ${maxAge}` : null]
        .filter(Boolean)
        .join(" to ") + " years",
    });

  return { facts: facts.slice(0, 5), lastDate: lastDate ? parseDDMMYYYY(lastDate) : null };
}

function formatReadable(ddmmyyyy) {
  const m = ddmmyyyy.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (!m) return ddmmyyyy;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(m[1])} ${months[Number(m[2]) - 1]} ${m[3]}`;
}

/**
 * The brief is written here, in the Gazette's own words, from the facts
 * that were extracted — never copied from the source article. The feed's
 * paragraph is a publisher's prose, and republishing it would make this a
 * mirror rather than a publication.
 */
function composeBrief({ department, kind, vacancies, facts, applyMode }) {
  const value = (re) => facts.find((f) => re.test(f.label))?.value ?? null;
  const lastDate = value(/last\s*date/i);
  const fee = value(/fee/i);
  const age = value(/age/i);
  const posts = vacancies
    ? `${vacancies.toLocaleString("en-IN")} ${vacancies === 1 ? "post" : "posts"}`
    : null;

  const lines = [];

  if (kind === "recruitment") {
    lines.push(
      posts
        ? `${department} has issued a recruitment notice for ${posts}.`
        : `${department} has issued a recruitment notice covered by the heading above.`
    );
    lines.push(
      applyMode === "offline"
        ? `Applications go on paper — by post or by hand — and must reach the office${
            lastDate ? ` by ${lastDate}` : " before the closing date in the notification"
          }.`
        : `Applications are made through the official portal${
            lastDate ? `, with ${lastDate} as the last date` : ", within the window stated in the notification"
          }.`
    );
    if (fee) {
      lines.push(
        /(^|\b)Rs\s?0\b/i.test(fee)
          ? "No application fee is stated for any category."
          : `The application fee is ${fee}.`
      );
    }
    if (age) lines.push(`The age window is ${age}.`);
    lines.push(
      "Eligibility, selection stages and the document list are set out in the official notification."
    );
  } else if (kind === "admit-card") {
    lines.push(
      `${department} has published an admit card for this examination.`
    );
    lines.push(
      "Download the hall ticket from the official portal and check the exam date, centre, reporting time and the photo and signature printed on it."
    );
    if (lastDate) lines.push(`The notice records ${lastDate} as its closing date.`);
  } else if (kind === "result") {
    lines.push(`${department} has declared a result under this notice.`);
    lines.push(
      "Open the official page to check your roll number, score and the next stage, and keep a copy of the result PDF."
    );
  } else if (kind === "answer-key") {
    lines.push(`${department} has published an answer key for this examination.`);
    lines.push(
      "Compare your responses against the key and use the objection window, where one is open, before it closes."
    );
  } else {
    lines.push(`${department} has opened admissions under this notice.`);
    lines.push(
      "The official page carries the programme detail, eligibility rules and the deadline for submitting the form."
    );
    if (fee) lines.push(`The fee stated in the notice is ${fee}.`);
  }

  return lines.join(" ").replace(/\s+/g, " ").trim().slice(0, 590);
}

/**
 * Source headlines are written for search snippets: "… 2026: Apply Online
 * for Posts | Notification, Eligibility & Exam Dates @ site.gov.in". We
 * keep the substance — the body, the post, the year — and drop the
 * keyword scaffolding, so a notice reads like a filing, not an ad.
 */
function cleanTitle(raw) {
  let title = raw.replace(/\s+/g, " ").trim();

  const TAILS = [
    /\s*[>|]\s*apply\s+(?:online|offline)\b.*$/i,
    /\s*[-–—]\s*apply\s+(?:online|offline)\b.*$/i,
    /\s*[>|]\s*(?:check|download|click)\b.*$/i,
    /\s*\|\s*(?:notification|eligibility|exam|salary|check|download|apply)\b.*$/i,
    /\s*[-–—]\s*(?:check|download)\b.*$/i,
    /\s*,\s*(?:check|download|eligibility)\b.*$/i,
    /\s*@\s*[\w.-]+$/i,
  ];

  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (const pattern of TAILS) {
      const next = title.replace(pattern, "").trim();
      if (next !== title && next.length > 24) {
        title = next;
        changed = true;
      }
    }
    if (!changed) break;
  }

  return title
    .replace(/\s*:?\s*notification\s+out\s*(?:for\s+)?/i, ": ")
    .replace(/\)(?=[A-Za-z])/g, ") ")
    .replace(/\s*[>|]\s*$/,"")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/[:;,\-–—\s]+$/, "")
    .slice(0, 200)
    .trim();
}

function classifyKind(title, categories) {  const hay = `${title} ${categories.join(" ")}`.toLowerCase();
  if (/admit\s*card|hall\s*ticket/.test(hay)) return "admit-card";
  if (/answer\s*key/.test(hay)) return "answer-key";
  if (/\bresult\b/.test(hay)) return "result";
  if (/admission/.test(hay)) return "admission";
  return "recruitment";
}

function classifyMode(title, categories, text) {
  const hay = `${title} ${categories.join(" ")} ${text}`.toLowerCase();
  if (/apply\s+offline|offline\s+form/.test(hay)) return "offline";
  return "online";
}

function deriveDepartment(title, text, officialUrl) {
  const KNOWN = [
    [/indian\s+army|\barmy\b|canteen\s+satwari/i, "Indian Army"],
    [/\bbsf\b|border\s+security/i, "Border Security Force"],
    [/\bcrpf\b/i, "CRPF"],
    [/\bitbp\b/i, "ITBP"],
    [/\bssb\b/i, "Sashastra Seema Bal"],
    [/coast\s+guard/i, "Indian Coast Guard"],
    [/india\s*post/i, "India Post"],
    [/dsssb/i, "Delhi Subordinate Services Selection Board"],
    [/jkssb/i, "J&K Services Selection Board"],
    [/\bechs\b/i, "Ex-Servicemen Contributory Health Scheme"],
    [/\bssc\b/i, "Staff Selection Commission"],
    [/\bupsc\b/i, "UPSC"],
    [/\brailway|\brrb\b/i, "Railway Recruitment"],
    [/\bibps\b/i, "IBPS"],
    [/police/i, "State Police"],
    [/court/i, "Judiciary"],
  ];
  for (const [re, name] of KNOWN) {
    if (re.test(title) || (text && re.test(text.slice(0, 3000)))) return name;
  }
  if (officialUrl) {
    try {
      const host = new URL(officialUrl).hostname.replace(/^www\./, "");
      const label = host
        .split(".")[0]
        .split(/[-_]/)[0]
        .replace(/\b\w/g, (c) => c.toUpperCase());
      if (label.length >= 3) return label;
    } catch {
      /* keep fallback */
    }
  }
  return "Government of India";
}

function extractVacancies(title, text) {
  // 2020–2035 values are years, not counts — skip them.
  const notYear = (v) => !(v && v.length === 4 && /^20[2-3]\d$/.test(v));
  const first = (re) =>
    [...text.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))]
      .map((m) => m[1])
      .find(notYear) ?? null;

  // "Total" phrasing first (FAQ blocks and vacancy tables state it).
  const totalPost = first(/total\s*posts?[^0-9]{0,14}(\d[\d,]{0,7})/i);
  const total =
    first(/total[^0-9.]{0,40}?(\d[\d,]{0,7})\s*(?:posts|vacanc)/gi) ??
    first(/total\s+(?:of\s+)?(\d[\d,]{0,7})\s+(?:contractual\s+)?(?:posts|vacanc)/gi);
  const nearVacancy = first(/(\d[\d,]{0,7})[^.\d]{0,30}?vacanc/i);
  const fromTitle = title.match(/(\d[\d,]*)\s*(?:posts|vacanc)/i)?.[1] ?? null;
  const fromText = first(/(\d[\d,]{1,8})\s*(?:posts|vacanc)/i);
  const raw = [totalPost, total, fromTitle, fromText, nearVacancy].find(
    (v) => v !== null && v !== undefined && notYear(v)
  );
  if (!raw) return null;
  const n = Number(raw.replaceAll(",", ""));
  return n >= 1 && n <= 1_000_000 ? n : null;
}

function slugFromLink(link) {
  try {
    const path = new URL(link).pathname.split("/").filter(Boolean);
    const last = path[path.length - 1] ?? "";
    return last.replace(/\.html?$/i, "").slice(0, 80).toLowerCase();
  } catch {
    return null;
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/* ── filing ──────────────────────────────────────────────────────────── */

function noticeFromItem(item, source) {
  if (!item.title || !item.link) return { skip: "missing title or link" };

  const slug = slugFromLink(item.link);
  if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { skip: "unsluggable link" };

  const text = htmlToText(item.contentHtml || item.title);
  const officialUrl = extractOfficialUrl(item.contentHtml || "", source.aggregator);
  if (!officialUrl) return { skip: "no official government link found" };

  const { facts, lastDate } = extractFacts(text);
  const year = item.title.match(/(20\d{2})/)?.[1] ?? String(new Date().getFullYear());
  const department = deriveDepartment(item.title, text, officialUrl);
  const kind = classifyKind(item.title, item.categories);
  const applyMode = classifyMode(item.title, item.categories, text);
  const vacancies = extractVacancies(item.title, text);

  const summary = composeBrief({ department, kind, vacancies, facts, applyMode });
  if (summary.length < 120) return { skip: "too few facts to write a useful brief" };

  const seriesSlug = slugify(`${department} ${year}`);
  if (!seriesSlug) return { skip: "unsluggable series" };

  return {
    row: {
      slug,
      title: cleanTitle(item.title),
      department,
      kind,
      apply_mode: applyMode,
      summary,
      facts: JSON.stringify(facts),
      official_url: officialUrl,
      apply_last_date: lastDate,
      vacancy_count: vacancies,
      series_slug: seriesSlug,
      source: source.feed,
      status: "live",
    },
  };
}

const UPSERT_SQL = `
  insert into public.notices
    (slug, title, department, kind, apply_mode, summary, facts,
     official_url, apply_last_date, vacancy_count, series_slug, source, status)
  values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13)
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
    status          = 'live'
  where public.notices.status <> 'archived'
`;

/* ── run ─────────────────────────────────────────────────────────────── */

const stats = { fetched: 0, filed: 0, updated: 0, skipped: 0, closed: 0 };
let client = null;

if (!DRY) {
  client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
}

async function fileRows(rows) {
  if (DRY) {
    for (const row of rows) {
      log(`  ⚖ ${row.slug}`);
      log(`     title ${row.title}`);
      log(`     dept ${row.department} · ${row.apply_mode} · ${row.vacancy_count ?? "?"} posts`);
      log(`     last ${row.apply_last_date ?? "—"} · ${row.official_url}`);
      for (const fact of JSON.parse(row.facts)) {
        log(`     · ${fact.label}: ${fact.value}`);
      }
      log(`     summary: ${row.summary.slice(0, 140)}…`);
    }
    stats.filed += rows.length;
    return;
  }
  for (const row of rows) {
    const res = await client.query(UPSERT_SQL, [
      row.slug,
      row.title,
      row.department,
      row.kind,
      row.apply_mode,
      row.summary,
      row.facts,
      row.official_url,
      row.apply_last_date,
      row.vacancy_count,
      row.series_slug,
      row.source,
      "live",
    ]);
    if (res.rowCount === 1) stats.filed += 1;
    else stats.updated += 1; // conflict + do-nothing guard (archived)
  }
}

for (const source of SOURCES) {
  log(`── ${source.name}: ${source.feed}`);
  let xml = "";
  try {
    const res = await fetch(source.feed, { headers: { "user-agent": UA } });
    if (!res.ok) {
      log(`  ✗ feed returned ${res.status}`);
      continue;
    }
    xml = await res.text();
  } catch (err) {
    log(`  ✗ fetch failed: ${err.message}`);
    continue;
  }

  const { items } = parseFeed(xml);
  stats.fetched += items.length;
  log(`  ${items.length} items in feed`);

  const rows = [];
  for (const item of items.slice(0, Number.isFinite(LIMIT) ? LIMIT : items.length)) {
    const { row, skip } = noticeFromItem(item, source);
    if (!row) {
      stats.skipped += 1;
      log(`  ⊘ skip ${item.title.slice(0, 60)} — ${skip}`);
      continue;
    }
    rows.push(row);
  }
  await fileRows(rows);
}

// Retire notices whose window has passed (idempotent, realtime UPDATE).
const CLOSE_SQL = `
  update public.notices set status = 'closed'
  where status = 'live' and apply_last_date is not null
    and apply_last_date < now() - interval '1 day'
`;
if (!DRY) {
  const closed = await client.query(CLOSE_SQL);
  stats.closed = closed.rowCount;
  await client.query("notify pgrst, 'reload schema'");
  await client.end();
} else {
  log("  (dry run: close-expired skipped)");
}

log(
  `✓ ingest — ${stats.fetched} fetched · ${stats.filed} filed · ${stats.updated} unchanged · ` +
    `${stats.skipped} skipped · ${stats.closed} closed${DRY ? " (dry)" : ""}`
);
