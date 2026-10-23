import { describe, expect, it } from "vitest";
import { emailAllowed, signupDecision } from "./signup-rules";

describe("emailAllowed", () => {
  it("matches exact emails and whole domains, ignoring case", () => {
    const rules = "Me@Example.com, @coastal.com.au";
    expect(emailAllowed("me@example.com", rules)).toBe(true);
    expect(emailAllowed("tom@coastal.com.au", rules)).toBe(true);
    expect(emailAllowed("tom@evilcoastal.com.au.fake", rules)).toBe(false);
    expect(emailAllowed("you@example.com", rules)).toBe(false);
  });
});

describe("signupDecision", () => {
  it("lets the first business in, then closes", () => {
    expect(signupDecision("a@x.com", { existingBusinesses: 0 }).ok).toBe(true);
    expect(signupDecision("a@x.com", { existingBusinesses: 1 }).ok).toBe(false);
  });
  it("follows ALLOWED_EMAILS when set, even for the first business", () => {
    expect(signupDecision("a@x.com", { allowedEmails: "b@x.com", existingBusinesses: 0 }).ok).toBe(false);
    expect(signupDecision("b@x.com", { allowedEmails: "b@x.com", existingBusinesses: 5 }).ok).toBe(true);
  });
  it("can be opened up", () => {
    expect(signupDecision("a@x.com", { openSignups: "true", existingBusinesses: 3 }).ok).toBe(true);
  });
});
