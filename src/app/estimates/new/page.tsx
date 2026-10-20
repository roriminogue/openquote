import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { resolveAiConfig } from "@/lib/ai/config";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { getOrg, gstRatePct, markupSettings } from "@/lib/estimate/queries";
import { NewEstimate } from "./new-estimate";

export const metadata: Metadata = { title: "New estimate" };

export default function NewEstimatePage({ searchParams }: PageProps<"/estimates/new">) {
  return (
    <>
      <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.01em]">New estimate</h1>
      <Suspense>
        <Loader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Loader({ searchParams }: Pick<PageProps<"/estimates/new">, "searchParams">) {
  const member = await requireMember();
  const [org, ai, sp] = await Promise.all([getOrg(member.orgId), resolveAiConfig(member.orgId), searchParams]);
  const describe = typeof sp.describe === "string" ? sp.describe.slice(0, 500) : "";

  return (
    <NewEstimate
      initialDescription={describe}
      markup={markupSettings(org)}
      gstRatePct={gstRatePct(org)}
      ai={
        ai.source === "none"
          ? null
          : { provider: PROVIDER_INFO[ai.provider].label, model: ai.smartModel ?? "", canEdit: member.role !== "member" }
      }
    />
  );
}
