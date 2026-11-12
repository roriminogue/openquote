import initSqlJs, { type Database, type SqlValue } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { migrate } from "./migrate";
import * as schema from "./schema";
import { loadDatabaseFile, saveDatabaseFile } from "./storage";

// The app's one database: SQLite (sql.js) running in the app, saved to the phone after every change.
// Queries go through Drizzle's SQLite proxy driver, so the query code reads the same as it did on Postgres.
//
// Saving: a write marks the database dirty; shortly after (and never mid-transaction) the whole file is written out.
// The file is small (a few hundred KB for years of quotes), so a full write is quick and keeps saving simple.

let sqlite: Database | null = null;
let txDepth = 0;
let dirty = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

const WRITE = /^\s*(insert|update|delete|replace|create|drop|alter)\b/i;

type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;
let sqlJs: Promise<SqlJs> | null = null;
const loadSqlJs = () => (sqlJs ??= initSqlJs({ locateFile: () => wasmUrl }));

function prepare(next: Database) {
  next.exec("PRAGMA foreign_keys = ON");
  migrate(next);
  return next;
}

/** Opens the saved database (or a new one) and brings it up to date. Called once, before the first screen. */
export async function openDatabase() {
  if (sqlite) return;
  const [SQL, bytes] = await Promise.all([loadSqlJs(), loadDatabaseFile()]);
  sqlite = prepare(bytes ? new SQL.Database(bytes) : new SQL.Database());
  if (!bytes) markDirty(); // save the fresh database straight away
}

/** Opens an empty in-memory database (tests). */
export async function openMemoryDatabase(SQL?: SqlJs) {
  sqlite?.close();
  sqlite = prepare(new (SQL ?? (await loadSqlJs())).Database());
}

/** Replaces the whole database with a backup file's contents (Settings → Account → Restore). */
export async function replaceDatabase(bytes: Uint8Array) {
  const SQL = await loadSqlJs();
  let next: Database;
  try {
    next = new SQL.Database(bytes);
    const found = next.exec("SELECT count(*) FROM sqlite_master WHERE name = 'organisations'")[0]?.values[0]?.[0];
    if (!found) throw new Error("not a backup");
  } catch {
    throw new Error("That file isn't an OpenQuote AU backup.");
  }
  await flush();
  sqlite?.close();
  sqlite = prepare(next);
  markDirty();
  await flush();
}

/** The database file as it is right now (for Settings → Account → Back up). */
export async function exportDatabase(): Promise<Uint8Array> {
  await flush();
  return snapshot();
}

function snapshot() {
  const bytes = conn().export();
  // sql.js turns foreign keys off when it exports; turn them back on.
  conn().exec("PRAGMA foreign_keys = ON");
  return bytes;
}

function conn() {
  if (!sqlite) throw new Error("The database isn't open yet.");
  return sqlite;
}

function markDirty() {
  dirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flush(), 250);
  // Screens re-read their data after any change (see lib/data.tsx).
  queueMicrotask(() => listeners.forEach((l) => l()));
}

/** Writes pending changes to the phone now (also called when the app goes to the background). */
export function flush(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!dirty || !sqlite) return saving;
  if (txDepth > 0) {
    saveTimer = setTimeout(() => void flush(), 100);
    return saving;
  }
  dirty = false;
  const bytes = snapshot();
  saving = saving
    .then(() => saveDatabaseFile(bytes))
    .catch((e) => {
      dirty = true; // try again with the next change
      console.error("Couldn't save the database:", (e as Error)?.message);
    });
  return saving;
}

/** Runs after any change to the data. Returns an unsubscribe function. */
export function onDatabaseChange(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function bindValue(v: unknown): SqlValue {
  if (v === undefined || v === null) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v instanceof Date) return v.getTime();
  if (typeof v === "bigint") return Number(v);
  return v as SqlValue;
}

export const db = drizzle(
  async (query, params, method) => {
    const statement = conn().prepare(query);
    try {
      statement.bind(params.map(bindValue));
      const rows: SqlValue[][] = [];
      while (statement.step()) rows.push(statement.get());
      if (/^\s*begin\b/i.test(query)) txDepth++;
      else if (/^\s*(commit|rollback)\b/i.test(query)) txDepth = Math.max(0, txDepth - 1);
      if (WRITE.test(query)) markDirty();
      return { rows: method === "get" ? rows[0] : rows } as { rows: unknown[] };
    } finally {
      statement.free();
    }
  },
  { schema },
);

// One transaction at a time: there's a single SQLite connection, so a second BEGIN while one is open would fail.
let txQueue: Promise<unknown> = Promise.resolve();
const transaction = db.transaction.bind(db);
db.transaction = ((...args: Parameters<typeof transaction>) => {
  const run = txQueue.then(() => transaction(...args));
  txQueue = run.catch(() => undefined);
  return run;
}) as typeof db.transaction;

export { schema };
export type Db = typeof db;
