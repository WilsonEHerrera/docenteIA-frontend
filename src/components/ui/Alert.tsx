import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon } from "./icons";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const styles: Record<AlertVariant, { box: string; icon: string; title: string }> = {
  info: { box: "border-sky-200 bg-sky-50", icon: "text-sky-700", title: "text-sky-900" },
  success: { box: "border-emerald-200 bg-emerald-50", icon: "text-emerald-700", title: "text-emerald-900" },
  warning: { box: "border-amber-200 bg-amber-50", icon: "text-amber-700", title: "text-amber-900" },
  danger: { box: "border-rose-200 bg-rose-50", icon: "text-rose-700", title: "text-rose-900" },
};

const icons = {
  info: InfoIcon,
  success: CheckCircleIcon,
  warning: AlertTriangleIcon,
  danger: AlertCircleIcon,
} as const;

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Inline status message. Icon + text, so meaning never depends on color alone. */
export function Alert({ variant = "info", title, children, action, className }: AlertProps) {
  const style = styles[variant];
  const Icon = icons[variant];
  const urgent = variant === "danger" || variant === "warning";
  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center",
        style.box,
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        <Icon className={cn("mt-px shrink-0", style.icon)} />
        <div className="min-w-0 flex-1 space-y-0.5">
          {title && <p className={cn("text-sm font-semibold", style.title)}>{title}</p>}
          {children && <div className="text-[13px] leading-relaxed text-stone-700">{children}</div>}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2 pl-8 sm:pl-0">{action}</div>}
    </div>
  );
}
