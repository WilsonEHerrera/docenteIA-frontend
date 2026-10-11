"use client";

import Link from "next/link";
import { useState } from "react";
import { RiskChip } from "@/components/ai/RiskChip";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { Activity, Course, GradebookRow, Paginated } from "@/types/api";
import { GradebookCharts } from "./GradebookCharts";

type View = "table" | "charts";
type ExportFormat = "pdf" | "xlsx";

interface Gradebook {
  activities: Activity[];
  rows: GradebookRow[];
}

export function GradebookScreen({ courseId }: { courseId: string }) {
  const toast = useToast();
  const book = useApiQuery<Gradebook>(`/courses/${courseId}/gradebook`);
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const [view, setView] = useState<View>("table");
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const course = courses.data?.data.find((item) => item.id === courseId);

  async function exportBook(format: ExportFormat) {
    setExporting(format);
    try {
      // TODO(api): the contract lists `?type&format`; courseId is assumed until confirmed.
      const blob = await apiFetch<Blob>("/reports/export", {
        query: { type: "gradebook", format, courseId },
        responseType: "blob",
      });
      const extension = blob.type === "text/csv" ? "csv" : format;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `notas-${courseId}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setExporting(null);
    }
  }

  const header = (
    <div className="space-y-1">
      <Link href="/notas" className="text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900">
        ← Notas
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-stone-900">
        Notas{course ? ` · ${course.name}` : ""}
      </h1>
      {course && <p className="text-sm text-stone-600">{course.subject.name}</p>}
    </div>
  );

  if (book.error !== null) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorState error={book.error} onRetry={book.reload} />
      </div>
    );
  }

  if (book.loading || !book.data) {
    return (
      <div role="status" aria-label="Cargando planilla" className="space-y-6">
        {header}
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { activities, rows } = book.data;
  const weightSum = activities.reduce((sum, activity) => sum + Number(activity.weightPct), 0);
  const weightsOk = Math.abs(weightSum - 100) < 0.001;

  return (
    <div className="space-y-6">
      {header}

      {activities.length === 0 || rows.length === 0 ? (
        <EmptyState
          title="Sin notas todavía"
          description="Este curso aún no tiene actividades ni estudiantes con notas registradas."
        />
      ) : (
        <>
          {!weightsOk && (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-stone-700"
            >
              Los porcentajes de las actividades suman{" "}
              <span className="font-mono font-semibold">{weightSum} %</span>, no 100 %. El promedio puede no ser
              confiable: ajusta los pesos de las actividades.
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              aria-label="Vista de notas"
              value={view}
              onChange={(value) => setView(value as View)}
              items={[
                { value: "table", label: "Planilla" },
                { value: "charts", label: "Gráficas" },
              ]}
            />
            <div className="flex gap-2">
              <Button variant="secondary" loading={exporting === "pdf"} onClick={() => void exportBook("pdf")}>
                Exportar PDF
              </Button>
              <Button variant="secondary" loading={exporting === "xlsx"} onClick={() => void exportBook("xlsx")}>
                Exportar Excel
              </Button>
            </div>
          </div>

          {view === "charts" ? (
            <GradebookCharts rows={rows} />
          ) : (
            <div>
              <Table containerClassName="max-h-[70vh]">
                <THead>
                  <TR>
                    <TH>Estudiante</TH>
                    {activities.map((activity) => (
                      <TH key={activity.id} numeric>
                        {activity.name}
                        <span className="block font-mono font-normal normal-case text-stone-500">
                          {activity.weightPct} %
                        </span>
                      </TH>
                    ))}
                    <TH numeric>Promedio</TH>
                    <TH numeric>Fallas</TH>
                    <TH>Riesgo</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <TR key={row.studentId}>
                      <TD className="font-medium text-stone-900">{row.studentName}</TD>
                      {activities.map((activity) => (
                        <TD key={activity.id} numeric>
                          {row.grades[activity.id] ?? "—"}
                        </TD>
                      ))}
                      <TD numeric className="font-semibold text-stone-900">
                        {row.average}
                      </TD>
                      <TD numeric>{row.absences}</TD>
                      <TD>
                        {row.atRisk && course ? (
                          <RiskChip absences={row.absences} maxAbsences={course.maxAbsences} />
                        ) : null}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
          {/* TODO(api): inline grade editing needs a grade id per cell (PUT /grades/:id); GradebookRow does not expose it. */}
        </>
      )}
    </div>
  );
}
