"use client";

import { useActionState, useState } from "react";
import { PROVIDER_INFO, PROVIDERS, type Provider } from "@/lib/ai/providers";
import { Button, Input, Notice, Panel, Row, Rows, Select } from "@/components/ui";
import { saveAiSettings, type SaveState } from "./actions";

type Initial = {
  provider: Provider;
  hasSavedKey: boolean;
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
    <form action={action}>
      <Panel>
        <Rows>
          <Row
            label="Provider"
            htmlFor="provider"
            hint={info.advanced ? "Quality depends on the model. Pick one with good tool-use support." : "Who runs the AI. You pay them directly."}
          >
            <Select id="provider" name="provider" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_INFO[p].label}
                  {PROVIDER_INFO[p].advanced ? " (advanced)" : ""}
                </option>
              ))}
            </Select>
          </Row>

          {info.needsKey && (
            <Row label="API key" htmlFor="apiKey" hint={savedKeyApplies ? "Leave blank to keep your saved key." : "From your provider’s console."}>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={savedKeyApplies ? "••••••••••••" : info.keyHint}
              />
            </Row>
          )}

          {provider === "ollama" && (
            <Row label="Ollama address" hint="Set by whoever runs this OpenQuote AU, with OLLAMA_BASE_URL.">
              <p className="text-sm text-ink-2">{info.defaultBaseUrl} unless they&apos;ve changed it.</p>
            </Row>
          )}

          <ModelField
            name="smartModel"
            label="Smart model"
            help="Writes and edits estimates."
            placeholder={info.defaultSmartModel ?? "Save to load models…"}
            defaultValue={provider === initial.provider ? initial.smartModel : ""}
          />
          <ModelField
            name="fastModel"
            label="Fast model"
            help="Tidies up spoken job descriptions (trade words, measurements)."
            placeholder={info.defaultFastModel ?? "Save to load models…"}
            defaultValue={provider === initial.provider ? initial.fastModel : ""}
          />

          <Row label="Talk" hint="Nothing to set up.">
            <p className="text-sm text-ink-2">
              Talk uses your phone or browser&apos;s own speech recognition, then the fast model above fixes misheard trade
              words.
            </p>
          </Row>
        </Rows>
        <datalist id="models">
          {state.models?.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dashed border-border px-4 py-4 sm:px-5">
          {state.message && (
            <div className="mr-auto min-w-0">
              <Notice tone={state.status === "error" ? "error" : "ok"}>{state.message}</Notice>
            </div>
          )}
          <Button className="max-sm:w-full" disabled={pending}>
            {pending ? "Checking key…" : "Test and save"}
          </Button>
        </div>
      </Panel>
    </form>
  );
}

function ModelField(props: { name: string; label: string; help: string; placeholder: string; defaultValue: string }) {
  return (
    <Row label={props.label} htmlFor={props.name} hint={props.help}>
      <Input
        id={props.name}
        name={props.name}
        list="models"
        spellCheck={false}
        autoCapitalize="off"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
      />
    </Row>
  );
}

/** Removing the key turns AI off for the whole business, so it takes a second, deliberate tap. */
export function RemoveKey({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const link = "text-sm font-medium underline underline-offset-4 hover:no-underline";
  if (!confirming) {
    return (
      <button type="button" className={`${link} text-danger`} onClick={() => setConfirming(true)}>
        Remove
      </button>
    );
  }
  return (
    <form action={action} className="flex items-baseline gap-3">
      <button className={`${link} text-danger`}>Remove key and turn AI off</button>
      <button type="button" className={`${link} text-ink-2`} onClick={() => setConfirming(false)}>
        Keep
      </button>
    </form>
  );
}
