import { OriginTag } from "@/components/ai/OriginTag";
import { Card, CardHeader } from "@/components/ui/Card";
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
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <Card>
        <CardHeader title="Promedio por estudiante" aside={<OriginTag origin="auto" />} />
        <ul className="space-y-3.5">
          {values.map(({ row, value }) => (
            <li key={row.studentId} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="truncate text-stone-700">{row.studentName}</span>
                <span className={`font-mono font-semibold ${value < 3 ? "text-rose-700" : "text-stone-900"}`}>
                  {row.average}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-stone-100"
                role="img"
                aria-label={`${row.studentName}: ${row.average} de 5${value < 3 ? ", por debajo de 3.0" : ""}`}
              >
                <div
                  className={`h-full rounded-full ${value < 3 ? "bg-rose-600" : "bg-stone-800"}`}
                  style={{ width: `${Math.min(100, (value / SCALE_MAX) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Distribución de promedios" aside={<OriginTag origin="auto" />} />
        <ul className="space-y-3.5">
          {buckets.map((bucket) => (
            <li key={bucket.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-stone-700">{bucket.label}</span>
                <span className="font-mono font-semibold text-stone-900">
                  {bucket.count} <span className="font-normal text-stone-500">est.</span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100" aria-hidden="true">
                <div
                  className={`h-full rounded-full ${bucket.danger ? "bg-rose-600" : "bg-stone-800"}`}
                  style={{ width: `${(bucket.count / maxCount) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">Escala de 0.0 a 5.0. En rojo, promedios por debajo de 3.0.</p>
      </Card>
    </div>
  );
}
