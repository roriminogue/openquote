import { Capacitor, registerPlugin } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { writeShareFile } from "@/db/storage";

// Getting things off the phone: a quote as a PDF, a backup file. On the iPhone both open the Share sheet (Messages,
// Mail, WhatsApp, AirDrop, Save to Files). In the web version the PDF is the print screen (Share is at its top).

type Native = {
  sharePdf(o: { fileName: string; text?: string }): Promise<{ completed: boolean; activity: string | null; pages: number }>;
};
const native = registerPlugin<Native>("OpenQuoteNative");

/**
 * Web version: opens the Share sheet with a PDF made beforehand (lib/pdf-web.ts), and the message. Call it straight
 * from the tap, with the PDF already made: the Share sheet only opens from a fresh tap. True once it was sent.
 */
export async function shareMadePdf(fileName: string, pdf: Uint8Array, text?: string): Promise<{ completed: boolean }> {
  const file = new File([pdf as BlobPart], `${fileName.replace(/[\\/:*?"<>|]/g, "-")}.pdf`, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return { completed: true };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return { completed: false };
    }
  }
  // No Share sheet (a computer's browser): open the PDF in a new tab to save or print from there.
  const url = URL.createObjectURL(file);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { completed: true };
}

/** Turns the screen showing now (with its print styles) into an A4 PDF and opens the Share sheet. */
export async function sharePdf(fileName: string, text?: string): Promise<{ completed: boolean }> {
  if (Capacitor.isNativePlatform()) return native.sharePdf({ fileName, text });
  window.print();
  return { completed: true };
}

/**
 * Shares a file (a backup) through the Share sheet: Save to Files, AirDrop, Mail. Where there's no Share sheet
 * (a computer's browser) it downloads instead. True once it went somewhere; false if the Share sheet was closed.
 */
export async function shareFile(name: string, data: Uint8Array, mime: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    const uri = await writeShareFile(name, data);
    try {
      await Share.share({ title: name, files: [uri] });
      return true;
    } catch {
      return false; // closed the Share sheet without picking anything
    }
  }
  const file = new File([data as BlobPart], name, { type: mime });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return false;
      // Not allowed to share right now: fall through to a download.
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
