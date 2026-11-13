import { Capacitor, registerPlugin } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { writeShareFile } from "@/db/storage";

// Getting things off the phone: a quote as a PDF, a backup file. On the iPhone both open the Share sheet (Messages,
// Mail, WhatsApp, AirDrop, Save to Files). In a browser (development) the PDF is the print dialog and files download.

type Native = {
  sharePdf(o: { fileName: string; text?: string }): Promise<{ completed: boolean; activity: string | null; pages: number }>;
};
const native = registerPlugin<Native>("OpenQuoteNative");

/** Turns the screen showing now (with its print styles) into an A4 PDF and opens the Share sheet. */
export async function sharePdf(fileName: string, text?: string): Promise<{ completed: boolean }> {
  if (Capacitor.isNativePlatform()) return native.sharePdf({ fileName, text });
  window.print();
  return { completed: true };
}

/** Shares a file (a backup), or downloads it in a browser. */
export async function shareFile(name: string, data: Uint8Array, mime: string) {
  if (Capacitor.isNativePlatform()) {
    const uri = await writeShareFile(name, data);
    await Share.share({ title: name, files: [uri] }).catch(() => {
      // Closed the Share sheet without picking anything.
    });
    return;
  }
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: mime }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
