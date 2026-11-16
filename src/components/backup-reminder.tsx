import { Button } from "@astryxdesign/core/Button";
import { CloudUpload, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Callout } from "@/components/callout";
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
      <Callout
        icon={failed ? TriangleAlert : CloudUpload}
        tone={failed ? "error" : "neutral"}
        title={last ? `Last backup ${ago(last)}` : "Back up your quotes"}
        description={
          failed
            ? "Couldn’t make the backup. Try again."
            : `Your ${plural} only on this phone. Save a backup to iCloud Drive or Files so you can get them back if the phone is lost.`
        }
        actions={
          <>
            <Button
              label="Back up now"
              variant="secondary"
              size="md"
              width="100%"
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
            <Button label="Not now" variant="ghost" size="md" width="100%" onClick={snoozeBackupReminder} />
          </>
        }
      />
    </div>
  );
}
