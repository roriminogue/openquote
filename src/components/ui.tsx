import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Shared controls, sized like a dense desktop workspace from 640px (28/32/36px controls, 12–14px labels) and
// thumb-sized on phones (44px). Primary is a short near-black gradient with a top highlight; the orange accent is
// kept for the one action that matters on a screen.

type Variant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,box-shadow,filter] duration-150 ease-out active:brightness-95 disabled:pointer-events-none disabled:opacity-50";
const variants: Record<Variant, string> = {
  primary:
    "border border-primary bg-linear-to-b from-primary-top to-primary text-on-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.16)] hover:from-primary-hover hover:to-primary",
  secondary: "border border-border-strong bg-bg text-ink hover:bg-hover",
  ghost: "text-ink-2 hover:bg-hover hover:text-ink",
  accent:
    "border border-accent-hover bg-linear-to-b from-accent to-accent-hover text-on-accent shadow-[inset_0_1px_0_rgb(255_255_255/0.22)] hover:brightness-105",
  danger: "border border-border-strong bg-bg text-danger hover:border-danger/40 hover:bg-danger-soft",
};
// sm: 28px, md: 32px, lg: 36px from 640px; 40–44px on phones.
const sizes: Record<Size, string> = {
  sm: "h-9 rounded-md px-3 text-sm sm:h-7 sm:px-2 sm:text-xs",
  md: "h-11 rounded-lg px-4 text-[0.9375rem] sm:h-8 sm:px-2.5 sm:text-xs",
  lg: "h-11 rounded-lg px-4 text-[0.9375rem] sm:h-9 sm:px-3 sm:text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// 16px text on phones so iOS doesn't zoom on focus; 14px from 640px.
const control =
  "w-full rounded-lg border border-border bg-bg px-3 text-base text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-border-strong focus:border-ink-4 focus:outline-none focus:ring-3 focus:ring-ink/5 disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-danger/10 sm:text-sm";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${control} h-11 sm:h-9 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${control} resize-none py-2 leading-relaxed ${className}`} {...props} />;
}

/** Native select (best on phones) with an up-down chevron and the same inset as inputs. */
export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select className={`${control} h-11 appearance-none pr-9 sm:h-9 ${className}`} {...props} />
      <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
    </span>
  );
}

export function Field({
  id,
  label,
  hint,
  optional,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-baseline gap-1.5 text-sm font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-3">Optional</span>}
      </label>
      {children}
      {hint && <p className="text-caption leading-snug text-ink-3 sm:text-xs">{hint}</p>}
    </div>
  );
}

/** Inline status line. Errors are red text on a pale wash; never a modal. */
export function Notice({ tone, children }: { tone: "error" | "ok" | "info"; children: ReactNode }) {
  const tones = {
    error: "border-danger/20 bg-danger-soft text-danger",
    ok: "border-ok/20 bg-ok-soft text-ok",
    info: "border-border bg-subtle text-ink-2",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </p>
  );
}

/** A quiet hairline between sections. */
export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-border ${className}`} />;
}

/** A card: the page colour, outlined by a 1px ring with the faintest layered shadow. 10px corners. */
export function Panel({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-[10px] bg-bg shadow-card ${className}`} {...props} />;
}

/** A small grey heading that sits above a card or a group, with an optional action on the right. */
export function GroupTitle({ id, children, action }: { id?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-7 items-center justify-between gap-4">
      <h2 id={id} className="text-sm font-medium text-ink-3">
        {children}
      </h2>
      {action}
    </div>
  );
}

/** Rows inside a card, split by dashed rules: label and hint on the left, value or control on the right. */
export function Rows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`divide-y divide-dashed divide-border px-4 sm:px-5 ${className}`}>{children}</div>;
}

export function Row({
  label,
  hint,
  htmlFor,
  children,
  stack = false,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children?: ReactNode;
  /** Put the control under the label instead of beside it (long inputs). */
  stack?: boolean;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className={`flex gap-x-6 gap-y-3 py-4 sm:py-5 ${stack ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between"}`}>
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
          {label}
        </Label>
        {hint && <p className="mt-0.5 text-sm text-ink-3">{hint}</p>}
      </div>
      {children && <div className={stack ? "" : "shrink-0 sm:max-w-[22rem] sm:min-w-[14rem]"}>{children}</div>}
    </div>
  );
}

/** A label and a value on one line, as in a details panel. */
export function KeyValue({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-4 py-2.5 text-sm">
      <dt className="w-28 shrink-0 text-ink-3">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium text-ink">{children}</dd>
    </div>
  );
}

export type Tone = "neutral" | "accent" | "ok" | "muted" | "danger";

/** Status as a small grey pill. Only the accent and danger tones add a dot; the word carries the meaning. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  const dot = { accent: "bg-accent", danger: "bg-danger" }[tone as "accent" | "danger"];
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full bg-subtle px-2 text-xs font-medium ${
        tone === "muted" ? "text-ink-3" : "text-ink"
      }`}
    >
      {dot && <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}

/** Page heading: Figtree at 24px, a grey line under it, actions on the right. */
export function PageTitle({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-display text-title font-medium leading-8 tracking-[-0.01em] text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

/** Empty state on a dotted panel: what this place is for, and the one thing to do. */
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="dots flex min-h-60 flex-col items-center justify-center rounded-[14px] bg-subtle/60 px-6 py-12 text-center">
      <div className="max-w-sm">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        <p className="mt-1 text-sm text-ink-3">{children}</p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
