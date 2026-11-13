import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { UserRole } from "@/db/schema";

// One business, one person, on this phone. There is no account to look up: the person is whoever holds the phone
// (the app opens behind Sign in with publik, see lib/publik.ts). "Member" keeps the shape the rest of the code
// was written against, so every query still filters by orgId.

export type Member = { id: string; orgId: string; name: string; email: string; role: UserRole };

/** The business on this phone, or null before onboarding. */
export async function getMember(): Promise<Member | null> {
  const [org] = await db
    .select({ id: schema.organisations.id, ownerName: schema.organisations.ownerName, email: schema.organisations.email })
    .from(schema.organisations)
    .orderBy(asc(schema.organisations.createdAt))
    .limit(1);
  if (!org) return null;
  return { id: org.id, orgId: org.id, name: org.ownerName, email: org.email ?? "", role: "owner" };
}

/** The business on this phone. The app only shows signed-in screens once onboarding has made one. */
export async function requireMember(): Promise<Member> {
  const member = await getMember();
  if (!member) throw new Error("Set up your business first.");
  return member;
}
