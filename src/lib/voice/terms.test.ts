import { describe, expect, it } from "vitest";
import { cleanTidyReply, tidyPrompt } from "./tidy";
import { TRADE_TERMS, voiceHints } from "./terms";

describe("voiceHints", () => {
  it("puts the business's rate names first and skips repeats and long titles", () => {
    const hints = voiceHints(["Merbau", "Labour (carpenter)", "Supply and install 1.8 m lap and cap timber paling fence per metre"]);
    expect(hints[0]).toBe("Merbau");
    expect(hints[1]).toBe("Labour (carpenter)");
    expect(hints.filter((h) => h.toLowerCase() === "merbau")).toHaveLength(1);
    expect(hints.some((h) => h.startsWith("Supply and install"))).toBe(false);
  });
  it("stays within what recognisers accept", () => {
    expect(voiceHints(Array.from({ length: 300 }, (_, i) => `Rate ${i}`)).length).toBe(100);
    expect(voiceHints([]).length).toBe(TRADE_TERMS.length);
  });
});

describe("tidy prompt", () => {
  it("gives the vocabulary and the heard text", () => {
    const p = tidyPrompt("  build a mirror bow deck ", ["merbau", "joists"]);
    expect(p).toContain("merbau, joists");
    expect(p.endsWith("build a mirror bow deck")).toBe(true);
  });
  it("strips labels and quotes from the reply", () => {
    expect(cleanTidyReply('Corrected text: "Build a merbau deck."')).toBe("Build a merbau deck.");
    expect(cleanTidyReply("Build a merbau deck.")).toBe("Build a merbau deck.");
  });
});
