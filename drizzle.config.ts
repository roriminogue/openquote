import { defineConfig } from "drizzle-kit";

// The phone's database. `npm run db:generate` writes a new migration to src/db/migrations after a schema change;
// the app applies them at start-up (src/db/migrate.ts).
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
});
