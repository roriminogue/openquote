// Password rules for Settings → Account (pure, for tests). Long beats clever: 12+ characters, and at most 72 bytes,
// because Supabase Auth (bcrypt) ignores anything past that.

export const PASSWORD_MIN = 12;
const PASSWORD_MAX_BYTES = 72;

const COMMON = new Set([
  "password1234", "123456789012", "qwertyuiop12", "openquote123", "letmein12345", "iloveyou1234", "password123!",
]);

export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters. A few words together works well.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return "Keep it under 72 characters.";
  if (/^(.)\1+$/.test(password) || COMMON.has(password.toLowerCase())) return "That password is too easy to guess. Try a few words together.";
  return null;
}
