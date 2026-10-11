import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "destructive";

const variants: Record<Variant, string> = {
  primary: "bg-stone-900 hover:bg-stone-800 text-white px-4 py-2",
  secondary: "bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 px-3.5 py-1.5",
  destructive:
    "bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-1.5",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 text-xs font-medium rounded-lg transition-colors cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin"
        />
      )}
      {children}
    </button>
  );
}
