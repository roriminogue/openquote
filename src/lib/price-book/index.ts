import data from "./items.json";

// The built-in price book: typical Australian material costs, checked against retailers and timber yards
// (see items.json for the date, region and basis). Prices are the business's cost in cents, ex GST. A
// business's own rate rules always win over these.

export type PriceBookItem = {
  id: string;
  name: string;
  trade: string;
  unit: string;
  costCents: number;
  lowCents: number;
  highCents: number;
  sources: number;
  confidence: "high" | "medium" | "low";
  note: string;
};

export const PRICE_BOOK = {
  checked: data.checked,
  region: data.region,
  items: data.items as PriceBookItem[],
};

const byId = new Map(PRICE_BOOK.items.map((i) => [i.id, i]));

export function priceBookItem(id: string | null | undefined): PriceBookItem | undefined {
  return id ? byId.get(id) : undefined;
}

/** Like priceBookItem, for ids the code itself uses: a missing one is a bug, not bad model output. */
export function bookItem(id: string): PriceBookItem {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown price book item: ${id}`);
  return item;
}

/** "October 2026", for showing where a price came from. */
export function priceBookCheckedLabel(): string {
  return new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(new Date(PRICE_BOOK.checked));
}

/**
 * Typical cost of an hour's labour when the business hasn't set its own rate: what an employed or
 * subcontracted tradesperson costs the business before markup (Melbourne, 2026 charge-out rates run
 * $60–90/h; award and labour-hire rates sit below that).
 */
export const DEFAULT_LABOUR_CENTS = { carpenter: 7500, labourer: 5000 } as const;

/**
 * Typical hours for common carpentry tasks, for lines the model prices itself. Derived from installer
 * timelines and published labour costs; a tradie's own experience beats these.
 */
export const LABOUR_GUIDE: { task: string; hours: number; per: string }[] = [
  { task: "Hang an internal door in an existing frame, incl. hinges and handle", hours: 2, per: "door" },
  { task: "Install a prehung internal door", hours: 2, per: "door" },
  { task: "Fit architraves, both sides of one door", hours: 1.25, per: "door" },
  { task: "Hang an external door with lock and weather seals", hours: 4, per: "door" },
  { task: "Fit skirting, standard room (incl. corners and scribing)", hours: 0.12, per: "lm" },
  { task: "Remove old skirting", hours: 0.05, per: "lm" },
  { task: "Frame a non-load-bearing stud wall, 2.4 m high", hours: 2.2, per: "lm" },
  { task: "Extra for a door or window opening in a new wall", hours: 3, per: "opening" },
  { task: "Weatherboard cladding, incl. trims", hours: 1, per: "m²" },
  { task: "Fix plasterboard (hang only)", hours: 0.25, per: "m²" },
  { task: "Pergola, freestanding timber, incl. footings", hours: 2.5, per: "m²" },
  { task: "Remove and dispose of an old timber deck", hours: 0.5, per: "m²" },
];

/** The price book as the model sees it: id, name, unit and cost, grouped by trade. */
export function priceBookForPrompt(): string {
  const trades = [...new Set(PRICE_BOOK.items.map((i) => i.trade))];
  return trades
    .map((t) => {
      const lines = PRICE_BOOK.items
        .filter((i) => i.trade === t)
        .map((i) => `- [${i.id}] ${i.name}: $${(i.costCents / 100).toFixed(2)} per ${i.unit}`);
      return `${t[0].toUpperCase()}${t.slice(1)}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

export function labourGuideForPrompt(): string {
  return LABOUR_GUIDE.map((g) => `- ${g.task}: ${g.hours} h per ${g.per}`).join("\n");
}
