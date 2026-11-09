import { describe, expect, it } from "vitest";
import { changedWords, joinSpoken, tidyLooksSafe } from "./text";

describe("joinSpoken", () => {
  it("adds after what's typed, with one space", () => {
    expect(joinSpoken("", "build a deck")).toBe("build a deck");
    expect(joinSpoken("Back deck.", " about 4 by 3 ")).toBe("Back deck. about 4 by 3");
    expect(joinSpoken("Back deck.   ", "oil finish")).toBe("Back deck. oil finish");
  });
  it("keeps a new line the person typed", () => {
    expect(joinSpoken("Deck\n", "steps to the lawn")).toBe("Deck\nsteps to the lawn");
  });
  it("leaves the text alone when nothing was heard", () => {
    expect(joinSpoken("Deck", "   ")).toBe("Deck");
  });
});

describe("changedWords", () => {
  it("lists the corrected words once", () => {
    expect(changedWords("build a mirror bow deck with age four posts", "Build a merbau deck with H4 posts.")).toEqual(["merbau", "H4"]);
  });
  it("skips numbers and units that were only written as digits", () => {
    expect(changedWords("a four by three mirror bow deck six hundred mil", "A 4 × 3 m merbau deck, 600 mm")).toEqual(["merbau"]);
  });
  it("is empty when nothing changed but punctuation and case", () => {
    expect(changedWords("replace the fence", "Replace the fence.")).toEqual([]);
  });
});

describe("tidyLooksSafe", () => {
  const heard = "replace twenty metres of one point eight metre paling fence reuse the posts";
  it("accepts small fixes", () => {
    expect(tidyLooksSafe(heard, "Replace 20 m of 1.8 m paling fence, reuse the posts.")).toBe(true);
  });
  it("refuses a rewrite or an empty answer", () => {
    expect(tidyLooksSafe(heard, "")).toBe(false);
    expect(tidyLooksSafe(heard, "Sure! Here is a detailed scope of works for your fencing project, including demolition, disposal, new posts, rails, palings, capping and a full site clean.")).toBe(false);
    expect(tidyLooksSafe(heard, "Install a new swimming pool with glass fencing around the backyard area")).toBe(false);
  });
});
