import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "success" | "danger" | "warning" | "info" | "neutral";

// Semantic colors communicate state only (docs/DESIGN.md §3).
const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
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
        "inline-block font-mono text-xs uppercase tracking-wide font-semibold px-2 py-1 rounded-md border",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
