import { describe, expect, it } from "vitest";
import { lowerFirst } from "./send-quote";

describe("lowerFirst", () => {
  it("lowercases an ordinary first word", () => {
    expect(lowerFirst("Deck 6 × 4 m merbau")).toBe("deck 6 × 4 m merbau");
    expect(lowerFirst("Bathroom retile")).toBe("bathroom retile");
  });
  it("leaves acronyms and names alone", () => {
    expect(lowerFirst("QA test deck")).toBe("QA test deck");
    expect(lowerFirst("LED downlights")).toBe("LED downlights");
    expect(lowerFirst("A deck")).toBe("A deck");
    expect(lowerFirst("6 m fence")).toBe("6 m fence");
  });
});
