import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { getOrg } from "@/lib/estimate/queries";
import { listRates } from "@/lib/rates";
import { BusinessContextForm, MarkupForm } from "./forms";
import { Intro } from "../parts";
import { RatesList } from "./rates-list";

export const metadata: Metadata = { title: "Rates and pricing" };

export default function RatesPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-8" aria-busy="true" aria-label="Loading">
          <Skeleton height={256} radius={4} />
        </div>
      }
    >
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
      <Intro>
        OpenQuote AU prices every line from your cost plus markup. Your own rates are used wherever they fit, and
        changes apply to new estimates only.{!canEdit && " Only owners and admins can change these."}
      </Intro>

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
