import type { Metadata } from "next";
import { Suspense } from "react";
import { Panel, Row, Rows, GroupTitle } from "@/components/ui";
import { requireMember } from "@/lib/auth";
import { PasswordForm } from "./form";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="mt-8 h-48 animate-pulse rounded-[10px] bg-hover" aria-busy="true" />}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const member = await requireMember();
  return (
    <>
      <section aria-labelledby="you" className="mt-8">
        <GroupTitle id="you">You</GroupTitle>
        <Panel>
          <Rows>
            <Row label="Name">
              <span className="text-sm font-medium">{member.name}</span>
            </Row>
            <Row label="Email" hint="You sign in with this.">
              <span className="break-all text-sm font-medium">{member.email}</span>
            </Row>
          </Rows>
        </Panel>
      </section>
      <PasswordForm email={member.email} />
    </>
  );
}
