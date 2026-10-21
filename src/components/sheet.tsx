"use client";

import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./ui";

/**
 * A task sheet on a native <dialog>: full screen on phones, a right-hand panel from 640px. The header carries the
 * way out (close, or Back inside a nested step); the primary action sits in a footer at the bottom, within thumb
 * reach on a phone. ⌘/Ctrl+Enter submits from anywhere in the sheet.
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
      className="sheet m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-bg p-0 text-ink backdrop:bg-ink/20 open:flex open:flex-col sm:ml-auto sm:max-w-[28rem] sm:border-l sm:border-border sm:shadow-lg"
    >
      <form
        onSubmit={onSubmit}
        onKeyDown={(e) => {
          if (action && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.currentTarget.requestSubmit();
          }
        }}
        noValidate
        className="flex min-h-0 flex-1 flex-col"
      >
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2 sm:px-4">
          {onBack ? (
            <button
              type="button"
              onClick={leave}
              className="inline-flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-body text-ink-2 transition-colors hover:bg-hover hover:text-ink sm:-ml-2 sm:h-9 sm:text-sm"
            >
              <ArrowLeft className="size-4" aria-hidden />
              {back ?? "Back"}
            </button>
          ) : null}
          <h2 id="sheet-title" className={`min-w-0 flex-1 truncate font-display text-base font-medium ${onBack ? "text-center sm:text-left sm:pl-2" : "pl-2 sm:pl-0"}`}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-hover hover:text-ink sm:-mr-2 sm:size-9"
          >
            <X className="size-[1.125rem]" aria-hidden />
            <span className="sr-only">Close</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-5 sm:px-6 sm:pt-6">{children}</div>
        {action && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-bg px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4 sm:pt-4">
            <Button type="button" variant="ghost" onClick={leave} className="hidden sm:inline-flex">
              {onBack ? "Back" : "Cancel"}
            </Button>
            <Button type="submit" disabled={busy} className="max-sm:h-12 max-sm:w-full max-sm:text-base">
              {busy ? "Saving…" : action}
            </Button>
          </footer>
        )}
      </form>
    </dialog>,
    document.body,
  );
}
