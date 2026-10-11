"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Entregas</h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Elige un curso y una actividad para subir entregas y revisar las sugerencias de la IA.
        </p>
      </div>

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <Card>
          <Select label="Curso" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">Selecciona un curso…</option>
            {courses.data.data.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} · {course.subject.name}
              </option>
            ))}
          </Select>

          {courseId &&
            (gradebook.error !== null ? (
              <ErrorState error={gradebook.error} onRetry={gradebook.reload} />
            ) : gradebook.loading || !gradebook.data ? (
              <div role="status" aria-label="Cargando actividades" className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : gradebook.data.activities.length === 0 ? (
              <EmptyState
                title="Sin actividades"
                description="Este curso aún no tiene actividades. Créalas desde la planilla de notas."
              />
            ) : (
              <ul className="space-y-2">
                {gradebook.data.activities.map((activity) => (
                  <li key={activity.id}>
                    <Link
                      href={`/entregas/${activity.id}?name=${encodeURIComponent(activity.name)}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border-soft p-3 transition-colors hover:bg-stone-50"
                    >
                      <span className="text-sm font-semibold text-stone-900">{activity.name}</span>
                      <span className="font-mono text-xs text-stone-700">{activity.weightPct} %</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </Card>
      )}
    </div>
  );
}
