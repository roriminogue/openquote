import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { useActionState, useState } from "react";
import { TextField } from "@/components/fields";
import { SubmitButton } from "@/components/submit-button";
import { createOrganisation, startDemo } from "./actions";

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
      <TryDemo />
    </form>
  );
}

/** Just looking? A made-up business with priced jobs, no setup or AI key needed (lib/demo.ts). */
function TryDemo() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-(--color-border) pt-5">
      <Text as="p" display="block" type="supporting">
        Just having a look? See it with a sample business and four priced jobs. No setup or AI key needed.
      </Text>
      <Button
        label={busy ? "Loading sample quotes…" : "Try it with sample quotes"}
        variant="secondary"
        size="lg"
        width="100%"
        isLoading={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await startDemo();
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
