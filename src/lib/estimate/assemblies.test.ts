import { describe, expect, it } from "vitest";
import { PRICE_BOOK } from "../price-book";
import { buildDeck, buildFence, type DeckSpec, type FenceSpec, type LabourRate } from "./assemblies";
import type { PricedGroup } from "./price";

const rate: LabourRate = { cents: 8000, source: "rate_rule", ref: "R1" };

const fence = (over: Partial<FenceSpec> = {}): FenceSpec => ({
  lengthM: 20,
  heightM: 1.8,
  style: "butted",
  newPosts: true,
  removeOld: false,
  gates: 0,
  capping: true,
  plinth: false,
  site: "normal",
  ...over,
});

const deck = (over: Partial<DeckSpec> = {}): DeckSpec => ({
  lengthM: 4,
  widthM: 3,
  heightMm: 600,
  boards: "merbau_90",
  hiddenFixings: false,
  attachedToHouse: true,
  steps: 2,
  stepWidthM: 1.2,
  oil: true,
  removeOldDeck: false,
  site: "normal",
  ...over,
});

const lines = (groups: PricedGroup[]) => groups.flatMap((g) => g.lines);
const byRef = (groups: PricedGroup[], ref: string) => lines(groups).filter((l) => l.sourceRef === ref);
const qty = (groups: PricedGroup[], ref: string) => byRef(groups, ref).reduce((n, l) => n + l.qty, 0);
const hours = (groups: PricedGroup[]) => lines(groups).filter((l) => l.type === "labour").reduce((n, l) => n + l.qty, 0);
const cost = (groups: PricedGroup[]) => lines(groups).reduce((n, l) => n + Math.round(l.qty * l.unitCostCents), 0);

describe("price book", () => {
  it("has unique ids and sane prices", () => {
    const ids = PRICE_BOOK.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of PRICE_BOOK.items) {
      expect(i.costCents).toBeGreaterThan(0);
      expect(i.lowCents).toBeLessThanOrEqual(i.costCents);
      expect(i.highCents).toBeGreaterThanOrEqual(i.costCents);
    }
  });
});

describe("buildFence", () => {
  it("prices a new 20 m butted paling fence by rule", () => {
    const g = buildFence(fence(), rate);
    expect(g.map((x) => x.name)).toEqual(["Posts", "Rails", "Palings and capping", "Clean-up"]);
    expect(qty(g, "post_tp_h4_125x75_2400")).toBe(10); // 9 bays + 1
    expect(qty(g, "concrete_20kg")).toBe(20);
    expect(qty(g, "rail_tp_75x50")).toBe(44); // 2 rails × 20 m + 10%
    expect(qty(g, "paling_tp_100x12_1800")).toBe(220); // 10 per metre + 10%
    expect(qty(g, "capping_tp_90x45")).toBe(22);
    // About a metre an hour, plus set-out and clean-up.
    expect(hours(g)).toBeGreaterThanOrEqual(18);
    expect(hours(g)).toBeLessThanOrEqual(24);
    expect(lines(g).filter((l) => l.type === "labour").every((l) => l.unitCostCents === 8000 && l.sourceRef === "R1")).toBe(true);
  });

  it("uses the Victorian lap-and-cap count and three rails", () => {
    const g = buildFence(fence({ style: "lap_and_cap" }), rate);
    expect(qty(g, "paling_tp_150x12_1800")).toBe(110);
    expect(qty(g, "paling_tp_100x12_1800")).toBe(110);
    expect(qty(g, "rail_tp_75x50")).toBe(66);
  });

  it("reuses posts and removes the old fence when asked", () => {
    const g = buildFence(fence({ newPosts: false, removeOld: true }), rate);
    expect(byRef(g, "post_tp_h4_125x75_2400")).toHaveLength(0);
    expect(g[0].name).toBe("Remove old fence");
    expect(qty(g, "skip_2m3")).toBe(1); // 20 m of palings and rails ≈ 2 m³ loose
    expect(qty(buildFence(fence({ lengthM: 45, removeOld: true }), rate), "skip_6m3")).toBe(2);
    expect(g[1].name).toBe("Existing posts");
  });

  it("takes a short fence's waste to the tip in the ute instead of hiring a skip", () => {
    const g = buildFence(fence({ lengthM: 8, removeOld: true }), rate);
    expect(qty(g, "tip_ute_load")).toBe(1); // 8 m × 0.15 m³ = 1.2 m³, one ute load
    expect(byRef(g, "skip_2m3")).toHaveLength(0);
    expect(g[0].lines.some((l) => l.type === "labour" && /tip/.test(l.description))).toBe(true);
    // Just over a ute load gets the smallest skip.
    expect(qty(buildFence(fence({ lengthM: 12, removeOld: true }), rate), "skip_2m3")).toBe(1);
  });

  it("adds gate posts, hardware and hours", () => {
    const plain = buildFence(fence(), rate);
    const gated = buildFence(fence({ gates: 1 }), rate);
    expect(qty(gated, "post_tp_h4_125x75_2400")).toBe(11);
    expect(qty(gated, "gate_hinge_strap")).toBe(1);
    expect(hours(gated) - hours(plain)).toBeGreaterThanOrEqual(3);
  });

  it("scales the paling price for heights longer than stock", () => {
    const g = buildFence(fence({ heightM: 2.4, style: "lap_and_cap" }), rate);
    const base = byRef(g, "paling_tp_150x12_2100")[0];
    expect(base.unitCostCents).toBeGreaterThan(PRICE_BOOK.items.find((i) => i.id === "paling_tp_150x12_2100")!.costCents);
  });

  it("lands in the published Melbourne range for a new 1.8 m fence", () => {
    // Prime Green Fencing 2026: supply only $55–85/m inc GST.
    const materials = lines(buildFence(fence(), rate)).filter((l) => l.type === "material");
    const perMetreIncGst = (materials.reduce((n, l) => n + l.qty * l.unitCostCents, 0) * 1.1) / 100 / 20;
    expect(perMetreIncGst).toBeGreaterThan(45);
    expect(perMetreIncGst).toBeLessThan(90);
  });
});

describe("buildDeck", () => {
  it("frames, decks and finishes a 4 × 3 m merbau deck", () => {
    const g = buildDeck(deck(), rate);
    expect(g.map((x) => x.name)).toEqual(["Footings", "Subframe", "Decking and fascia", "Steps", "Finishing and clean-up"]);
    expect(qty(g, "post_tp_h4_100x100_2400")).toBe(8); // 2 bearers × 4 posts
    const boards = byRef(g, "deck_merbau_90x19");
    expect(boards[0].qty).toBeCloseTo(138.9, 1); // 12 m² ÷ 95 mm + 10%
    expect(qty(g, "masonry_anchor_m12")).toBe(8);
    // Market labour is about $140–220/m².
    expect(hours(g)).toBeGreaterThanOrEqual(24);
    expect(hours(g)).toBeLessThanOrEqual(36);
  });

  it("uses low-deck framing and stirrups near the ground", () => {
    const g = buildDeck(deck({ heightMm: 150, steps: 0, stepWidthM: 0 }), rate);
    expect(qty(g, "stirrup_galv_post")).toBeGreaterThan(0);
    expect(byRef(g, "frame_tp_h3_90x45").length).toBe(1);
  });

  it("uses clips, not screws, for composite and skips oil", () => {
    const g = buildDeck(deck({ boards: "composite_137" }), rate);
    expect(qty(g, "deck_hidden_clips_m2")).toBe(12);
    expect(byRef(g, "oil_deck_4l").concat(byRef(g, "oil_deck_10l"))).toHaveLength(0);
  });

  it("costs more on a difficult site", () => {
    expect(cost(buildDeck(deck({ site: "difficult" }), rate))).toBeGreaterThan(cost(buildDeck(deck(), rate)));
  });

  it("only uses price book items that exist, across options", () => {
    for (const boards of ["merbau_90", "merbau_140", "spotted_gum_86", "spotted_gum_135", "treated_pine_90", "composite_137"] as const) {
      for (const heightMm of [100, 600, 1500]) {
        expect(() => buildDeck(deck({ boards, heightMm, removeOldDeck: true, attachedToHouse: heightMm > 500 }), rate)).not.toThrow();
      }
    }
    for (const heightM of [1.2, 1.5, 1.8, 2.1]) {
      for (const style of ["butted", "lapped", "lap_and_cap"] as const) {
        expect(() => buildFence(fence({ heightM, style, gates: 2, plinth: true, removeOld: true }), rate)).not.toThrow();
      }
    }
  });
});
