import { Banner } from "@astryxdesign/core/Banner";
import { useActionState } from "react";
import { TextField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { createOrganisation } from "./actions";

/** The two things a new business needs before its first quote. */
export function BusinessSetupForm() {
  const [state, action] = useActionState(createOrganisation, { error: null });
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField name="name" label="Your name" size="lg" autoComplete="name" autoCapitalize="words" enterKeyHint="next" />
      <TextField
        name="business"
        label="Business name"
        size="lg"
        autoComplete="organization"
        autoCapitalize="words"
        enterKeyHint="done"
      />
      {state.error && <Banner status="error" title={state.error} />}
      <SubmitButton label="Create business" pendingLabel="Creating your business…" size="lg" width="100%" />
    </form>
  );
}
