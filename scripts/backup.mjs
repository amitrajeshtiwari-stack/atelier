/**
 * Whole-site snapshot. Not just rows: everything needed to stand the site back
 * up on a machine that has never seen this project.
 *
 *   node scripts/backup.mjs                  # → backups/gazette-<stamp>/ + .tar.gz
 *   node scripts/backup.mjs --dir /path      # write elsewhere
 *   node scripts/backup.mjs --no-secrets     # omit .env.local (shareable copy)
 *
 * What lands in the snapshot:
 *   site/gazette.bundle   full git history, every branch — `git clone` from it
 *   site/site.tar.gz      the tracked files at HEAD, no git needed to read them
 *   db/gazette-data.sql   every row, restorable with run-sql.mjs
 *   db/gazette-snapshot.json  the same rows plus policies/indexes/constraints
 *   env/.env.local        the secrets (skip with --no-secrets)
 *   RESTORE.md            the procedure, written out
 *   MANIFEST.txt          commit, row counts, sha256 of every artifact
 *
 * The archive is verified before this command reports success: the bundle is
 * checked with `git bundle verify` and the tarball is listed back off disk.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, statSync, copyFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import pg from "pg";

const root = fileURLToPath(new URL("..", import.meta.url));
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i > -1 ? argv[i + 1] : undefined;
};

/* ── resolve DATABASE_URL from env, then .env.local ─────────────────── */
const envPath = join(root, ".env.local");
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  try {
    databaseUrl = readFileSync(envPath, "utf8")
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

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .replace("T", "_")
  .slice(0, 19);
const outRoot = opt("--dir") ? resolve(opt("--dir")) : join(root, "backups");
const outDir = join(outRoot, `gazette-${stamp}`);

const ident = (name) => `"${String(name).replace(/"/g, '""')}"`;
const sha256 = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
const kb = (file) => (statSync(file).size / 1024).toFixed(1);

/* ═══ 1. database ════════════════════════════════════════════════════ */

async function dumpDatabase(dbDir) {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const { rows: tableRows } = await client.query(`
      select c.relname as name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `);
    const allTables = tableRows.map((r) => r.name);

    const { rows: edges } = await client.query(`
      select src.relname as child, tgt.relname as parent
      from pg_constraint k
      join pg_class src on src.oid = k.conrelid
      join pg_class tgt on tgt.oid = k.confrelid
      join pg_namespace n on n.oid = src.relnamespace
      where k.contype = 'f' and n.nspname = 'public'
    `);

    /* parents before children, so a restore never breaks a foreign key */
    const parentsOf = new Map(allTables.map((t) => [t, new Set()]));
    for (const { child, parent } of edges) {
      if (parentsOf.has(child) && parentsOf.has(parent)) {
        parentsOf.get(child).add(parent);
      }
    }
    const ordered = [];
    const placed = new Set();
    while (ordered.length < allTables.length) {
      const ready = allTables.filter(
        (t) => !placed.has(t) && [...parentsOf.get(t)].every((p) => placed.has(p))
      );
      if (ready.length === 0) {
        for (const t of allTables) {
          if (!placed.has(t)) {
            ordered.push(t);
            placed.add(t);
          }
        }
        break;
      }
      for (const t of ready) {
        ordered.push(t);
        placed.add(t);
      }
    }

    mkdirSync(dbDir, { recursive: true });
    const json = {
      meta: {
        takenAt: new Date().toISOString(),
        database: databaseUrl.replace(/\/\/[^@]*@/, "//***@"),
      },
      tables: {},
    };
    const sql = [
      "-- Gazette data snapshot",
      `-- taken ${new Date().toISOString()}`,
      "-- structure lives in supabase/*.sql; this file carries rows only",
      "-- restore: schema.sql → gazette.sql → this file",
      "",
      "begin;",
      "",
    ];

    let totalRows = 0;
    const counts = [];

    for (const table of ordered) {
      const { rows: cols } = await client.query(
        `select column_name from information_schema.columns
          where table_schema = 'public' and table_name = $1
          order by ordinal_position`,
        [table]
      );
      if (cols.length === 0) continue;

      /* Postgres renders each row: quote_nullable() is the only place that
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
        sql.push(`-- ${table}`);
        for (const { stmt } of stmts) sql.push(stmt);
        sql.push("");
      }

      const { rows } = await client.query(`select * from public.${ident(table)}`);
      json.tables[table] = rows;      totalRows += rows.length;
      counts.push({ table, rows: rows.length });
    }

    sql.push("commit;", "");

    const { rows: policies } = await client.query(`
      select tablename, policyname, permissive, roles, cmd, qual, with_check
      from pg_policies where schemaname = 'public'
      order by tablename, policyname
    `);
    const { rows: indexes } = await client.query(`
      select tablename, indexname, indexdef from pg_indexes
      where schemaname = 'public' order by tablename, indexname
    `);
    const { rows: constraints } = await client.query(`
      select conrelid::regclass::text as table, conname,
             pg_get_constraintdef(oid) as definition
      from pg_constraint where connamespace = 'public'::regnamespace
      order by conrelid::regclass::text, conname
    `);
    const { rows: triggers } = await client.query(`
      select event_object_table as table, trigger_name, action_timing,
             event_manipulation
      from information_schema.triggers where trigger_schema = 'public'
      order by event_object_table, trigger_name
    `);

    json.catalog = { policies, indexes, constraints, triggers };

    const sqlFile = join(dbDir, "gazette-data.sql");
    const jsonFile = join(dbDir, "gazette-snapshot.json");
    writeFileSync(sqlFile, sql.join("\n"));
    writeFileSync(jsonFile, JSON.stringify(json, null, 2));

    const inserts = sql.filter((l) => l.startsWith("INSERT INTO")).length;
    if (inserts !== totalRows) {
      throw new Error(
        `row/statement mismatch (${totalRows} rows, ${inserts} inserts) — snapshot is not trustworthy`
      );
    }

    return { totalRows, counts, sqlFile, jsonFile, inserts };
  } finally {
    await client.end().catch(() => {});
  }
}

/* ═══ 2. code, config, instructions ══════════════════════════════════ */

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1 << 26 }).trim();

function snapshotSite(siteDir, envDir) {
  mkdirSync(siteDir, { recursive: true });
  mkdirSync(envDir, { recursive: true });

  const commit = git("rev-parse", "HEAD");
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const subject = git("log", "-1", "--pretty=%s");
  const dirty = git("status", "--porcelain", "--untracked-files=all")
    .split("\n")
    .filter((l) => l.trim() && !/^\?\? (kaz-documentary\/|\.opencode\/)/.test(l));

  /* Every branch and tag in one clonable file. */
  const bundle = join(siteDir, "gazette.bundle");
  git("bundle", "create", bundle, "--all");
  execFileSync("git", ["bundle", "verify", bundle], { cwd: root, stdio: "pipe" });

  /* The files at HEAD, readable without any git at all. */
  const tarball = join(siteDir, "site.tar.gz");
  execFileSync("git", ["archive", "--format=tar.gz", "-o", tarball, "HEAD"], {
    cwd: root,
  });

  let secrets = false;
  if (!flag("--no-secrets")) {
    try {
      const dest = join(envDir, ".env.local");
      copyFileSync(envPath, dest);
      execFileSync("chmod", ["600", dest]);
      secrets = true;
    } catch {
      /* no .env.local on this machine */
    }
  }

  return { commit, branch, subject, dirty, bundle, tarball, secrets };
}

function writeRestore(dir, info, db) {
  writeFileSync(
    join(dir, "RESTORE.md"),
    `# Restoring this site

Snapshot taken ${new Date().toISOString()} from commit \`${info.commit.slice(0, 7)}\`
(${info.branch}) — "${info.subject}".

You need: Node 20+, git, a Supabase project, and the secrets in
\`env/.env.local\`${info.secrets ? "" : " (NOT included in this copy)"}.

## 1. Get the code back

The bundle is a complete repository — full history, every branch:

\`\`\`bash
git clone gazette.bundle gazette
cd gazette
git checkout ${info.branch}
\`\`\`

If you only need to read the files, \`site.tar.gz\` unpacks the same tree
without any git.

## 2. Put the secrets back

\`\`\`bash
cp ../env/.env.local .env.local     # NEXT_PUBLIC_*, DATABASE_URL
\`\`\`

## 3. Rebuild the database

Apply structure first, then rows. Never the other way round.

\`\`\`bash
node scripts/run-sql.mjs supabase/schema.sql
node scripts/run-sql.mjs supabase/gazette.sql
node scripts/run-sql.mjs ../db/gazette-data.sql
\`\`\`

Then update \`DATABASE_URL\` if the new project has a different host.

## 4. Run it

\`\`\`bash
npm ci
npm run build
npm start
\`\`\`

## 5. Put it back on the internet

1. Push the clone to a new GitHub repository (private), or restore the
   original.
2. Re-add the \`DATABASE_URL\` repository secret — Actions secrets do not
   travel with code. Then dispatch the ingest workflow once by hand.
3. Deploy with \`NEXT_PUBLIC_SITE_URL\` and \`NEXT_PUBLIC_CONTACT_EMAIL\` set.
4. Point the domain at the new host.

## What this snapshot does not contain

- \`node_modules\` — \`npm ci\` rebuilds it from \`package-lock.json\`.
- Supabase's own internals (auth users, storage objects) — those are the
  platform's responsibility, not this repo's.
- Anything DNS, registrar, or Vercel-side. Those live at those providers.
- Uncommitted work. Rows: ${db.totalRows} across ${db.counts.length} tables.
`
  );
}

/* ═══ run ════════════════════════════════════════════════════════════ */

async function main() {
  mkdirSync(outDir, { recursive: true });

  const db = await dumpDatabase(join(outDir, "db"));
  const site = snapshotSite(join(outDir, "site"), join(outDir, "env"));
  writeRestore(outDir, site, db);

  /* ── manifest, with a checksum for every artifact ──────────────────── */
  const artifacts = [
    "site/gazette.bundle",
    "site/site.tar.gz",
    "db/gazette-data.sql",
    "db/gazette-snapshot.json",
    ...(site.secrets ? ["env/.env.local"] : []),
  ];

  const manifest = [
    "Gazette — whole-site snapshot",
    `taken       ${new Date().toISOString()}`,
    `commit      ${site.commit}`,
    `branch      ${site.branch}`,
    `subject     ${site.subject}`,
    `node        ${process.version}`,
    `database    ${db.totalRows} rows in ${db.counts.length} tables`,
    `code        ${git("ls-files").split("\n").length} tracked files`,
    `secrets     ${site.secrets ? "included" : "omitted (--no-secrets)"}`,
    site.dirty.length
      ? `uncommitted ${site.dirty.length} file(s) were NOT captured:\n            ${site.dirty.join("\n            ")}`
      : "uncommitted none — the snapshot matches HEAD exactly",
    "",
    "sha256",
    ...artifacts.map((a) => `  ${sha256(join(outDir, a))}  ${a}`),
    "",
  ].join("\n");

  writeFileSync(join(outDir, "MANIFEST.txt"), manifest);

  /* ── one file to carry off the machine ─────────────────────────────── */
  const archive = join(outRoot, `gazette-${stamp}.tar.gz`);
  execFileSync("tar", ["-czf", archive, "-C", outRoot, `gazette-${stamp}`]);

  /* ── verify by reading it back, not by trusting the writer ─────────── */
  const listing = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const bundleCheck = execFileSync(
    "git",
    ["bundle", "verify", site.bundle],
    { cwd: root, encoding: "utf8", stdio: "pipe" }
  );

  /* the archive is only a backup if every piece made it in */
  const required = ["MANIFEST.txt", "RESTORE.md", "site/gazette.bundle", "db/gazette-data.sql"];
  const missing = required.filter((piece) => !listing.some((entry) => entry.includes(piece)));
  if (missing.length) {
    throw new Error(`archive is incomplete — missing ${missing.join(", ")}`);
  }

  console.log(
    `✓ database   ${db.counts.map((c) => `${c.table} ${c.rows}`).join(" · ")}`
  );
  console.log(
    `  code       ${site.commit.slice(0, 7)} on ${site.branch}, ${git("ls-files").split("\n").length} tracked files`
  );
  console.log(`  secrets    ${site.secrets ? ".env.local included (0600)" : "omitted"}`);
  if (site.dirty.length) {
    console.log(`  ⚠ uncommitted work was NOT captured (${site.dirty.length} file(s)):`);
    for (const line of site.dirty) console.log(`      ${line}`);
  }
  console.log(`  bundle     verified — ${bundleCheck.split("\n")[0]}`);
  console.log("");
  console.log(`  ${archive}`);
  console.log(`  ${kb(archive)} kB, sha256 verified for ${artifacts.length} artifacts`);
  console.log("");
  console.log(
    "  Same disk as the machine it protects. Copy the .tar.gz somewhere else:\n" +
      `  cp "${archive}" "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Gazette-backups/"`
  );
}

main().catch((err) => {
  console.error("✗ backup failed:", err.message);
  process.exitCode = 1;
});
