import { describe, expect, it, vi } from "vitest";
import { checkModel, listModels } from "./providers";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("listModels", () => {
  it("lists Anthropic models with the key in x-api-key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ data: [{ id: "claude-sonnet-5-5" }, { id: "claude-haiku-5-5" }] }));
    const res = await listModels("anthropic", { apiKey: "sk-ant-x" }, fetchImpl);
    expect(res).toEqual({ ok: true, models: ["claude-sonnet-5-5", "claude-haiku-5-5"] });
    expect(fetchImpl.mock.calls[0][1].headers["x-api-key"]).toBe("sk-ant-x");
  });

  it("maps a 401 to a plain-English error", async () => {
    const res = await listModels("openai", { apiKey: "bad" }, vi.fn().mockResolvedValue(json({}, 401)));
    expect(res).toEqual({ ok: false, error: "The provider rejected this key. Check it and try again." });
  });

  it("requires a key for hosted providers without calling out", async () => {
    const fetchImpl = vi.fn();
    expect(await listModels("google", { apiKey: "" }, fetchImpl)).toEqual({ ok: false, error: "Enter an API key." });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps the Google key out of the URL and strips the models/ prefix", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      json({
        models: [
          { name: "models/gemini-x", supportedGenerationMethods: ["generateContent"] },
          { name: "models/embed-x", supportedGenerationMethods: ["embedContent"] },
        ],
      }),
    );
    const res = await listModels("google", { apiKey: "AIzaKEY" }, fetchImpl);
    expect(res).toEqual({ ok: true, models: ["gemini-x"] });
    expect(fetchImpl.mock.calls[0][0]).not.toContain("AIzaKEY");
  });

  it("checks the OpenRouter key before listing models", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(json({}, 401));
    const res = await listModels("openrouter", { apiKey: "sk-or-bad" }, fetchImpl);
    expect(res.ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/key");
  });

  it("uses Ollama's base URL without a key and reports when it's down", async () => {
    const ok = vi.fn().mockResolvedValue(json({ models: [{ name: "llama3:8b" }] }));
    expect(await listModels("ollama", { baseUrl: "http://box:11434/" }, ok)).toEqual({ ok: true, models: ["llama3:8b"] });
    expect(ok.mock.calls[0][0]).toBe("http://box:11434/api/tags");

    const down = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const res = await listModels("ollama", {}, down);
    expect(res).toEqual({ ok: false, error: "Couldn't reach Ollama at http://localhost:11434. Is it running?" });
  });
});

describe("checkModel", () => {
  it("accepts an available model", () => {
    expect(checkModel("claude-haiku-5-5", ["claude-haiku-5-5"])).toBeNull();
  });

  it("suggests close matches for an unavailable one", () => {
    expect(checkModel("claude-nope", ["claude-sonnet-5-5", "gpt-x"])).toBe(
      '"claude-nope" isn\'t available to this key. Try: claude-sonnet-5-5.',
    );
  });
});
