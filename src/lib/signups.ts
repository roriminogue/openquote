import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import { signupDecision } from "./signup-rules";

/** Whether this email may create a new business on this install. See signup-rules.ts. */
export async function canCreateBusiness(email: string) {
  const [{ n }] = await db.select({ n: count() }).from(schema.organisations);
  return signupDecision(email, {
    allowedEmails: process.env.ALLOWED_EMAILS,
    openSignups: process.env.OPEN_SIGNUPS,
    existingBusinesses: n,
  });
}
