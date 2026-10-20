import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Shared controls. One shape (4px "tape" radius), one height scale, one focus treatment everywhere.

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-tape font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0";
const variants: Record<Variant, string> = {
  primary: "bg-blade text-on-blade hover:bg-blade-press",
  secondary: "border border-hairline-strong bg-surface text-ink hover:border-ink",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "text-mark underline decoration-1 underline-offset-4 hover:no-underline",
};
const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-[0.9375rem]",
  lg: "h-14 px-6 text-[1.0625rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${variant === "danger" ? "" : sizes[size]} ${extra}`;
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

const control =
  "w-full rounded-tape border border-hairline-strong bg-surface px-3.5 text-base text-ink placeholder:text-ink-3 transition-colors duration-150 hover:border-ink-3 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus disabled:opacity-60 aria-invalid:border-mark";

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${control} h-12 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${control} py-3 leading-relaxed ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${control} h-12 ${className}`} {...props} />;
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-sm text-ink-3">{hint}</p>}
    </div>
  );
}

/** Inline status line. Errors use stud-mark red; never a modal. */
export function Notice({ tone, children }: { tone: "error" | "ok" | "info"; children: ReactNode }) {
  const tones = {
    error: "bg-mark-wash text-mark",
    ok: "bg-surface-2 text-ok",
    info: "bg-surface-2 text-ink-2",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`rounded-tape px-3.5 py-3 text-[0.9375rem] ${tones[tone]}`}>
      {children}
    </p>
  );
}

/** A 1px rule that starts with graduation ticks, used between sections instead of boxes. */
export function Rule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`relative h-px bg-hairline ${className}`}>
      <span className="absolute -top-1.5 left-0 flex gap-[5px]">
        {[10, 5, 5, 5, 5, 10].map((h, i) => (
          <span key={i} className="block w-px bg-hairline-strong" style={{ height: h }} />
        ))}
      </span>
    </div>
  );
}
