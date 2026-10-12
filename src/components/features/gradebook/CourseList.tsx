"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertTriangleIcon, BookIcon, ChevronRightIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { Course, Paginated } from "@/types/api";

export function CourseList() {
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const list = courses.data?.data ?? [];
  const students = list.reduce((sum, course) => sum + course.enrolledCount, 0);
  const periods = [...new Set(list.map((course) => course.period))];
  const subjects = new Set(list.map((course) => course.subject.id)).size;

  return (
    <div className="space-y-6">
      <PageHeader title="Notas" description="Elige un curso para ver su planilla de calificaciones, promedios y alertas." />

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <div role="status" aria-label="Cargando cursos" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="hidden h-28 rounded-2xl lg:block" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="Sin cursos" description="Aún no tienes cursos asignados. Contacta al administrador." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            <StatTile
              label="Cursos"
              icon={<BookIcon />}
              value={courses.data.meta.total}
              hint={`${subjects} ${subjects === 1 ? "materia" : "materias"}.`}
            />
            <StatTile label="Estudiantes" icon={<UsersIcon />} value={students} hint="Matrícula total de los cursos." />
            <div className="col-span-2 lg:col-span-1">
              <StatTile
                label="Periodo"
                icon={<ClockIcon />}
                value={periods.length === 1 ? periods[0] : periods.length}
                hint={periods.length === 1 ? "Periodo académico en curso." : "Periodos con cursos activos."}
              />
            </div>
          </div>

          <section aria-labelledby="courses-heading" className="space-y-3">
            <h2 id="courses-heading" className="text-lg font-semibold tracking-tight text-stone-900">
              Planillas por curso
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:gap-4">
              {list.map((course) => (
                <li key={course.id}>
                  <Link
                    href={`/notas/${course.id}`}
                    className="group flex h-full flex-col gap-4 rounded-2xl border border-border-soft bg-white p-4 shadow-xs transition-[border-color,box-shadow] hover:border-stone-300 hover:shadow-sm sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-lg leading-snug font-semibold tracking-tight text-stone-900">
                          {course.name}
                        </p>
                        <p className="truncate text-[13px] text-stone-600">{course.subject.name}</p>
                      </div>
                      <ChevronRightIcon className="mt-1 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-700" />
                    </div>
                    <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-border-soft pt-4 text-xs">
                      {[
                        { Icon: UsersIcon, term: "Estudiantes", value: course.enrolledCount },
                        { Icon: AlertTriangleIcon, term: "Límite", value: `${course.maxAbsences} fallas` },
                        { Icon: ClockIcon, term: "Periodo", value: course.period },
                      ].map(({ Icon, term, value }) => (
                        <div key={term} className="min-w-0 space-y-1">
                          <dt className="flex items-center gap-1.5 text-stone-500">
                            <Icon width={13} height={13} className="shrink-0" />
                            {term}
                          </dt>
                          <dd className="truncate font-mono font-semibold text-stone-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
