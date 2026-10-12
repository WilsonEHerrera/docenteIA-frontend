"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
import type { Course, Paginated, QuizSummaryView, QuizView } from "@/types/api";

// Only the extracted text is sent to the backend (API_CONTRATO §6.14, D24): PDF/DOCX are not read.
const MAX_FILE_BYTES = 1024 * 1024;
const MAX_SOURCE_CHARS = 20_000;

type QuizRow = QuizSummaryView & { courseId: string };

/** There is no global quiz list: GET /courses/:id/quizzes is called once per course. */
function useQuizzes(ids: string[] | null) {
  const courseIds = ids ?? [];
  const [token, setToken] = useState(0);
  const [result, setResult] = useState<{ key: string; rows: QuizRow[]; error: unknown } | null>(null);
  const key = `${courseIds.join(",")}|${token}`;

  useEffect(() => {
    if (courseIds.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const pages = await Promise.all(
          courseIds.map(async (id) => {
            const page = await apiFetch<Paginated<QuizSummaryView>>(`/courses/${id}/quizzes`, {
              query: { limit: 100 },
            });
            return page.data.map((quiz) => ({ ...quiz, courseId: id }));
          }),
        );
        const rows = pages
          .flat()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        if (!cancelled) setResult({ key, rows, error: null });
      } catch (error) {
        if (!cancelled) setResult({ key, rows: [], error });
      }
    })();
    return () => {
      cancelled = true;
    };
    // `key` already encodes courseIds and the reload counter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setToken((value) => value + 1), []);
  const current = result?.key === key ? result : null;
  // `ids === null`: the course list is still loading. An empty list means no courses, so no quizzes.
  const empty = ids !== null && courseIds.length === 0;
  return {
    data: empty ? ([] as QuizRow[]) : ids === null ? null : (current?.rows ?? null),
    error: empty || ids === null ? null : (current?.error ?? null),
    loading: !empty && (ids === null || current === null),
    reload,
  };
}

export function QuizHome() {
  const router = useRouter();
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const quizzes = useQuizzes(courses.data ? courses.data.data.map((course) => course.id) : null);
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
    if (!/\.txt$/i.test(picked.name)) {
      setFormError("Por ahora solo se leen documentos de texto (.txt).");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setFormError("El documento pesa más de 1 MB.");
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
      const sourceText = file ? (await file.text()).trim() : "";
      if (file && sourceText === "") {
        setFormError("El documento no tiene texto.");
        setGenerating(false);
        return;
      }
      if (sourceText.length > MAX_SOURCE_CHARS) {
        setFormError(`El documento supera los ${MAX_SOURCE_CHARS} caracteres. Usa un fragmento más corto.`);
        setGenerating(false);
        return;
      }
      const quiz = await apiFetch<QuizView>("/quizzes/generate", {
        method: "POST",
        body: {
          courseId,
          ...(topic.trim() ? { topic: topic.trim() } : {}),
          ...(sourceText ? { sourceText } : {}),
        },
      });
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
              hint="Archivo de texto (.txt); máximo 1 MB."
              accept=".txt"
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
                          {courseName(quiz.courseId)} · <span className="font-mono">{quiz.questionCount}</span> preguntas
                        </span>
                      </span>
                      {quiz.status === "PUBLISHED" ? (
                        <Badge variant="success">
                          <CheckIcon />
                          Publicado
                        </Badge>
                      ) : quiz.status === "GENERATING" ? (
                        <Badge variant="info">Generando</Badge>
                      ) : quiz.status === "MANUAL_REQUIRED" ? (
                        <Badge variant="warning">Modo manual</Badge>
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
