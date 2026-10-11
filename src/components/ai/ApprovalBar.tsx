import type { ReactNode } from "react";

interface ApprovalBarProps {
  reviewed: number;
  total: number;
  children?: ReactNode;
}

/** Fixed bottom bar with the review counter (batch approval arrives in Fase 3). */
export function ApprovalBar({ reviewed, total, children }: ApprovalBarProps) {
  const done = total > 0 && reviewed === total;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-white px-4 py-3 md:pl-[calc(52px+1.5rem)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-stone-700" role="status">
          <span className="font-mono font-semibold">
            {reviewed} de {total}
          </span>{" "}
          revisadas{done && " · Todo revisado"}
        </p>
        {children}
      </div>
    </div>
  );
}
