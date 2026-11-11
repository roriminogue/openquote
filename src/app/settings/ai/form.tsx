"use client";

import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useActionState, useState } from "react";
import { TextField } from "@/components/fields";
import { PROVIDER_INFO, PROVIDERS, type Provider } from "@/lib/ai/providers";
import { FormFooter } from "../form-footer";
import { Fields, SettingsSection } from "../parts";
import { saveAiSettings, type SaveState } from "./actions";

type Initial = {
  provider: Provider;
  hasSavedKey: boolean;
  smartModel: string;
  fastModel: string;
  transcription: "off" | "openai" | "local";
};

const PROVIDER_OPTIONS = PROVIDERS.map((p) => ({
  value: p,
  label: `${PROVIDER_INFO[p].label}${PROVIDER_INFO[p].advanced ? " (advanced)" : ""}`,
}));

export function AiSettingsForm({ initial }: { initial: Initial }) {
  const [state, action] = useActionState<SaveState, FormData>(saveAiSettings, { status: "idle" });
  const [provider, setProvider] = useState<Provider>(initial.provider);
  const [apiKey, setApiKey] = useState("");
  const info = PROVIDER_INFO[provider];
  // A saved key only applies to the provider it was saved for.
  const savedKeyApplies = initial.hasSavedKey && provider === initial.provider;
  const same = provider === initial.provider;

  return (
    <form action={action} noValidate>
      <SettingsSection id="change" title="Provider and key">
        <Fields>
          <Selector
            label="Provider"
            description={
              info.advanced
                ? "Quality depends on the model. Pick one with good tool-use support."
                : "Who runs the AI. You pay them directly."
            }
            htmlName="provider"
            options={PROVIDER_OPTIONS}
            value={provider}
            onChange={(p) => setProvider(p as Provider)}
            presentation="adaptive"
            width="100%"
          />

          {info.needsKey && (
            <TextInput
              id="apiKey"
              type="password"
              label="API key"
              description={savedKeyApplies ? "Leave blank to keep your saved key." : "From your provider’s console."}
              htmlName="apiKey"
              value={apiKey}
              onChange={setApiKey}
              autoComplete="off"
              hasSpellCheck={false}
              placeholder={savedKeyApplies ? "••••••••••••" : info.keyHint}
              width="100%"
            />
          )}

          {provider === "ollama" && (
            <div>
              <Text as="p" display="block" type="label" color="secondary" weight="medium">
                Ollama address
              </Text>
              <Text as="p" display="block" type="supporting">
                {info.defaultBaseUrl} unless whoever runs this OpenQuote AU has changed it with OLLAMA_BASE_URL.
              </Text>
            </div>
          )}

          {/* Remount when the provider changes, so each provider starts from its own saved model. */}
          <TextField
            key={`smart-${provider}`}
            name="smartModel"
            label="Smart model"
            description="Writes and edits estimates."
            defaultValue={same ? initial.smartModel : ""}
            placeholder={info.defaultSmartModel ?? "Save to load models…"}
            hasSpellCheck={false}
            autoCapitalize="none"
            {...{ list: "models" }}
          />
          <TextField
            key={`fast-${provider}`}
            name="fastModel"
            label="Fast model"
            description="Tidies up spoken job descriptions (trade words, measurements)."
            defaultValue={same ? initial.fastModel : ""}
            placeholder={info.defaultFastModel ?? "Save to load models…"}
            hasSpellCheck={false}
            autoCapitalize="none"
            {...{ list: "models" }}
          />

          <div>
            <Text as="p" display="block" type="label" color="secondary" weight="medium">
              Talk
            </Text>
            <Text as="p" display="block" type="supporting">
              Nothing to set up. Talk uses your phone or browser&apos;s own speech recognition, then the fast model
              above fixes misheard trade words.
            </Text>
          </div>
        </Fields>
        <datalist id="models">
          {state.models?.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <FormFooter
          message={state.message}
          error={state.status === "error"}
          label="Test and save"
          pendingLabel="Checking key…"
        />
      </SettingsSection>
    </form>
  );
}

/** Removing the key turns AI off for the whole business, so it takes a second, deliberate tap. */
export function RemoveKey({ action }: { action: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return <Button label="Remove key" variant="ghost" size="sm" onClick={() => setConfirming(true)} />;
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <Text as="p" display="block" type="supporting">
        AI stops working for everyone in your business until a new key is saved.
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button label="Keep" size="sm" onClick={() => setConfirming(false)} />
        <Button type="submit" label="Remove key and turn AI off" variant="destructive" size="sm" />
      </div>
    </form>
  );
}
