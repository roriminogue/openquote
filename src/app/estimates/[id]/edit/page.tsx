import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { getEstimate, markupSettings } from "@/lib/estimate/queries";
import { EstimateEditor, type EditorGroup } from "./editor";

export const metadata: Metadata = { title: "Edit estimate" };

export default function EditEstimatePage({ params }: PageProps<"/estimates/[id]/edit">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[10px] bg-hover" aria-busy="true" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<PageProps<"/estimates/[id]/edit">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const member = await requireMember();
  const data = await getEstimate(member.orgId, id);
  if (!data) notFound();
  const { estimate, org, groups } = data;

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
