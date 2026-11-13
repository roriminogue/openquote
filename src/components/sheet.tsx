import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Button } from "@astryxdesign/core/Button";
import { Drawer } from "@astryxdesign/core/Drawer";
import { Heading } from "@astryxdesign/core/Heading";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";

const WIDE = "(min-width: 640px)";

function watchWide(onChange: () => void) {
  const media = window.matchMedia(WIDE);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * A panel for a short job that shouldn't lose your place: picking a project, adding a client, editing a rate.
 * On a phone it comes up from the bottom; on a wider screen it slides in from the right.
 *
 * Keep it mounted and flip `open`, so it can animate out. Its own form stops the submit from reaching any form
 * around it. With `onBack`, Escape and the back arrow go back one step instead of closing everything.
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
  /** Name for the back arrow, e.g. "Back to project". */
  back?: string;
  onBack?: () => void;
  /** Label for the main button. Leave out for a sheet with no form to save. */
  action?: string;
  busy?: boolean;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const wide = useSyncExternalStore(
    watchWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  const leave = () => (onBack ? onBack() : onClose());

  // A closed sheet keeps nothing in the page: its fields would otherwise share ids with the same form in
  // another sheet. The contents stay just long enough to slide away with it.
  const [filled, setFilled] = useState(open);
  if (open && !filled) setFilled(true);
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setFilled(false), 500);
    return () => clearTimeout(timer);
  }, [open]);

  const body = !filled ? null : (
    <form
      noValidate
      className="flex min-h-full flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit?.(e);
      }}
      onKeyDown={(e) => {
        if (action && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {/* The phone sheet has a grab handle floating over its top edge, so the header starts a little lower. */}
      <header
        className={`sticky top-0 z-10 flex items-center gap-1 border-b border-(--color-border) bg-(--color-background-surface) pr-2 ${
          onBack ? "pl-2" : "pl-4 sm:pl-6"
        } ${wide ? "py-3" : "pb-2 pt-5"}`}
      >
        {onBack && (
          <IconButton label={back ?? "Back"} variant="ghost" icon={<Icon icon={ArrowLeft} />} onClick={onBack} />
        )}
        <div className="min-w-0 flex-1">
          <Heading level={3} accessibilityLevel={2} maxLines={1}>
            {title}
          </Heading>
        </div>
        <IconButton label="Close" variant="ghost" icon={<Icon icon={X} />} onClick={onClose} />
      </header>

      <div className="flex-1 px-4 pb-8 pt-5 sm:px-6">{children}</div>

      {action && (
        <footer
          className={`sticky z-10 flex items-center justify-end gap-2 border-t border-(--color-border) bg-(--color-background-surface) px-4 py-3 sm:px-6 ${
            // The side panel pads its own bottom for the home indicator, so the bar sits just above that strip
            // and paints it too. The phone sheet keeps that strip outside its scrolling area.
            wide
              ? "bottom-[env(safe-area-inset-bottom,0px)] after:absolute after:inset-x-0 after:top-full after:h-[env(safe-area-inset-bottom,0px)] after:bg-(--color-background-surface)"
              : "bottom-0"
          }`}
        >
          <div className="hidden sm:block">
            <Button label={onBack ? "Back" : "Cancel"} variant="ghost" onClick={leave} />
          </div>
          <div className="flex-1 sm:flex-none">
            <Button
              type="submit"
              variant="primary"
              size={wide ? "md" : "lg"}
              width="100%"
              label={busy ? "Saving…" : action}
              isDisabled={busy}
            />
          </div>
        </footer>
      )}
    </form>
  );

  // A sheet with something to save only closes on purpose (the X, Cancel, Escape); one that only shows or
  // picks things also closes on a tap outside or a swipe down.
  const purpose = action ? "form" : "info";
  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen) leave();
  };

  return wide ? (
    <Drawer isOpen={open} onOpenChange={onOpenChange} label={title} purpose={purpose} padding={0} width={448}>
      {body}
    </Drawer>
  ) : (
    <BottomSheet isOpen={open} onOpenChange={onOpenChange} label={title} purpose={purpose} padding={0} height="tall">
      {body}
    </BottomSheet>
  );
}
