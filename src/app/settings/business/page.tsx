import { Skeleton } from "@astryxdesign/core/Skeleton";
import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { formatAbn } from "@/lib/business-schema";
import { getOrg } from "@/lib/estimate/queries";
import { Intro } from "../parts";
import { BusinessForm } from "./form";

export const metadata: Metadata = { title: "Business" };

export default function BusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-8" aria-busy="true" aria-label="Loading">
          <Skeleton height={256} radius={4} />
        </div>
      }
    >
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
      <Intro>These appear on every quote you send.{!canEdit && " Only owners and admins can change them."}</Intro>
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
