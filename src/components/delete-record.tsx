"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { DeleteResult } from "@/app/actions/delete";
import { Button } from "@/components/ui";

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
    <section aria-label={label} className="no-print mt-12 border-t border-border pt-6">
      {asking ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1 basis-64">
            <p className="text-sm font-medium text-ink">{question}</p>
            <p className="mt-0.5 text-sm text-ink-3">{consequence} This can&apos;t be undone.</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setAsking(false)} disabled={pending}>
              Keep
            </Button>
            <Button type="button" variant="danger" onClick={confirm} disabled={pending} aria-busy={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setAsking(true)} className="-ml-2.5 text-danger hover:text-danger">
          <Trash2 className="size-3.5" aria-hidden />
          {label}
        </Button>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
