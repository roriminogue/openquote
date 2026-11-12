import { Avatar } from "@astryxdesign/core/Avatar";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { HardDriveDownload, UserRound } from "lucide-react";

/**
 * The person using the app: their initial in the top bar, with account settings and backups behind it. On a phone
 * the choices come up as a sheet from the bottom; with a mouse they drop down from the avatar.
 */
export function AccountMenu({ name }: { name: string }) {
  return (
    <DropdownMenu
      aria-label="Account"
      presentation="adaptive"
      placement="below"
      alignment="end"
      menuWidth={232}
      hasChevron={false}
      renderTrigger={(trigger) => (
        <button
          {...trigger}
          type="button"
          aria-label={`Account: ${name}`}
          className="grid size-11 cursor-pointer place-items-center rounded-full outline-offset-[-4px] transition-opacity hover:opacity-80 aria-expanded:opacity-80"
        >
          <Avatar name={name} size={32} tooltip={false} />
        </button>
      )}
      items={[
        {
          type: "section",
          title: name,
          items: [
            { label: "Account settings", icon: UserRound, href: "/settings/account" },
            { label: "Back up your data", icon: HardDriveDownload, href: "/settings/account#backup" },
          ],
        },
      ]}
    />
  );
}
