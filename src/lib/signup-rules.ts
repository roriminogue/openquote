// Who may create a business on this install (pure, for tests). A self-hosted OpenQuote AU is private by default:
// the first person sets it up, and nobody else can create a business (and spend the install's AI key) unless the
// owner allows it with ALLOWED_EMAILS or OPEN_SIGNUPS.

/** ALLOWED_EMAILS: comma-separated emails and/or "@domain" entries, e.g. "me@x.com, @mybusiness.com.au". */
export function emailAllowed(email: string, allowed: string): boolean {
  const e = email.trim().toLowerCase();
  return allowed
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => (rule.startsWith("@") ? e.endsWith(rule) : e === rule));
}

export type SignupPolicy = { allowedEmails?: string; openSignups?: string; existingBusinesses: number };

export function signupDecision(email: string, p: SignupPolicy): { ok: true } | { ok: false; reason: string } {
  if (p.allowedEmails?.trim()) {
    return emailAllowed(email, p.allowedEmails)
      ? { ok: true }
      : { ok: false, reason: "This OpenQuote AU is private. Ask its owner to add your email to ALLOWED_EMAILS." };
  }
  if (p.openSignups === "true" || p.existingBusinesses === 0) return { ok: true };
  return {
    ok: false,
    reason: "This OpenQuote AU already has a business set up. To let more people create one, its owner can set ALLOWED_EMAILS or OPEN_SIGNUPS=true.",
  };
}
