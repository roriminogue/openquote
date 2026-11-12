import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { ArrowLeft } from "lucide-react";

/** "← Estimates" above a record: back to the list it came from. Hidden when printing. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="no-print -ml-2.5">
      <Button href={href} label={label} variant="ghost" size="sm" icon={<Icon icon={ArrowLeft} />} />
    </div>
  );
}
