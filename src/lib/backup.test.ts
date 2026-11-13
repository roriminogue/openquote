import initSqlJs from "sql.js";
import { beforeAll, describe, expect, it } from "vitest";
import { db, openMemoryDatabase, schema } from "@/db";
import { ago, backupDue, backupStats } from "./backup";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 10, 13);

describe("backupDue", () => {
  const stats = (quotes: number, firstDaysAgo: number, changedDaysAgo: number) => ({
    quotes,
    firstQuoteAt: now - firstDaysAgo * DAY,
    lastChangeAt: now - changedDaysAgo * DAY,
  });

  it("stays quiet with no quotes", () => {
    expect(backupDue({ quotes: 0, firstQuoteAt: null, lastChangeAt: null }, null, null, now)).toBe(false);
  });

  it("waits for a few quotes or a few days before the first reminder", () => {
    expect(backupDue(stats(1, 1, 1), null, null, now)).toBe(false);
    expect(backupDue(stats(3, 0, 0), null, null, now)).toBe(true);
    expect(backupDue(stats(1, 3, 3), null, null, now)).toBe(true);
  });

  it("after a backup, reminds only once something changed and a week has passed", () => {
    expect(backupDue(stats(5, 30, 1), now - 2 * DAY, null, now)).toBe(false); // backed up 2 days ago
    expect(backupDue(stats(5, 30, 9), now - 8 * DAY, null, now)).toBe(false); // nothing new since
    expect(backupDue(stats(5, 30, 1), now - 8 * DAY, null, now)).toBe(true);
  });

  it("Not now hides it until the snooze runs out", () => {
    expect(backupDue(stats(5, 30, 1), null, now + DAY, now)).toBe(false);
    expect(backupDue(stats(5, 30, 1), null, now - 1, now)).toBe(true);
  });
});

describe("ago", () => {
  it("reads naturally", () => {
    expect(ago(now, now)).toBe("today");
    expect(ago(now - DAY, now)).toBe("yesterday");
    expect(ago(now - 5 * DAY, now)).toBe("5 days ago");
    expect(ago(now - 21 * DAY, now)).toBe("3 weeks ago");
    expect(ago(now - 70 * DAY, now)).toBe("2 months ago");
  });
});

describe("backupStats", () => {
  beforeAll(async () => openMemoryDatabase(await initSqlJs()));

  it("counts the business's quotes and finds the first and the latest change", async () => {
    const [org] = await db.insert(schema.organisations).values({ name: "QA test backup" }).returning();
    const at = (d: number) => new Date(now - d * DAY);
    await db.insert(schema.estimates).values([
      { orgId: org.id, number: 1001, createdAt: at(10), updatedAt: at(4) },
      { orgId: org.id, number: 1002, createdAt: at(2), updatedAt: at(2) },
    ]);
    expect(await backupStats(org.id)).toEqual({ quotes: 2, firstQuoteAt: now - 10 * DAY, lastChangeAt: now - 2 * DAY });
    expect((await backupStats("nobody")).quotes).toBe(0);
  });
});
