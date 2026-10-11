"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { Course, ImportReport, Paginated } from "@/types/api";

const MAX_CSV_BYTES = 1024 * 1024;
const CODE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

function ImportCard() {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    setReport(null);
    if (!picked) return;
    if (!/\.csv$/i.test(picked.name)) return setProblem("El archivo debe ser un CSV (.csv).");
    if (picked.size > MAX_CSV_BYTES) return setProblem("El archivo pesa más de 1 MB. Divídelo en partes.");
    setProblem(null);
    setFile(picked);
  }

  async function upload() {
    if (!file) return;
    setLoading(true);
    setProblem(null);
    try {
      const text = await file.text();
      const result = await apiFetch<ImportReport>("/courses/import", {
        method: "POST",
        body: text,
        contentType: "text/csv",
      });
      setReport(result);
      toast.show(
        result.errors.length === 0 ? "Importación completada." : "Importación terminada con errores.",
        result.errors.length === 0 ? "success" : "warning",
      );
    } catch (error) {
      setProblem(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-stone-900">Importar matrícula (CSV)</h3>
      <p className="text-xs leading-relaxed text-stone-600">
        Primera fila obligatoria:{" "}
        <code className="font-mono">course,studentCode,fullName,email</code>. El campo{" "}
        <code className="font-mono">course</code> es el nombre del curso. Máximo 2000 filas y 1 MB.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        aria-label="Archivo CSV de matrícula"
        className="block w-full cursor-pointer text-xs text-stone-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-stone-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium"
      />
      {file && <p className="font-mono text-[11px] text-stone-500">{file.name}</p>}
      {problem && (
        <p role="alert" className="text-xs text-rose-700">
          {problem}
        </p>
      )}
      <Button onClick={() => void upload()} loading={loading} disabled={!file}>
        Importar
      </Button>

      {report && (
        <div className="space-y-3" role="status">
          <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {[
              ["Filas", report.totalRows],
              ["Matriculados", report.enrolled],
              ["Ya matriculados", report.alreadyEnrolled],
              ["Estudiantes nuevos", report.studentsCreated],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border-soft p-2">
                <dd className="font-mono text-lg font-semibold text-stone-900">{value}</dd>
                <dt className="text-[11px] text-stone-600">{label}</dt>
              </div>
            ))}
          </dl>
          {report.errors.length > 0 && (
            <Table containerClassName="max-h-64">
              <THead>
                <TR>
                  <TH numeric>Fila</TH>
                  <TH>Error</TH>
                </TR>
              </THead>
              <TBody>
                {report.errors.map((item) => (
                  <TR key={`${item.row}-${item.message}`}>
                    <TD numeric>{item.row}</TD>
                    <TD>{item.message}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      )}
    </Card>
  );
}

function StudentCard() {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!CODE_PATTERN.test(code)) found.code = "Usa letras, números, guion o guion bajo (máx. 32).";
    if (fullName.trim().length < 2) found.fullName = "Escribe el nombre completo.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) found.email = "Escribe un correo válido o déjalo vacío.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaving(true);
    try {
      await apiFetch("/students", {
        method: "POST",
        body: { code, fullName: fullName.trim(), ...(email ? { email: email.trim() } : {}) },
      });
      toast.show("Estudiante creado.", "success");
      setCode("");
      setFullName("");
      setEmail("");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-stone-900">Nuevo estudiante</h3>
      <form onSubmit={submit} noValidate className="space-y-3">
        <Input label="Código" className="font-mono" value={code} onChange={(e) => setCode(e.target.value)} error={errors.code} />
        <Input label="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.fullName} />
        <Input label="Correo (opcional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Button type="submit" loading={saving}>
          Crear estudiante
        </Button>
      </form>
    </Card>
  );
}

function EnrollCard() {
  const toast = useToast();
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const [courseId, setCourseId] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId) return setError("Elige un curso.");
    if (!CODE_PATTERN.test(studentCode)) return setError("Escribe el código del estudiante.");
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/courses/${courseId}/enrollments`, { method: "POST", body: { studentCode } });
      toast.show("Estudiante matriculado.", "success");
      setStudentCode("");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="text-base font-semibold text-stone-900">Matricular estudiante</h3>
      <form onSubmit={submit} noValidate className="space-y-3">
        <Select label="Curso" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">{courses.loading ? "Cargando…" : "Selecciona un curso…"}</option>
          {courses.data?.data.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} · {course.period}
            </option>
          ))}
        </Select>
        <Input
          label="Código del estudiante"
          className="font-mono"
          value={studentCode}
          onChange={(e) => setStudentCode(e.target.value)}
        />
        {error && (
          <p role="alert" className="text-xs text-rose-700">
            {error}
          </p>
        )}
        <Button type="submit" loading={saving}>
          Matricular
        </Button>
      </form>
    </Card>
  );
}

export function EnrollmentScreen() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-stone-900">Matrícula</h2>
      <ImportCard />
      <div className="grid gap-4 lg:grid-cols-2">
        <StudentCard />
        <EnrollCard />
      </div>
    </div>
  );
}
