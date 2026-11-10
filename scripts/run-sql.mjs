/**
 * Executes a SQL file against the Supabase Postgres database directly —
 * bypasses the dashboard SQL editor entirely. Statements run one by one
 * (each auto-commits), so a single bad statement never blanks the run;
 * the exact failing statement is reported. Ends with a PostgREST
 * schema-cache reload notify soREST sees new tables immediately.
 *
 *   node scripts/run-sql.mjs supabase/apply-part2.sql
 *
 * DATABASE_URL is read from the environment or .env.local.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

/* ── resolve DATABASE_URL from env, then .env.local ─────────────────── */
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
if (!databaseUrl) {
  console.error(
    "✗ DATABASE_URL is not set (Dashboard → Connect → Connection string → URI)."
  );
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-sql.mjs <file.sql>");
  process.exit(1);
}

/* ── statement splitter ───────────────────────────────────────────────
   Splits on `;` only outside '…' strings, $tag$…$tag$ bodies (also $$),
   -- line comments and /* *∕ block comments. Comments are dropped.     */
function splitStatements(source) {
  const out = [];
  let cur = "";
  let mode = "code"; // code | single | dollar | linec | blockc
  let tag = "";

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const two = source.slice(i, i + 2);

    if (mode === "code") {
      if (two === "--") { mode = "linec"; i++; continue; }
      if (two === "/*") { mode = "blockc"; i++; continue; }
      if (ch === "'") { mode = "single"; cur += ch; continue; }
      if (ch === "$") {
        const m = source.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
        if (m) {
          tag = m[0];
          mode = "dollar";
          cur += tag;
          i += tag.length - 1;
          continue;
        }
      }
      if (ch === ";") {
        const t = cur.trim();
        if (t) out.push(t);
        cur = "";
        continue;
      }
      cur += ch;
      continue;
    }

    if (mode === "single") {
      if (two === "''") { cur += "''"; i++; continue; }
      if (ch === "'") { mode = "code"; cur += ch; continue; }
      cur += ch;
      continue;
    }

    if (mode === "dollar") {
      const idx = source.indexOf(tag, i);
      if (idx === -1) { cur += source.slice(i); i = source.length; continue; }
      cur += source.slice(i, idx + tag.length);
      i = idx + tag.length - 1;
      mode = "code";
      continue;
    }

    if (mode === "linec") {
      if (ch === "\n") { mode = "code"; cur += ch; }
      continue;
    }

    if (mode === "blockc") {
      if (two === "*/") { mode = "code"; i++; }
      continue;
    }
  }

  const t = cur.trim();
  if (t) out.push(t);
  return out;
}

const statements = [
  ...splitStatements(readFileSync(file, "utf8")),
  // Make the hosted REST API immediately aware of new tables/policies.
  "notify pgrst, 'reload schema'",
];
console.log(`✓ ${file}: ${statements.length} statements`);

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

let ok = 0;
try {
  for (let n = 0; n < statements.length; n++) {
    const statement = statements[n];
    let label = statement.replace(/\s+/g, " ").slice(0, 72);
    try {
      await client.query(statement);
      ok += 1;
      process.stdout.write(`  ✓ [${n + 1}] ${label}${label.length === 72 ? "…" : ""}\n`);
    } catch (err) {
      const benign = /already exists|duplicate/i.test(err.message);
      if (benign) {
        process.stdout.write(`  ⊘ [${n + 1}] ${label}… (already existed)\n`);
        ok += 1;
        continue;
      }
      console.error(`  ✗ [${n + 1}] ${label}\n     ${err.message}`);
      if (err.detail) console.error(`     detail: ${err.detail}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}
console.log(`✓ done — ${ok}/${statements.length} statements applied`);
