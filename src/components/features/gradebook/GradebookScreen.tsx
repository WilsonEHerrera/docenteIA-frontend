"use client";

import { useState } from "react";
import { OriginTag } from "@/components/ai/OriginTag";
import { RiskChip } from "@/components/ai/RiskChip";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  AlertTriangleIcon,
  DownloadIcon,
  FileCheckIcon,
  GaugeIcon,
  TableIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { StatTile } from "@/components/ui/StatTile";
import { PageHeader } from "@/components/ui/PageHeader";
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

  const ready = book.data !== null && book.data.activities.length > 0 && book.data.rows.length > 0;

  const header = (
    <PageHeader
      back={{ href: "/notas", label: "Notas" }}
      title={course ? course.name : "Planilla de notas"}
      description={course ? `${course.subject.name} · Periodo ${course.period}` : undefined}
      actions={
        ready && (
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={exporting === "pdf"}
              disabled={exporting !== null}
              onClick={() => void exportBook("pdf")}
              aria-label="Exportar planilla en PDF"
            >
              {exporting !== "pdf" && <DownloadIcon />}
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={exporting === "xlsx"}
              disabled={exporting !== null}
              onClick={() => void exportBook("xlsx")}
              aria-label="Exportar planilla en Excel"
            >
              {exporting !== "xlsx" && <DownloadIcon />}
              Excel
            </Button>
          </>
        )
      }
    />
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
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const { activities, rows } = book.data;
  const weightSum = activities.reduce((sum, activity) => sum + Number(activity.weightPct), 0);
  const weightsOk = Math.abs(weightSum - 100) < 0.001;
  const atRisk = rows.filter((row) => row.atRisk).length;

  return (
    <div className="space-y-6">
      {header}

      {!ready ? (
        <EmptyState
          icon={<TableIcon width={20} height={20} />}
          title="Sin notas todavía"
          description="Este curso aún no tiene actividades ni estudiantes con notas registradas."
        />
      ) : (
        <>
          {!weightsOk && (
            <Alert variant="warning" title="Los pesos no suman 100 %">
              Las actividades suman <span className="font-mono font-semibold">{weightSum} %</span>. El promedio puede
              no ser confiable: ajusta los pesos de las actividades.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatTile label="Estudiantes" icon={<UsersIcon />} value={rows.length} />
            <StatTile label="Actividades" icon={<FileCheckIcon />} value={activities.length} />
            <StatTile
              label="En riesgo por fallas"
              icon={<AlertTriangleIcon />}
              value={atRisk}
              tone={atRisk > 0 ? "warning" : "default"}
              hint={course ? `Límite del curso: ${course.maxAbsences} fallas.` : undefined}
            />
            <StatTile
              label="Peso de las actividades"
              icon={<GaugeIcon />}
              value={`${weightSum} %`}
              tone={weightsOk ? "default" : "warning"}
              hint={weightsOk ? "Suma completa." : "Debe sumar 100 %."}
            />
          </div>

          <Tabs
            aria-label="Vista de notas"
            value={view}
            onChange={(value) => setView(value as View)}
            items={[
              { value: "table", label: "Planilla" },
              { value: "charts", label: "Gráficas" },
            ]}
          />

          {view === "charts" ? (
            <GradebookCharts rows={rows} />
          ) : (
            <div className="space-y-2">
              <Table label="Planilla de notas" containerClassName="max-h-[70vh]">
                <THead>
                  <TR>
                    <TH sticky className="min-w-44">
                      Estudiante
                    </TH>
                    {activities.map((activity) => (
                      <TH key={activity.id} numeric className="min-w-24">
                        <span className="block max-w-40 truncate" title={activity.name}>
                          {activity.name}
                        </span>
                        <span className="block font-mono font-normal text-stone-500 normal-case">
                          {activity.weightPct} %
                        </span>
                      </TH>
                    ))}
                    <TH numeric>
                      Promedio
                    </TH>
                    <TH numeric>Fallas</TH>
                    <TH>Riesgo</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <TR key={row.studentId}>
                      <TD sticky className="font-medium whitespace-nowrap text-stone-900">
                        {row.studentName}
                      </TD>
                      {activities.map((activity) => (
                        <TD key={activity.id} numeric>
                          {row.grades[activity.id] ?? <span className="text-stone-400">—</span>}
                        </TD>
                      ))}
                      <TD numeric className="font-semibold text-stone-900">
                        {row.average}
                      </TD>
                      <TD numeric>{row.absences}</TD>
                      <TD className="whitespace-nowrap">
                        {row.atRisk && course ? (
                          <RiskChip absences={row.absences} maxAbsences={course.maxAbsences} />
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <OriginTag origin="auto" label="Promedios, fallas y riesgo calculados por el sistema" />
            </div>
          )}
          {/* TODO(api): inline grade editing needs a grade id per cell (PUT /grades/:id); GradebookRow does not expose it. */}
        </>
      )}
    </div>
  );
}
