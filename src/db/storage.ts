import { Capacitor } from "@capacitor/core";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";

// Where the database file lives between launches.
// On the iPhone: Library/OpenQuote/openquote.sqlite. Library is private to the app and included in the phone's
// iCloud and computer backups (unlike Caches). Each save writes a temporary file and renames it over the old one,
// so a crash mid-save can't leave half a database.
// In a browser (development and the Simulator preview): IndexedDB.

const FOLDER = "OpenQuote";
const FILE = `${FOLDER}/openquote.sqlite`;
const TEMP = `${FOLDER}/openquote.sqlite.saving`;

export const isNative = () => Capacitor.isNativePlatform();

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64: string) {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

// ── IndexedDB (browser) ─────────────────────────────────────────────────────
const IDB_NAME = "openquote";
const IDB_STORE = "files";

function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve((req.result as Uint8Array | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key: string, value: Uint8Array) {
  const db = await idb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Public ──────────────────────────────────────────────────────────────────
/** The saved database, or null on first launch. */
export async function loadDatabaseFile(): Promise<Uint8Array | null> {
  if (!isNative()) return idbGet("db");
  try {
    const { data } = await Filesystem.readFile({ path: FILE, directory: Directory.Library });
    return typeof data === "string" ? fromBase64(data) : new Uint8Array(await data.arrayBuffer());
  } catch {
    return null; // not there yet
  }
}

export async function saveDatabaseFile(bytes: Uint8Array) {
  if (!isNative()) return idbPut("db", bytes);
  await Filesystem.writeFile({ path: TEMP, directory: Directory.Library, data: toBase64(bytes), recursive: true });
  await Filesystem.rename({ from: TEMP, to: FILE, directory: Directory.Library, toDirectory: Directory.Library });
}

/** Writes a file to the app's cache folder and returns its file:// URI, for sharing (backups, quote PDFs). */
export async function writeShareFile(name: string, data: Uint8Array | string): Promise<string> {
  const isText = typeof data === "string";
  const { uri } = await Filesystem.writeFile({
    path: `share/${name}`,
    directory: Directory.Cache,
    data: isText ? data : toBase64(data),
    encoding: isText ? Encoding.UTF8 : undefined,
    recursive: true,
  });
  return uri;
}

export { fromBase64, toBase64 };
