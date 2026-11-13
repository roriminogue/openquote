import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Text } from "@astryxdesign/core/Text";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/lib/navigation";
import { useState, useTransition } from "react";
import type { DeleteResult } from "@/app/actions/delete";

/**
 * A quiet "Delete …" control at the foot of a record page. The first tap asks in place (no pop-up dialog): what
 * happens, then Delete or Keep. On success it goes back to the list.
 */
export function DeleteRecord({
  label,
  question,
  consequence,
  action,
  then,
}: {
  /** "Delete estimate" */
  label: string;
  /** "Delete EST-1010?" */
  question: string;
  /** What goes with it, in one sentence. */
  consequence: string;
  action: () => Promise<DeleteResult>;
  /** Where to go afterwards, e.g. "/estimates". */
  then: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function confirm() {
    setError(null);
    start(async () => {
      const res = await action().catch(() => ({ ok: false, error: "That didn't work. Try again." }) as const);
      if (!res.ok) return setError(res.error);
      router.push(then);
      router.refresh();
    });
  }

  return (
    <section aria-label={label} className="no-print mt-12 border-t border-(--color-border) pt-6">
      {asking ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1 basis-64">
            <Text as="p" weight="medium">
              {question}
            </Text>
            <div className="mt-0.5">
              <Text as="p" type="supporting">
                {consequence} This can&apos;t be undone.
              </Text>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <Button label="Keep" onClick={() => setAsking(false)} isDisabled={pending} width="100%" />
            <Button
              label={pending ? "Deleting…" : "Delete"}
              variant="destructive"
              onClick={confirm}
              isLoading={pending}
              width="100%"
            />
          </div>
        </div>
      ) : (
        <div className="-ml-2.5">
          <Button
            label={label}
            variant="ghost"
            icon={<Icon icon={Trash2} color="error" />}
            onClick={() => setAsking(true)}
          />
        </div>
      )}
      {error && (
        <div className="mt-3">
          <Banner status="error" title={error} />
        </div>
      )}
    </section>
  );
}
