import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeSwitch } from "@/components/theme";
import { Panel, Row, Rows, GroupTitle } from "@/components/ui";
import { requireMember } from "@/lib/auth";

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
            <Row label="Email" hint="You sign in with a code sent here.">
              <span className="break-all text-sm font-medium">{member.email}</span>
            </Row>
          </Rows>
        </Panel>
      </section>
      <section aria-labelledby="appearance" className="mt-10">
        <GroupTitle id="appearance">Appearance</GroupTitle>
        <Panel>
          <Rows>
            <Row label="Theme" hint="System follows your device. Saved on this device.">
              <ThemeSwitch />
            </Row>
          </Rows>
        </Panel>
      </section>
    </>
  );
}
