import { Badge } from "@astryxdesign/core/Badge";
import type { ReactNode } from "react";
import { PageTitle } from "./page-title";

// Small shared pieces for the Projects and Clients pages.

export { FilterTabs } from "./filter-tabs";
export { SearchBox } from "./search-box";

export const STATUS_LABEL: Record<string, string> = {
  quoting: "Quoting",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Project status as a small badge. Orange marks work still being priced; everything else stays grey. */
export function StatusPill({ status }: { status: string }) {
  return <Badge variant={status === "quoting" ? "orange" : "neutral"} label={STATUS_LABEL[status] ?? status} />;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return <PageTitle title={title} description={description} action={action} />;
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
