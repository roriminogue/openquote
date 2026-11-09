// Trade words for voice input (pure, for tests). The phone's recogniser gets them as hints, and the tidy-up gets
// them as the vocabulary it should correct towards. A business's own rate names come first: they're the words
// that business actually uses.

/** Words speech recognisers commonly mishear on Australian building jobs. */
export const TRADE_TERMS = [
  // Timber and decking
  "merbau", "spotted gum", "blackbutt", "jarrah", "treated pine", "hardwood", "Ekodeck", "composite decking",
  "decking boards", "joists", "bearers", "stumps", "noggins", "studs", "top plate", "bottom plate", "LVL",
  "H3", "H4", "F7", "MGP10", "GL17", "joist hangers", "post stirrups", "batten", "fascia", "barge board",
  // Fencing
  "palings", "lap and cap", "capping", "plinth", "sleepers", "Colorbond", "Good Neighbour", "Lysaght",
  "pool fencing", "slat screen",
  // Sheeting, wet areas and finishes
  "Gyprock", "Villaboard", "Hardiflex", "Scyon", "James Hardie", "fibre cement", "cornice", "skirting",
  "architraves", "waterproofing membrane", "screed", "grout", "tiles", "vanity", "Dulux", "Taubmans",
  "low sheen", "semi-gloss", "decking oil",
  // Roofing, concrete and site
  "Colorbond roof", "Klip-Lok", "Trimdek", "Corrugated", "flashing", "downpipes", "gutters", "pergola",
  "footings", "pier holes", "reo", "mesh", "formwork", "bobcat", "skip bin", "excavation",
  // Units as said out loud
  "mm", "metres", "square metres", "lineal metres", "linear metres",
] as const;

const MAX_HINTS = 100;

/** Rate names first, then the trade terms, without repeats; short phrases only (that's what recognisers use). */
export function voiceHints(rateTitles: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...rateTitles, ...TRADE_TERMS]) {
    const t = raw.trim().replace(/\s+/g, " ");
    if (!t || t.length > 40 || t.split(" ").length > 5) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length === MAX_HINTS) break;
  }
  return out;
}
