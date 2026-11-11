"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { InputGroup, InputGroupText } from "@astryxdesign/core/InputGroup";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { ImageUp, Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { TextField } from "@/components/fields";
import { DEFAULT_TERMS } from "@/lib/business-schema";
import { createClient } from "@/lib/supabase/client";
import { FormFooter } from "../form-footer";
import { Fields, SettingsSection } from "../parts";
import { saveBusiness, setLogo, type BusinessState } from "./actions";

export type BusinessDetails = {
  name: string;
  abn: string;
  email: string;
  phone: string;
  address: string;
  termsMd: string;
  quoteValidDays: number;
  logoUrl: string | null;
};

/** Upload goes straight from the browser to Supabase Storage (logos/<orgId>/…); the server only records the URL. */
function LogoPicker({ orgId, initial, canEdit }: { orgId: string; initial: string | null; canEdit: boolean }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      return setError("Use a PNG, JPG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return setError("Use an image under 2 MB.");
    setBusy(true);
    const supabase = createClient();
    const path = `${orgId}/logo-${Date.now()}.${file.type.split("/")[1]}`;
    const { error: upErr } = await supabase.storage
      .from("logos")
      .upload(path, file, { cacheControl: "31536000", upsert: false });
    if (upErr) {
      setBusy(false);
      return setError("The upload didn't work. Check your connection and try again.");
    }
    const publicUrl = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
    const res = await setLogo(publicUrl);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Couldn't save the logo.");
    setUrl(publicUrl);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Text as="p" display="block" type="label" color="secondary" weight="medium">
          Logo
        </Text>
        <Text as="p" display="block" type="supporting">
          Shown at the top of every quote. PNG, JPG or WebP, under 2 MB.
        </Text>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-16 w-32 items-center justify-center overflow-hidden rounded-(--radius-element) border border-dashed border-(--color-border-emphasized) bg-(--color-background-muted)">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo from Supabase Storage
            <img src={url} alt="Your logo" className="max-h-14 max-w-28 object-contain" />
          ) : (
            <Text type="supporting">No logo</Text>
          )}
        </span>
        {canEdit && (
          <span className="flex items-center gap-2">
            <input
              ref={input}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
            <Button
              label={busy ? "Uploading…" : url ? "Change" : "Upload logo"}
              icon={<Icon icon={ImageUp} />}
              isLoading={busy}
              onClick={() => input.current?.click()}
            />
            {url && (
              <IconButton
                label="Remove logo"
                variant="ghost"
                icon={<Icon icon={Trash2} />}
                isDisabled={busy}
                onClick={async () => {
                  const res = await setLogo(null);
                  if (res.ok) setUrl(null);
                }}
              />
            )}
          </span>
        )}
      </div>
      {error && <Banner status="error" title={error} />}
    </div>
  );
}

export function BusinessForm({
  orgId,
  initial,
  canEdit,
}: {
  orgId: string;
  initial: BusinessDetails;
  canEdit: boolean;
}) {
  const [state, action] = useActionState<BusinessState, FormData>(saveBusiness, { status: "idle" });
  const [terms, setTerms] = useState(initial.termsMd);
  const bad = (f: string) => (state.field === f ? ({ type: "error" } as const) : undefined);
  const off = !canEdit;

  return (
    <>
      <SettingsSection id="brand" title="On your quotes">
        <LogoPicker orgId={orgId} initial={initial.logoUrl} canEdit={canEdit} />
      </SettingsSection>
      <form action={action} noValidate>
        <SettingsSection id="details" title="Business details">
          <Fields>
            <TextField
              name="name"
              label="Business name"
              defaultValue={initial.name}
              isDisabled={off}
              status={bad("name")}
              autoComplete="organization"
              autoCapitalize="words"
            />
            <TextField
              name="abn"
              label="ABN"
              description="Shown on quotes and invoices."
              defaultValue={initial.abn}
              inputMode="numeric"
              placeholder="12 345 678 901"
              isOptional
              isDisabled={off}
              status={bad("abn")}
            />
            <TextField
              name="email"
              type="email"
              label="Email"
              description="Where clients can reach you."
              defaultValue={initial.email}
              isOptional
              isDisabled={off}
              status={bad("email")}
              autoComplete="email"
            />
            <TextField
              name="phone"
              type="tel"
              label="Phone"
              defaultValue={initial.phone}
              isOptional
              isDisabled={off}
              autoComplete="tel"
              placeholder="04…"
            />
            <TextField
              name="address"
              label="Address"
              description="Shown under your business name."
              defaultValue={initial.address}
              isOptional
              isDisabled={off}
              autoComplete="street-address"
            />
          </Fields>
        </SettingsSection>

        <SettingsSection id="terms" title="Quote terms">
          <Fields>
            <div className="max-w-56">
              <InputGroup
                label="Quotes are valid for"
                description="Clients see a valid-until date."
                isDisabled={off}
                status={bad("quoteValidDays")}
              >
                <TextField
                  name="quoteValidDays"
                  label="Days"
                  inputMode="numeric"
                  defaultValue={String(initial.quoteValidDays)}
                />
                <InputGroupText>days</InputGroupText>
              </InputGroup>
            </div>
            <TextArea
              label="Terms and conditions"
              description="Printed at the end of every quote. Plain text; new lines are kept."
              htmlName="termsMd"
              rows={6}
              value={terms}
              onChange={setTerms}
              placeholder={DEFAULT_TERMS}
              isDisabled={off}
              status={bad("termsMd")}
              width="100%"
            />
          </Fields>
          {canEdit && <FormFooter message={state.message} error={state.status === "error"} />}
        </SettingsSection>
      </form>
    </>
  );
}
