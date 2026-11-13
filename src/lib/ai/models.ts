import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import type { AiConfig } from "./config";
import { PROVIDER_INFO } from "./providers";

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI isn't set up yet. Sign in with publik or add your own key in Settings → AI.");
  }
}

/**
 * Builds the language model for the business's "smart" or "fast" tier. Calls go straight from the phone to the
 * provider; each provider allows that (Anthropic needs its browser-access header).
 */
export function languageModel(config: AiConfig, tier: "smart" | "fast"): { model: LanguageModel; modelId: string } {
  const modelId = tier === "smart" ? config.smartModel : config.fastModel;
  if (config.source === "none" || !modelId) throw new AiNotConfiguredError();
  const apiKey = config.apiKey ?? undefined;
  const baseURL = config.baseUrl ?? PROVIDER_INFO[config.provider].defaultBaseUrl;

  switch (config.provider) {
    case "publik":
      // publik API speaks the OpenAI Chat Completions dialect, with the install's key as the bearer.
      return {
        model: createOpenAICompatible({ name: "publik", baseURL: baseURL!, apiKey, supportsStructuredOutputs: true })(modelId),
        modelId,
      };
    case "anthropic":
      return {
        model: createAnthropic({ apiKey, headers: { "anthropic-dangerous-direct-browser-access": "true" } })(modelId),
        modelId,
      };
    case "openai":
      return { model: createOpenAI({ apiKey })(modelId), modelId };
    case "google":
      return { model: createGoogle({ apiKey })(modelId), modelId };
    case "openrouter":
      return { model: createOpenAICompatible({ name: "openrouter", baseURL: baseURL!, apiKey })(modelId), modelId };
    case "ollama":
      // Ollama serves an OpenAI-compatible API under /v1.
      return { model: createOpenAICompatible({ name: "ollama", baseURL: `${baseURL}/v1` })(modelId), modelId };
  }
}
