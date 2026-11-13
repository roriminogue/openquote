import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Text } from "@astryxdesign/core/Text";
import { HardDriveDownload, HardDriveUpload } from "lucide-react";
import { Suspense, useRef, useState } from "react";
import { ThemeSwitch } from "@/components/theme-switch";
import { replaceDatabase } from "@/db";
import { isNative } from "@/db/storage";
import { getOrg } from "@/lib/estimate/queries";
import { requireMember } from "@/lib/auth";
import { useQuery } from "@/lib/data";
import { ago, backUpNow, useLastBackup } from "@/lib/backup";
import { SettingsSection } from "../parts";

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

function Account() {
  const { member, org } = useQuery("account", async () => {
    const member = await requireMember();
    return { member, org: await getOrg(member.orgId) };
  });
  return (
    <>
      <SettingsSection id="you" title="You">
        <MetadataList label={{ width: 96 }}>
          <MetadataListItem label="Name">
            <Text>{member.name || "Not set"}</Text>
          </MetadataListItem>
          <MetadataListItem label="Business">
            <Text>{org.name}</Text>
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
      <Backup />
    </>
  );
}

/** Everything lives on this phone, so: a backup file to keep somewhere else, and a way to bring one back. */
function Backup() {
  const picker = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const last = useLastBackup();

  async function backUp() {
    setStatus(null);
    setBusy(true);
    try {
      if (await backUpNow()) setStatus({ kind: "success", text: "Backed up. Keep that file somewhere other than this phone." });
    } catch {
      setStatus({ kind: "error", text: "Couldn't make the backup. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function restore(file: File) {
    setStatus(null);
    if (!confirm("Replace everything on this phone with the backup? Anything added since that backup is lost.")) return;
    setBusy(true);
    try {
      await replaceDatabase(new Uint8Array(await file.arrayBuffer()));
      setStatus({ kind: "success", text: "Restored. Everything from the backup is back." });
    } catch (e) {
      setStatus({ kind: "error", text: (e as Error)?.message || "Couldn't restore that file." });
    } finally {
      setBusy(false);
      if (picker.current) picker.current.value = "";
    }
  }

  return (
    <SettingsSection id="backup" title="Your data">
      <div className="flex flex-col gap-4 sm:max-w-md">
        <Text as="p" display="block" type="supporting">
          {isNative()
            ? "Your quotes, clients and settings are saved on this iPhone, not on a server, and included in its iCloud backup."
            : "Your quotes, clients and settings are saved in this app on your phone, not on a server."}{" "}
          If the phone is lost or the app is deleted, a backup file is how you get them back. Save it to iCloud Drive
          or Files, or email it to yourself. It&rsquo;s also how you move to a new phone.
        </Text>
        <Text as="p" display="block" weight="medium">
          {last ? `Last backup: ${new Date(last).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })} (${ago(last)})` : "Not backed up yet"}
        </Text>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            label="Back up to a file"
            variant="secondary"
            icon={<Icon icon={HardDriveDownload} />}
            onClick={backUp}
            isDisabled={busy}
            width="100%"
          />
          <Button
            label="Restore from a file"
            variant="ghost"
            icon={<Icon icon={HardDriveUpload} />}
            onClick={() => picker.current?.click()}
            isDisabled={busy}
            width="100%"
          />
        </div>
        <input
          ref={picker}
          type="file"
          // Straight to Files (no Photo Library or camera): a backup is a .oqbackup file.
          accept=".oqbackup,application/octet-stream"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void restore(f);
          }}
        />
        {status && <Banner status={status.kind} title={status.text} />}
      </div>
    </SettingsSection>
  );
}
