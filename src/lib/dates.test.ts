import { describe, expect, it } from "vitest";
import { DATE_TIME, dateFormat, startOfMonth } from "./dates";

const plain = (s: string) => s.replace(/ /g, " ");

describe("dateFormat", () => {
  // 05:30 UTC on 9 November is 4:30 pm in Sydney (daylight time) and 1:30 pm in Perth.
  const at = new Date("2026-11-09T05:30:00Z");
  it("shows Australian time, not the server's UTC", () => {
    expect(plain(dateFormat(DATE_TIME).format(at))).toMatch(/9 Nov,? 4:30 pm/);
  });
  it("can show another zone", () => {
    expect(plain(dateFormat(DATE_TIME, "Australia/Perth").format(at))).toMatch(/9 Nov,? 1:30 pm/);
  });
  it("dates a morning job on the right day", () => {
    // 8 am in Sydney on 10 November is still 9 November in UTC.
    expect(dateFormat({ day: "numeric", month: "long" }).format(new Date("2026-11-09T21:00:00Z"))).toBe("10 November");
  });
});

describe("startOfMonth", () => {
  it("starts the month at midnight in Sydney, not UTC", () => {
    // 9 am on 1 December in Sydney (daylight time, UTC+11) is still 30 November in UTC.
    expect(startOfMonth(new Date("2026-11-30T22:00:00Z")).toISOString()).toBe("2026-11-30T13:00:00.000Z");
  });
  it("is still last month's start just before midnight on the 1st", () => {
    expect(startOfMonth(new Date("2026-11-30T12:59:00Z")).toISOString()).toBe("2026-10-31T13:00:00.000Z");
  });
  it("uses standard time when the 1st falls outside daylight saving", () => {
    // 1 July in Sydney is UTC+10.
    expect(startOfMonth(new Date("2026-07-15T03:00:00Z")).toISOString()).toBe("2026-06-30T14:00:00.000Z");
  });
  it("measures the offset on the 1st across a daylight-saving change", () => {
    // Daylight saving starts on 4 October 2026, so 1 October is still UTC+10.
    expect(startOfMonth(new Date("2026-10-20T03:00:00Z")).toISOString()).toBe("2026-09-30T14:00:00.000Z");
  });
  it("works for Perth", () => {
    expect(startOfMonth(new Date("2026-11-11T03:00:00Z"), "Australia/Perth").toISOString()).toBe(
      "2026-10-31T16:00:00.000Z",
    );
  });
});
