import pg from "pg";
import { readFileSync } from "node:fs";
const url = readFileSync(".env.local","utf8").split("\n").find(l=>l.startsWith("DATABASE_URL=")).slice(13).trim();
const c = new pg.Client({ connectionString: url, ssl:{rejectUnauthorized:false} });
await c.connect();
await c.query("notify pgrst, 'reload schema'");
console.log("✓ notified pgrst");
await c.end();
