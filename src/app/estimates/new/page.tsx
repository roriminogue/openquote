import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { resolveAiConfig } from "@/lib/ai/config";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { getOrg, gstRatePct, hasEstimates, markupSettings } from "@/lib/estimate/queries";
import { listClients, listProjects } from "@/lib/projects";
import { listRates } from "@/lib/rates";
import { voiceHints } from "@/lib/voice/terms";
import { NewEstimate } from "./new-estimate";

export const metadata: Metadata = { title: "New estimate" };

export default function NewEstimatePage({ searchParams }: PageProps<"/estimates/new">) {
  return (
    <>
      <div className="mx-auto max-w-[50rem]">
        <PageTitle title="New estimate" description="Describe the job and it’s priced line by line, using your rates first." />
      </div>
      <Suspense>
        <Loader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Loader({ searchParams }: Pick<PageProps<"/estimates/new">, "searchParams">) {
  const member = await requireMember();
  const [org, ai, sp, projects, clients, experienced, rates] = await Promise.all([
    getOrg(member.orgId),
    resolveAiConfig(member.orgId),
    searchParams,
    listProjects(member.orgId),
    listClients(member.orgId),
    hasEstimates(member.orgId),
    listRates(member.orgId),
  ]);
  const describe = typeof sp.describe === "string" ? sp.describe.slice(0, 500) : "";
  const initialProject = typeof sp.project === "string" ? (projects.find((p) => p.id === sp.project) ?? null) : null;

  return (
    <NewEstimate
      initialDescription={describe}
      firstTime={!experienced}
      projects={projects}
      clients={clients}
      initialProject={initialProject}
      markup={markupSettings(org)}
      gstRatePct={gstRatePct(org)}
      voiceHints={voiceHints(rates.map((r) => r.title))}
      ai={
        ai.source === "none"
          ? null
          : { provider: PROVIDER_INFO[ai.provider].label, model: ai.smartModel ?? "", canEdit: member.role !== "member" }
      }
    />
  );
}
