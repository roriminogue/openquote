import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// A missing DATABASE_URL doesn't crash on import, so /setup can explain it; the proxy sends every other page there.
// postgres() connects lazily, so queries fail with a connection error rather than at start-up.
const url = process.env.DATABASE_URL ?? "postgres://not-configured@127.0.0.1:1/missing";

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
// prepare: false — Supabase's transaction pooler (port 6543) doesn't support prepared statements.
const client = globalForDb.pg ?? postgres(url, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export { schema };
