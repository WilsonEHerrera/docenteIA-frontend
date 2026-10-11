"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { Course, Paginated } from "@/types/api";

export function CourseList() {
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Notas</h1>
        <p className="text-sm text-stone-600 leading-relaxed">Elige un curso para ver su planilla.</p>
      </div>

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <div role="status" aria-label="Cargando cursos" className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : courses.data.data.length === 0 ? (
        <EmptyState title="Sin cursos" description="Aún no tienes cursos asignados. Contacta al administrador." />
      ) : (
        <ul className="space-y-3">
          {courses.data.data.map((course) => (
            <li key={course.id}>
              <Link href={`/notas/${course.id}`} className="block">
                <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-stone-50">
                  <span>
                    <span className="block text-sm font-semibold text-stone-900">{course.name}</span>
                    <span className="block text-xs text-stone-600">{course.subject.name}</span>
                  </span>
                  <span className="font-mono text-xs text-stone-700">{course.period}</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
