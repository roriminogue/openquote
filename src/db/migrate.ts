import type { Database } from "sql.js";

// Applies the SQL files in ./migrations (written by `npm run db:generate`) that this database hasn't had yet, in
// order, each in its own transaction. Bundled into the app, so a new version upgrades the phone's data on launch.

const files = import.meta.glob<string>("./migrations/*.sql", { query: "?raw", import: "default", eager: true });

export function migrate(sqlite: Database) {
  sqlite.exec("CREATE TABLE IF NOT EXISTS __migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)");
  const done = new Set(
    (sqlite.exec("SELECT name FROM __migrations")[0]?.values ?? []).map((row) => String(row[0])),
  );
  const pending = Object.keys(files)
    .sort()
    .map((path) => ({ name: path.split("/").pop()!.replace(/\.sql$/, ""), sql: files[path] }))
    .filter((m) => !done.has(m.name));

  for (const m of pending) {
    sqlite.exec("BEGIN");
    try {
      for (const statement of m.sql.split("--> statement-breakpoint")) {
        if (statement.trim()) sqlite.exec(statement);
      }
      sqlite.run("INSERT INTO __migrations (name, applied_at) VALUES (?, ?)", [m.name, Date.now()]);
      sqlite.exec("COMMIT");
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  }
  return pending.length;
}
