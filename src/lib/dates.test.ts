import { describe, expect, it } from "vitest";
import { DATE_TIME, dateFormat } from "./dates";

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
