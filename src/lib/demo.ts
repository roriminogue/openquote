import { eq } from "drizzle-orm";
import { db, resetDatabase, schema } from "@/db";
import type { EstimateAlternative } from "@/db/schema";
import { markDecision, shareEstimate } from "./proposals";

// Demo mode: "Try it with sample quotes" on the setup screen fills the app with a made-up carpentry business, its
// rates, two clients and four priced jobs, so anyone can look around without setting anything up or adding an AI
// key. A banner on Estimates says it's sample data and starts fresh with a real business (it clears everything).

const DEMO = "oq-demo";

export function isDemo() {
  try {
    return localStorage.getItem(DEMO) === "1";
  } catch {
    return false;
  }
}

type Line = [description: string, type: "material" | "labour" | "subbie" | "other", qty: number, unit: string, unitCost: number];
type Job = {
  title: string;
  daysAgo: number;
  client?: 0 | 1;
  project?: boolean;
  site?: string;
  summary: string;
  scope: string[];
  assumptions: string[];
  exclusions: string[];
  alternatives: EstimateAlternative[];
  groups: [name: string, lines: Line[]][];
  then?: "sent" | "accepted" | "declined";
};

const JOBS: Job[] = [
  {
    title: "Merbau deck 6 × 4 m with steps and oil finish",
    daysAgo: 12,
    client: 0,
    project: true,
    site: "12 Example St, Penrith NSW 2750",
    summary:
      "Break up the old slab and build a 6 × 4 m merbau deck on an H3 pine frame, attached to the house, with three steps to the lawn and one coat of decking oil.",
    scope: ["Remove and dispose of the old concrete slab", "Footings, bearers and joists", "Merbau decking, steps and one coat of oil", "Leave the site clean"],
    assumptions: ["Clear access down the side of the house", "Ground is level and free of rock"],
    exclusions: ["Council approval, if needed", "Balustrade", "Lighting and power"],
    alternatives: [
      { kind: "saving", title: "Treated pine decking instead of merbau", detail: "About $1,800 less in materials. Needs oiling more often." },
      { kind: "upgrade", title: "Hidden fixings", detail: "No screw heads on top. Adds about $650." },
    ],
    groups: [
      ["Demolition and site prep", [["Break up and remove old slab", "labour", 10, "hour", 85], ["Skip bin 6 m³", "material", 1, "each", 520]]],
      [
        "Footings and frame",
        [
          ["Concrete footings with galvanised stirrups", "material", 12, "each", 42],
          ["H3 treated pine bearers and joists", "material", 1, "lot", 1860],
          ["Build frame and fix ledger to house", "labour", 18, "hour", 85],
        ],
      ],
      ["Decking", [["Merbau decking 140 × 19", "material", 26, "m²", 165], ["Stainless deck screws", "material", 4, "box", 68], ["Lay and fix decking", "labour", 20, "hour", 85]]],
      ["Steps and finishing", [["Three steps to the lawn", "labour", 6, "hour", 85], ["Decking oil", "material", 2, "tin", 95], ["Sand and oil", "labour", 5, "hour", 85]]],
    ],
    then: "accepted",
  },
  {
    title: "Colorbond fence 25 m × 1.8 m with gate",
    daysAgo: 5,
    client: 1,
    site: "4 Sample Rd, Kingswood NSW 2747",
    summary: "Remove the old paling fence along the back and side boundary and install 25 m of 1.8 m Colorbond in Monument, with a matching gate.",
    scope: ["Remove and dispose of the old fence", "25 m of 1.8 m Colorbond, Monument", "One 900 mm gate with latch"],
    assumptions: ["Boundary line is marked", "No underground services along the fence line"],
    exclusions: ["Retaining walls", "Neighbour's share of the cost"],
    alternatives: [{ kind: "upgrade", title: "Lockable gate latch", detail: "Adds about $90." }],
    groups: [
      ["Remove old fence", [["Remove palings, rails and posts", "labour", 8, "hour", 85], ["Skip bin 4 m³", "material", 1, "each", 409]]],
      [
        "Colorbond fence",
        [
          ["Colorbond panels 2.36 m, Monument", "material", 10, "panel", 123],
          ["Concrete for posts", "material", 24, "bag", 9],
          ["Dig holes, set posts and fit panels", "labour", 16, "hour", 85],
        ],
      ],
      ["Gate", [["900 mm gate kit with latch", "material", 1, "each", 260], ["Hang the gate and fit the latch", "labour", 3, "hour", 85]]],
    ],
    then: "sent",
  },
  {
    title: "Bathroom retile 2.4 × 2.0 m with walk-in shower",
    daysAgo: 2,
    summary: "Strip and retile a 2.4 × 2.0 m bathroom floor to ceiling, with a walk-in shower and frameless screen.",
    scope: ["Strip existing tiles", "Waterproofing by a licensed waterproofer", "Wall and floor tiling", "Frameless shower screen"],
    assumptions: ["Plumbing stays where it is", "Tiles chosen from the standard range"],
    exclusions: ["Plumbing and electrical work", "New vanity and toilet"],
    alternatives: [{ kind: "saving", title: "Tile to 1.2 m instead of the ceiling", detail: "About $900 less." }],
    groups: [
      ["Strip out", [["Remove tiles and screed", "labour", 12, "hour", 80], ["Rubbish removal", "other", 1, "load", 280]]],
      ["Waterproofing", [["Waterproof floor and shower walls", "subbie", 1, "job", 950]]],
      ["Tiling", [["Wall and floor tiles", "material", 28, "m²", 65], ["Adhesive, grout and trims", "material", 1, "lot", 320], ["Lay tiles", "labour", 30, "hour", 80]]],
      ["Shower", [["Frameless screen, supplied and installed", "subbie", 1, "job", 1200]]],
    ],
  },
  {
    title: "Pergola 4 × 3 m, Colorbond roof",
    daysAgo: 20,
    client: 0,
    site: "12 Example St, Penrith NSW 2750",
    summary: "Build a free-standing 4 × 3 m treated pine pergola with a Colorbond roof over the back patio.",
    scope: ["Footings and posts", "Beams and rafters", "Colorbond roof sheets and flashing"],
    assumptions: ["Existing patio slab can take post footings beside it"],
    exclusions: ["Guttering and downpipes", "Council approval, if needed"],
    alternatives: [],
    groups: [
      ["Frame", [["Treated pine posts, beams and rafters", "material", 1, "lot", 1450], ["Footings and frame", "labour", 16, "hour", 85]]],
      ["Roof", [["Colorbond sheets and flashing", "material", 14, "m²", 38], ["Fix roof sheets", "labour", 6, "hour", 85]]],
    ],
    then: "declined",
  },
];

/** Fills the empty app with the sample business. Call only when there's no business yet. */
export async function loadDemo() {
  const now = Date.now();
  const day = 86_400_000;
  const [org] = await db
    .insert(schema.organisations)
    .values({
      name: "Example Carpentry Co",
      ownerName: "Sam",
      abn: "12 345 678 901",
      phone: "0400 000 000",
      email: "quotes@example.com",
      address: "Penrith NSW 2750",
      postcode: "2750",
      trades: ["carpentry", "decking", "fencing"],
      nextEstimateNo: 1001 + JOBS.length,
      nextProjectNo: 2,
    })
    .returning();
  const clients = await db
    .insert(schema.clients)
    .values([
      { orgId: org.id, name: "Jordan Lee", email: "jordan@example.com", phone: "0411 111 111", address: "12 Example St, Penrith NSW 2750" },
      { orgId: org.id, name: "Priya Shah", email: "priya@example.com", phone: "0422 222 222", address: "4 Sample Rd, Kingswood NSW 2747" },
    ])
    .returning();
  const [project] = await db
    .insert(schema.projects)
    .values({ orgId: org.id, number: 1, name: "Jordan's backyard", clientId: clients[0].id, siteAddress: "12 Example St, Penrith NSW 2750" })
    .returning();
  await db.insert(schema.rateRules).values([
    { orgId: org.id, title: "Carpenter", rateCents: 8500, unit: "hour", type: "labour" },
    { orgId: org.id, title: "Tiler", rateCents: 8000, unit: "hour", type: "labour" },
    { orgId: org.id, title: "Merbau decking 140 × 19", rateCents: 16500, unit: "m²", type: "material" },
    { orgId: org.id, title: "Colorbond panel 2.36 m", rateCents: 12300, unit: "panel", type: "material" },
  ]);

  // Oldest first, so the numbers follow the dates.
  const ordered = JOBS.map((job, i) => ({ job, i })).sort((a, b) => b.job.daysAgo - a.job.daysAgo);
  for (const [n, { job }] of ordered.entries()) {
    const at = new Date(now - job.daysAgo * day);
    const [estimate] = await db
      .insert(schema.estimates)
      .values({
        orgId: org.id,
        number: 1001 + n,
        title: job.title,
        clientId: job.client === undefined ? null : clients[job.client].id,
        projectId: job.project ? project.id : null,
        siteAddress: job.site ?? null,
        summary: job.summary,
        scope: job.scope,
        assumptions: job.assumptions,
        exclusions: job.exclusions,
        alternatives: job.alternatives,
        createdAt: at,
        updatedAt: at,
      })
      .returning();
    for (const [g, [name, lines]] of job.groups.entries()) {
      const [group] = await db.insert(schema.lineGroups).values({ estimateId: estimate.id, name, sort: g }).returning();
      await db.insert(schema.lineItems).values(
        lines.map(([description, type, qty, unit, cost], sort) => ({
          groupId: group.id,
          description,
          type,
          qty,
          unit,
          unitCostCents: Math.round(cost * 100),
          sort,
          source: type === "labour" ? ("rate_rule" as const) : ("price_book" as const),
        })),
      );
    }
    if (job.then) {
      await shareEstimate(org.id, estimate.id, "groups");
      if (job.then === "accepted" || job.then === "declined") await markDecision(org.id, estimate.id, job.then);
      // Sent the day after it was priced, answered two days later (not all "today").
      const sentAt = new Date(at.getTime() + day);
      const sends = await db
        .update(schema.proposalSends)
        .set({ sentAt })
        .where(eq(schema.proposalSends.estimateId, estimate.id))
        .returning({ id: schema.proposalSends.id });
      for (const send of sends)
        await db
          .update(schema.proposalEvents)
          .set({ at: new Date(at.getTime() + 3 * day) })
          .where(eq(schema.proposalEvents.sendId, send.id));
    }
  }
  try {
    localStorage.setItem(DEMO, "1");
  } catch {
    // the banner just won't show
  }
}

/** Forgets that the app holds the demo (a backup was restored over it). */
export function forgetDemo() {
  try {
    localStorage.removeItem(DEMO);
  } catch {
    // nothing to clear
  }
}

/** Leaves the demo: clears everything so the person can set up their own business. */
export async function leaveDemo() {
  await resetDatabase();
  try {
    localStorage.removeItem(DEMO);
    localStorage.removeItem("oq-last-backup");
    localStorage.removeItem("oq-backup-snooze-until");
  } catch {
    // nothing to clear
  }
}
