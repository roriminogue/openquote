import { describe, expect, it } from "vitest";
import { DEFAULT_DAILY_LIMIT, dailyLimit, overLimit } from "./limits";

describe("dailyLimit", () => {
  it("defaults when unset or invalid", () => {
    expect(dailyLimit(undefined)).toBe(DEFAULT_DAILY_LIMIT);
    expect(dailyLimit("")).toBe(DEFAULT_DAILY_LIMIT);
    expect(dailyLimit("lots")).toBe(DEFAULT_DAILY_LIMIT);
    expect(dailyLimit("-3")).toBe(DEFAULT_DAILY_LIMIT);
  });
  it("reads a number, and 0 means no limit", () => {
    expect(dailyLimit(" 25 ")).toBe(25);
    expect(dailyLimit("0")).toBeNull();
  });
});

describe("overLimit", () => {
  it("stops at the limit", () => {
    expect(overLimit(24, 25)).toBe(false);
    expect(overLimit(25, 25)).toBe(true);
    expect(overLimit(10_000, null)).toBe(false);
  });
});
