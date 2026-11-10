import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { TextField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { createOrganisation } from "./actions";

/** The two things a new business needs before its first quote. */
export function BusinessSetupForm({ error }: { error?: string | null }) {
  return (
    <form action={createOrganisation} className="flex flex-col gap-4">
      <TextField name="name" label="Your name" size="lg" autoComplete="name" autoCapitalize="words" enterKeyHint="next" />
      <TextField
        name="business"
        label="Business name"
        size="lg"
        autoComplete="organization"
        autoCapitalize="words"
        enterKeyHint="done"
      />
      {error && <Banner status="error" title={error} />}
      <SubmitButton label="Create business" pendingLabel="Creating your business…" size="lg" width="100%" />
    </form>
  );
}

/** Shown when this install is not taking new businesses: why, and a way back out. */
export function SignupsClosed({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Banner status="info" title={reason} />
      {/* Signing out is a POST, so a link someone pastes or a page that prefetches can never sign you out. */}
      <form action="/auth/signout" method="post">
        <Button type="submit" label="Sign out" variant="secondary" size="lg" width="100%" />
      </form>
    </div>
  );
}
