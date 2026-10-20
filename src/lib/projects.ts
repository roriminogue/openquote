import { and, desc, eq, max, sql } from "drizzle-orm";
import type { z } from "zod";
import { db, schema } from "@/db";
import type { ClientInput, ClientOption, ProjectInput, ProjectOption } from "./project-schema";

export * from "./project-schema";

// Projects and clients: the "who and where" an estimate belongs to. Every query is scoped by orgId (Drizzle
// bypasses RLS).

export async function listClients(orgId: string): Promise<ClientOption[]> {
  return db
    .select({
      id: schema.clients.id,
      kind: schema.clients.kind,
      name: schema.clients.name,
      contactName: schema.clients.contactName,
      email: schema.clients.email,
      phone: schema.clients.phone,
      address: schema.clients.address,
    })
    .from(schema.clients)
    .where(eq(schema.clients.orgId, orgId))
    .orderBy(schema.clients.name);
}

/** Projects with their client, most recently used first (latest estimate, else when the project was made). */
export async function listProjects(orgId: string): Promise<ProjectOption[]> {
  const lastEstimate = db
    .select({ projectId: schema.estimates.projectId, at: max(schema.estimates.createdAt).as("at") })
    .from(schema.estimates)
    .where(eq(schema.estimates.orgId, orgId))
    .groupBy(schema.estimates.projectId)
    .as("last_estimate");

  const rows = await db
    .select({
      id: schema.projects.id,
      number: schema.projects.number,
      name: schema.projects.name,
      siteAddress: schema.projects.siteAddress,
      status: schema.projects.status,
      clientId: schema.clients.id,
      clientName: schema.clients.name,
      clientAddress: schema.clients.address,
      lastUsedAt: sql<Date>`greatest(${schema.projects.createdAt}, coalesce(${lastEstimate.at}, ${schema.projects.createdAt}))`,
    })
    .from(schema.projects)
    .innerJoin(schema.clients, eq(schema.clients.id, schema.projects.clientId))
    .leftJoin(lastEstimate, eq(lastEstimate.projectId, schema.projects.id))
    .where(eq(schema.projects.orgId, orgId))
    .orderBy(desc(schema.projects.number));

  return rows
    .map((r) => ({
      id: r.id,
      number: r.number,
      name: r.name,
      siteAddress: r.siteAddress,
      status: r.status,
      client: { id: r.clientId, name: r.clientName, address: r.clientAddress },
      lastUsedAt: new Date(r.lastUsedAt).toISOString(),
    }))
    .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
}

export async function createClient(orgId: string, input: z.output<typeof ClientInput>) {
  const [client] = await db.insert(schema.clients).values({ orgId, ...input }).returning();
  return client;
}

export async function createProject(orgId: string, input: z.output<typeof ProjectInput>) {
  return db.transaction(async (tx) => {
    const [owner] = await tx
      .select({ id: schema.clients.id })
      .from(schema.clients)
      .where(and(eq(schema.clients.id, input.clientId), eq(schema.clients.orgId, orgId)));
    if (!owner) throw new Error("Client not found");

    const [{ number }] = await tx
      .update(schema.organisations)
      .set({ nextProjectNo: sql`${schema.organisations.nextProjectNo} + 1` })
      .where(eq(schema.organisations.id, orgId))
      .returning({ number: sql<number>`${schema.organisations.nextProjectNo} - 1` });
    const [project] = await tx
      .insert(schema.projects)
      .values({ orgId, number, ...input })
      .returning();
    return project;
  });
}

export async function getProject(orgId: string, projectId: string) {
  const [row] = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.id, projectId), eq(schema.projects.orgId, orgId)));
  return row ?? null;
}

export async function updateClient(orgId: string, clientId: string, input: z.output<typeof ClientInput>) {
  const [client] = await db
    .update(schema.clients)
    .set(input)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.orgId, orgId)))
    .returning();
  return client ?? null;
}

export async function updateProject(orgId: string, projectId: string, input: z.output<typeof ProjectInput>) {
  return db.transaction(async (tx) => {
    const [owner] = await tx
      .select({ id: schema.clients.id })
      .from(schema.clients)
      .where(and(eq(schema.clients.id, input.clientId), eq(schema.clients.orgId, orgId)));
    if (!owner) throw new Error("Client not found");
    const [project] = await tx
      .update(schema.projects)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.orgId, orgId)))
      .returning();
    // Keep the project's estimates pointing at its current client.
    if (project) {
      await tx
        .update(schema.estimates)
        .set({ clientId: input.clientId })
        .where(and(eq(schema.estimates.projectId, projectId), eq(schema.estimates.orgId, orgId)));
    }
    return project ?? null;
  });
}

export async function getClient(orgId: string, clientId: string) {
  const [row] = await db
    .select()
    .from(schema.clients)
    .where(and(eq(schema.clients.id, clientId), eq(schema.clients.orgId, orgId)));
  return row ?? null;
}
