import initSqlJs from "sql.js";
import { beforeAll, describe, expect, it } from "vitest";
import { db, openMemoryDatabase, schema } from "@/db";
import { loadDemo } from "./demo";

describe("loadDemo", () => {
  beforeAll(async () => openMemoryDatabase(await initSqlJs()));

  it("fills an empty app with a sample business, clients, rates and four priced jobs", async () => {
    await loadDemo();
    const [org] = await db.select().from(schema.organisations);
    expect(org.name).toBe("Example Carpentry Co");
    const estimates = await db.select().from(schema.estimates);
    expect(estimates.map((e) => e.status).sort()).toEqual(["accepted", "declined", "draft", "sent"]);
    expect(estimates.map((e) => e.number).sort()).toEqual([1001, 1002, 1003, 1004]);
    expect(await db.select().from(schema.clients)).toHaveLength(2);
    expect(await db.select().from(schema.rateRules)).toHaveLength(4);
    expect((await db.select().from(schema.lineItems)).length).toBeGreaterThan(20);
    const [project] = await db.select().from(schema.projects);
    expect(project.status).toBe("active"); // its quote was accepted
  });
});
