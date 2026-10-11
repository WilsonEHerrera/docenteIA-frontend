"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { CourseDetail, Weekday } from "@/types/api";

const WEEKDAYS: Array<{ value: Weekday; label: string }> = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function ScheduleForm({ courseId, onCreated }: { courseId: string; onCreated: () => void }) {
  const toast = useToast();
  const [weekday, setWeekday] = useState<Weekday>("MONDAY");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:40");
  const [room, setRoom] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!TIME.test(startTime) || !TIME.test(endTime)) {
      setError("Escribe las horas en formato HH:mm, por ejemplo 07:00.");
      return;
    }
    if (startTime >= endTime) {
      setError("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/courses/${courseId}/schedules`, {
        method: "POST",
        body: { weekday, startTime, endTime, ...(room.trim() ? { room: room.trim() } : {}) },
      });
      toast.show("Horario agregado.", "success");
      setRoom("");
      onCreated();
    } catch (caught) {
      toast.show(errorMessage(caught), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <Select label="Día" value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)}>
        {WEEKDAYS.map((day) => (
          <option key={day.value} value={day.value}>
            {day.label}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Inicio (HH:mm)" className="font-mono" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <Input label="Fin (HH:mm)" className="font-mono" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <Input label="Salón (opcional)" value={room} onChange={(e) => setRoom(e.target.value)} />
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
      <Button type="submit" loading={saving}>
        Agregar horario
      </Button>
    </form>
  );
}

export function CourseDetailAdmin({ courseId }: { courseId: string }) {
  const { data, error, loading, reload } = useApiQuery<CourseDetail>(`/courses/${courseId}`);

  const back = (
    <Link href="/admin/cursos" className="text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900">
      ← Cursos
    </Link>
  );

  if (error !== null) {
    return (
      <div className="space-y-4">
        {back}
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div role="status" aria-label="Cargando curso" className="space-y-4">
        {back}
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const dayLabel = (day: Weekday) => WEEKDAYS.find((item) => item.value === day)?.label ?? day;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        {back}
        <h2 className="text-xl font-bold tracking-tight text-stone-900">{data.name}</h2>
        <p className="text-sm text-stone-600">
          {data.subject.name} · {data.teacher.fullName} ·{" "}
          <span className="font-mono">{data.period}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="text-base font-semibold text-stone-900">Horarios</h3>
          {data.schedules.length === 0 ? (
            <EmptyState title="Sin horarios" description="Agrega los días y horas en que se dicta el curso." />
          ) : (
            <ul className="space-y-2">
              {data.schedules.map((schedule) => (
                <li
                  key={schedule.id}
                  className="flex items-center justify-between rounded-xl border border-border-soft p-3 text-xs"
                >
                  <span className="font-medium text-stone-900">{dayLabel(schedule.weekday)}</span>
                  <span className="font-mono text-stone-700">
                    {schedule.startTime}–{schedule.endTime}
                    {schedule.room ? ` · ${schedule.room}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <ScheduleForm courseId={courseId} onCreated={reload} />
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-stone-900">
            Estudiantes <span className="font-mono text-stone-500">({data.students.length})</span>
          </h3>
          {data.students.length === 0 ? (
            <EmptyState
              title="Sin estudiantes matriculados"
              description="Matricula estudiantes desde la sección Matrícula."
            />
          ) : (
            <Table containerClassName="max-h-80">
              <THead>
                <TR>
                  <TH>Código</TH>
                  <TH>Nombre</TH>
                </TR>
              </THead>
              <TBody>
                {data.students.map((student) => (
                  <TR key={student.id}>
                    <TD className="font-mono">{student.code}</TD>
                    <TD>{student.fullName}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
