// Moves a business from the old web version (Postgres, e.g. Supabase) into a backup file for the phone app.
// Usage: DATABASE_URL=… npx tsx scripts/export-from-web.ts [business name]
// (DATABASE_URL is read from .env.local when set there.) Writes exports/<business> from web.oqbackup; restore it in
// the app (Settings → Account → Restore from a file), or let ios/install-on-iphone.sh copy it in with --data.
// AI keys aren't moved (the web version kept them encrypted on the server): add yours again in Settings → AI.
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import initSqlJs, { type Database, type SqlValue } from "sql.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL to the web version's database (in .env.local or the environment).");
const pg = postgres(url, { prepare: false, max: 1 });

/** Tables in the order they can be inserted, and how to find this business's rows in each. */
const TABLES: [table: string, where: string][] = [
  ["organisations", "id = $1"],
  ["rate_rules", "org_id = $1"],
  ["ai_instructions", "org_id = $1"],
  ["ai_settings", "org_id = $1"],
  ["clients", "org_id = $1"],
  ["client_contacts", "client_id in (select id from clients where org_id = $1)"],
  ["projects", "org_id = $1"],
  ["estimates", "org_id = $1"],
  ["estimate_versions", "estimate_id in (select id from estimates where org_id = $1)"],
  ["line_groups", "estimate_id in (select id from estimates where org_id = $1)"],
  ["line_items", "group_id in (select g.id from line_groups g join estimates e on e.id = g.estimate_id where e.org_id = $1)"],
  ["ai_usage", "org_id = $1"],
  ["attachments", "org_id = $1"],
  ["proposal_sends", "estimate_id in (select id from estimates where org_id = $1)"],
  ["proposal_events", "send_id in (select s.id from proposal_sends s join estimates e on e.id = s.estimate_id where e.org_id = $1)"],
  ["invoices", "org_id = $1"],
];

function migrate(db: Database) {
  const dir = join(import.meta.dirname, "../src/db/migrations");
  db.exec("CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    for (const statement of readFileSync(join(dir, file), "utf8").split("--> statement-breakpoint")) {
      if (statement.trim()) db.exec(statement);
    }
    db.run("INSERT INTO __migrations (name, applied_at) VALUES (?, ?)", [file.replace(/\.sql$/, ""), Date.now()]);
  }
}

function toSqlite(value: unknown, type: string): SqlValue {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return type === "TEXT" ? value.toISOString().slice(0, 10) : value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && (type === "REAL" || type === "INTEGER")) return Number(value);
  if (typeof value === "bigint") return Number(value);
  return value as SqlValue;
}

async function logoAsDataUrl(logoUrl: string | null) {
  if (!logoUrl || logoUrl.startsWith("data:")) return logoUrl;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/png";
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

async function main() {
  const wanted = process.argv.slice(2).join(" ").trim();
  const orgs = await pg<{ id: string; name: string; estimates: number }[]>`
    select o.id, o.name, (select count(*)::int from estimates e where e.org_id = o.id) as estimates
    from organisations o order by estimates desc`;
  const org = wanted ? orgs.find((o) => o.name.toLowerCase() === wanted.toLowerCase()) : orgs[0];
  if (!org) throw new Error(`No business called "${wanted}". There are: ${orgs.map((o) => o.name).join(", ")}`);
  console.log(`Exporting ${org.name} (${org.estimates} estimates)…`);

  const SQL = await initSqlJs();
  const db = new SQL.Database();
  migrate(db);
  db.exec("PRAGMA foreign_keys = OFF");

  for (const [table, where] of TABLES) {
    const columns = (db.exec(`PRAGMA table_info(${table})`)[0]?.values ?? []).map((r) => ({ name: String(r[1]), type: String(r[2]).toUpperCase() }));
    const rows = await pg.unsafe(`select * from ${table} where ${where}`, [org.id]);
    for (const row of rows as Record<string, unknown>[]) {
      if (table === "organisations") {
        const [owner] = await pg<{ name: string }[]>`select name from users where org_id = ${org.id} order by (role = 'owner') desc limit 1`;
        row.owner_name = owner?.name ?? "";
        row.logo_url = await logoAsDataUrl(row.logo_url as string | null);
      }
      const present = columns.filter((c) => c.name in row);
      db.run(
        `INSERT INTO ${table} (${present.map((c) => `"${c.name}"`).join(", ")}) VALUES (${present.map(() => "?").join(", ")})`,
        present.map((c) => toSqlite(row[c.name], c.type)),
      );
    }
    console.log(`  ${table}: ${rows.length}`);
  }

  db.exec("PRAGMA foreign_keys = ON");
  const problems = db.exec("PRAGMA foreign_key_check");
  if (problems.length) throw new Error(`Some rows point at missing rows: ${JSON.stringify(problems[0].values.slice(0, 5))}`);

  mkdirSync("exports", { recursive: true });
  const out = join("exports", `${org.name} from web.oqbackup`);
  writeFileSync(out, db.export());
  console.log(`Wrote ${out}`);
  await pg.end();
}

main().catch(async (e) => {
  console.error((e as Error).message);
  await pg.end().catch(() => {});
  process.exit(1);
});
