import type { Metadata } from "next";
import { Suspense } from "react";
import { requireMember } from "@/lib/auth";
import { resolveAiConfig } from "@/lib/ai/config";
import { PROVIDER_INFO } from "@/lib/ai/providers";
import { getOrg, gstRatePct, hasEstimates, markupSettings } from "@/lib/estimate/queries";
import { listClients, listProjects } from "@/lib/projects";
import { NewEstimate } from "./new-estimate";

export const metadata: Metadata = { title: "New estimate" };

export default function NewEstimatePage({ searchParams }: PageProps<"/estimates/new">) {
  return (
    <>
      <div className="mx-auto max-w-[50rem]">
        <h1 className="font-display text-title font-medium leading-8 text-ink-3">New estimate</h1>
        <p className="font-display text-xl font-medium leading-7 text-ink">What&rsquo;s the job? OpenQuote prices it line by line.</p>
      </div>
      <Suspense>
        <Loader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Loader({ searchParams }: Pick<PageProps<"/estimates/new">, "searchParams">) {
  const member = await requireMember();
  const [org, ai, sp, projects, clients, experienced] = await Promise.all([
    getOrg(member.orgId),
    resolveAiConfig(member.orgId),
    searchParams,
    listProjects(member.orgId),
    listClients(member.orgId),
    hasEstimates(member.orgId),
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
      ai={
        ai.source === "none"
          ? null
          : { provider: PROVIDER_INFO[ai.provider].label, model: ai.smartModel ?? "", canEdit: member.role !== "member" }
      }
    />
  );
}
