import { z } from "zod";
import { DeckSpec, FenceSpec } from "./assemblies";

// What the model returns for a Quick estimate (SPEC.md §5, Generate). Costs are AUD ex-GST *cost* to the
// business, in dollars (models are better with dollars than cents); markup and GST are applied by code later.

export const DraftLine = z.object({
  description: z.string().min(1).describe("What is supplied or done, specific enough for the client to understand"),
  type: z.enum(["material", "labour", "subbie", "other"]),
  qty: z.number().positive(),
  unit: z.string().min(1).describe("e.g. hour, m2, lm, each, bag, lot"),
  unitCost: z.number().nonnegative().describe("Cost to the business per unit in AUD ex GST, before markup"),
  rateRuleId: z
    .string()
    .nullable()
    .describe("Id of the business's rate rule this line is priced from, or null if none applies"),
  priceBookId: z
    .string()
    .nullable()
    .describe("Id of the price book item this material is priced from, or null if none matches"),
  notes: z.string().nullable().describe("Brief reasoning for quantity or price, for the tradie only"),
});

export const DraftGroup = z.object({
  name: z.string().min(1).describe("A stage of the job in the order it happens, e.g. 'Site preparation'"),
  lines: z.array(DraftLine).min(1),
});

export const EstimateDraft = z.object({
  title: z.string().min(1).describe("Short job title, e.g. 'Merbau deck 4 × 3 m'"),
  summary: z.string().describe("Two or three plain sentences for the client describing what's included"),
  scope: z.array(z.string()).describe("Scope of work as short bullet points"),
  assumptions: z.array(z.string()).describe("Assumptions the price depends on"),
  exclusions: z.array(z.string()).describe("Things not included"),
  fences: z
    .array(FenceSpec)
    .describe("Timber paling fences in the job, priced by the fence calculator. Empty if there are none"),
  decks: z.array(DeckSpec).describe("Timber or composite decks in the job, priced by the deck calculator. Empty if there are none"),
  groups: z
    .array(DraftGroup)
    .describe("Everything the calculators don't cover, by stage. Empty when the calculators cover the whole job"),
  alternatives: z
    .array(
      z.object({
        kind: z.enum(["upgrade", "saving"]),
        title: z.string(),
        detail: z.string().describe("What changes and roughly how it affects the price"),
      }),
    )
    .describe("Two or three upgrade options and two or three cost-saving options"),
});

export type EstimateDraft = z.infer<typeof EstimateDraft>;
export type DraftLine = z.infer<typeof DraftLine>;
