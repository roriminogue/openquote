import { Suspense } from "react";
import { PageTitle } from "@/components/page-title";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { useSearchParams } from "@/lib/navigation";
import { resolveAiConfig } from "@/lib/ai/config";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { getOrg, gstRatePct, hasEstimates, markupSettings } from "@/lib/estimate/queries";
import { listClients, listProjects } from "@/lib/projects";
import { listRates } from "@/lib/rates";
import { voiceHints } from "@/lib/voice/terms";
import { NewEstimate } from "./new-estimate";

export default function NewEstimatePage() {
  return (
    <>
      <div className="mx-auto max-w-[50rem]">
        <PageTitle title="New estimate" description="Describe the job and it’s priced line by line, using your rates first." />
      </div>
      <Suspense>
        <Loader />
      </Suspense>
    </>
  );
}

function Loader() {
  const sp = useSearchParams();
  const { member, org, ai, projects, clients, experienced, rates } = useQuery("new-estimate", async () => {
    const member = await requireMember();
    const [org, ai, projects, clients, experienced, rates] = await Promise.all([
      getOrg(member.orgId),
      resolveAiConfig(member.orgId),
      listProjects(member.orgId),
      listClients(member.orgId),
      hasEstimates(member.orgId),
      listRates(member.orgId),
    ]);
    return { member, org, ai, projects, clients, experienced, rates };
  });
  const describe = (sp.get("describe") ?? "").slice(0, 500);
  const projectId = sp.get("project");
  const initialProject = projectId ? (projects.find((p) => p.id === projectId) ?? null) : null;

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
