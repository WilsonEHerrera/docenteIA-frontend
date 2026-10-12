"use client";

import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/auth/roles";
import type { AttendanceRecord, AttendanceStatus } from "@/types/api";

interface AttendanceGridProps {
  records: AttendanceRecord[];
  readOnly?: boolean;
  busyIds?: ReadonlySet<string>;
  onMark: (recordId: string, status: AttendanceStatus) => void;
}

const OPTIONS: Array<{ status: AttendanceStatus; label: string; selected: string }> = [
  { status: "PRESENT", label: "Presente", selected: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { status: "ABSENT", label: "Ausente", selected: "border-rose-300 bg-rose-50 text-rose-800" },
];

export function AttendanceGrid({ records, readOnly, busyIds, onMark }: AttendanceGridProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {records.map((record) => {
        const unrecognized = record.status === "UNRECOGNIZED";
        const busy = busyIds?.has(record.id) ?? false;
        return (
          <li
            key={record.id}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border p-3 shadow-xs transition-colors sm:p-4",
              unrecognized ? "border-amber-300 bg-amber-50/70" : "border-border-soft bg-white",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  unrecognized ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-700",
                )}
              >
                {initials(record.studentName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{record.studentName}</p>
                <p className="truncate font-mono text-[11px] text-stone-500">{record.studentId}</p>
              </div>
              {record.source === "MANUAL" && record.status !== "UNRECOGNIZED" ? (
                <span className="font-mono text-[10px] font-medium tracking-wide text-stone-500 uppercase" title="Marcado por ti">
                  Manual
                </span>
              ) : (
                <ConfidenceBadge status={record.status} confidence={record.confidence} />
              )}
            </div>

            {unrecognized && !readOnly && (
              <p className="text-xs leading-relaxed text-amber-900">
                La IA no pudo identificarlo en la foto. Indica si está presente o ausente.
              </p>
            )}

            <div role="group" aria-label={`Asistencia de ${record.studentName}`} className="mt-auto grid grid-cols-2 gap-2">
              {OPTIONS.map((option) => {
                const selected = record.status === option.status;
                return (
                  <button
                    key={option.status}
                    type="button"
                    aria-pressed={selected}
                    disabled={readOnly || busy}
                    onClick={() => onMark(record.id, option.status)}
                    className={cn(
                      "inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border text-[13px] font-medium transition-colors sm:h-10",
                      "disabled:cursor-not-allowed",
                      selected
                        ? option.selected
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50",
                    )}
                  >
                    {selected && <CheckIcon width={16} height={16} />}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
