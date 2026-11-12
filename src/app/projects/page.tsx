import { Suspense } from "react";
import { PageHeader } from "@/components/records";
import { ProjectsView } from "@/components/views/projects-view";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { useSearchParams } from "@/lib/navigation";
import { listClients } from "@/lib/projects";
import { projectsOverview } from "@/lib/records-overview";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<PageHeader title="Projects" />}>
      <Projects />
    </Suspense>
  );
}

const FILTERS = ["all", "quoting", "active", "on_hold", "completed", "cancelled"];

function Projects() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const status = FILTERS.includes(sp.get("status") ?? "") ? sp.get("status")! : "all";
  const { all, clients } = useQuery("projects-overview", async () => {
    const member = await requireMember();
    const [all, clients] = await Promise.all([projectsOverview(member.orgId), listClients(member.orgId)]);
    return { all, clients };
  });

  return <ProjectsView all={all} clients={clients} q={q} status={status} />;
}
