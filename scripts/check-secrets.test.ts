import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scan } from "./check-secrets.mjs";

describe("check-secrets", () => {
  it("finds a key pasted into a bundle and passes clean code", () => {
    const dir = mkdtempSync(join(tmpdir(), "oq-secrets-"));
    writeFileSync(join(dir, "clean.js"), 'const headers = { "x-api-key": apiKey }; // the key comes from the phone');
    expect(scan(dir)).toEqual([]);
    writeFileSync(join(dir, "leaky.js"), `const k = "sk-ant-api03-${"A".repeat(40)}";`);
    expect(scan(dir).map((f) => f.kind)).toEqual(["Anthropic key"]);
  });
});
