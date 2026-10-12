import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

// Semantic colors communicate state only (docs/DESIGN.md §3). Always paired with a text label.
const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-stone-100 text-stone-700 border-stone-200",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 py-0.5",
        "font-mono text-[11px] font-semibold uppercase leading-5 tracking-wide",
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
