import { describe, expect, it } from "vitest";
import { BusinessInput, formatAbn } from "./business-schema";

const base = { name: "Coastal Carpentry", abn: "", email: "", phone: "", address: "", termsMd: "", quoteValidDays: "30" };

describe("BusinessInput", () => {
  it("cleans up optional fields and the ABN", () => {
    const r = BusinessInput.parse({ ...base, abn: "12 345 678 901", email: " hi@coastal.com.au " });
    expect(r).toMatchObject({ abn: "12345678901", email: "hi@coastal.com.au", phone: null, quoteValidDays: 30 });
  });
  it("rejects a bad ABN, email or validity", () => {
    expect(BusinessInput.safeParse({ ...base, abn: "1234" }).error?.issues[0].message).toBe("An ABN is 11 digits.");
    expect(BusinessInput.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(BusinessInput.safeParse({ ...base, quoteValidDays: "0" }).success).toBe(false);
    expect(BusinessInput.safeParse({ ...base, name: " " }).success).toBe(false);
  });
});

describe("formatAbn", () => {
  it("groups the digits", () => {
    expect(formatAbn("12345678901")).toBe("12 345 678 901");
    expect(formatAbn(null)).toBeNull();
  });
});
