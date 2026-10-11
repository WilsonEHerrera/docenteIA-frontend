"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CameraIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { ApiError, errorMessage, isServiceUnavailable } from "@/lib/api/errors";
import type { AttendanceSession, Course, Paginated } from "@/types/api";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
// TODO(api): the contract does not define this error code.
const CONSENT_CODE = "BIOMETRIC_CONSENT_MISSING";

type Problem =
  | { kind: "service-down" }
  | { kind: "no-consent"; message: string }
  | { kind: "error"; message: string };

export function CourseCapture() {
  const router = useRouter();
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const [courseId, setCourseId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("El archivo debe ser una imagen (JPG, PNG o HEIC).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("La foto pesa más de 10 MB. Toma otra con menor resolución.");
      return;
    }
    setPhotoError(null);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function submitPhoto() {
    if (!courseId || !photo) return;
    setSubmitting(true);
    setProblem(null);
    try {
      const form = new FormData();
      form.set("courseId", courseId);
      form.set("photo", photo);
      const session = await apiFetch<AttendanceSession>("/attendance/sessions", {
        method: "POST",
        body: form,
      });
      router.push(`/asistencia/${session.id}`);
    } catch (error) {
      if (isServiceUnavailable(error)) setProblem({ kind: "service-down" });
      else if (error instanceof ApiError && error.code === CONSENT_CODE) {
        setProblem({ kind: "no-consent", message: error.message });
      } else setProblem({ kind: "error", message: errorMessage(error) });
      setSubmitting(false);
    }
  }

  async function continueManual() {
    if (!courseId) return;
    setManualLoading(true);
    try {
      // TODO(api): the contract expects records[]; the backend should seed all enrolled students.
      const session = await apiFetch<AttendanceSession>("/attendance/sessions/manual", {
        method: "POST",
        body: { courseId, records: [] },
      });
      router.push(`/asistencia/${session.id}`);
    } catch (error) {
      setProblem({ kind: "error", message: errorMessage(error) });
      setManualLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Asistencia</h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Elige el curso y toma una foto del grupo. La IA propone quién está presente y tú confirmas.
        </p>
      </div>

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <div role="status" aria-label="Cargando cursos" className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : courses.data.data.length === 0 ? (
        <EmptyState title="Sin cursos" description="Aún no tienes cursos asignados. Contacta al administrador." />
      ) : (
        <Card>
          <Select
            label="Curso"
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setProblem(null);
            }}
          >
            <option value="">Selecciona un curso…</option>
            {courses.data.data.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name} · {course.subject.name}
              </option>
            ))}
          </Select>

          <div className="space-y-3">
            <p className="text-xs font-medium text-stone-700">Foto del grupo</p>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
              <img
                src={preview}
                alt="Vista previa de la foto del grupo"
                className="max-h-72 w-full rounded-xl border border-border-soft object-contain"
              />
            ) : (
              <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-600">
                Aún no has agregado una foto.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 text-xs font-medium text-white transition-colors hover:bg-stone-800 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stone-900">
                <CameraIcon />
                {photo ? "Tomar otra foto" : "Tomar foto"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={onPhoto}
                />
              </label>
              <label className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-stone-200 bg-white px-4 py-3 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stone-900">
                Subir desde galería
                <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
              </label>
            </div>
            {photoError && (
              <p role="alert" className="text-[11px] text-rose-700">
                {photoError}
              </p>
            )}
          </div>

          {problem?.kind === "service-down" && (
            <ManualModeBanner onContinue={continueManual} loading={manualLoading}>
              No pudimos procesar la foto ahora. Puedes marcar la asistencia a mano sin perder tu avance.
            </ManualModeBanner>
          )}
          {problem?.kind === "no-consent" && (
            <ManualModeBanner
              title="Hay estudiantes sin consentimiento"
              onContinue={continueManual}
              loading={manualLoading}
            >
              {problem.message}
            </ManualModeBanner>
          )}
          {problem?.kind === "error" && <ErrorState error={new Error(problem.message)} />}

          <Button
            onClick={submitPhoto}
            loading={submitting}
            disabled={!courseId || !photo}
            className="w-full py-3"
          >
            Enviar foto y proponer asistencia
          </Button>
        </Card>
      )}
    </div>
  );
}
