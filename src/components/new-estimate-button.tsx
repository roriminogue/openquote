import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { ArrowRight } from "lucide-react";

/** A button that opens New estimate. Client-side, so a server page can show it. */
export function NewEstimateButton({ label }: { label: string }) {
  return <Button href="/estimates/new" label={label} variant="primary" icon={<Icon icon={ArrowRight} />} />;
}
