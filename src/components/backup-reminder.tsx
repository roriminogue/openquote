import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { useState } from "react";
import { ago, backupDue, backupStats, backUpNow, snoozeBackupReminder, useLastBackup, useSnoozedUntil } from "@/lib/backup";
import { useQuery } from "@/lib/data";

/**
 * A nudge above the quotes when there's work that isn't in a backup yet (see lib/backup.ts for when). Back up now
 * opens the Share sheet; Not now hides it for a few days. Once a backup is saved it goes away by itself.
 */
export function BackupReminder({ orgId }: { orgId: string }) {
  const stats = useQuery(`backup-stats|${orgId}`, () => backupStats(orgId));
  const last = useLastBackup();
  const snoozedUntil = useSnoozedUntil();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!backupDue(stats, last, snoozedUntil)) return null;

  const plural = stats.quotes === 1 ? "quote is" : "quotes are";
  return (
    <div className="mt-6">
      <Banner
        status={failed ? "error" : "info"}
        title={last ? `Last backup ${ago(last)}` : "Back up your quotes"}
        description={
          failed
            ? "Couldn’t make the backup. Try again."
            : `Your ${plural} only on this phone. Save a backup to iCloud Drive or Files so you can get them back if the phone is lost.`
        }
        endContent={
          <div className="flex gap-2">
            <Button
              label="Back up now"
              variant="primary"
              size="sm"
              isDisabled={busy}
              onClick={async () => {
                setBusy(true);
                setFailed(false);
                try {
                  await backUpNow();
                } catch {
                  setFailed(true);
                } finally {
                  setBusy(false);
                }
              }}
            />
            <Button label="Not now" variant="ghost" size="sm" onClick={snoozeBackupReminder} />
          </div>
        }
      />
    </div>
  );
}
