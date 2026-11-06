import { describe, expect, it } from "vitest";
import { LOGIN_ERRORS, loginErrorFor, messageFor } from "./auth-messages";

describe("messageFor", () => {
  it("only shows our own messages", () => {
    expect(messageFor(LOGIN_ERRORS, "wrong_password")).toBe(LOGIN_ERRORS.wrong_password);
    expect(messageFor(LOGIN_ERRORS, "Your account is locked. Call 1800 000 000")).toBeNull();
    expect(messageFor(LOGIN_ERRORS, "toString")).toBeNull();
    expect(messageFor(LOGIN_ERRORS, ["wrong_password"])).toBeNull();
    expect(messageFor(LOGIN_ERRORS, undefined)).toBeNull();
  });
});

describe("loginErrorFor", () => {
  it("maps Supabase errors to codes", () => {
    expect(loginErrorFor({ code: "invalid_credentials" })).toBe("wrong_password");
    expect(loginErrorFor({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
    expect(loginErrorFor({ status: 429 })).toBe("rate_limited");
    expect(loginErrorFor({ code: "something_new", status: 500 })).toBe("failed");
  });
});
