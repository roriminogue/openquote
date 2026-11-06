import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { getEstimate } from "@/lib/estimate/queries";
import { DEFAULT_DISPLAY, displayOptionsFor, isProposalToken, newProposalToken, validUntil, type DetailLevel } from "./proposal-schema";

// Sending quotes to clients. Drizzle bypasses RLS: member-facing functions filter by orgId, and the public
// functions only ever find a quote by its unguessable token.

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
    if (existing) return { token: existing.token, sentAt: existing.sentAt, isNew: false };

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

async function sendByToken(token: string) {
  if (!isProposalToken(token)) return null;
  const [send] = await db.select().from(schema.proposalSends).where(eq(schema.proposalSends.token, token));
  return send ?? null;
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

/** Everything the client-facing quote page shows, or null for an unknown link. */
export async function getPublicProposal(token: string) {
  const send = await sendByToken(token);
  if (!send) return null;
  const [owner] = await db.select({ orgId: schema.estimates.orgId }).from(schema.estimates).where(eq(schema.estimates.id, send.estimateId));
  if (!owner) return null;
  const data = await getEstimate(owner.orgId, send.estimateId);
  if (!data) return null;
  const [client] = data.estimate.clientId
    ? await db.select().from(schema.clients).where(eq(schema.clients.id, data.estimate.clientId))
    : [];
  const decision = await latestDecision([send.id]);
  const until = validUntil(send.sentAt, data.org.quoteValidDays);
  return {
    send,
    ...data,
    client: client ?? null,
    display: data.estimate.displayOptions ?? DEFAULT_DISPLAY,
    decision,
    validUntil: until,
    // A day's grace so "valid until today" still works all day in any timezone.
    expired: !decision && until.getTime() + 24 * 3600 * 1000 < Date.now(),
  };
}

/** Counts a client opening the link, at most once every 30 minutes. */
export async function recordView(sendId: string) {
  const [last] = await db
    .select({ at: schema.proposalEvents.at })
    .from(schema.proposalEvents)
    .where(and(eq(schema.proposalEvents.sendId, sendId), eq(schema.proposalEvents.type, "viewed")))
    .orderBy(desc(schema.proposalEvents.at))
    .limit(1);
  if (last && Date.now() - last.at.getTime() < 30 * 60 * 1000) return;
  await db.insert(schema.proposalEvents).values({ sendId, type: "viewed" });
}

export type DecideResult = "ok" | "missing" | "answered" | "expired" | "changed";

/**
 * Records the client's answer, once. `seenVersion` is the estimate version on the client's screen: if the business
 * has edited the quote since, nothing is recorded and the client is asked to reload, so nobody accepts a price they
 * didn't see. Expired quotes can't be answered.
 */
export async function decide(
  token: string,
  seenVersion: number,
  decision: { type: "accepted"; name: string; email: string | null } | { type: "declined"; reason: string | null },
): Promise<DecideResult> {
  const q = await getPublicProposal(token);
  if (!q) return "missing";
  if (q.decision) return "answered";
  if (q.expired) return "expired";
  if (q.estimate.currentVersion !== seenVersion) return "changed";

  return db.transaction(async (tx) => {
    // Lock this link, then check again inside the lock: two answers at the same moment must not both count, and
    // an edit saved in the meantime must not slip in.
    await tx.select({ id: schema.proposalSends.id }).from(schema.proposalSends).where(eq(schema.proposalSends.id, q.send.id)).for("update");
    const [answered] = await tx
      .select({ id: schema.proposalEvents.id })
      .from(schema.proposalEvents)
      .where(and(eq(schema.proposalEvents.sendId, q.send.id), inArray(schema.proposalEvents.type, ["accepted", "declined"])))
      .limit(1);
    if (answered) return "answered";
    const [estimate] = await tx
      .update(schema.estimates)
      .set({ status: decision.type, updatedAt: new Date() })
      .where(and(eq(schema.estimates.id, q.send.estimateId), eq(schema.estimates.currentVersion, seenVersion)))
      .returning({ id: schema.estimates.id });
    if (!estimate) return "changed";
    await tx.insert(schema.proposalEvents).values({
      sendId: q.send.id,
      type: decision.type,
      actorName: decision.type === "accepted" ? decision.name : null,
      actorEmail: decision.type === "accepted" ? decision.email : null,
      reason: decision.type === "declined" ? decision.reason : null,
      estimateVersion: seenVersion,
      totalCents: q.totals.totalCents,
    });
    return "ok";
  });
}

/** For the estimate page: the link, when it was sent, how often it was viewed and the client's answer. */
export async function proposalActivity(orgId: string, estimateId: string) {
  const sends = await db
    .select({ id: schema.proposalSends.id, token: schema.proposalSends.token, sentAt: schema.proposalSends.sentAt })
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
    views: views.length,
    lastViewedAt: views[0]?.at ?? null,
    decision: await latestDecision(sends.map((s) => s.id)),
  };
}
