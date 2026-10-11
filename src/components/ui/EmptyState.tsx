import type { ReactNode } from "react";
import { InboxIcon } from "./icons";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      <span className="text-stone-500">{icon ?? <InboxIcon width={28} height={28} />}</span>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-stone-600 leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
