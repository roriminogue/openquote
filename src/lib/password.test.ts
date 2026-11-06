import { describe, expect, it } from "vitest";
import { passwordProblem } from "./password";

describe("passwordProblem", () => {
  it("accepts long passphrases", () => {
    expect(passwordProblem("timber fence blue gate")).toBeNull();
  });
  it("rejects short, overlong and obvious ones", () => {
    expect(passwordProblem("hunter2")).toMatch(/at least 12/);
    expect(passwordProblem("a".repeat(73))).toMatch(/under 72/);
    expect(passwordProblem("aaaaaaaaaaaaaa")).toMatch(/too easy/);
    expect(passwordProblem("Password1234")).toMatch(/too easy/);
  });
});
