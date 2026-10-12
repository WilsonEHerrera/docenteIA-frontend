import type { ReactNode } from "react";
import { CheckCircleIcon } from "@/components/ui/icons";

interface ApprovalBarProps {
  reviewed: number;
  total: number;
  children?: ReactNode;
}

/** Fixed bottom bar with the review counter (batch approval arrives in Fase 3). */
export function ApprovalBar({ reviewed, total, children }: ApprovalBarProps) {
  const done = total > 0 && reviewed === total;
  const percent = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/85 md:pl-rail">
      <div className="mx-auto flex max-w-[96rem] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3" role="status">
          {done && <CheckCircleIcon className="shrink-0 text-emerald-700" />}
          <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-xs">
            <p className="text-[13px] text-stone-700">
              <span className="font-mono font-semibold text-stone-900">
                {reviewed}/{total}
              </span>{" "}
              {done ? "revisadas. Todo revisado." : "revisadas por ti"}
            </p>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-stone-100"
              role="progressbar"
              aria-label="Progreso de revisión"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={reviewed}
            >
              <div
                className={done ? "h-full rounded-full bg-emerald-600 transition-[width] duration-300" : "h-full rounded-full bg-stone-900 transition-[width] duration-300"}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
