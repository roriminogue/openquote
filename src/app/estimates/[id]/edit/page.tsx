import { Skeleton } from "@astryxdesign/core/Skeleton";
import { notFound, redirect } from "@/lib/navigation";
import { Suspense } from "react";
import { useParams } from "react-router";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { getEstimate, markupSettings } from "@/lib/estimate/queries";
import { EstimateEditor, type EditorGroup } from "./editor";

export default function EditEstimatePage() {
  return (
    <Suspense
      fallback={
        <div aria-busy="true" aria-label="Loading estimate">
          <Skeleton height={256} radius={4} />
        </div>
      }
    >
      <Editor />
    </Suspense>
  );
}

function Editor() {
  const id = useParams().id ?? "";
  const data = useQuery(`estimate-edit:${id}`, async () => getEstimate((await requireMember()).orgId, id));
  if (!data) notFound();
  const { estimate, org, groups } = data;
  // Accepted quotes are locked.
  if (estimate.status === "accepted") redirect(`/estimates/${estimate.id}`);

  const initial: EditorGroup[] = groups.map((g) => ({
    name: g.name,
    lines: g.lines.map((l) => ({
      description: l.description,
      type: l.type,
      qty: l.qty,
      unit: l.unit,
      unitCostCents: l.unitCostCents,
      // Only a line's own override is editable; the rest follow the business or estimate markup.
      markupPct: l.markupPct !== l.defaultMarkupPct ? l.markupPct : null,
      notes: l.notes,
      source: l.source,
      sourceRef: l.sourceRef,
    })),
  }));

  return (
    <EstimateEditor
      estimateId={estimate.id}
      number={estimate.number}
      initialTitle={estimate.title}
      initialGroups={initial}
      markup={markupSettings(org)}
      estimateMarkupPct={estimate.markupPct}
      gstRatePct={org.gstRegistered && !estimate.gstExempt ? org.gstRate : 0}
    />
  );
}
