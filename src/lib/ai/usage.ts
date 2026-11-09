import { and, count, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";

/** How many times this business ran an AI operation in the last 24 hours (for the shared-key daily cap). */
export async function usageLast24h(orgId: string, operation: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.aiUsage)
    .where(
      and(
        eq(schema.aiUsage.orgId, orgId),
        eq(schema.aiUsage.operation, operation),
        gt(schema.aiUsage.createdAt, new Date(Date.now() - 24 * 3600 * 1000)),
      ),
    );
  return n;
}
