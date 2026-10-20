import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { createClient } from "@/lib/supabase/server";

/** The signed-in Supabase Auth user, or null. Verified against the Auth server's signing keys. */
export async function getAuthUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  return { id: claims.sub, email: claims.email as string | undefined };
}

/**
 * The signed-in member and their organisation. Redirects to /login when signed out and to /onboarding when the
 * account isn't attached to an organisation yet. Drizzle connects as the database owner and bypasses RLS, so
 * every query made with it must filter by `member.orgId`.
 */
export async function requireMember() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [member] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
  if (!member) redirect("/onboarding");
  return member;
}
