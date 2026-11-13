import { sql } from "drizzle-orm";
import { useSyncExternalStore } from "react";
import { db, snapshotDatabase } from "@/db";
import { shareFile } from "./share";

// Everything lives on this phone, so a backup file kept somewhere else (Files, iCloud Drive, email) is the only way
// back if the phone is lost or the app is deleted. This remembers when the last backup was saved, and says when a
// reminder is due. Kept in this device's local storage: it's about this phone, not the data.

const LAST = "oq-last-backup";
const SNOOZE = "oq-backup-snooze-until";
const CHANGED = "oq-backup-changed";
const DAY = 24 * 60 * 60 * 1000;

/** Days between backups once there's something new to back up. */
export const BACKUP_EVERY_DAYS = 7;
/** Before the first backup: remind once there are this many quotes, or the first is this many days old. */
const FIRST_AFTER_QUOTES = 3;
const FIRST_AFTER_DAYS = 3;
/** "Not now" hides the reminder for this long. */
const SNOOZE_DAYS = 3;

function read(key: string): number | null {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function write(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Private mode or storage full: the reminder just comes back sooner.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** When the last backup was saved on this phone (ms), or null if never. Re-renders when it changes. */
export function useLastBackup() {
  return useSyncExternalStore(subscribe, () => read(LAST), () => null);
}

/** When "Not now" stops hiding the reminder (ms), or null. */
export function useSnoozedUntil() {
  return useSyncExternalStore(subscribe, () => read(SNOOZE), () => null);
}

export function snoozeBackupReminder() {
  write(SNOOZE, Date.now() + SNOOZE_DAYS * DAY);
}

const fileDate = () => new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Sydney" });

/**
 * Opens the Share sheet with a backup file (Save to Files, AirDrop, Mail…). The file is made straight away, while
 * the tap still counts, so the Share sheet is allowed to open. True once it was saved or sent somewhere.
 */
export async function backUpNow(): Promise<boolean> {
  const saved = await shareFile(`OpenQuote AU backup ${fileDate()}.oqbackup`, snapshotDatabase(), "application/octet-stream");
  if (saved) write(LAST, Date.now());
  return saved;
}

export type BackupStats = { quotes: number; firstQuoteAt: number | null; lastChangeAt: number | null };

/** How many quotes there are, when the first was made and when any last changed (ms). */
export async function backupStats(orgId: string): Promise<BackupStats> {
  const row = await db.get<[number, number | null, number | null]>(sql`
    select count(*), min(created_at), max(max(updated_at, created_at)) from estimates where org_id = ${orgId}`);
  return { quotes: Number(row?.[0] ?? 0), firstQuoteAt: row?.[1] ?? null, lastChangeAt: row?.[2] ?? null };
}

/** Whether to show the reminder: there's work that isn't in a backup yet, and it's been a while. */
export function backupDue(stats: BackupStats, last: number | null, snoozedUntil: number | null, now = Date.now()) {
  if (!stats.quotes || !stats.lastChangeAt) return false;
  if (snoozedUntil && now < snoozedUntil) return false;
  if (last) return stats.lastChangeAt > last && now - last >= BACKUP_EVERY_DAYS * DAY;
  return stats.quotes >= FIRST_AFTER_QUOTES || (!!stats.firstQuoteAt && now - stats.firstQuoteAt >= FIRST_AFTER_DAYS * DAY);
}

/** "today", "yesterday", "5 days ago", "3 weeks ago", "2 months ago". */
export function ago(ms: number, now = Date.now()) {
  const days = Math.floor((now - ms) / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}
