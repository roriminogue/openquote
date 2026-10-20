import { describe, expect, it } from "vitest";
import { costMicroUsd } from "./cost";

describe("costMicroUsd", () => {
  it("prices known models per million tokens", () => {
    // 10k in × $2/M + 2k out × $10/M = $0.02 + $0.02 = 40,000 micro-dollars
    expect(costMicroUsd("claude-sonnet-5-5", 10_000, 2_000)).toBe(40_000);
  });

  it("returns null for unknown models", () => {
    expect(costMicroUsd("some-local-model", 10, 10)).toBeNull();
  });
});
