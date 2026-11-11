import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import type { ReactNode } from "react";

/** The top of a page: its name, one line on what it's for, and the page's main actions. */
export function PageTitle({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <Heading level={1}>{title}</Heading>
        {description && (
          <div className="mt-1">
            <Text as="p" color="secondary">
              {description}
            </Text>
          </div>
        )}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}
