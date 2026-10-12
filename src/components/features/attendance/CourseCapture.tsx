"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type ReactNode } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldMessage } from "@/components/ui/Field";
import { CameraIcon, GaugeIcon, SparkIcon, UploadIcon, UserCheckIcon } from "@/components/ui/icons";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { ApiError, errorMessage, isServiceUnavailable } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import type { AttendanceSession, Course, Paginated } from "@/types/api";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
// TODO(api): the contract does not define this error code.
const CONSENT_CODE = "BIOMETRIC_CONSENT_MISSING";

type Problem =
  | { kind: "service-down" }
  | { kind: "no-consent"; message: string }
  | { kind: "error"; message: string };

const pickerClass =
  "flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-stone-900 sm:h-11";

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-stone-900">
        <span className="flex size-5 items-center justify-center rounded-full bg-stone-900 font-mono text-[10px] text-white">
          {n}
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

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
    <div className="space-y-6">
      <PageHeader
        title="Asistencia"
        description="Elige el curso y toma una foto del grupo. La IA propone quién está presente; tú revisas y confirmas."
      />

      {courses.error !== null ? (
        <ErrorState error={courses.error} onRetry={courses.reload} />
      ) : courses.loading || !courses.data ? (
        <div role="status" aria-label="Cargando cursos" className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="hidden aspect-[4/3] rounded-2xl lg:block" />
        </div>
      ) : courses.data.data.length === 0 ? (
        <EmptyState title="Sin cursos" description="Aún no tienes cursos asignados. Contacta al administrador." />
      ) : (
        <>
          <Card>
            {/* Phones: course, preview, controls. Desktop: steps on the left, preview spanning the right column. */}
            <div className="grid gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-8">
              <Step n={1} title="Curso">
                <Select
                  aria-label="Curso"
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
              </Step>

              <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-72">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not optimizable
                  <img
                    src={preview}
                    alt="Vista previa de la foto del grupo"
                    className="aspect-[4/3] w-full rounded-xl border border-border-soft bg-stone-100 object-contain lg:aspect-auto lg:h-full"
                  />
                ) : (
                  <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 text-center lg:aspect-auto lg:h-full">
                    <CameraIcon width={24} height={24} className="text-stone-400" />
                    <p className="text-[13px] text-stone-600">Aún no has agregado una foto.</p>
                    <p className="text-xs text-stone-500">Procura que se vean los rostros con buena luz.</p>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <Step n={2} title="Foto del grupo">
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                    <label className={cn(pickerClass, "bg-stone-900 text-white shadow-xs hover:bg-stone-800")}>
                      <CameraIcon width={18} height={18} />
                      {photo ? "Tomar otra foto" : "Tomar foto"}
                      <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPhoto} />
                    </label>
                    <label
                      className={cn(pickerClass, "border border-stone-200 bg-white text-stone-800 shadow-xs hover:bg-stone-50")}
                    >
                      <UploadIcon width={18} height={18} />
                      Subir desde galería
                      <input type="file" accept="image/*" className="sr-only" onChange={onPhoto} />
                    </label>
                  </div>
                  <FieldMessage
                    id="attendance-photo"
                    error={photoError ?? undefined}
                    hint={photo ? photo.name : "JPG, PNG o HEIC; máximo 10 MB."}
                  />
                </Step>

                {problem?.kind === "service-down" && (
                  <ManualModeBanner onContinue={continueManual} loading={manualLoading}>
                    No pudimos procesar la foto ahora. Puedes marcar la asistencia a mano sin perder tu avance.
                  </ManualModeBanner>
                )}
                {problem?.kind === "no-consent" && (
                  <ManualModeBanner title="Hay estudiantes sin consentimiento" onContinue={continueManual} loading={manualLoading}>
                    {problem.message}
                  </ManualModeBanner>
                )}
                {problem?.kind === "error" && <ErrorState error={new Error(problem.message)} />}

                <div className="space-y-2 border-t border-border-soft pt-5">
                  <Button onClick={submitPhoto} loading={submitting} disabled={!courseId || !photo} className="w-full">
                    {submitting ? "Enviando foto…" : "Enviar foto y proponer asistencia"}
                  </Button>
                  <p className="text-center text-xs text-stone-500">
                    Nada se guarda hasta que confirmes la asistencia en el siguiente paso.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          <ProcessSteps
            layout="row"
            title="Cómo se registra la asistencia"
            steps={[
              {
                icon: CameraIcon,
                actor: "Tú",
                title: "Tomas la foto",
                text: "Una sola foto del grupo, con los rostros visibles y buena luz.",
              },
              {
                icon: SparkIcon,
                actor: "IA",
                title: "La IA propone",
                text: "Marca como presentes a quienes reconoce. Si no identifica a alguien, queda «No reconocido», nunca ausente.",
              },
              {
                icon: UserCheckIcon,
                actor: "Tú",
                title: "Revisas y confirmas",
                text: "Defines a los no reconocidos y corriges lo que haga falta. Nada se guarda antes de tu confirmación.",
              },
              {
                icon: GaugeIcon,
                actor: "Sistema",
                title: "Se actualizan las fallas",
                text: "Con la asistencia confirmada, el sistema actualiza las fallas y las alertas del curso.",
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
