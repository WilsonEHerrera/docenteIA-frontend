import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "md" | "sm" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-stone-900 text-white shadow-xs hover:bg-stone-800 active:bg-stone-950",
  secondary:
    "border border-stone-200 bg-white text-stone-800 shadow-xs hover:border-stone-300 hover:bg-stone-50",
  destructive: "border border-rose-200 bg-white text-rose-700 shadow-xs hover:border-rose-300 hover:bg-rose-50",
  ghost: "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
};

// md is touch-sized on phones (44 px) and compacts to 40 px from sm up.
const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-sm sm:h-10",
  sm: "h-9 px-3 text-[13px] sm:h-8",
  /** Square, icon-only: pass an aria-label. */
  icon: "size-11 text-sm sm:size-10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
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
        "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium",
        "transition-[background-color,border-color,color,box-shadow] duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
