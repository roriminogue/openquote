import { Suspense } from "react";
import { Outlet } from "react-router";
import { PageTitle } from "@/components/page-title";
import { SettingsTabs } from "./tabs";

export default function SettingsLayout() {
  return (
    <div className="max-w-[56rem]">
      <PageTitle title="Settings" />
      <div className="mt-5">
        <SettingsTabs />
      </div>
      <Suspense>
        <Outlet />
      </Suspense>
    </div>
  );
}
