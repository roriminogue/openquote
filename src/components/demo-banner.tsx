import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useState } from "react";
import { leaveDemo } from "@/lib/demo";
import { navigateTo } from "@/lib/navigation";

/** On Estimates in demo mode: says it's sample data, and starts fresh with the person's own business. */
export function DemoBanner() {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-6">
      <Banner
        status="info"
        title="These are sample quotes"
        description="A made-up business, so you can look around. Open a job to see the breakdown and the quote the client gets. To price your own jobs, start with your business and add an AI key."
        endContent={
          <Button
            label={busy ? "Clearing…" : "Start with my business"}
            variant="primary"
            size="sm"
            isDisabled={busy}
            onClick={async () => {
              if (!confirm("Clear the sample quotes and set up your own business?")) return;
              setBusy(true);
              await leaveDemo();
              navigateTo("/onboarding", { replace: true });
            }}
          />
        }
      />
    </div>
  );
}
