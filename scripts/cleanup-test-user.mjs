import pg from "pg";
import { readFileSync } from "node:fs";
const url = readFileSync(".env.local","utf8").split("\n").find(l=>l.startsWith("DATABASE_URL=")).slice(13).trim();
const c = new pg.Client({ connectionString: url, ssl:{rejectUnauthorized:false} });
await c.connect();
const uid = (await c.query(`select id from auth.users where email='atelier.test.2026@gmail.com'`)).rows[0]?.id;
if (uid) {
  await c.query(`delete from auth.sessions where user_id = '${uid}'`);
  await c.query(`delete from auth.identities where user_id = '${uid}'`);
  await c.query(`delete from auth.refresh_tokens where user_id = '${uid}'`);
  await c.query(`delete from auth.users where id = '${uid}'`);
  await c.query(`delete from public.profiles where id = '${uid}'`);
  console.log("✓ test user removed");
} else {
  console.log("test user not found");
}
await c.end();
