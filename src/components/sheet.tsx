"use client";

import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui";

/**
 * A task sheet on a native <dialog>: full screen on phones, a right-hand panel from 640px. The top bar carries
 * the way out (Cancel, or Back inside a nested step) and the one primary action, which submits the sheet's form.
 */
export function Sheet({
  open,
  title,
  onClose,
  back,
  onBack,
  action,
  busy,
  onSubmit,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  back?: string;
  onBack?: () => void;
  action?: string;
  busy?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const leave = () => (onBack ? onBack() : onClose());

  // Portalled to <body> so the sheet's own form never nests inside the page's form.
  if (typeof document === "undefined") return null;
  return createPortal(
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault(); // Escape steps back one level instead of throwing the whole flow away
        leave();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-ground p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px] open:flex open:flex-col sm:ml-auto sm:max-w-lg sm:border-l sm:border-hairline sm:shadow-[-12px_0_32px_-16px_rgb(0_0_0/0.35)]"
    >
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface-2 px-2">
          <button
            type="button"
            onClick={leave}
            className="inline-flex h-10 items-center gap-1.5 rounded-tape px-2.5 font-semibold text-ink-2 transition-colors hover:bg-surface hover:text-ink"
          >
            {onBack ? <ArrowLeft className="size-[1.125rem]" aria-hidden /> : <X className="size-[1.125rem]" aria-hidden />}
            {back ?? (onBack ? "Back" : "Cancel")}
          </button>
          <h2 id="sheet-title" className="min-w-0 flex-1 truncate text-center text-[1.0625rem] font-bold">
            {title}
          </h2>
          {action ? (
            <Button type="submit" className="h-10 px-4" disabled={busy}>
              {busy ? "Saving…" : action}
            </Button>
          ) : (
            <span className="w-[4.5rem]" aria-hidden />
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6">{children}</div>
      </form>
    </dialog>,
    document.body,
  );
}
