"use client";

import { useActionState, useState } from "react";
import { PROVIDER_INFO, PROVIDERS, type Provider } from "@/lib/ai/providers";
import { Button, Field, Input, Notice, Select } from "@/components/ui";
import { saveAiSettings, type SaveState } from "./actions";

type Initial = {
  provider: Provider;
  hasSavedKey: boolean;
  baseUrl: string;
  smartModel: string;
  fastModel: string;
  transcription: "off" | "openai" | "local";
};

export function AiSettingsForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveAiSettings, { status: "idle" });
  const [provider, setProvider] = useState<Provider>(initial.provider);
  const info = PROVIDER_INFO[provider];
  // A saved key only applies to the provider it was saved for.
  const savedKeyApplies = initial.hasSavedKey && provider === initial.provider;

  return (
    <form action={action} className="mt-8 space-y-6">
      <Field
        id="provider"
        label="Provider"
        hint={info.advanced ? "Quality depends on the model. Pick one with good tool-use support." : undefined}
      >
        <Select id="provider" name="provider" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {PROVIDER_INFO[p].label}
              {PROVIDER_INFO[p].advanced ? " (advanced)" : ""}
            </option>
          ))}
        </Select>
      </Field>

      {info.needsKey && (
        <Field id="apiKey" label="API key" hint={savedKeyApplies ? "Leave blank to keep your saved key." : undefined}>
          <Input
            id="apiKey"
            name="apiKey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder={savedKeyApplies ? "••••••••••••" : info.keyHint}
          />
        </Field>
      )}

      {info.defaultBaseUrl && (
        <Field id="baseUrl" label="Base URL">
          <Input
            id="baseUrl"
            name="baseUrl"
            type="url"
            defaultValue={provider === initial.provider ? initial.baseUrl : ""}
            placeholder={info.defaultBaseUrl}
          />
        </Field>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <ModelField
          name="smartModel"
          label="Smart model"
          help="Writes and edits estimates"
          placeholder={info.defaultSmartModel ?? "Save to load models…"}
          defaultValue={provider === initial.provider ? initial.smartModel : ""}
        />
        <ModelField
          name="fastModel"
          label="Fast model"
          help="Sorts jobs, reads documents"
          placeholder={info.defaultFastModel ?? "Save to load models…"}
          defaultValue={provider === initial.provider ? initial.fastModel : ""}
        />
      </div>
      <datalist id="models">
        {state.models?.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <Field id="transcription" label="Voice notes">
        <Select id="transcription" name="transcription" defaultValue={initial.transcription}>
          <option value="off">Off (type descriptions)</option>
          <option value="openai">OpenAI Whisper (uses an OpenAI key)</option>
          <option value="local">Local whisper.cpp (self-hosted)</option>
        </Select>
      </Field>

      <Button size="lg" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Checking key…" : "Test & save"}
      </Button>

      {state.message && <Notice tone={state.status === "error" ? "error" : "ok"}>{state.message}</Notice>}
    </form>
  );
}

function ModelField(props: { name: string; label: string; help: string; placeholder: string; defaultValue: string }) {
  return (
    <Field id={props.name} label={props.label} hint={props.help}>
      <Input
        id={props.name}
        name={props.name}
        list="models"
        spellCheck={false}
        autoCapitalize="off"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
      />
    </Field>
  );
}

/** Removing the key turns AI off for the whole business, so it takes a second, deliberate tap. */
export function RemoveKey({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const link = "text-[0.9375rem] font-semibold underline underline-offset-4 hover:no-underline";
  if (!confirming) {
    return (
      <button type="button" className={`${link} text-mark`} onClick={() => setConfirming(true)}>
        Remove
      </button>
    );
  }
  return (
    <form action={action} className="flex items-baseline gap-3">
      <button className={`${link} text-mark`}>Remove key and turn AI off</button>
      <button type="button" className={`${link} text-ink-2`} onClick={() => setConfirming(false)}>
        Keep
      </button>
    </form>
  );
}
