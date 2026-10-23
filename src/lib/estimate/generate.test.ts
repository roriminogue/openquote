import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import type { EstimateDraft } from "./draft";
import { generateEstimateDraft } from "./generate";

const draft: EstimateDraft = {
  title: "Deck",
  summary: "A new deck.",
  scope: ["Build deck"],
  assumptions: ["Level site"],
  exclusions: ["Council permits"],
  fences: [],
  decks: [],
  groups: [
    {
      name: "Framing",
      lines: [
        { description: "Carpenter", type: "labour", qty: 8, unit: "hour", unitCost: 95, rateRuleId: "R1", priceBookId: null, notes: null },
      ],
    },
  ],
  alternatives: [{ kind: "saving", title: "Pine decking", detail: "Cheaper boards" }],
};

function mockModel(text: string) {
  // Split the JSON into small chunks to exercise partial parsing.
  const deltas = Array.from({ length: Math.ceil(text.length / 25) }, (_, i) => text.slice(i * 25, i * 25 + 25));
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t" },
          ...deltas.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
          { type: "text-end", id: "t" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: undefined },
            logprobs: undefined,
            usage: {
              inputTokens: { total: 1200, noCache: 1200, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: 800, text: 800, reasoning: undefined },
            },
          },
        ],
      }),
    }),
  });
}

describe("generateEstimateDraft", () => {
  it("streams partial objects and returns the validated draft with usage", async () => {
    const partials: unknown[] = [];
    const result = await generateEstimateDraft({
      model: mockModel(JSON.stringify(draft)),
      system: "s",
      prompt: "p",
      onPartial: (p) => partials.push(p),
    });
    expect(result.draft).toEqual(draft);
    expect(result.usage).toEqual({ inputTokens: 1200, outputTokens: 800 });
    expect(partials.length).toBeGreaterThan(1);
    expect(partials[0]).not.toEqual(draft);
  });

  it("rejects output that doesn't match the schema", async () => {
    const bad = JSON.stringify({ ...draft, fences: [{ lengthM: -5 }] });
    await expect(generateEstimateDraft({ model: mockModel(bad), system: "s", prompt: "p" })).rejects.toThrow();
  });
});
