"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { OriginTag } from "@/components/ai/OriginTag";
import { RiskChip } from "@/components/ai/RiskChip";
import { Badge } from "@/components/ui/Badge";
import { BarList } from "@/components/ui/BarList";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  AlertTriangleIcon,
  BookIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  GaugeIcon,
  SparkIcon,
  UserCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useTodaySchedule } from "@/hooks/useTodaySchedule";
import { useAuth } from "@/providers/AuthProvider";
import { EducationQuote } from "./EducationQuote";
import type { Course, Paginated } from "@/types/api";
import type { DashboardSummary } from "@/types/todo-api";

const today = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" });

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

const rowLink =
  "group flex items-center gap-3 rounded-xl border border-border-soft p-3 transition-colors hover:border-stone-300 hover:bg-stone-50";

const PRINCIPLE = [
  { Icon: GaugeIcon, who: "El sistema", text: "calcula promedios, fallas y alertas." },
  { Icon: SparkIcon, who: "La IA", text: "interpreta entregas y propone notas y preguntas." },
  { Icon: UserCheckIcon, who: "Tú", text: "revisas, ajustas y decides qué se publica." },
];

/** Editorial block: a sourced quote and the product principle, in place of empty space. */
function PrincipleCard({ wide = false }: { wide?: boolean }) {
  return (
    <Card
      spacing={wide ? "none" : "lg"}
      className={`relative overflow-hidden ${wide ? "grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10" : ""}`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -top-10 -right-10 size-44 text-stone-100"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
      >
        {[30, 50, 70, 90].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} />
        ))}
      </svg>
      <EducationQuote className={wide ? "self-center" : undefined} />
      <div
        className={`relative space-y-3 border-border-soft ${wide ? "border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-10" : "border-t pt-5"}`}
      >
        <p className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase">Cómo trabaja DocentIA</p>
        <ul className="space-y-2.5">
          {PRINCIPLE.map(({ Icon, who, text }) => (
            <li key={who} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-stone-700">
              <Icon width={16} height={16} className="mt-0.5 shrink-0 text-stone-500" />
              <span>
                <span className="font-semibold text-stone-900">{who}</span> {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const role = user?.role;
  const schedule = useTodaySchedule();
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  // TODO(api): GET /dashboard is not in docs/API_CONTRATO.md (still mocked).
  const dashboard = useApiQuery<DashboardSummary>("/dashboard");

  const firstName = user?.fullName.split(" ")[0] ?? "";
  const date = today.format(new Date());
  // Pending AI suggestions are a teacher's queue; other roles never see unreviewed proposals.
  const isTeacher = role === "TEACHER";
  const seesEnrollment = role === "TEACHER" || role === "COORDINATOR" || role === "ADMIN";
  const showSchedule = isTeacher || schedule.slots.length > 0;

  const courseList = courses.data?.data ?? [];
  const students = courseList.reduce((sum, course) => sum + course.enrolledCount, 0);
  const alerts = dashboard.data?.riskAlerts ?? [];
  const exceeded = alerts.filter((alert) => alert.absences > alert.maxAbsences).length;
  const pending = (dashboard.data?.pendingSuggestions ?? []).reduce((sum, item) => sum + item.count, 0);
  const coursesReady = courses.data !== null;
  const dashboardReady = dashboard.data !== null;

  const tiles: Array<{ key: string; node: ReactNode }> = [];
  if (isTeacher) {
    tiles.push({
      key: "today",
      node: (
        <StatTile
          label="Clases hoy"
          icon={<ClockIcon />}
          value={schedule.loading ? null : schedule.slots.length}
          hint={schedule.slots[0] ? `La primera empieza a las ${schedule.slots[0].startTime}.` : "Sin clases programadas."}
        />
      ),
    });
  }
  tiles.push({
    key: "courses",
    node: (
      <StatTile
        label={isTeacher ? "Tus cursos" : "Cursos"}
        icon={<BookIcon />}
        value={coursesReady ? courses.data!.meta.total : null}
        hint={courseList[0] ? `Periodo ${courseList[0].period}.` : undefined}
      />
    ),
  });
  if (seesEnrollment && !isTeacher) {
    tiles.push({
      key: "students",
      node: (
        <StatTile
          label="Estudiantes matriculados"
          icon={<UsersIcon />}
          value={coursesReady ? students : null}
          hint="Suma de la matrícula de los cursos."
        />
      ),
    });
  }
  tiles.push({
    key: "alerts",
    node: (
      <StatTile
        label="Alertas de fallas"
        icon={<AlertTriangleIcon />}
        tone={exceeded > 0 ? "danger" : alerts.length > 0 ? "warning" : "default"}
        value={dashboardReady ? alerts.length : null}
        hint={
          dashboardReady
            ? exceeded > 0
              ? `${exceeded} ya superaron el límite.`
              : alerts.length > 0
                ? "Cerca del límite, ninguno lo ha superado."
                : "Nadie está cerca del límite."
            : undefined
        }
      />
    ),
  });
  if (isTeacher) {
    tiles.push({
      key: "pending",
      node: (
        <StatTile
          label="Sugerencias por revisar"
          icon={<SparkIcon />}
          value={dashboardReady ? pending : null}
          hint="Esperan tu decisión antes de publicarse."
        />
      ),
    });
  }

  const summary = dashboardReady
    ? [
        alerts.length > 0 && `${alerts.length} ${alerts.length === 1 ? "alerta" : "alertas"} de fallas`,
        isTeacher && pending > 0 && `${pending} ${pending === 1 ? "sugerencia" : "sugerencias"} por revisar`,
      ].filter(Boolean)
    : [];

  const alertsCard = (
    <Card>
      <CardHeader
        title="Alertas de fallas"
        description="Estudiantes cerca o por encima del límite de inasistencias de su curso."
        aside={<OriginTag origin="auto" label="Calculado por el sistema" />}
      />
      {dashboard.error !== null ? (
        <ErrorState error={dashboard.error} onRetry={dashboard.reload} />
      ) : !dashboardReady ? (
        <SectionSkeleton rows={3} />
      ) : alerts.length === 0 ? (
        <EmptyState
          inset
          icon={<CheckCircleIcon width={20} height={20} />}
          title="Sin alertas"
          description="Ningún estudiante está cerca del límite de fallas."
        />
      ) : (
        <BarList
          label="Fallas de cada estudiante frente al límite de su curso"
          unit="% del límite"
          max={100}
          items={[...alerts]
            .sort((a, b) => b.absences / b.maxAbsences - a.absences / a.maxAbsences)
            .map((alert) => ({
              key: `${alert.courseName}-${alert.studentId}`,
              label: alert.studentName,
              sublabel: alert.courseName,
              value: Math.round((alert.absences / alert.maxAbsences) * 100),
              status: alert.absences > alert.maxAbsences ? "danger" : "warning",
              display: <RiskChip absences={alert.absences} maxAbsences={alert.maxAbsences} />,
            }))}
        />
      )}
    </Card>
  );

  const enrollmentCard = seesEnrollment && (
    <Card>
      <CardHeader
        title="Estudiantes por curso"
        description="Matrícula actual de cada curso."
        aside={coursesReady && <span className="font-mono text-xs text-stone-500">{students} en total</span>}
      />
      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : !coursesReady ? (
        <SectionSkeleton rows={3} />
      ) : courseList.length === 0 ? (
        <EmptyState inset title="Sin cursos" description="Aún no hay cursos asignados." />
      ) : (
        <BarList
          label="Estudiantes matriculados por curso"
          unit="estudiantes"
          items={[...courseList]
            .sort((a, b) => b.enrolledCount - a.enrolledCount)
            .map((course) => ({
              key: course.id,
              label: course.name,
              sublabel: course.subject.name,
              value: course.enrolledCount,
            }))}
        />
      )}
    </Card>
  );

  // Coordinators and admins follow several courses: group the same alerts by course.
  const alertCounts = new Map<string, number>();
  for (const alert of alerts) alertCounts.set(alert.courseName, (alertCounts.get(alert.courseName) ?? 0) + 1);
  const alertsByCourseCard = !isTeacher && dashboardReady && alerts.length > 0 && (
    <Card>
      <CardHeader title="Alertas por curso" description="Dónde se concentran las inasistencias." />
      <BarList
        label="Número de alertas de fallas por curso"
        unit="alertas"
        items={[...alertCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([courseName, count]) => ({
            key: courseName,
            label: courseName,
            value: count,
            display: `${count} ${count === 1 ? "alerta" : "alertas"}`,
          }))}
      />
    </Card>
  );

  const scheduleCard = showSchedule && (
    <Card>
      <CardHeader title="Horario de hoy" aside={<span className="text-xs text-stone-500">{date}</span>} />
      {schedule.error !== null ? (
        <ErrorState error={schedule.error} onRetry={schedule.reload} />
      ) : schedule.loading ? (
        <SectionSkeleton />
      ) : schedule.slots.length === 0 ? (
        <EmptyState
          inset
          icon={<ClockIcon width={20} height={20} />}
          title="Sin clases hoy"
          description="No tienes clases programadas para hoy."
        />
      ) : (
        <ol className="space-y-2">
          {schedule.slots.map((slot) => (
            <li key={`${slot.courseId}-${slot.startTime}`}>
              <Link href="/asistencia" className={rowLink}>
                <span className="w-[4.5rem] shrink-0 font-mono text-xs leading-tight text-stone-700">
                  {slot.startTime}
                  <span className="block text-stone-400">{slot.endTime}</span>
                </span>
                <span className="min-w-0 flex-1 border-l border-border-soft pl-3">
                  <span className="block truncate text-sm font-semibold text-stone-900">{slot.courseName}</span>
                  <span className="block truncate text-xs text-stone-600">
                    {slot.subject}
                    {slot.room ? ` · ${slot.room}` : ""}
                  </span>
                </span>
                <ChevronRightIcon className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );

  const suggestionsCard = isTeacher && (
    <Card>
      <CardHeader
        title="Sugerencias por revisar"
        description="Propuestas de la IA que esperan tu aprobación antes de publicarse."
        aside={<OriginTag origin="teacher" />}
      />
      {dashboard.error !== null ? (
        <ErrorState error={dashboard.error} onRetry={dashboard.reload} />
      ) : !dashboardReady ? (
        <SectionSkeleton />
      ) : dashboard.data!.pendingSuggestions.length === 0 ? (
        <EmptyState
          inset
          icon={<CheckCircleIcon width={20} height={20} />}
          title="Todo al día"
          description="No tienes sugerencias de IA pendientes de revisión."
        />
      ) : (
        <ul className="space-y-2">
          {dashboard.data!.pendingSuggestions.map((item) => (
            <li key={item.activityId}>
              <Link
                href={`/entregas/${item.activityId}?name=${encodeURIComponent(item.activityName)}`}
                className={rowLink}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-900">{item.activityName}</span>
                  <span className="block truncate text-xs text-stone-600">{item.courseName}</span>
                </span>
                <Badge variant="info">{item.count} por revisar</Badge>
                <ChevronRightIcon className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${firstName}`}
        description={
          <>
            {date.charAt(0).toUpperCase() + date.slice(1)}.{" "}
            {summary.length > 0
              ? `Hoy tienes ${summary.join(" y ")}.`
              : dashboardReady
                ? "No hay pendientes que requieran tu atención."
                : "Esto es lo que necesita tu atención hoy."}
          </>
        }
      />

      <div className={`grid gap-3 sm:grid-cols-2 lg:gap-4 ${tiles.length >= 4 ? "xl:grid-cols-4" : tiles.length === 3 ? "lg:grid-cols-3" : ""}`}>
        {tiles.map((tile) => (
          <div key={tile.key}>{tile.node}</div>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:gap-6 xl:grid-cols-12">
        <div className="space-y-4 lg:space-y-6 xl:col-span-8">
          {alertsCard}
          {enrollmentCard}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:gap-6 xl:col-span-4 xl:grid-cols-1">
          {scheduleCard}
          {suggestionsCard}
          {alertsByCourseCard}
          {!isTeacher && <PrincipleCard />}
        </div>
      </div>

      {isTeacher && <PrincipleCard wide />}
    </div>
  );
}
