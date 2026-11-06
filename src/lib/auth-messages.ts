// Messages for the sign-in and onboarding pages (pure, for tests). Links carry a short code, never the text itself,
// so nobody can send a link to the real sign-in page that shows a message of their own ("call this number…").

export const LOGIN_ERRORS = {
  invalid_email: "Enter a valid email.",
  missing_password: "Enter your email and password.",
  wrong_password: "That email and password don’t match. If you haven’t set a password yet, use an email link.",
  link_expired: "That sign-in link expired or was already used. Send a new one.",
  not_confirmed: "Confirm your email first: open the link we emailed you.",
  signups_closed: "This OpenQuote isn’t taking new sign-ups.",
  rate_limited: "Too many tries. Wait a minute, then try again.",
  failed: "Sign-in didn’t work. Try again.",
} as const;
export type LoginError = keyof typeof LOGIN_ERRORS;

export const CODE_ERRORS = {
  format: "Enter the code from the email.",
  wrong: "That code didn’t work. Check it, or send a new one.",
  rate_limited: "Too many tries. Wait a minute, then try again.",
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
    case "invalid_credentials":
      return "wrong_password";
    case "email_not_confirmed":
      return "not_confirmed";
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
