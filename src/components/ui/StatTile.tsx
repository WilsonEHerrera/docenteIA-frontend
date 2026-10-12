import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Skeleton } from "./Skeleton";

interface StatTileProps {
  label: string;
  /** null while loading; renders a skeleton. */
  value: ReactNode | null;
  hint?: ReactNode;
  icon?: ReactNode;
  /** Draws the value in the warning/danger ink when the number needs attention. */
  tone?: "default" | "warning" | "danger";
}

const tones = { default: "text-stone-900", warning: "text-amber-800", danger: "text-rose-700" } as const;

/** Headline number with its label. Values come from the API as-is; the UI only counts or sums. */
export function StatTile({ label, value, hint, icon, tone = "default" }: StatTileProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border-soft bg-white p-4 shadow-xs sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-stone-600">{label}</p>
        {icon && <span className="text-stone-400 [&_svg]:size-4">{icon}</span>}
      </div>
      {value === null ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className={cn("font-mono text-[1.75rem] leading-none font-semibold tabular-nums", tones[tone])}>{value}</p>
      )}
      {hint && <p className="text-xs leading-relaxed text-stone-500">{hint}</p>}
    </div>
  );
}
