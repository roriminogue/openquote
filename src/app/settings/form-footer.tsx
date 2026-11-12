import { Banner } from "@astryxdesign/core/Banner";
import { SubmitButton } from "@/components/submit-button";

/**
 * The foot of a settings form: what happened after the last save, then Save. Full width on a phone. The button
 * locks while the form sends, so nothing saves twice.
 */
export function FormFooter({
  message,
  error,
  label = "Save",
  pendingLabel = "Saving…",
}: {
  message?: string;
  error?: boolean;
  label?: string;
  pendingLabel?: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-dashed border-(--color-border) pt-5 sm:flex-row sm:items-center sm:justify-end">
      {message && (
        <div className="min-w-0 sm:mr-auto" aria-live="polite">
          <Banner status={error ? "error" : "success"} title={message} />
        </div>
      )}
      <div className="sm:shrink-0">
        <SubmitButton label={label} pendingLabel={pendingLabel} variant="primary" width="100%" />
      </div>
    </div>
  );
}
