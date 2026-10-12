"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  BookIcon,
  ChevronRightIcon,
  FileCheckIcon,
  SparkIcon,
  UploadIcon,
  UserCheckIcon,
} from "@/components/ui/icons";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { Activity, Course, GradebookRow, Paginated } from "@/types/api";

export function ActivityPicker() {
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const [courseId, setCourseId] = useState("");
  const gradebook = useApiQuery<{ activities: Activity[]; rows: GradebookRow[] }>(
    courseId ? `/courses/${courseId}/gradebook` : null,
  );
  const course = courses.data?.data.find((item) => item.id === courseId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entregas"
        description="Elige un curso y una actividad para subir entregas y revisar las sugerencias de calificación de la IA."
      />

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <div role="status" aria-label="Cargando cursos" className="grid gap-4 lg:grid-cols-12 lg:gap-6">
          <Skeleton className="h-36 rounded-2xl lg:col-span-4" />
          <Skeleton className="h-56 rounded-2xl lg:col-span-8" />
        </div>
      ) : courses.data.data.length === 0 ? (
        <EmptyState title="Sin cursos" description="Aún no tienes cursos asignados. Contacta al administrador." />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
          <div className="space-y-4 lg:col-span-4 lg:space-y-6">
            <Card>
              <CardHeader title="Curso" description="Las actividades se cargan desde la planilla del curso." />
              <Select aria-label="Curso" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">Selecciona un curso…</option>
                {courses.data.data.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.subject.name}
                  </option>
                ))}
              </Select>
            </Card>
            <ProcessSteps
              title="De la entrega a la nota publicada"
              steps={[
                {
                  icon: UploadIcon,
                  actor: "Tú",
                  title: "Subes entregas y rúbrica",
                  text: "Defines los criterios y sus pesos; deben sumar 100 %.",
                },
                {
                  icon: SparkIcon,
                  actor: "IA",
                  title: "La IA propone una nota",
                  text: "Por cada estudiante, con la justificación y la evidencia de cada criterio.",
                },
                {
                  icon: UserCheckIcon,
                  actor: "Tú",
                  title: "Apruebas, editas o rechazas",
                  text: "Solo lo que apruebas o editas llega a la planilla y al estudiante.",
                },
              ]}
            />
          </div>

          <Card className="lg:col-span-8">
            <CardHeader
              title="Actividades"
              description={course ? `${course.name} · ${course.subject.name}` : undefined}
            />
            {!courseId ? (
              <EmptyState
                inset
                icon={<BookIcon width={20} height={20} />}
                title="Elige un curso"
                description="Verás aquí sus actividades para subir entregas y revisar las sugerencias."
              />
            ) : gradebook.error !== null ? (
              <ErrorState error={gradebook.error} onRetry={gradebook.reload} />
            ) : gradebook.loading || !gradebook.data ? (
              <div role="status" aria-label="Cargando actividades" className="space-y-2">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : gradebook.data.activities.length === 0 ? (
              <EmptyState
                inset
                title="Sin actividades"
                description="Este curso aún no tiene actividades. Créalas desde la planilla de notas."
              />
            ) : (
              <ul className="divide-y divide-border-soft overflow-hidden rounded-xl border border-border-soft">
                {gradebook.data.activities.map((activity) => (
                  <li key={activity.id}>
                    <Link
                      href={`/entregas/${activity.id}?name=${encodeURIComponent(activity.name)}`}
                      className="group flex min-h-14 items-center gap-3 px-3 py-3 transition-colors hover:bg-stone-50 sm:px-4"
                    >
                      <FileCheckIcon className="shrink-0 text-stone-400" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-900">{activity.name}</span>
                      <span className="font-mono text-xs text-stone-600" title="Peso en la nota del periodo">
                        {activity.weightPct} %
                      </span>
                      <ChevronRightIcon className="shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
