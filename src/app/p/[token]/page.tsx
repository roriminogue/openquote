import { Skeleton } from "@astryxdesign/core/Skeleton";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { getAuthUser } from "@/lib/auth";
import { getPublicProposal, recordView } from "@/lib/proposals";
import { QuoteDocument } from "./document";

// The client-facing quote, reached only through its unguessable link. It is always light (the pre-paint script in
// the root layout sees the /p/ path), whatever the client's device is set to.

export const metadata: Metadata = { title: "Quote", robots: { index: false, follow: false } };

export default function QuotePage({ params }: PageProps<"/p/[token]">) {
  return (
    <div className="min-h-dvh flex-1 bg-(--color-background-muted) print:bg-white">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl px-3 pt-10 sm:px-6" aria-busy="true" aria-label="Loading quote">
            <Skeleton height={384} radius={4} />
          </div>
        }
      >
        <Quote params={params} />
      </Suspense>
    </div>
  );
}

async function Quote({ params }: Pick<PageProps<"/p/[token]">, "params">) {
  const { token } = await params;
  const q = await getPublicProposal(token);
  if (!q) notFound();

  // Don't count the business's own previews as client views.
  const user = await getAuthUser();
  const [viewer] = user
    ? await db.select({ orgId: schema.users.orgId }).from(schema.users).where(eq(schema.users.id, user.id))
    : [];
  if (viewer?.orgId !== q.org.id) await recordView(q.send.id);

  return <QuoteDocument q={q} token={token} />;
}
