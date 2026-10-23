"use client";

import { ImageUp, Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { Button, GroupTitle, Input, Notice, Panel, Row, Rows, Textarea } from "@/components/ui";
import { DEFAULT_TERMS } from "@/lib/business-schema";
import { createClient } from "@/lib/supabase/client";
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
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError("Use a PNG, JPG or WebP image.");
    if (file.size > 2 * 1024 * 1024) return setError("Use an image under 2 MB.");
    setBusy(true);
    const supabase = createClient();
    const path = `${orgId}/logo-${Date.now()}.${file.type.split("/")[1]}`;
    const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { cacheControl: "31536000", upsert: false });
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
    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
      <span className="flex h-14 w-28 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border-strong bg-surface">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded logo from Supabase Storage
          <img src={url} alt="Your logo" className="max-h-12 max-w-24 object-contain" />
        ) : (
          <span className="text-xs text-ink-3">No logo</span>
        )}
      </span>
      {canEdit && (
        <span className="flex gap-2">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            <ImageUp className="size-3.5" aria-hidden />
            {busy ? "Uploading…" : url ? "Change" : "Upload logo"}
          </Button>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={async () => {
                const res = await setLogo(null);
                if (res.ok) setUrl(null);
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
              <span className="sr-only">Remove logo</span>
            </Button>
          )}
        </span>
      )}
      {error && (
        <span className="basis-full">
          <Notice tone="error">{error}</Notice>
        </span>
      )}
    </div>
  );
}

export function BusinessForm({ orgId, initial, canEdit }: { orgId: string; initial: BusinessDetails; canEdit: boolean }) {
  const [state, action, pending] = useActionState<BusinessState, FormData>(saveBusiness, { status: "idle" });
  const bad = (f: string) => (state.field === f ? true : undefined);
  return (
    <>
      <section aria-labelledby="brand" className="mt-8">
        <GroupTitle id="brand">On your quotes</GroupTitle>
        <Panel>
          <Rows>
            <Row label="Logo" hint="Shown at the top of every quote. PNG, JPG or WebP, under 2 MB.">
              <LogoPicker orgId={orgId} initial={initial.logoUrl} canEdit={canEdit} />
            </Row>
          </Rows>
        </Panel>
      </section>
      <form action={action}>
        <section aria-labelledby="details" className="mt-10">
          <GroupTitle id="details">Business details</GroupTitle>
          <Panel>
            <Rows>
              <Row label="Business name" htmlFor="name">
                <Input id="name" name="name" defaultValue={initial.name} required disabled={!canEdit} aria-invalid={bad("name")} autoComplete="organization" />
              </Row>
              <Row label="ABN" htmlFor="abn" hint="Shown on quotes and invoices.">
                <Input id="abn" name="abn" defaultValue={initial.abn} inputMode="numeric" placeholder="12 345 678 901" disabled={!canEdit} aria-invalid={bad("abn")} className="figures" />
              </Row>
              <Row label="Email" htmlFor="email" hint="Where clients can reach you.">
                <Input id="email" name="email" type="email" defaultValue={initial.email} disabled={!canEdit} aria-invalid={bad("email")} autoComplete="email" />
              </Row>
              <Row label="Phone" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" defaultValue={initial.phone} disabled={!canEdit} autoComplete="tel" placeholder="04…" />
              </Row>
              <Row label="Address" htmlFor="address" hint="Optional. Shown under your business name.">
                <Input id="address" name="address" defaultValue={initial.address} disabled={!canEdit} autoComplete="street-address" />
              </Row>
            </Rows>
          </Panel>
        </section>

        <section aria-labelledby="terms" className="mt-10">
          <GroupTitle id="terms">Quote terms</GroupTitle>
          <Panel>
            <Rows>
              <Row label="Quotes are valid for" htmlFor="quoteValidDays" hint="Clients see a valid-until date.">
                <span className="flex items-center gap-2 sm:w-40">
                  <Input
                    id="quoteValidDays"
                    name="quoteValidDays"
                    inputMode="numeric"
                    defaultValue={String(initial.quoteValidDays)}
                    disabled={!canEdit}
                    aria-invalid={bad("quoteValidDays")}
                    className="figures text-right"
                  />
                  <span className="text-sm text-ink-3">days</span>
                </span>
              </Row>
              <Row label="Terms and conditions" htmlFor="termsMd" hint="Printed at the end of every quote. Plain text; new lines are kept." stack>
                <Textarea
                  id="termsMd"
                  name="termsMd"
                  rows={6}
                  defaultValue={initial.termsMd}
                  placeholder={DEFAULT_TERMS}
                  disabled={!canEdit}
                  aria-invalid={bad("termsMd")}
                />
              </Row>
            </Rows>
            {canEdit && (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dashed border-border px-4 py-4 sm:px-5">
                {state.message && (
                  <div className="mr-auto min-w-0" aria-live="polite">
                    <Notice tone={state.status === "error" ? "error" : "ok"}>{state.message}</Notice>
                  </div>
                )}
                <Button className="max-sm:w-full" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
          </Panel>
        </section>
      </form>
    </>
  );
}
