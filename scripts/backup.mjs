/**
 * Takes a portable snapshot of the live database: every row of every table in
 * the public schema, written as restorable INSERT statements, plus the data as
 * JSON and a catalogue snapshot of the policies, indexes and constraints.
 *
 *   node scripts/backup.mjs              # → backups/<timestamp>/
 *   node scripts/backup.mjs --dir /path  # write somewhere else entirely
 *
 * Structure (tables, enums, RLS) still comes from supabase/*.sql — restore is
 * `node scripts/run-sql.mjs <schema.sql>` followed by the generated data file,
 * which is why this writes SQL rather than a pg_dump binary. There is no
 * pg_dump on this machine and no `pg_restore` to read one back.
 *
 * DATABASE_URL is read from the environment or .env.local.
 */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
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

/* ── where to write ─────────────────────────────────────────────────── */
const flagDir = process.argv.indexOf("--dir");
const outRoot =
  flagDir > -1 && process.argv[flagDir + 1]
    ? resolve(process.argv[flagDir + 1])
    : fileURLToPath(new URL("../backups", import.meta.url));

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);
const outDir = resolve(outRoot, stamp);

const ident = (name) => `"${String(name).replace(/"/g, '""')}"`;

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  /* ── which tables exist, and in what order can they be restored ───── */
  const { rows: tableRows } = await client.query(`
    select c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  `);
  const allTables = tableRows.map((r) => r.name);

  const { rows: edges } = await client.query(`
    select
      src.relname as child,
      tgt.relname as parent
    from pg_constraint k
    join pg_class src on src.oid = k.conrelid
    join pg_class tgt on tgt.oid = k.confrelid
    join pg_namespace n on n.oid = src.relnamespace
    where k.contype = 'f' and n.nspname = 'public'
  `);

  /* topological sort: parents before children, so inserts never break a FK */
  const parentsOf = new Map(allTables.map((t) => [t, new Set()]));
  for (const { child, parent } of edges) {
    if (parentsOf.has(child) && parentsOf.has(parent)) parentsOf.get(child).add(parent);
  }
  const ordered = [];
  const placed = new Set();
  while (ordered.length < allTables.length) {
    const ready = allTables.filter(
      (t) => !placed.has(t) && [...parentsOf.get(t)].every((p) => placed.has(p))
    );
    if (ready.length === 0) {
      /* a cycle: fall back to alphabetical for whatever is left */
      for (const t of allTables) if (!placed.has(t)) ordered.push(t), placed.add(t);
      break;
    }
    for (const t of ready) ordered.push(t), placed.add(t);
  }

  /* ── dump each table ───────────────────────────────────────────────── */
  mkdirSync(outDir, { recursive: true });

  const json = {
    meta: {
      takenAt: new Date().toISOString(),
      database: databaseUrl.replace(/\/\/[^@]*@/, "//***@"),
      tables: {},
    },
    tables: {},
  };

  const sqlLines = [
    "-- Gazette data snapshot",
    `-- taken ${new Date().toISOString()}`,
    "-- structure comes from supabase/*.sql; this file only carries rows",
    "-- restore: node scripts/run-sql.mjs <schema.sql> then this file",
    "",
    "begin;",
    "",
  ];

  let totalRows = 0;
  const counts = [];

  for (const table of ordered) {
    const { rows: cols } = await client.query(
      `select column_name, data_type
         from information_schema.columns
        where table_schema = 'public' and table_name = $1
        order by ordinal_position`,
      [table]
    );
    if (cols.length === 0) continue;

    /* Let Postgres render each row: quote_nullable() is the one place that
       knows how to escape a value, so no quoting logic lives in this file. */
    const values = cols
      .map((c) => `quote_nullable(${ident(c.column_name)})`)
      .join(" || ',' || ");

    const { rows: stmts } = await client.query(
      `select 'INSERT INTO public.${ident(table)} (${cols
        .map((c) => ident(c.column_name))
        .join(", ")}) VALUES (' || ${values} || ') ON CONFLICT DO NOTHING;' as stmt
         from public.${ident(table)}`
    );

    if (stmts.length > 0) {
      sqlLines.push(`-- ${table}`);
      for (const { stmt } of stmts) sqlLines.push(stmt);
      sqlLines.push("");
    }

    const { rows } = await client.query(
      `select * from public.${ident(table)}`
    );
    json.tables[table] = rows;
    totalRows += rows.length;
    counts.push({ table, rows: rows.length });
  }

  sqlLines.push("commit;", "");

  /* ── catalogue snapshot: policies, indexes, constraints ─────────────── */
  const { rows: policies } = await client.query(`
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies where schemaname = 'public'
    order by tablename, policyname
  `);
  const { rows: indexes } = await client.query(
    `select tablename, indexname, indexdef from pg_indexes
      where schemaname = 'public' order by tablename, indexname`
  );
  const { rows: constraints } = await client.query(`
    select conrelid::regclass::text as table, conname, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where connamespace = 'public'::regnamespace
    order by conrelid::regclass::text, conname
  `);
  const { rows: triggers } = await client.query(`
    select event_object_table as table, trigger_name, action_timing, event_manipulation
    from information_schema.triggers
    where trigger_schema = 'public'
    order by event_object_table, trigger_name
  `);

  json.catalog = { policies, indexes, constraints, triggers };

  /* ── write, then verify what landed on disk ─────────────────────────── */
  const sqlFile = resolve(outDir, "gazette-data.sql");
  const jsonFile = resolve(outDir, "gazette-snapshot.json");
  writeFileSync(sqlFile, sqlLines.join("\n"));
  writeFileSync(jsonFile, JSON.stringify(json, null, 2));

  const sqlBytes = statSync(sqlFile).size;
  const jsonBytes = statSync(jsonFile).size;
  const insertCount = sqlLines.filter((l) => l.startsWith("INSERT INTO")).length;

  console.log(`✓ ${counts.map((c) => `${c.table} ${c.rows}`).join(" · ")}`);
  console.log(`  ${totalRows} rows → ${insertCount} insert statements`);
  console.log(`  ${sqlFile}  ${(sqlBytes / 1024).toFixed(1)} kB`);
  console.log(`  ${jsonFile}  ${(jsonBytes / 1024).toFixed(1)} kB`);

  if (insertCount !== totalRows) {
    console.error(
      `✗ row/statement mismatch (${totalRows} rows, ${insertCount} inserts) — snapshot is not trustworthy`
    );
    process.exitCode = 1;
  }

  console.log(
    "\n  This lives on the same disk as the machine it protects. Copy it off:\n" +
      `  cp -R "${outDir}" ~/Dropbox/Gazette-backups/   (or iCloud Drive)`
  );
}

main()
  .catch((err) => {
    console.error("✗ backup failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => client.end().catch(() => {}));
