import { z } from "zod";
import { bookItem } from "../price-book";
import type { PricedGroup, PricedLine } from "./price";

// Calculators for jobs common enough to price by rule rather than by guess. The model reads the job and fills in
// a spec (lengths, heights, style); code works out every quantity, prices materials from the price book and
// labour from the business's hourly rate. Rules and sources: price-research/rules.md.

export const SiteDifficulty = z
  .enum(["easy", "normal", "difficult"])
  .describe("difficult = slope, rock, tight access or carrying through the house");

export const FenceSpec = z.object({
  lengthM: z.number().positive().max(500).describe("Total fence length in metres"),
  heightM: z.number().min(0.9).max(2.4).describe("Fence height in metres, usually 1.8"),
  style: z
    .enum(["butted", "lapped", "lap_and_cap"])
    .describe(
      "butted = palings side by side; lapped = overlapping palings; lap_and_cap = Victorian two-layer (150 mm base palings with 100 mm palings over the gaps)",
    ),
  newPosts: z.boolean().describe("false when the existing posts are reused"),
  removeOld: z.boolean().describe("Remove and dispose of an existing fence"),
  gates: z.number().int().min(0).max(10).describe("Number of single pedestrian gates"),
  capping: z.boolean().describe("Timber capping along the top"),
  plinth: z.boolean().describe("A plinth board along the bottom"),
  site: SiteDifficulty,
});

export const DeckBoards = z.enum([
  "merbau_90",
  "merbau_140",
  "spotted_gum_86",
  "spotted_gum_135",
  "treated_pine_90",
  "composite_137",
]);

export const DeckSpec = z.object({
  lengthM: z.number().positive().max(30).describe("Deck length in metres, along the house (the way the boards run)"),
  widthM: z.number().positive().max(30).describe("Deck depth in metres, out from the house"),
  heightMm: z.number().min(0).max(3000).describe("Height of the finished deck above the ground, in mm"),
  boards: DeckBoards,
  hiddenFixings: z.boolean().describe("Concealed clips instead of face screws (composite boards always use them)"),
  attachedToHouse: z.boolean().describe("One edge is carried by a ledger bolted to the house"),
  steps: z.number().int().min(0).max(12).describe("Number of steps down to the ground, 0 for none"),
  stepWidthM: z.number().min(0).max(10).describe("Width of the steps in metres, 0 for none"),
  oil: z.boolean().describe("Clean and oil the deck, two coats (ignored for composite)"),
  removeOldDeck: z.boolean().describe("Demolish and dispose of an existing deck of the same size"),
  site: SiteDifficulty,
});

export type FenceSpec = z.infer<typeof FenceSpec>;
export type DeckSpec = z.infer<typeof DeckSpec>;

/** The hourly rate labour lines are priced at: the business's own rate when it has one. */
export type LabourRate = { cents: number; source: "rate_rule" | "price_book"; ref: string | null };

const SITE_FACTOR = { easy: 0.9, normal: 1, difficult: 1.3 } as const;
const WASTE = 1.1;

/** Round up, ignoring floating-point dust (10 × 20 × 1.1 is 220.00000000000003). */
const ceil = (n: number) => Math.ceil(n - 1e-9);
const r1 = (n: number) => Math.round(n * 10) / 10;
/** Hours to the nearest half hour, never less than half an hour. */
const hrs = (n: number) => Math.max(0.5, Math.round(n * 2) / 2);
const fmt = (n: number) => String(r1(n));

function material(id: string, qty: number, notes: string, opts: { description?: string; factor?: number } = {}): PricedLine {
  const item = bookItem(id);
  return {
    description: opts.description ?? item.name,
    type: "material",
    qty: r1(qty),
    unit: item.unit,
    unitCostCents: Math.round(item.costCents * (opts.factor ?? 1)),
    source: "price_book",
    sourceRef: item.id,
    notes,
  };
}

function other(id: string, qty: number, notes: string): PricedLine {
  return { ...material(id, qty, notes), type: "other" };
}

function labour(description: string, hours: number, rate: LabourRate, notes: string): PricedLine {
  return {
    description,
    type: "labour",
    qty: hrs(hours),
    unit: "hour",
    unitCostCents: rate.cents,
    source: rate.source,
    sourceRef: rate.ref,
    notes,
  };
}

/** A ute tray takes about this much loose waste in one run to the tip (about 10 m of old fence). */
export const UTE_LOAD_M3 = 1.5;

/**
 * Getting rid of demolition waste. Up to one ute load (about 10 m of fence, or a 5 m² deck) goes to the tip in
 * the ute: the tip fee plus an hour for the run. More than that gets the smallest skip that takes it, and very
 * large amounts several 6 m³ skips.
 */
function disposal(volumeM3: number, why: string, rate: LabourRate): PricedLine[] {
  if (volumeM3 <= UTE_LOAD_M3)
    return [
      other("tip_ute_load", 1, `${why}: one ute load`),
      labour("Load the ute and take the waste to the tip", 1, rate, "About an hour there and back"),
    ];
  if (volumeM3 <= 2) return [other("skip_2m3", 1, why)];
  if (volumeM3 <= 4) return [other("skip_4m3", 1, why)];
  return [other("skip_6m3", ceil(volumeM3 / 6), why)];
}

const groups = (list: { name: string; lines: PricedLine[] }[]): PricedGroup[] => list.filter((g) => g.lines.length > 0);

// ── Paling fence ────────────────────────────────────────────────────────────

const PALINGS: Record<100 | 150, [number, string][]> = {
  100: [
    [1.5, "paling_tp_100x12_1500"],
    [1.8, "paling_tp_100x12_1800"],
  ],
  150: [
    [1.8, "paling_tp_150x12_1800"],
    [2.1, "paling_tp_150x12_2100"],
  ],
};

/** The stocked paling at or just above the fence height; longer fences scale the longest stocked price. */
function paling(width: 100 | 150, heightM: number): { id: string; lengthM: number; factor: number } {
  const options = PALINGS[width];
  const fit = options.find(([len]) => len >= heightM - 0.001);
  if (fit) return { id: fit[1], lengthM: fit[0], factor: 1 };
  const [len, id] = options[options.length - 1];
  const lengthM = Math.ceil(heightM * 10) / 10;
  return { id, lengthM, factor: lengthM / len };
}

export function buildFence(spec: FenceSpec, rate: LabourRate): PricedGroup[] {
  const L = spec.lengthM;
  const H = spec.heightM;
  const site = SITE_FACTOR[spec.site];
  const m = `${fmt(L)} m`;

  const bays = ceil(L / 2.4);
  const linePosts = spec.newPosts ? bays + 1 : 0;
  const gatePosts = spec.newPosts ? spec.gates : 0; // a gate needs its own post beside the line post
  const posts = linePosts + gatePosts;
  const postLength = H <= 1.5 ? 2.1 : H <= 1.8 ? 2.4 : 2.7; // 600 mm in the ground
  const rails = H >= 2.1 || (H >= 1.8 && spec.style !== "butted") ? 3 : 2;

  // Palings per metre of fence.
  const palingSets: { width: 100 | 150; perM: number; why: string }[] =
    spec.style === "lap_and_cap"
      ? [
          { width: 150, perM: 5, why: "5 base palings per metre (150 mm, about 50 mm apart)" },
          { width: 100, perM: 5, why: "5 cover palings per metre over the gaps" },
        ]
      : spec.style === "lapped"
        ? [{ width: 100, perM: 1 / 0.075, why: "100 mm palings lapped 25 mm: 13.3 per metre" }]
        : [{ width: 100, perM: 10, why: "100 mm palings butted: 10 per metre" }];

  // ── Demolition
  const demo: PricedLine[] = [];
  if (spec.removeOld) {
    const oldPosts = spec.newPosts ? bays + 1 : 0;
    demo.push(
      labour(
        spec.newPosts ? "Remove old fence, including digging out the posts" : "Remove old palings and rails, keep the posts",
        (0.3 * L + 0.5 * oldPosts) * site,
        rate,
        `0.3 h per metre${oldPosts ? ` + 0.5 h per old post (${oldPosts})` : ""}`,
      ),
      ...disposal(L * (spec.newPosts ? 0.15 : 0.1), `Old fence waste, about ${spec.newPosts ? "0.15" : "0.1"} m³ loose per metre`, rate),
    );
  }

  // ── Posts
  const postLines: PricedLine[] = [];
  if (posts > 0) {
    postLines.push(
      material("post_tp_h4_125x75_2400", posts, `${m} ÷ 2.4 m bays = ${bays} bays + 1 = ${linePosts} posts${gatePosts ? `, + ${gatePosts} gate post${gatePosts > 1 ? "s" : ""}` : ""}`, {
        description: `H4 treated pine posts 125×75, ${postLength} m`,
        factor: postLength / 2.4,
      }),
      material("concrete_20kg", posts * 2 + gatePosts, `2 bags per post${gatePosts ? ", 3 for gate posts" : ""}`),
      labour("Set out, dig post holes and concrete in posts", (1 + 0.75 * posts) * site, rate, `1 h set-out + 0.75 h per post`),
    );
  } else {
    postLines.push(labour("Check, straighten and re-fix the existing posts", (0.5 + 0.1 * L) * site, rate, "0.1 h per metre"));
  }

  // ── Rails, palings, capping
  const railLm = rails * L * WASTE;
  const frame: PricedLine[] = [
    material("rail_tp_75x50", railLm, `${rails} rails × ${m} + 10% waste`, { description: "H3 treated pine rails 75×50" }),
    labour(`Fix ${rails} rails`, (rails === 3 ? 0.2 : 0.15) * L * site, rate, `${rails === 3 ? 0.2 : 0.15} h per metre`),
  ];
  if (spec.plinth) {
    frame.push(
      material("plinth_tp_150x25", L * WASTE, `${m} + 10% waste`),
      labour("Fix plinth board", 0.1 * L * site, rate, "0.1 h per metre"),
    );
  }

  const cladding: PricedLine[] = [];
  let palingCount = 0;
  for (const set of palingSets) {
    const p = paling(set.width, H);
    const count = ceil(set.perM * L * WASTE);
    palingCount += count;
    const item = bookItem(p.id);
    cladding.push(
      material(p.id, count, `${set.why} × ${m} + 10% waste`, {
        description: p.factor === 1 ? item.name : `Treated pine paling ${set.width}×12 ${p.lengthM} m H3`,
        factor: p.factor,
      }),
    );
  }
  const nails = palingCount * rails * 2;
  cladding.push(
    nails > 800
      ? material("nails_paling_galv_5kg", ceil(nails / 1600), `${nails} nails (2 per paling per rail), about 1,600 per 5 kg`)
      : material("nails_paling_galv_500g", ceil(nails / 160), `${nails} nails (2 per paling per rail), 160 per pack`),
  );
  const palingHours = { butted: 0.3, lapped: 0.4, lap_and_cap: 0.5 }[spec.style];
  cladding.push(labour("Fix palings to a string line", palingHours * L * site, rate, `${palingHours} h per metre`));
  if (spec.capping) {
    cladding.push(
      material("capping_tp_90x45", L * WASTE, `${m} + 10% waste`),
      labour("Fit capping", 0.08 * L * site, rate, "0.08 h per metre"),
    );
  }

  // ── Gates
  const gateLines: PricedLine[] = [];
  if (spec.gates > 0) {
    const g = spec.gates;
    const gp = paling(100, H);
    gateLines.push(
      material("rail_tp_75x50", 6 * g, "About 6 lm of frame per gate", { description: "H3 treated pine 75×50 gate frame" }),
      material(gp.id, 12 * g, "About 12 palings per 1 m gate", { factor: gp.factor }),
      material("gate_hinge_strap", g, "1 set per gate"),
      material("gate_latch_d", g, "1 per gate"),
      labour(g > 1 ? `Build and hang ${g} gates` : "Build and hang the gate", 3 * g * site, rate, "3 h per gate"),
    );
  }

  const clean = [labour("Clean up and remove offcuts", (0.5 + 0.05 * L) * site, rate, "0.5 h + 0.05 h per metre")];

  return groups([
    { name: "Remove old fence", lines: demo },
    { name: spec.newPosts ? "Posts" : "Existing posts", lines: postLines },
    { name: "Rails", lines: frame },
    { name: spec.style === "lap_and_cap" ? "Palings (lap and cap) and capping" : "Palings and capping", lines: cladding },
    { name: spec.gates > 1 ? "Gates" : "Gate", lines: gateLines },
    { name: "Clean-up", lines: clean },
  ]);
}

// ── Deck ────────────────────────────────────────────────────────────────────

const BOARDS: Record<DeckSpec["boards"], { id: string; coverM: number; fascia: string; hardwood: boolean }> = {
  merbau_90: { id: "deck_merbau_90x19", coverM: 0.095, fascia: "deck_merbau_140x19", hardwood: true },
  merbau_140: { id: "deck_merbau_140x19", coverM: 0.145, fascia: "deck_merbau_140x19", hardwood: true },
  spotted_gum_86: { id: "deck_spottedgum_86x19", coverM: 0.091, fascia: "deck_spottedgum_135x19", hardwood: true },
  spotted_gum_135: { id: "deck_spottedgum_135x19", coverM: 0.14, fascia: "deck_spottedgum_135x19", hardwood: true },
  treated_pine_90: { id: "deck_tp_90x22", coverM: 0.095, fascia: "frame_tp_h3_140x35", hardwood: false },
  composite_137: { id: "deck_composite_137x23", coverM: 0.143, fascia: "deck_composite_137x23", hardwood: false },
};

const JOIST_SPACING = 0.45;

export function buildDeck(spec: DeckSpec, rate: LabourRate): PricedGroup[] {
  const L = spec.lengthM;
  const W = spec.widthM;
  const area = L * W;
  const site = SITE_FACTOR[spec.site];
  const board = BOARDS[spec.boards];
  const composite = spec.boards === "composite_137";
  const hidden = spec.hiddenFixings || composite;
  const dims = `${fmt(L)} × ${fmt(W)} m = ${fmt(area)} m²`;

  // Frame layout (Timberlink DIY deck guide, F7/MGP10 H3, 2 kPa): joists at 450 mm run out from the house and
  // sit on bearers; low decks use 90×45 joists (span ≤ 1.3 m), others 140×45 (bearers at ≤ 1.8 m). Bearers are
  // doubled 140×45 on posts at ≤ 1.8 m.
  const low = spec.heightMm < 300;
  const joistId = low ? "frame_tp_h3_90x45" : "frame_tp_h3_140x45";
  const joistSize = low ? "90×45" : "140×45";
  const maxJoistSpan = low ? 1.3 : 1.8;
  const supportLines = ceil(W / maxJoistSpan) + 1; // incl. the ledger when attached
  const bearers = spec.attachedToHouse ? supportLines - 1 : supportLines;
  const postsPerBearer = ceil(L / 1.8) + 1;
  const posts = bearers * postsPerBearer;
  const joists = ceil(L / JOIST_SPACING) + 1;
  const joistLm = joists * W * 1.05;
  const bearerLm = bearers * L * 2 * 1.05;
  const stirrups = spec.heightMm < 250;
  const postLen = Math.max(0.9, spec.heightMm / 1000 + 0.45);

  // ── Demolition
  const demo: PricedLine[] = [];
  if (spec.removeOldDeck) {
    demo.push(
      labour("Demolish and remove the old deck", 0.5 * area * site, rate, "0.5 h per m²"),
      ...disposal(area * 0.3, "Old deck waste, about 0.3 m³ loose per m²", rate),
    );
  }

  // ── Footings
  const footings: PricedLine[] = [labour("Set out, levels and footing positions", (1 + 0.05 * area) * site, rate, "1 h + 0.05 h per m²")];
  if (stirrups) {
    footings.push(
      material("stirrup_galv_post", posts, `${bearers} bearer${bearers > 1 ? "s" : ""} × ${postsPerBearer} supports at ≤ 1.8 m`),
      material("concrete_20kg", posts * 2, "2 bags per pad footing"),
      labour("Dig and pour pad footings, set stirrups", 0.4 * posts * site, rate, "0.4 h per footing"),
    );
  } else {
    footings.push(
      material("post_tp_h4_100x100_2400", posts, `${bearers} bearer${bearers > 1 ? "s" : ""} × ${postsPerBearer} posts at ≤ 1.8 m; ${fmt(postLen)} m each incl. 450 mm in the ground`, {
        description: `H4 treated pine posts 100×100, cut to ${fmt(postLen)} m`,
        // Two short posts come out of one 2.4 m length; longer ones cost proportionally more.
        factor: postLen <= 1.2 ? 0.5 : postLen <= 2.4 ? 1 : postLen / 2.4,
      }),
      material("concrete_20kg", posts * 3, "3 bags per post hole"),
      labour("Dig post holes, set and brace posts in concrete", 0.6 * posts * site, rate, "0.6 h per post"),
    );
  }
  footings.push(material("weed_mat_m2", area * WASTE, `Under the deck, ${fmt(area)} m² + 10%`));

  // ── Subframe
  const frame: PricedLine[] = [
    material("frame_tp_h3_140x45", bearerLm, `${bearers} doubled bearer${bearers > 1 ? "s" : ""} × ${fmt(L)} m + 5%`, {
      description: "H3 treated pine bearers 2/140×45",
    }),
    material(joistId, joistLm, `${joists} joists at 450 mm × ${fmt(W)} m + 5%`, { description: `H3 treated pine joists ${joistSize}` }),
    material(low ? "joist_hanger_45x90" : "joist_hanger_45x140", joists * supportLines, `${joists} joists × ${supportLines} supports`, {
      description: "Joist hangers / framing brackets",
    }),
    material("bolt_cuphead_m12x150", posts * 2, "2 × M12 bolts per bearer-to-post connection"),
    material("joist_tape_50m", ceil((joistLm + bearerLm / 2) / 50), "Covers the tops of joists and bearers"),
  ];
  if (spec.attachedToHouse) {
    frame.push(
      material("frame_tp_h3_140x45", L * 1.05, `Ledger along ${fmt(L)} m of wall`, { description: "H3 treated pine ledger 140×45" }),
      material("masonry_anchor_m12", ceil(L / 0.6) + 1, "M12 at ≤ 600 mm centres"),
    );
  }
  frame.push(
    labour(
      "Build the subframe: bearers, joists" + (spec.attachedToHouse ? " and ledger" : ""),
      (0.6 * area + (spec.attachedToHouse ? 0.15 * L : 0)) * site,
      rate,
      `0.6 h per m²${spec.attachedToHouse ? " + 0.15 h per metre of ledger" : ""}`,
    ),
  );

  // ── Decking
  const boardLm = (area / board.coverM) * WASTE;
  const decking: PricedLine[] = [material(board.id, boardLm, `${dims} ÷ ${board.coverM * 1000} mm cover + 10% waste`)];
  if (hidden) {
    decking.push(material("deck_hidden_clips_m2", area, `${fmt(area)} m²`));
  } else {
    const screws = ceil((area / board.coverM / JOIST_SPACING) * 2 * 1.05);
    decking.push(
      screws > 700
        ? material("screw_deck_ss304_10gx50_1000", ceil(screws / 1000), `${screws} screws: 2 per board at every joist`)
        : material("screw_deck_ss304_10gx50_500", ceil(screws / 500), `${screws} screws: 2 per board at every joist`),
    );
  }
  const boardHours = hidden ? (composite ? 0.7 : 0.9) : 0.6;
  decking.push(labour(hidden ? "Lay and fix decking with hidden clips" : "Lay, pre-drill and screw the decking", boardHours * area * site, rate, `${boardHours} h per m²`));
  const fasciaLm = (spec.attachedToHouse ? L + 2 * W : 2 * (L + W)) * WASTE;
  decking.push(
    material(board.fascia, fasciaLm, `Exposed edges ${spec.attachedToHouse ? "(3 sides)" : "(4 sides)"} + 10%`, { description: `Fascia: ${bookItem(board.fascia).name}` }),
    labour("Cut and fit fascia", 0.15 * fasciaLm * site, rate, "0.15 h per metre"),
  );

  // ── Steps
  const stepLines: PricedLine[] = [];
  if (spec.steps > 0 && spec.stepWidthM > 0) {
    const s = spec.steps;
    const w = spec.stepWidthM;
    const stringers = ceil(w / 0.9) + 1;
    const treadBoards = ceil(0.3 / board.coverM);
    stepLines.push(
      material("frame_tp_h3_190x45", stringers * (s * 0.3 + 0.4), `${stringers} stringers × ${fmt(s * 0.3 + 0.4)} m`, { description: "H3 treated pine stringers 190×45" }),
      material(board.id, s * treadBoards * w * WASTE, `${s} treads × ${treadBoards} boards × ${fmt(w)} m + 10%`, { description: `Step treads: ${bookItem(board.id).name}` }),
      material(board.fascia, s * w * WASTE, `${s} risers × ${fmt(w)} m + 10%`, { description: `Step risers: ${bookItem(board.fascia).name}` }),
      material("concrete_20kg", 2, "Pad under the stringers"),
      labour(`Build ${s} step${s > 1 ? "s" : ""}`, (1 + 1.5 * s) * site, rate, "1 h + 1.5 h per step"),
    );
  }

  // ── Finish
  const finish: PricedLine[] = [];
  if (spec.oil && !composite) {
    const litres = (area * 1.1 * 2) / 10;
    finish.push(
      litres > 6
        ? material("oil_deck_10l", ceil(litres / 10), `${fmt(area)} m² × 2 coats at 10 m² per litre ≈ ${fmt(litres)} L`)
        : material("oil_deck_4l", ceil(litres / 4), `${fmt(area)} m² × 2 coats at 10 m² per litre ≈ ${fmt(litres)} L`),
      labour("Clean and oil, two coats", 0.12 * area * site, rate, "0.12 h per m²"),
    );
  }
  finish.push(labour("Clean up and remove offcuts", (1 + 0.03 * area) * site, rate, "1 h + 0.03 h per m²"));

  return groups([
    { name: "Remove old deck", lines: demo },
    { name: "Footings", lines: footings },
    { name: "Subframe", lines: frame },
    { name: "Decking and fascia", lines: decking },
    { name: spec.steps > 1 ? "Steps" : "Step", lines: stepLines },
    { name: "Finishing and clean-up", lines: finish },
  ]);
}
