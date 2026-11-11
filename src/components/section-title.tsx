import { Heading } from "@astryxdesign/core/Heading";
import type { ReactNode } from "react";

/** A small grey heading over a section of a page, kept as an h2 for the outline, with an optional action. */
export function SectionTitle({ id, children, action }: { id?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div id={id}>
        <Heading level={4} accessibilityLevel={2} color="secondary">
          {children}
        </Heading>
      </div>
      {action}
    </div>
  );
}
