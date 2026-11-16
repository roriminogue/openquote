import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * A quiet notice on a raised surface: a small icon tile, a title, one line or two of explanation, and its actions.
 * Used where a coloured Astryx Banner would shout (sample data, backups, AI setup). Errors still use Banner.
 * On a phone the actions sit under the text, full width; from 640px they sit on the right.
 */
export function Callout({
  icon: IconGlyph,
  title,
  description,
  actions,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** "error" tints the icon tile red, for a failed action the callout itself offers. */
  tone?: "neutral" | "error";
}) {
  return (
    <section className="raised-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <span
          aria-hidden
          className={
            "grid size-9 shrink-0 place-items-center rounded-(--radius-element) " +
            (tone === "error"
              ? "bg-(--color-background-red) text-(--color-error)"
              : "bg-(--color-background-muted) text-(--color-text-primary)")
          }
        >
          <IconGlyph size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 pt-px">
          <p className="text-base leading-snug font-semibold text-balance text-(--color-text-primary)">{title}</p>
          <p className="mt-1 max-w-[62ch] text-[0.9375rem] leading-relaxed sm:text-sm text-pretty text-(--color-text-secondary)">
            {description}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row sm:items-center">
          {actions}
        </div>
      )}
    </section>
  );
}
