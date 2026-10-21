import { listEstimates } from "@/lib/estimate/queries";
import { listClients, listProjects, type ClientOption, type ProjectOption } from "@/lib/projects";

// Read models for the Projects and Clients pages: each record with its estimate count and latest quote.

/**
 * `quotedCents` is the most recent estimate's total, not a sum: a second estimate for the same job is usually an
 * alternative or a revision, so adding them up would overstate the work.
 */
export type Quoted = { estimateCount: number; quotedCents: number };

function tally(rows: Awaited<ReturnType<typeof listEstimates>>, key: (r: (typeof rows)[number]) => string | null) {
  const map = new Map<string, Quoted>();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    // listEstimates is newest first, so the first row seen for a record is its latest quote.
    const t = map.get(k) ?? { estimateCount: 0, quotedCents: r.totals.totalCents };
    t.estimateCount += 1;
    map.set(k, t);
  }
  return map;
}

const none: Quoted = { estimateCount: 0, quotedCents: 0 };

export async function projectsOverview(orgId: string): Promise<(ProjectOption & Quoted)[]> {
  const [projects, estimates] = await Promise.all([listProjects(orgId), listEstimates(orgId)]);
  const byProject = tally(estimates, (r) => r.estimate.projectId);
  return projects.map((p) => ({ ...p, ...(byProject.get(p.id) ?? none) }));
}

export async function clientsOverview(orgId: string): Promise<(ClientOption & Quoted & { projectCount: number })[]> {
  const [clients, projects, estimates] = await Promise.all([listClients(orgId), listProjects(orgId), listEstimates(orgId)]);
  const byClient = tally(estimates, (r) => r.estimate.clientId);
  return clients.map((c) => ({
    ...c,
    projectCount: projects.filter((p) => p.client.id === c.id).length,
    ...(byClient.get(c.id) ?? none),
  }));
}

/** Case-insensitive match across the given fields. */
export function matches(q: string, ...fields: (string | null | undefined)[]) {
  const needle = q.trim().toLowerCase();
  return !needle || fields.some((f) => f?.toLowerCase().includes(needle));
}
