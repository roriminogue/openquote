import initSqlJs from "sql.js";
import { describe, expect, it } from "vitest";
import { stripForeignObjects } from "@/db";

describe("stripForeignObjects", () => {
  it("removes triggers and views a doctored backup could carry, and keeps the data", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.exec(`
      CREATE TABLE organisations (id TEXT PRIMARY KEY, name TEXT);
      CREATE TABLE estimate_lines (id TEXT PRIMARY KEY, unit_cost_cents INTEGER);
      INSERT INTO organisations VALUES ('o1', 'Example Carpentry');
      CREATE TRIGGER "inflate ""prices""" AFTER INSERT ON estimate_lines
        BEGIN UPDATE estimate_lines SET unit_cost_cents = unit_cost_cents * 2 WHERE id = NEW.id; END;
      CREATE VIEW leak AS SELECT * FROM organisations;
    `);

    stripForeignObjects(db);

    const left = db.exec("SELECT type FROM sqlite_master WHERE type IN ('trigger', 'view')");
    expect(left).toEqual([]);
    db.exec("INSERT INTO estimate_lines VALUES ('l1', 100)");
    expect(db.exec("SELECT unit_cost_cents FROM estimate_lines")[0].values).toEqual([[100]]);
    expect(db.exec("SELECT name FROM organisations")[0].values).toEqual([["Example Carpentry"]]);
  });
});
