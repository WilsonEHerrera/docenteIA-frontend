import { Card } from "@/components/ui/Card";
import type { GradebookRow } from "@/types/api";

// Pure-CSS charts: Recharts is not installed yet (docs/FRONTEND.md §10, Fase 4 lazy-loads it).
// Averages come from the backend; the UI only reads them and groups them for display.

const SCALE_MAX = 5;

export function GradebookCharts({ rows }: { rows: GradebookRow[] }) {
  const values = rows.map((row) => ({ row, value: Number(row.average) }));
  const buckets = [
    { label: "Menos de 3.0", count: values.filter((v) => v.value < 3).length, danger: true },
    { label: "3.0 a 3.9", count: values.filter((v) => v.value >= 3 && v.value < 4).length, danger: false },
    { label: "4.0 o más", count: values.filter((v) => v.value >= 4).length, danger: false },
  ];
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Promedio por estudiante</h2>
        <ul className="space-y-3">
          {values.map(({ row, value }) => (
            <li key={row.studentId} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-stone-700">{row.studentName}</span>
                <span className="font-mono font-semibold text-stone-900">{row.average}</span>
              </div>
              <div className="h-2 rounded-full bg-stone-100" role="img" aria-label={`${row.studentName}: ${row.average} de 5`}>
                <div
                  className={`h-2 rounded-full ${value < 3 ? "bg-rose-600" : "bg-stone-900"}`}
                  style={{ width: `${Math.min(100, (value / SCALE_MAX) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Distribución de promedios</h2>
        <ul className="space-y-3">
          {buckets.map((bucket) => (
            <li key={bucket.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-700">{bucket.label}</span>
                <span className="font-mono font-semibold text-stone-900">{bucket.count}</span>
              </div>
              <div className="h-2 rounded-full bg-stone-100" aria-hidden="true">
                <div
                  className={`h-2 rounded-full ${bucket.danger ? "bg-rose-600" : "bg-stone-900"}`}
                  style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
