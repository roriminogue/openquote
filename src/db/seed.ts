// Synthetic demo data. Run with: npm run db:seed
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { db, schema } = await import("./index");
  const s = schema;

  const [org] = await db
    .insert(s.organisations)
    .values({
      name: "Coastal Carpentry Co",
      abn: "12 345 678 901",
      email: "hello@coastal.example",
      phone: "0400 000 000",
      trades: ["carpenter", "deck builder"],
      postcode: "3056",
      defaultMarkupPct: 25,
      termsMd: "Quote valid for 30 days. 10% deposit on acceptance.",
    })
    .returning();

  await db.insert(s.users).values({ orgId: org.id, name: "Alex Demo", email: "alex@coastal.example" });

  await db.insert(s.rateRules).values([
    { orgId: org.id, title: "Qualified carpenter", rateCents: 9500, unit: "hour", type: "labour" },
    { orgId: org.id, title: "Apprentice", rateCents: 4500, unit: "hour", type: "labour" },
    { orgId: org.id, title: "Merbau decking 90x19", rateCents: 2290, unit: "lm", type: "material" },
    { orgId: org.id, title: "H4 treated pine 90x45", rateCents: 840, unit: "lm", type: "material" },
  ]);

  await db.insert(s.aiInstructions).values([
    { orgId: org.id, text: "Always include a 10% waste allowance on timber materials." },
    { orgId: org.id, text: "Allow 2 hours for site clean-up on every job." },
  ]);

  const [client] = await db
    .insert(s.clients)
    .values({ orgId: org.id, name: "Jordan Sample", email: "jordan@client.example", address: "1 Example St, Brunswick VIC" })
    .returning();

  const [est] = await db
    .insert(s.estimates)
    .values({
      orgId: org.id,
      clientId: client.id,
      number: 1001,
      title: "Merbau deck 4×3m",
      siteAddress: client.address,
      description: "Build a 4x3m merbau deck, two posts in concrete footings, balustrade on the open side, oil finish.",
    })
    .returning();

  const [framing, decking] = await db
    .insert(s.lineGroups)
    .values([
      { estimateId: est.id, name: "Subframe", sort: 0 },
      { estimateId: est.id, name: "Decking", sort: 1 },
    ])
    .returning();

  await db.insert(s.lineItems).values([
    { groupId: framing.id, description: "H4 treated pine 90x45 joists", type: "material", qty: 40, unit: "lm", unitCostCents: 840, source: "rate_rule" },
    { groupId: framing.id, description: "Rapid set concrete 20kg", type: "material", qty: 4, unit: "bag", unitCostCents: 1180, source: "ai" },
    { groupId: framing.id, description: "Set out, footings and subframe", type: "labour", qty: 8, unit: "hour", unitCostCents: 9500, source: "rate_rule" },
    { groupId: decking.id, description: "Merbau decking 90x19", type: "material", qty: 86, unit: "lm", unitCostCents: 2290, source: "rate_rule" },
    { groupId: decking.id, description: "Lay boards and oil finish", type: "labour", qty: 10, unit: "hour", unitCostCents: 9500, source: "rate_rule" },
  ]);

  console.log(`Seeded org "${org.name}" with estimate EST-${est.number}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
