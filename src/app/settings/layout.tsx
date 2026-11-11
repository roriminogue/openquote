import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/page-title";
import { SettingsTabs, SettingsTabsFor } from "./tabs";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <AppShell>
      <div className="max-w-[56rem]">
        <PageTitle title="Settings" />
        <div className="mt-5">
          <Suspense fallback={<SettingsTabsFor pathname="" />}>
            <SettingsTabs />
          </Suspense>
        </div>
        {children}
      </div>
    </AppShell>
  );
}
