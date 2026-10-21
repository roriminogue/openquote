import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/records";
import { ClientsView } from "@/components/views/clients-view";
import { requireMember } from "@/lib/auth";
import { clientsOverview } from "@/lib/records-overview";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
  return (
    <Suspense fallback={<PageHeader title="Clients" />}>
      <Clients searchParams={searchParams} />
    </Suspense>
  );
}

async function Clients({ searchParams }: Pick<PageProps<"/clients">, "searchParams">) {
  const member = await requireMember();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const all = await clientsOverview(member.orgId);
  return <ClientsView all={all} q={q} />;
}
