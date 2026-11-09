// Messages for the sign-in and onboarding pages (pure, for tests). Links carry a short code, never the text itself,
// so nobody can send a link to the real sign-in page that shows a message of their own ("call this number…").

export const LOGIN_ERRORS = {
  invalid_email: "Enter a valid email.",
  link_expired: "That sign-in link didn’t work here. Open it in the browser where you asked for it, or send a new code.",
  signups_closed: "This OpenQuote AU isn’t taking new sign-ups.",
  rate_limited: "Too many codes sent. Wait a few minutes, then try again.",
  failed: "Sign-in didn’t work. Try again.",
} as const;
export type LoginError = keyof typeof LOGIN_ERRORS;

export const CODE_ERRORS = {
  format: "Enter the code from the email.",
  wrong: "That code didn’t work. Check it, or send a new one.",
  expired: "That code expired. Send a new one.",
  rate_limited: "Too many tries. Wait a minute, then try again.",
} as const;

export const CODE_NOTICES = {
  recent: "A code was sent a moment ago, so use that one. To get a new code, wait a minute.",
} as const;

export const ONBOARDING_ERRORS = {
  missing_fields: "Fill in both fields.",
} as const;

/** The message for a code from the URL, or null for anything else. */
export function messageFor<T extends Record<string, string>>(table: T, code: unknown): string | null {
  return typeof code === "string" && Object.hasOwn(table, code) ? table[code] : null;
}

/** Maps a Supabase Auth error to one of our codes, so its own wording never travels through a URL. */
export function loginErrorFor(error: { code?: string; status?: number }): LoginError {
  switch (error.code) {
    case "signup_disabled":
    case "otp_disabled":
      return "signups_closed";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "rate_limited";
    case "otp_expired":
    case "flow_state_expired":
    case "flow_state_not_found":
      return "link_expired";
  }
  return error.status === 429 ? "rate_limited" : "failed";
}
