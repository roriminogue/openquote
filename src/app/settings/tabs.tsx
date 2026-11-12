import { usePathname } from "@/lib/navigation";
import { FilterTabs } from "@/components/records";

const TABS = [
  ["/settings/business", "Business"],
  ["/settings/rates", "Rates and pricing"],
  ["/settings/ai", "AI"],
  ["/settings/account", "Account"],
] as const;

/** The tabs for a known path; also the Suspense fallback. */
export function SettingsTabsFor({ pathname }: { pathname: string }) {
  return (
    <FilterTabs
      label="Settings"
      items={TABS.map(([href, label]) => ({ href, label, on: pathname.startsWith(href) }))}
    />
  );
}

/** Settings sections as text tabs. Reads the URL, so it renders inside Suspense. */
export function SettingsTabs() {
  return <SettingsTabsFor pathname={usePathname()} />;
}
