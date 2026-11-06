import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import { signupDecision } from "./signup-rules";

/**
 * Whether this email may create a new business on this install. See signup-rules.ts. Pass the transaction that
 * creates the business, so the count and the insert happen under the same lock.
 */
export async function canCreateBusiness(email: string, executor: Pick<typeof db, "select"> = db) {
  const [{ n }] = await executor.select({ n: count() }).from(schema.organisations);
  return signupDecision(email, {
    allowedEmails: process.env.ALLOWED_EMAILS,
    openSignups: process.env.OPEN_SIGNUPS,
    existingBusinesses: n,
  });
}
