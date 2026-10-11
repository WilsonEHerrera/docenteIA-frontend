"use client";

import Link from "next/link";
import { RiskChip } from "@/components/ai/RiskChip";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useTodaySchedule } from "@/hooks/useTodaySchedule";
import { useAuth } from "@/providers/AuthProvider";
import type { DashboardSummary } from "@/types/todo-api";

function SectionSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

function DemoTag() {
  return (
    <span
      className="font-mono text-[10px] uppercase tracking-wide text-stone-500"
      title="Datos de demostración: el endpoint aún no está implementado en el backend"
    >
      Demo
    </span>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const schedule = useTodaySchedule();
  // TODO(api): GET /dashboard is not in docs/API_CONTRATO.md (still mocked).
  const dashboard = useApiQuery<DashboardSummary>("/dashboard");
  const firstName = user?.fullName.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Hola, {firstName}</h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Esto es lo que necesita tu atención hoy.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-base font-semibold text-stone-900">Horario de hoy</h2>
          {schedule.error !== null ? (
            <ErrorState error={schedule.error} onRetry={schedule.reload} />
          ) : schedule.loading ? (
            <SectionSkeleton />
          ) : schedule.slots.length === 0 ? (
            <EmptyState title="Sin clases hoy" description="No tienes clases programadas para hoy." />
          ) : (
            <ul className="space-y-2">
              {schedule.slots.map((slot) => (
                <li key={`${slot.courseId}-${slot.startTime}`}>
                  <Link
                    href="/asistencia"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-soft p-3 transition-colors hover:bg-stone-50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-stone-900">{slot.courseName}</span>
                      <span className="block text-xs text-stone-600">
                        {slot.subject}
                        {slot.room ? ` · ${slot.room}` : ""}
                      </span>
                    </span>
                    <span className="font-mono text-xs text-stone-700">
                      {slot.startTime}–{slot.endTime}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Alertas de fallas</h2>
            <DemoTag />
          </div>
          {dashboard.error !== null ? (
            <ErrorState error={dashboard.error} onRetry={dashboard.reload} />
          ) : dashboard.loading || !dashboard.data ? (
            <SectionSkeleton />
          ) : dashboard.data.riskAlerts.length === 0 ? (
            <EmptyState title="Sin alertas" description="Ningún estudiante está cerca del límite de fallas." />
          ) : (
            <ul className="space-y-2">
              {dashboard.data.riskAlerts.map((alert) => (
                <li
                  key={`${alert.courseName}-${alert.studentId}`}
                  className="space-y-1.5 rounded-xl border border-border-soft p-3"
                >
                  <p className="text-sm font-semibold text-stone-900">{alert.studentName}</p>
                  <p className="text-xs text-stone-600">{alert.courseName}</p>
                  <RiskChip absences={alert.absences} maxAbsences={alert.maxAbsences} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Sugerencias por aprobar</h2>
            <DemoTag />
          </div>
          {dashboard.error !== null ? (
            <ErrorState error={dashboard.error} onRetry={dashboard.reload} />
          ) : dashboard.loading || !dashboard.data ? (
            <SectionSkeleton />
          ) : dashboard.data.pendingSuggestions.length === 0 ? (
            <EmptyState title="Todo al día" description="No tienes sugerencias de IA pendientes de revisión." />
          ) : (
            <ul className="space-y-2">
              {dashboard.data.pendingSuggestions.map((item) => (
                <li key={item.activityId}>
                  <Link
                    href={`/entregas/${item.activityId}?name=${encodeURIComponent(item.activityName)}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 p-3 transition-colors hover:bg-stone-50"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-stone-900">{item.activityName}</span>
                      <span className="block text-xs text-stone-600">{item.courseName}</span>
                    </span>
                    <Badge variant="info">{item.count} por revisar</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
