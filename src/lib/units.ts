// Quantities as a tradie writes them: "3 hrs", "1 hr", "36 bags", "700 ea", "12 lm", "4.5 m²".

const plural = new Intl.PluralRules("en-AU");

/** Canonical short forms. Each entry is [one, other]; one value means the unit never takes a plural. */
const UNITS: Record<string, [string, string?]> = {
  hour: ["hr", "hrs"],
  hr: ["hr", "hrs"],
  hrs: ["hr", "hrs"],
  hours: ["hr", "hrs"],
  h: ["hr", "hrs"],
  day: ["day", "days"],
  days: ["day", "days"],
  each: ["ea"],
  ea: ["ea"],
  item: ["ea"],
  unit: ["ea"],
  lot: ["lot"],
  "lump sum": ["lot"],
  ls: ["lot"],
  lm: ["lm"],
  "linear metre": ["lm"],
  "linear metres": ["lm"],
  "lineal metre": ["lm"],
  m: ["m"],
  metre: ["m"],
  metres: ["m"],
  m2: ["m²"],
  "m²": ["m²"],
  sqm: ["m²"],
  "square metre": ["m²"],
  "square metres": ["m²"],
  m3: ["m³"],
  "m³": ["m³"],
  "cubic metre": ["m³"],
  "cubic metres": ["m³"],
  kg: ["kg"],
  t: ["t"],
  tonne: ["t"],
  tonnes: ["t"],
  l: ["L"],
  litre: ["L"],
  litres: ["L"],
};

const qtyFmt = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 });

export function formatQty(qty: number) {
  return qtyFmt.format(qty);
}

/** The unit word for a quantity, abbreviated where the trade does and pluralised where English does. */
export function unitLabel(unit: string, qty: number) {
  const key = unit.trim().toLowerCase();
  const known = UNITS[key];
  const many = plural.select(qty) !== "one";
  if (known) return many && known[1] ? known[1] : known[0];
  // Unknown words: pluralise simple nouns ("bag" → "bags"), leave anything already plural or abbreviated alone.
  if (!many || /[^a-z\s]/i.test(key) || /s$/i.test(key) || key.length <= 2) return unit.trim();
  return /(ch|sh|x)$/i.test(key) ? `${unit.trim()}es` : `${unit.trim()}s`;
}

export function formatQtyUnit(qty: number, unit: string) {
  return `${formatQty(qty)} ${unitLabel(unit, qty)}`;
}

/**
 * Keeps a number with its unit ("1.8 m", "600 mm", "20 m²", "3 hrs") and with a "×" next to it, so a title never
 * breaks between them: those spaces become non-breaking. For titles and other text shown as written.
 */
export function keepUnits(text: string) {
  return text
    .replace(/(\d)\s+(?=(?:mm|cm|m²|m³|m2|m3|m|lm|kg|L|hrs?|h|ea|sheets?|bags?|packs?)(?![\p{L}]))/gu, "$1 ")
    .replace(/×\s+(?=\d)/g, "× ");
}
