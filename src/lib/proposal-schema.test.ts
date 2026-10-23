import { describe, expect, it } from "vitest";
import { AcceptInput, DeclineInput, displayOptionsFor, isProposalToken, newProposalToken, validUntil } from "./proposal-schema";

describe("proposal tokens", () => {
  it("are 32 URL-safe characters and different every time", () => {
    const a = newProposalToken();
    const b = newProposalToken();
    expect(isProposalToken(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(isProposalToken("../etc/passwd")).toBe(false);
    expect(isProposalToken("short")).toBe(false);
  });
});

describe("displayOptionsFor", () => {
  it("maps the three presets", () => {
    expect(displayOptionsFor("total")).toMatchObject({ showGroupTotals: false, showItemPrices: false });
    expect(displayOptionsFor("groups")).toMatchObject({ showGroupTotals: true, showItemPrices: false, showQuantities: false });
    expect(displayOptionsFor("full")).toMatchObject({ showGroupTotals: true, showItemPrices: true, showQuantities: true });
  });
});

describe("validUntil", () => {
  it("counts the send day as day one", () => {
    const sent = new Date(2026, 9, 1);
    expect(validUntil(sent, 30).getDate()).toBe(30);
    expect(validUntil(sent, 1).getDate()).toBe(1);
  });
});

describe("AcceptInput", () => {
  it("needs a name and the tick", () => {
    expect(AcceptInput.safeParse({ name: " Jordan Sample ", email: "", agree: true })).toMatchObject({ success: true, data: { name: "Jordan Sample", email: null } });
    expect(AcceptInput.safeParse({ name: "J", email: "", agree: true }).success).toBe(false);
    expect(AcceptInput.safeParse({ name: "Jordan", email: "", agree: false }).success).toBe(false);
    expect(AcceptInput.safeParse({ name: "Jordan", email: "not-an-email", agree: true }).success).toBe(false);
  });
});

describe("DeclineInput", () => {
  it("allows no reason", () => {
    expect(DeclineInput.parse({ reason: "  " })).toEqual({ reason: null });
  });
});
