"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Pager } from "@/components/ui/Pager";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { Course, Paginated, Subject, UserView } from "@/types/api";

const LIMIT = 20;
const CODE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

function SubjectForm({ onCreated }: { onCreated: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (name.trim().length < 2) found.name = "Escribe el nombre de la materia.";
    if (!CODE_PATTERN.test(code)) found.code = "Usa letras, números, guion o guion bajo (máx. 32).";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await apiFetch("/subjects", { method: "POST", body: { name: name.trim(), code } });
      toast.show("Materia creada.", "success");
      setName("");
      setCode("");
      onCreated();
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <Input label="Nombre de la materia" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input
        label="Código"
        className="font-mono"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        error={errors.code}
      />
      <Button type="submit" loading={saving}>
        Crear materia
      </Button>
    </form>
  );
}

function CourseForm({
  subjects,
  teachers,
  onCreated,
}: {
  subjects: Subject[];
  teachers: UserView[];
  onCreated: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [maxAbsences, setMaxAbsences] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (name.trim().length < 2) found.name = "Escribe el nombre del curso.";
    if (period.trim() === "") found.period = "Indica el periodo (ej. 2026-2).";
    if (!subjectId) found.subjectId = "Elige una materia.";
    if (!teacherId) found.teacherId = "Elige un docente.";
    if (maxAbsences !== "" && !/^\d{1,3}$/.test(maxAbsences)) found.maxAbsences = "Escribe un número entero.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await apiFetch("/courses", {
        method: "POST",
        body: {
          name: name.trim(),
          period: period.trim(),
          subjectId,
          teacherId,
          ...(maxAbsences !== "" ? { maxAbsences: Number(maxAbsences) } : {}),
        },
      });
      toast.show("Curso creado.", "success");
      setName("");
      setPeriod("");
      setMaxAbsences("");
      onCreated();
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <Input label="Nombre del curso" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input label="Periodo" className="font-mono" value={period} onChange={(e) => setPeriod(e.target.value)} error={errors.period} />
      <Select label="Materia" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
        <option value="">Selecciona…</option>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name} ({subject.code})
          </option>
        ))}
      </Select>
      {errors.subjectId && <p role="alert" className="text-[11px] text-rose-700">{errors.subjectId}</p>}
      <Select label="Docente" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
        <option value="">Selecciona…</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.fullName}
          </option>
        ))}
      </Select>
      {errors.teacherId && <p role="alert" className="text-[11px] text-rose-700">{errors.teacherId}</p>}
      <Input
        label="Límite de fallas (opcional)"
        inputMode="numeric"
        className="font-mono"
        value={maxAbsences}
        onChange={(e) => setMaxAbsences(e.target.value)}
        error={errors.maxAbsences}
      />
      <Button type="submit" loading={saving}>
        Crear curso
      </Button>
    </form>
  );
}

export function CoursesAdmin() {
  const [page, setPage] = useState(1);
  const courses = useApiQuery<Paginated<Course>>("/courses", { page, limit: LIMIT });
  const subjects = useApiQuery<Subject[]>("/subjects");
  const users = useApiQuery<Paginated<UserView>>("/users", { page: 1, limit: 100 });

  const teachers = (users.data?.data ?? []).filter((user) => user.role === "TEACHER" && user.isActive);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-stone-900">Cursos</h2>

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <div role="status" aria-label="Cargando cursos" className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : courses.data.data.length === 0 ? (
        <EmptyState title="Sin cursos" description="Crea el primer curso con el formulario de abajo." />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Curso</TH>
                <TH>Materia</TH>
                <TH>Docente</TH>
                <TH>Periodo</TH>
                <TH numeric>Estudiantes</TH>
                <TH numeric>Límite de fallas</TH>
              </TR>
            </THead>
            <TBody>
              {courses.data.data.map((course) => (
                <TR key={course.id}>
                  <TD className="font-medium text-stone-900">
                    <Link
                      href={`/admin/cursos/${course.id}`}
                      className="underline underline-offset-2 hover:text-stone-600"
                    >
                      {course.name}
                    </Link>
                  </TD>
                  <TD>{course.subject.name}</TD>
                  <TD>{course.teacher.fullName}</TD>
                  <TD className="font-mono">{course.period}</TD>
                  <TD numeric>{course.enrolledCount}</TD>
                  <TD numeric>{course.maxAbsences}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pager page={page} limit={LIMIT} total={courses.data.meta.total} onChange={setPage} />
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-stone-900">Nuevo curso</h3>
          {subjects.error !== null ? (
            <ErrorState error={subjects.error} onRetry={subjects.reload} />
          ) : subjects.loading || !subjects.data || users.loading ? (
            <Skeleton className="h-40 w-full" />
          ) : subjects.data.length === 0 ? (
            <EmptyState title="Primero crea una materia" description="Un curso necesita una materia." />
          ) : teachers.length === 0 ? (
            <EmptyState
              title="No hay docentes activos"
              description="Crea un usuario con rol Docente en la sección Usuarios."
            />
          ) : (
            <CourseForm subjects={subjects.data} teachers={teachers} onCreated={courses.reload} />
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-stone-900">Materias</h3>
          {subjects.data && subjects.data.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Materias existentes">
              {subjects.data.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-lg border border-border-soft bg-stone-50 px-2.5 py-1 text-xs text-stone-700"
                >
                  {subject.name} <span className="font-mono text-stone-500">{subject.code}</span>
                </li>
              ))}
            </ul>
          )}
          <SubjectForm onCreated={subjects.reload} />
        </Card>
      </div>
    </div>
  );
}
