import { describe, expect, it } from "vitest";
import { CODE_NOTICES, LOGIN_ERRORS, loginErrorFor, messageFor } from "./auth-messages";

describe("messageFor", () => {
  it("only shows our own messages", () => {
    expect(messageFor(LOGIN_ERRORS, "invalid_email")).toBe(LOGIN_ERRORS.invalid_email);
    expect(messageFor(LOGIN_ERRORS, "Your account is locked. Call 1800 000 000")).toBeNull();
    expect(messageFor(LOGIN_ERRORS, "toString")).toBeNull();
    expect(messageFor(LOGIN_ERRORS, ["invalid_email"])).toBeNull();
    expect(messageFor(LOGIN_ERRORS, undefined)).toBeNull();
    expect(messageFor(CODE_NOTICES, "recent")).toBe(CODE_NOTICES.recent);
  });
});

describe("loginErrorFor", () => {
  it("maps Supabase errors to codes", () => {
    expect(loginErrorFor({ code: "otp_expired" })).toBe("link_expired");
    expect(loginErrorFor({ code: "over_email_send_rate_limit" })).toBe("rate_limited");
    expect(loginErrorFor({ status: 429 })).toBe("rate_limited");
    expect(loginErrorFor({ code: "something_new", status: 500 })).toBe("failed");
  });
});
