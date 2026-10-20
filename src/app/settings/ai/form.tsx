"use client";

import { useActionState, useState } from "react";
import { PROVIDER_INFO, PROVIDERS, type Provider } from "@/lib/ai/providers";
import { saveAiSettings, type SaveState } from "./actions";

type Initial = {
  provider: Provider;
  hasSavedKey: boolean;
  baseUrl: string;
  smartModel: string;
  fastModel: string;
  transcription: "off" | "openai" | "local";
};

const input = "w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950";

export function AiSettingsForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveAiSettings, { status: "idle" });
  const [provider, setProvider] = useState<Provider>(initial.provider);
  const info = PROVIDER_INFO[provider];
  // A saved key only applies to the provider it was saved for.
  const savedKeyApplies = initial.hasSavedKey && provider === initial.provider;

  return (
    <form action={action} className="mt-8 space-y-5">
      <div className="space-y-1">
        <label htmlFor="provider" className="block text-sm font-medium">
          Provider
        </label>
        <select
          id="provider"
          name="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          className={input}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_INFO[p].label}
              {PROVIDER_INFO[p].advanced ? " (advanced)" : ""}
            </option>
          ))}
        </select>
        {info.advanced && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Quality depends on the model. Pick one with good tool-use support.
          </p>
        )}
      </div>

      {info.needsKey && (
        <div className="space-y-1">
          <label htmlFor="apiKey" className="block text-sm font-medium">
            API key
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder={savedKeyApplies ? "Leave blank to keep your saved key" : info.keyHint}
            className={input}
          />
        </div>
      )}

      {info.defaultBaseUrl && (
        <div className="space-y-1">
          <label htmlFor="baseUrl" className="block text-sm font-medium">
            Base URL
          </label>
          <input
            id="baseUrl"
            name="baseUrl"
            type="url"
            defaultValue={provider === initial.provider ? initial.baseUrl : ""}
            placeholder={info.defaultBaseUrl}
            className={input}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ModelField
          name="smartModel"
          label="Smart model"
          help="Writes and edits estimates"
          placeholder={info.defaultSmartModel ?? "Save to load models"}
          defaultValue={provider === initial.provider ? initial.smartModel : ""}
        />
        <ModelField
          name="fastModel"
          label="Fast model"
          help="Classifies jobs, reads documents"
          placeholder={info.defaultFastModel ?? "Save to load models"}
          defaultValue={provider === initial.provider ? initial.fastModel : ""}
        />
      </div>
      <datalist id="models">
        {state.models?.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="space-y-1">
        <label htmlFor="transcription" className="block text-sm font-medium">
          Voice notes
        </label>
        <select id="transcription" name="transcription" defaultValue={initial.transcription} className={input}>
          <option value="off">Off (type descriptions)</option>
          <option value="openai">OpenAI Whisper (uses an OpenAI key)</option>
          <option value="local">Local whisper.cpp (self-hosted)</option>
        </select>
      </div>

      <button
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Checking key…" : "Test & save"}
      </button>

      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-sm ${state.status === "error" ? "text-red-600" : "text-green-700 dark:text-green-400"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function ModelField(props: { name: string; label: string; help: string; placeholder: string; defaultValue: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={props.name} className="block text-sm font-medium">
        {props.label}
      </label>
      <input
        id={props.name}
        name={props.name}
        list="models"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        className={input}
      />
      <p className="text-xs text-zinc-500">{props.help}</p>
    </div>
  );
}
