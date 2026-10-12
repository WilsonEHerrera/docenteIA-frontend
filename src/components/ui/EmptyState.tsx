import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { InboxIcon } from "./icons";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  /** Compact version for use inside a card. */
  inset?: boolean;
}

export function EmptyState({ title, description, action, icon, inset }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-center",
        inset
          ? "rounded-xl bg-stone-50 px-4 py-8"
          : "rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full border border-border-soft bg-white text-stone-500">
        {icon ?? <InboxIcon width={20} height={20} />}
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-pretty text-stone-600">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
