// Provider catalogue (SPEC.md §7a). Publik is the default: the person signs in with publik and pays publik per use,
// with no key to paste. The rest are bring-your-own-key. No SDKs here: checking a key only needs each provider's
// free "list models" endpoint, which also tells us which model ids the key can use.

export const PROVIDERS = ["publik", "anthropic", "openai", "google", "openrouter", "ollama"] as const;
export type Provider = (typeof PROVIDERS)[number];

type ProviderInfo = {
  label: string;
  needsKey: boolean;
  defaultBaseUrl?: string;
  /** Model defaults; null means the user must choose from the provider's list. */
  defaultSmartModel: string | null;
  defaultFastModel: string | null;
  keyHint: string;
  advanced?: boolean;
};

export const PUBLIK_BASE_URL = "https://publikhq.com/api/v1";

export const PROVIDER_INFO: Record<Provider, ProviderInfo> = {
  publik: {
    label: "Publik",
    needsKey: false,
    defaultBaseUrl: PUBLIK_BASE_URL,
    // Publik picks the model behind each tier; never send it a vendor model name.
    defaultSmartModel: "publik-smart",
    defaultFastModel: "publik-fast",
    keyHint: "",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    needsKey: true,
    defaultSmartModel: "claude-sonnet-5-5",
    defaultFastModel: "claude-haiku-5-5",
    keyHint: "sk-ant-…",
  },
  openai: {
    label: "OpenAI",
    needsKey: true,
    defaultSmartModel: null,
    defaultFastModel: null,
    keyHint: "sk-…",
  },
  google: {
    label: "Google (Gemini)",
    needsKey: true,
    defaultSmartModel: null,
    defaultFastModel: null,
    keyHint: "AIza…",
  },
  openrouter: {
    label: "OpenRouter",
    needsKey: true,
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultSmartModel: null,
    defaultFastModel: null,
    keyHint: "sk-or-…",
    advanced: true,
  },
  ollama: {
    label: "Ollama (local)",
    needsKey: false,
    defaultBaseUrl: "http://localhost:11434",
    defaultSmartModel: null,
    defaultFastModel: null,
    keyHint: "",
    advanced: true,
  },
};

/** Where the app calls a provider. Ollama can be on another computer on the same Wi-Fi (Settings → AI). */
export function providerBaseUrl(provider: Provider, saved?: string | null): string | null {
  if (provider === "ollama") return (saved?.trim() || PROVIDER_INFO.ollama.defaultBaseUrl!).replace(/\/+$/, "");
  return PROVIDER_INFO[provider].defaultBaseUrl ?? null;
}

export function isProvider(value: unknown): value is Provider {
  return typeof value === "string" && (PROVIDERS as readonly string[]).includes(value);
}

export type ListModelsResult = { ok: true; models: string[] } | { ok: false; error: string };

type Fetch = typeof fetch;

/** Lists the models a key can use. Doubles as the key check: costs nothing and needs no SDK. */
export async function listModels(
  provider: Provider,
  { apiKey, baseUrl }: { apiKey?: string | null; baseUrl?: string | null },
  fetchImpl: Fetch = fetch,
): Promise<ListModelsResult> {
  const info = PROVIDER_INFO[provider];
  if (info.needsKey && !apiKey) return { ok: false, error: "Enter an API key." };
  const base = (baseUrl || info.defaultBaseUrl || "").replace(/\/+$/, "");

  try {
    switch (provider) {
      case "publik":
        return { ok: true, models: [PROVIDER_INFO.publik.defaultSmartModel!, "publik-balanced", PROVIDER_INFO.publik.defaultFastModel!] };
      case "anthropic": {
        const res = await fetchImpl("https://api.anthropic.com/v1/models?limit=1000", {
          headers: { "x-api-key": apiKey!, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        });
        if (!res.ok) return { ok: false, error: await describeError(res) };
        const body = (await res.json()) as { data: { id: string }[] };
        return { ok: true, models: body.data.map((m) => m.id) };
      }
      case "openai": {
        const res = await fetchImpl("https://api.openai.com/v1/models", {
          headers: { authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return { ok: false, error: await describeError(res) };
        const body = (await res.json()) as { data: { id: string }[] };
        return { ok: true, models: body.data.map((m) => m.id).sort() };
      }
      case "google": {
        // Key goes in a header, not the URL, so it never lands in access logs.
        const res = await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000", {
          headers: { "x-goog-api-key": apiKey! },
        });
        if (!res.ok) return { ok: false, error: await describeError(res) };
        const body = (await res.json()) as { models: { name: string; supportedGenerationMethods?: string[] }[] };
        return {
          ok: true,
          models: body.models
            .filter((m) => m.supportedGenerationMethods?.includes("generateContent") ?? true)
            .map((m) => m.name.replace(/^models\//, "")),
        };
      }
      case "openrouter": {
        // /models is public, so check the key separately.
        const keyRes = await fetchImpl(`${base}/key`, { headers: { authorization: `Bearer ${apiKey}` } });
        if (!keyRes.ok) return { ok: false, error: await describeError(keyRes) };
        const res = await fetchImpl(`${base}/models`);
        if (!res.ok) return { ok: false, error: await describeError(res) };
        const body = (await res.json()) as { data: { id: string }[] };
        return { ok: true, models: body.data.map((m) => m.id).sort() };
      }
      case "ollama": {
        const res = await fetchImpl(`${base}/api/tags`);
        if (!res.ok) return { ok: false, error: await describeError(res) };
        const body = (await res.json()) as { models: { name: string }[] };
        return { ok: true, models: body.models.map((m) => m.name) };
      }
    }
  } catch {
    return {
      ok: false,
      error: provider === "ollama" ? `Couldn't reach Ollama at ${base}. Is it running?` : "Couldn't reach the provider. Try again.",
    };
  }
}

async function describeError(res: Response): Promise<string> {
  if (res.status === 401 || res.status === 403) return "The provider rejected this key. Check it and try again.";
  if (res.status === 402) return "This account has no credit. Add billing with the provider.";
  if (res.status === 429) return "The provider is rate limiting this key. Wait a moment and try again.";
  return `The provider returned an error (HTTP ${res.status}).`;
}

/** Explains why a chosen model can't be used, or returns null when it's available. */
export function checkModel(model: string, available: string[]): string | null {
  if (available.includes(model)) return null;
  const close = available.filter((m) => m.includes(model.split(/[-:/]/)[0])).slice(0, 3);
  return `"${model}" isn't available to this key${close.length ? `. Try: ${close.join(", ")}` : ""}.`;
}
