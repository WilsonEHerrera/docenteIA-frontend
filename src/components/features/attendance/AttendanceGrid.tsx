"use client";

import { ConfidenceBadge } from "@/components/ai/ConfidenceBadge";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/auth/roles";
import type { AttendanceRecord, AttendanceStatus } from "@/types/api";

interface AttendanceGridProps {
  records: AttendanceRecord[];
  readOnly?: boolean;
  busyIds?: ReadonlySet<string>;
  onMark: (recordId: string, status: AttendanceStatus) => void;
}

const OPTIONS: Array<{ status: AttendanceStatus; label: string }> = [
  { status: "PRESENT", label: "Presente" },
  { status: "ABSENT", label: "Ausente" },
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
              "space-y-3 rounded-xl border bg-white p-3",
              unrecognized ? "border-amber-200 bg-amber-50" : "border-border-soft",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700"
              >
                {initials(record.studentName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-stone-900">{record.studentName}</p>
                <p className="font-mono text-[11px] text-stone-500">{record.studentId}</p>
              </div>
              {record.status === "PRESENT" && record.source === "MANUAL" ? (
                <span className="font-mono text-[11px] uppercase text-stone-500">Manual</span>
              ) : (
                <ConfidenceBadge status={record.status} confidence={record.confidence} />
              )}
            </div>

            <div role="group" aria-label={`Asistencia de ${record.studentName}`} className="flex gap-2">
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
                      "flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? option.status === "PRESENT"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-rose-200 bg-rose-50 text-rose-700"
                        : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
                    )}
                  >
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
