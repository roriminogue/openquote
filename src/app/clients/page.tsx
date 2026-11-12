import { Suspense } from "react";
import { PageHeader } from "@/components/records";
import { ClientsView } from "@/components/views/clients-view";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { useSearchParams } from "@/lib/navigation";
import { clientsOverview } from "@/lib/records-overview";

export default function ClientsPage() {
  return (
    <Suspense fallback={<PageHeader title="Clients" />}>
      <Clients />
    </Suspense>
  );
}

function Clients() {
  const q = useSearchParams().get("q") ?? "";
  const all = useQuery("clients-overview", async () => clientsOverview((await requireMember()).orgId));
  return <ClientsView all={all} q={q} />;
}
