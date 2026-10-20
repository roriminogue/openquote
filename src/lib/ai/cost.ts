// Known list prices in US$ per million tokens (input, output). Unknown models record null cost, not a guess.
const PRICES: Record<string, [number, number]> = {
  "claude-opus-5-5": [4, 20],
  "claude-sonnet-5-5": [2, 10],
  "claude-haiku-5-5": [0.1, 0.5],
};

/** Estimated cost in micro-US$ (1e-6 dollars), or null when we don't know the model's price. */
export function costMicroUsd(modelId: string, inputTokens: number, outputTokens: number): number | null {
  const price = PRICES[modelId];
  if (!price) return null;
  // $/1M tokens × tokens = micro-dollars.
  return Math.round(price[0] * inputTokens + price[1] * outputTokens);
}
