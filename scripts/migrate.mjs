// Applies pending database migrations (drizzle/) before a production build, so a self-hosted install sets up and
// upgrades its own database on deploy. Runs on Vercel production builds, or anywhere with MIGRATE_ON_BUILD=1.
// Same bookkeeping table as `npm run db:migrate` (drizzle.__drizzle_migrations), so the two can be mixed.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const run = process.env.VERCEL_ENV === "production" || process.env.MIGRATE_ON_BUILD === "1";
if (!run) {
  console.log("migrate: skipped (only runs for production builds, or with MIGRATE_ON_BUILD=1)");
  process.exit(0);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("migrate: DATABASE_URL is not set, so the database wasn't set up. Add it, redeploy, then check /setup.");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
try {
  const started = Date.now();
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  console.log(`migrate: database is up to date (${Date.now() - started} ms)`);
} catch (e) {
  console.error("migrate: failed. The deploy stops here so the app never runs against a half-set-up database.");
  console.error(e);
  process.exitCode = 1;
} finally {
  await sql.end();
}
