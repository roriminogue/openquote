import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/records";
import { ProjectsView } from "@/components/views/projects-view";
import { requireMember } from "@/lib/auth";
import { listClients } from "@/lib/projects";
import { projectsOverview } from "@/lib/records-overview";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <Suspense fallback={<PageHeader title="Projects" />}>
      <Projects searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS = ["all", "quoting", "active", "on_hold", "completed", "cancelled"];

async function Projects({ searchParams }: Pick<PageProps<"/projects">, "searchParams">) {
  const member = await requireMember();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = FILTERS.includes(sp.status as string) ? (sp.status as string) : "all";
  const [all, clients] = await Promise.all([projectsOverview(member.orgId), listClients(member.orgId)]);

  return <ProjectsView all={all} clients={clients} q={q} status={status} />;
}
