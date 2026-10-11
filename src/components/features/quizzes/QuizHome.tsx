"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
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

  const courseName = (id: string) => courses.data?.data.find((course) => course.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Cuestionarios</h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          Genera preguntas con IA a partir de un tema o un documento. Tú las revisas antes de publicarlas.
        </p>
      </div>

      <Card>
        <h2 className="text-base font-semibold text-stone-900">Nuevo cuestionario</h2>
        {aiDown && (
          <ManualModeBanner>
            No pudimos generar las preguntas ahora. Inténtalo de nuevo en unos minutos; tus datos no se
            pierden.
          </ManualModeBanner>
        )}
        <form onSubmit={generate} noValidate className="space-y-4">
          <Select label="Curso" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">Selecciona un curso…</option>
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
          <div className="space-y-1.5">
            <label htmlFor="quiz-file" className="block text-xs font-medium text-stone-700">
              O un documento (opcional)
            </label>
            <input
              id="quiz-file"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={onFile}
              className="block w-full cursor-pointer text-xs text-stone-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-stone-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium"
            />
            {file && <p className="font-mono text-[11px] text-stone-500">{file.name}</p>}
          </div>
          {formError && (
            <p role="alert" className="text-xs text-rose-700">
              {formError}
            </p>
          )}
          <Button type="submit" loading={generating}>
            {generating ? "Generando preguntas…" : "Generar con IA"}
          </Button>
        </form>
      </Card>

      <section className="space-y-3" aria-label="Cuestionarios existentes">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">Tus cuestionarios</h2>
        {quizzes.error !== null ? (
          <ErrorState error={quizzes.error} onRetry={quizzes.reload} />
        ) : quizzes.loading || !quizzes.data ? (
          <div role="status" aria-label="Cargando cuestionarios" className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : quizzes.data.length === 0 ? (
          <EmptyState title="Aún no tienes cuestionarios" description="Genera el primero con un tema o un documento." />
        ) : (
          <ul className="space-y-3">
            {quizzes.data.map((quiz) => (
              <li key={quiz.id}>
                <Link href={`/cuestionarios/${quiz.id}`} className="block">
                  <Card className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-stone-50">
                    <span>
                      <span className="block text-sm font-semibold text-stone-900">{quiz.title}</span>
                      <span className="block text-xs text-stone-600">
                        {courseName(quiz.courseId)} · {quiz.questions.length} preguntas
                      </span>
                    </span>
                    {quiz.status === "PUBLISHED" ? (
                      <Badge variant="success">Publicado</Badge>
                    ) : (
                      <Badge variant="info">Sugerido por IA</Badge>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
