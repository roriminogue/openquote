import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeSwitch } from "@/components/theme-switch";
import { requireMember } from "@/lib/auth";
import { SettingsSection } from "../parts";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="mt-8" aria-busy="true" aria-label="Loading">
          <Skeleton height={256} radius={4} />
        </div>
      }
    >
      <Account />
    </Suspense>
  );
}

async function Account() {
  const member = await requireMember();
  return (
    <>
      <SettingsSection id="you" title="You">
        <MetadataList label={{ width: 96 }}>
          <MetadataListItem label="Name">
            <Text>{member.name}</Text>
          </MetadataListItem>
          <MetadataListItem label="Email">
            <span className="break-all">
              <Text>{member.email}</Text>
            </span>
            <Text as="p" display="block" type="supporting">
              You sign in with a code sent here.
            </Text>
          </MetadataListItem>
        </MetadataList>
      </SettingsSection>
      <SettingsSection id="appearance" title="Appearance">
        <div className="flex flex-col gap-2 sm:max-w-sm">
          <ThemeSwitch />
          <Text as="p" display="block" type="supporting">
            System follows your device. Saved on this device.
          </Text>
        </div>
      </SettingsSection>
    </>
  );
}
