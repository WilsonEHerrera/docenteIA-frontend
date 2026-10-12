"use client";

import { useState } from "react";
import { OriginTag } from "@/components/ai/OriginTag";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertTriangleIcon, ChartIcon, DownloadIcon, GaugeIcon, UsersIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AttendanceReport, Course, Paginated, PerformanceReport } from "@/types/api";

type View = "performance" | "attendance";

const dash = <span className="text-stone-400">—</span>;

function PerformanceView({ report }: { report: PerformanceReport }) {
  return (
    <div className="space-y-6">
      {!report.weightsComplete && (
        <Alert variant="warning" title="Los pesos no suman 100 %">
          Las actividades del periodo suman <span className="font-mono font-semibold">{report.weightsTotal} %</span>.
          Los promedios son parciales.
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Promedio del curso" icon={<GaugeIcon />} value={report.courseAverage ?? "—"} />
        <StatTile
          label="Estudiantes calificados"
          icon={<UsersIcon />}
          value={`${report.gradedStudents} / ${report.studentCount}`}
        />
        <StatTile
          label="Por debajo de 3.0"
          icon={<AlertTriangleIcon />}
          value={report.belowPassing}
          tone={report.belowPassing > 0 ? "warning" : "default"}
        />
        <StatTile
          label="En riesgo"
          icon={<AlertTriangleIcon />}
          value={report.atRiskCount}
          tone={report.atRiskCount > 0 ? "warning" : "default"}
          hint={`${report.absenceAlerts} con alerta de fallas.`}
        />
      </div>

      <div className="space-y-2">
        <Table label="Rendimiento por actividad">
          <THead>
            <TR>
              <TH>Actividad</TH>
              <TH numeric>Peso</TH>
              <TH numeric>Calificados</TH>
              <TH numeric>Promedio</TH>
            </TR>
          </THead>
          <TBody>
            {report.activities.map((activity) => (
              <TR key={activity.id}>
                <TD className="font-medium text-stone-900">{activity.name}</TD>
                <TD numeric>{activity.weightPct} %</TD>
                <TD numeric>{activity.gradedCount}</TD>
                <TD numeric>{activity.average ?? dash}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <OriginTag origin="auto" label="Calculado por el sistema" />
      </div>

      {report.atRiskStudents.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-stone-900">Estudiantes en riesgo</h2>
          <Table label="Estudiantes en riesgo">
            <THead>
              <TR>
                <TH>Estudiante</TH>
                <TH>Código</TH>
                <TH numeric>Promedio</TH>
                <TH numeric>Fallas</TH>
                <TH>Alerta de fallas</TH>
              </TR>
            </THead>
            <TBody>
              {report.atRiskStudents.map((student) => (
                <TR key={student.studentId}>
                  <TD className="font-medium text-stone-900">{student.studentName}</TD>
                  <TD className="font-mono">{student.studentCode}</TD>
                  <TD numeric>{student.average ?? dash}</TD>
                  <TD numeric>{student.absences}</TD>
                  <TD>{student.absenceAlert ? "Sí" : dash}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AttendanceView({ report }: { report: AttendanceReport }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <StatTile label="Sesiones confirmadas" icon={<ChartIcon />} value={report.confirmedSessions} />
        <StatTile
          label="Asistencia global"
          icon={<GaugeIcon />}
          value={report.overallAttendancePct === null ? "—" : `${report.overallAttendancePct} %`}
          hint="Presentes sobre presentes y ausentes; las excusas no cuentan."
        />
      </div>
      {report.rows.length === 0 ? (
        <EmptyState title="Sin datos" description="No hay sesiones confirmadas en el rango elegido." />
      ) : (
        <div className="space-y-2">
          <Table label="Asistencia por estudiante">
            <THead>
              <TR>
                <TH>Estudiante</TH>
                <TH>Código</TH>
                <TH numeric>Presente</TH>
                <TH numeric>Ausente</TH>
                <TH numeric>Excusas</TH>
                <TH numeric>Asistencia</TH>
              </TR>
            </THead>
            <TBody>
              {report.rows.map((row) => (
                <TR key={row.studentId}>
                  <TD className="font-medium text-stone-900">{row.studentName}</TD>
                  <TD className="font-mono">{row.studentCode}</TD>
                  <TD numeric>{row.present}</TD>
                  <TD numeric>{row.absent}</TD>
                  <TD numeric>{row.excused}</TD>
                  <TD numeric>{row.attendancePct === null ? dash : `${row.attendancePct} %`}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <OriginTag origin="auto" label="Calculado por el sistema" />
        </div>
      )}
    </div>
  );
}

export function ReportsScreen() {
  const toast = useToast();
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const [courseId, setCourseId] = useState("");
  const [view, setView] = useState<View>("performance");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exporting, setExporting] = useState(false);

  const rangeInvalid = from !== "" && to !== "" && from > to;
  const performance = useApiQuery<PerformanceReport>(
    courseId && view === "performance" ? "/reports/performance" : null,
    { courseId },
  );
  const attendance = useApiQuery<AttendanceReport>(
    courseId && view === "attendance" && !rangeInvalid ? "/reports/attendance" : null,
    { courseId, from: from || undefined, to: to || undefined },
  );
  const current = view === "performance" ? performance : attendance;

  // CSV is the only export the backend offers (API_CONTRATO §6.10).
  async function exportCsv() {
    setExporting(true);
    try {
      const blob = await apiFetch<Blob>("/reports/export", {
        query: {
          type: view,
          format: "csv",
          courseId,
          period: view === "performance" ? performance.data?.period : undefined,
          from: view === "attendance" ? from || undefined : undefined,
          to: view === "attendance" ? to || undefined : undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-${view}-${courseId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Consulta el rendimiento y la asistencia por curso. Las cifras las calcula el sistema."
        actions={
          courseId && current.data !== null && (
            <Button variant="secondary" size="sm" loading={exporting} onClick={() => void exportCsv()} aria-label="Exportar reporte en CSV">
              {!exporting && <DownloadIcon />}
              CSV
            </Button>
          )
        }
      />

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <Skeleton role="status" aria-label="Cargando cursos" className="h-24 w-full rounded-2xl" />
      ) : courses.data.data.length === 0 ? (
        <EmptyState title="Sin cursos" description="Aún no hay cursos para consultar." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Select label="Curso" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">Selecciona un curso…</option>
                {courses.data.data.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} · {course.subject.name}
                  </option>
                ))}
              </Select>
            </div>
            {view === "attendance" && (
              <>
                <Input label="Desde" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                <Input
                  label="Hasta"
                  type="date"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  error={rangeInvalid ? "«Desde» debe ser anterior o igual a «Hasta»." : undefined}
                />
              </>
            )}
          </div>

          <Tabs
            aria-label="Tipo de reporte"
            value={view}
            onChange={(value) => setView(value as View)}
            items={[
              { value: "performance", label: "Rendimiento" },
              { value: "attendance", label: "Asistencia" },
            ]}
          />

          {!courseId ? (
            <EmptyState
              icon={<ChartIcon width={20} height={20} />}
              title="Elige un curso"
              description="Verás aquí su reporte de rendimiento o de asistencia."
            />
          ) : current.error !== null ? (
            <ErrorState error={current.error} onRetry={current.reload} />
          ) : current.loading || current.data === null ? (
            <div role="status" aria-label="Cargando reporte" className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
          ) : view === "performance" ? (
            <PerformanceView report={performance.data as PerformanceReport} />
          ) : (
            <AttendanceView report={attendance.data as AttendanceReport} />
          )}
        </>
      )}
    </div>
  );
}
