import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { getOrg } from "@/lib/estimate/queries";
import { listRates } from "@/lib/rates";
import { BusinessContextForm, MarkupForm } from "./forms";
import { RatesList } from "./rates-list";

export const metadata: Metadata = { title: "Rates and pricing" };

export default function RatesPage() {
  return (
    <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-[10px] bg-hover" aria-busy="true" />}>
      <Rates />
    </Suspense>
  );
}

async function Rates() {
  const member = await requireMember();
  const [org, rates] = await Promise.all([getOrg(member.orgId), listRates(member.orgId)]);
  const canEdit = member.role !== "member";

  return (
    <>
      <p className="mt-6 max-w-[68ch] text-sm text-ink-3">
        OpenQuote prices every line from your cost plus markup. Your own rates are used wherever they fit, and changes
        apply to new estimates only.
      </p>
      {!canEdit && <p className="mt-3 text-sm text-ink-3">Only owners and admins can change these.</p>}

      <RatesList rates={rates} canEdit={canEdit} />

      <MarkupForm
        canEdit={canEdit}
        initial={{
          defaultMarkupPct: org.defaultMarkupPct,
          markupMaterialsPct: org.markupMaterialsPct,
          markupLabourPct: org.markupLabourPct,
          markupSubbiePct: org.markupSubbiePct,
          markupOtherPct: org.markupOtherPct,
          gstRegistered: org.gstRegistered,
          gstRate: org.gstRate,
        }}
      />

      <BusinessContextForm
        canEdit={canEdit}
        initial={{ trades: org.trades.join(", "), finishLevel: org.finishLevel, postcode: org.postcode ?? "" }}
      />
    </>
  );
}
