"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { AiBadge } from "@/components/ai/OriginTag";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FileChip, FileInput } from "@/components/ui/FileInput";
import { CheckIcon, ChevronRightIcon, PencilLineIcon, QuizIcon, SparkIcon, UserCheckIcon } from "@/components/ui/icons";
import { ProcessSteps } from "@/components/ui/ProcessSteps";
import { StatTile } from "@/components/ui/StatTile";
import { Input } from "@/components/ui/Input";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage, isServiceUnavailable } from "@/lib/api/errors";
import type { Course, Paginated } from "@/types/api";
import type { Quiz } from "@/types/todo-api";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function QuizHome() {
  const router = useRouter();
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  // TODO(api): GET /quizzes (list) is not in the contract.
  const quizzes = useApiQuery<Quiz[]>("/quizzes");
  const [courseId, setCourseId] = useState("");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiDown, setAiDown] = useState(false);

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!picked) return;
    if (!/\.(pdf|docx?|txt)$/i.test(picked.name)) {
      setFormError("El documento debe ser PDF, DOC, DOCX o TXT.");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFormError("El documento pesa más de 10 MB.");
      return;
    }
    setFormError(null);
    setFile(picked);
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId) return setFormError("Elige un curso.");
    if (!topic.trim() && !file) return setFormError("Escribe un tema o adjunta un documento.");
    setFormError(null);
    setAiDown(false);
    setGenerating(true);
    try {
      const form = new FormData();
      form.set("courseId", courseId);
      if (topic.trim()) form.set("topic", topic.trim());
      if (file) form.set("file", file);
      const quiz = await apiFetch<Quiz>("/quizzes/generate", { method: "POST", body: form });
      router.push(`/cuestionarios/${quiz.id}`);
    } catch (error) {
      if (isServiceUnavailable(error)) setAiDown(true);
      else setFormError(errorMessage(error));
      setGenerating(false);
    }
  }

  const published = (quizzes.data ?? []).filter((quiz) => quiz.status === "PUBLISHED").length;
  const drafts = (quizzes.data?.length ?? 0) - published;
  const courseName = (id: string) => courses.data?.data.find((course) => course.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuestionarios"
        description="Genera preguntas con IA a partir de un tema o un documento. Tú las revisas y editas antes de publicarlas."
      />

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader
            title="Nuevo cuestionario"
            description="La IA prepara un borrador; no se publica nada hasta que lo apruebes."
          />
          {aiDown && (
            <ManualModeBanner>
              No pudimos generar las preguntas ahora. Inténtalo de nuevo en unos minutos; tus datos no se pierden.
            </ManualModeBanner>
          )}
          <form onSubmit={generate} noValidate className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Curso" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="">{courses.loading ? "Cargando cursos…" : "Selecciona un curso…"}</option>
                {courses.data?.data.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} · {course.subject.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Tema"
                placeholder="Ej. Funciones cuadráticas"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </div>
            <FileInput
              label="O un documento de referencia (opcional)"
              hint="PDF, DOC, DOCX o TXT; máximo 10 MB."
              accept=".pdf,.doc,.docx,.txt"
              onChange={onFile}
            >
              {file && <FileChip name={file.name} onRemove={() => setFile(null)} />}
            </FileInput>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <div className="flex justify-end border-t border-border-soft pt-5">
              <Button type="submit" loading={generating} className="w-full sm:w-auto">
                {!generating && <SparkIcon />}
                {generating ? "Generando preguntas…" : "Generar borrador con IA"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Borradores"
              icon={<SparkIcon />}
              value={quizzes.data ? drafts : null}
              hint="Esperan tu aprobación."
            />
            <StatTile
              label="Publicados"
              icon={<CheckIcon />}
              value={quizzes.data ? published : null}
              hint="Visibles para tus estudiantes."
            />
          </div>
          <section className="space-y-4" aria-labelledby="quizzes-heading">
            <SectionHeader id="quizzes-heading" title="Tus cuestionarios" />
            {quizzes.error !== null ? (
              <ErrorState error={quizzes.error} onRetry={quizzes.reload} />
            ) : quizzes.loading || !quizzes.data ? (
              <div role="status" aria-label="Cargando cuestionarios" className="space-y-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : quizzes.data.length === 0 ? (
              <EmptyState
                icon={<QuizIcon width={20} height={20} />}
                title="Aún no tienes cuestionarios"
                description="Genera el primero con un tema o un documento."
              />
            ) : (
              <ul className="divide-y divide-border-soft overflow-hidden rounded-2xl border border-border-soft bg-white shadow-xs">
                {quizzes.data.map((quiz) => (
                  <li key={quiz.id}>
                    <Link
                      href={`/cuestionarios/${quiz.id}`}
                      className="group flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3.5 transition-colors hover:bg-stone-50 sm:flex-nowrap sm:px-5"
                    >
                      <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                        <span className="block truncate text-sm font-semibold text-stone-900">{quiz.title}</span>
                        <span className="block truncate text-xs text-stone-600">
                          {courseName(quiz.courseId)} · <span className="font-mono">{quiz.questions.length}</span> preguntas
                        </span>
                      </span>
                      {quiz.status === "PUBLISHED" ? (
                        <Badge variant="success">
                          <CheckIcon />
                          Publicado
                        </Badge>
                      ) : (
                        <AiBadge />
                      )}
                      <ChevronRightIcon className="ml-auto shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5 sm:ml-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <ProcessSteps
            title="Antes de que un estudiante vea una pregunta"
            steps={[
              {
                icon: SparkIcon,
                actor: "IA",
                title: "Genera un borrador",
                text: "A partir del tema o del documento que elijas.",
              },
              {
                icon: PencilLineIcon,
                actor: "Tú",
                title: "Revisas cada pregunta",
                text: "Editas el enunciado, eliges la respuesta correcta, regeneras o eliminas.",
              },
              {
                icon: UserCheckIcon,
                actor: "Tú",
                title: "Apruebas y publicas",
                text: "Solo entonces el cuestionario queda disponible para el curso.",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
