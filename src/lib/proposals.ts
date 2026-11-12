import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getEstimate } from "@/lib/estimate/queries";
import { DEFAULT_DISPLAY, displayOptionsFor, newProposalToken, validUntil, type DetailLevel } from "./proposal-schema";

// Sending quotes to clients: each PDF shared from the phone is recorded, and so is the client's answer once the
// tradie marks it. Every function filters by orgId.

export type Decision = {
  type: "accepted" | "declined";
  name: string | null;
  email: string | null;
  reason: string | null;
  /** Total inc GST the client answered, when recorded (older answers have none). */
  totalCents: number | null;
  at: Date;
};

/**
 * The share link for an estimate: reuses the existing one (so a link already sent keeps working), records what
 * the client should see, and marks a draft as sent.
 */
export async function shareEstimate(orgId: string, estimateId: string, detail: DetailLevel) {
  return db.transaction(async (tx) => {
    const [estimate] = await tx
      .select({ id: schema.estimates.id, status: schema.estimates.status, version: schema.estimates.currentVersion, clientId: schema.estimates.clientId })
      .from(schema.estimates)
      .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, orgId)));
    if (!estimate) return null;

    await tx
      .update(schema.estimates)
      .set({ displayOptions: displayOptionsFor(detail), status: estimate.status === "draft" ? "sent" : estimate.status, updatedAt: new Date() })
      .where(eq(schema.estimates.id, estimateId));

    const [existing] = await tx
      .select()
      .from(schema.proposalSends)
      .where(eq(schema.proposalSends.estimateId, estimateId))
      .orderBy(desc(schema.proposalSends.sentAt))
      .limit(1);
    if (existing) {
      // Remember which version was shared last, so the estimate page can tell when it has changed since.
      if (existing.version !== estimate.version)
        await tx.update(schema.proposalSends).set({ version: estimate.version }).where(eq(schema.proposalSends.id, existing.id));
      return { token: existing.token, sentAt: existing.sentAt, isNew: false };
    }

    const [client] = estimate.clientId
      ? await tx.select({ email: schema.clients.email }).from(schema.clients).where(and(eq(schema.clients.id, estimate.clientId), eq(schema.clients.orgId, orgId)))
      : [];
    const [send] = await tx
      .insert(schema.proposalSends)
      .values({ estimateId, version: estimate.version, toEmail: client?.email ?? null, token: newProposalToken() })
      .returning();
    return { token: send.token, sentAt: send.sentAt, isNew: true };
  });
}

async function latestDecision(sendIds: string[]): Promise<Decision | null> {
  if (!sendIds.length) return null;
  const [e] = await db
    .select()
    .from(schema.proposalEvents)
    .where(and(inArray(schema.proposalEvents.sendId, sendIds), inArray(schema.proposalEvents.type, ["accepted", "declined"])))
    .orderBy(desc(schema.proposalEvents.at))
    .limit(1);
  return e
    ? { type: e.type as Decision["type"], name: e.actorName, email: e.actorEmail, reason: e.reason, totalCents: e.totalCents, at: e.at }
    : null;
}

/** Everything the quote document (the PDF) shows, or null when the estimate isn't this business's. */
export async function getQuoteDocument(orgId: string, estimateId: string, detail?: DetailLevel) {
  const data = await getEstimate(orgId, estimateId);
  if (!data) return null;
  const [client] = data.estimate.clientId
    ? await db.select().from(schema.clients).where(eq(schema.clients.id, data.estimate.clientId))
    : [];
  const sends = await db
    .select()
    .from(schema.proposalSends)
    .where(eq(schema.proposalSends.estimateId, estimateId))
    .orderBy(desc(schema.proposalSends.sentAt));
  const decision = await latestDecision(sends.map((x) => x.id));
  // Valid from today when it's being sent now, or from when it was last sent.
  const sentAt = sends[0]?.sentAt ?? new Date();
  const until = validUntil(detail ? new Date() : sentAt, data.org.quoteValidDays);
  return {
    send: { sentAt: detail ? new Date() : sentAt },
    ...data,
    client: client ?? null,
    display: detail ? displayOptionsFor(detail) : (data.estimate.displayOptions ?? DEFAULT_DISPLAY),
    decision,
    validUntil: until,
    expired: false,
  };
}

/**
 * Records the client's answer, as told to the tradie (by text, email or phone). Accepting locks the quote, and a
 * project still marked Quoting becomes Active. Returns false when the estimate isn't this business's.
 */
export async function markDecision(orgId: string, estimateId: string, type: "accepted" | "declined", reason: string | null = null) {
  return db.transaction(async (tx) => {
    const [estimate] = await tx
      .select({ id: schema.estimates.id, version: schema.estimates.currentVersion, projectId: schema.estimates.projectId })
      .from(schema.estimates)
      .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, orgId)));
    if (!estimate) return false;
    let [send] = await tx
      .select({ id: schema.proposalSends.id })
      .from(schema.proposalSends)
      .where(eq(schema.proposalSends.estimateId, estimateId))
      .orderBy(desc(schema.proposalSends.sentAt))
      .limit(1);
    // Answered without being sent from the app (say, quoted on site): record it against a share made now.
    send ??= (
      await tx
        .insert(schema.proposalSends)
        .values({ estimateId, version: estimate.version, token: newProposalToken() })
        .returning({ id: schema.proposalSends.id })
    )[0];
    await tx.update(schema.estimates).set({ status: type, updatedAt: new Date() }).where(eq(schema.estimates.id, estimateId));
    await tx.insert(schema.proposalEvents).values({ sendId: send.id, type, reason, estimateVersion: estimate.version });
    if (type === "accepted" && estimate.projectId) {
      await tx
        .update(schema.projects)
        .set({ status: "active", updatedAt: new Date() })
        .where(and(eq(schema.projects.id, estimate.projectId), eq(schema.projects.status, "quoting")));
    }
    return true;
  });
}

/** Takes back an answer marked by mistake: the quote goes back to Sent and can be edited again. */
export async function clearDecision(orgId: string, estimateId: string) {
  return db.transaction(async (tx) => {
    const [estimate] = await tx
      .select({ id: schema.estimates.id })
      .from(schema.estimates)
      .where(and(eq(schema.estimates.id, estimateId), eq(schema.estimates.orgId, orgId)));
    if (!estimate) return false;
    const sends = await tx
      .select({ id: schema.proposalSends.id })
      .from(schema.proposalSends)
      .where(eq(schema.proposalSends.estimateId, estimateId));
    if (sends.length)
      await tx
        .delete(schema.proposalEvents)
        .where(and(inArray(schema.proposalEvents.sendId, sends.map((x) => x.id)), inArray(schema.proposalEvents.type, ["accepted", "declined"])));
    await tx.update(schema.estimates).set({ status: "sent", updatedAt: new Date() }).where(eq(schema.estimates.id, estimateId));
    return true;
  });
}

/** For the estimate page: the link, when it was sent, how often it was viewed and the client's answer. */
export async function proposalActivity(orgId: string, estimateId: string) {
  const sends = await db
    .select({ id: schema.proposalSends.id, token: schema.proposalSends.token, sentAt: schema.proposalSends.sentAt, version: schema.proposalSends.version })
    .from(schema.proposalSends)
    .innerJoin(schema.estimates, eq(schema.estimates.id, schema.proposalSends.estimateId))
    .where(and(eq(schema.proposalSends.estimateId, estimateId), eq(schema.estimates.orgId, orgId)))
    .orderBy(desc(schema.proposalSends.sentAt));
  if (!sends.length) return null;
  const views = await db
    .select({ at: schema.proposalEvents.at })
    .from(schema.proposalEvents)
    .where(and(inArray(schema.proposalEvents.sendId, sends.map((s) => s.id)), eq(schema.proposalEvents.type, "viewed")))
    .orderBy(desc(schema.proposalEvents.at));
  return {
    token: sends[0].token,
    sentAt: sends[0].sentAt,
    /** The estimate version last shared with the client. */
    sharedVersion: sends[0].version,
    views: views.length,
    lastViewedAt: views[0]?.at ?? null,
    decision: await latestDecision(sends.map((s) => s.id)),
  };
}
