import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { formatAbn } from "@/lib/business-schema";
import { getOrg } from "@/lib/estimate/queries";
import { BusinessForm } from "./form";

export const metadata: Metadata = { title: "Business" };

export default function BusinessPage() {
  return (
    <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-[10px] bg-hover" aria-busy="true" />}>
      <Business />
    </Suspense>
  );
}

async function Business() {
  const member = await requireMember();
  const org = await getOrg(member.orgId);
  const canEdit = member.role !== "member";
  return (
    <>
      <p className="mt-6 max-w-[68ch] text-sm text-ink-3">These appear on every quote you send.</p>
      {!canEdit && <p className="mt-3 text-sm text-ink-3">Only owners and admins can change these.</p>}
      <BusinessForm
        orgId={org.id}
        canEdit={canEdit}
        initial={{
          name: org.name,
          abn: formatAbn(org.abn) ?? "",
          email: org.email ?? "",
          phone: org.phone ?? "",
          address: org.address ?? "",
          termsMd: org.termsMd ?? "",
          quoteValidDays: org.quoteValidDays,
          logoUrl: org.logoUrl,
        }}
      />
    </>
  );
}
