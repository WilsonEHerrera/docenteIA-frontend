"use client";

import { useState } from "react";
import { AiBadge } from "@/components/ai/OriginTag";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldMessage } from "@/components/ui/Field";
import { CheckIcon, RefreshIcon, TrashIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import type { Quiz, QuizQuestion } from "@/types/todo-api";

function validate(question: QuizQuestion): string | null {
  if (question.text.trim() === "") return "Escribe el enunciado de la pregunta.";
  if (question.type === "CLOSED") {
    const options = question.options.map((option) => option.trim());
    if (options.length < 2 || options.some((option) => option === "")) {
      return "Una pregunta cerrada necesita al menos dos opciones con texto.";
    }
    if (!question.answer || !options.includes(question.answer.trim())) {
      return "Marca cuál es la respuesta correcta.";
    }
  }
  return null;
}

interface QuestionCardProps {
  index: number;
  question: QuizQuestion;
  readOnly: boolean;
  busy: boolean;
  error: string | null;
  onChange: (question: QuizQuestion) => void;
  onDelete: () => void;
  onRegenerate: () => void;
}

function QuestionCard({ index, question, readOnly, busy, error, onChange, onDelete, onRegenerate }: QuestionCardProps) {
  return (
    <Card
      padding="none"
      spacing="none"
      tone={error ? "danger" : readOnly ? "default" : "ai"}
      aria-label={`Pregunta ${index + 1}`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-soft px-4 py-3 sm:px-5">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-stone-900">
          <span className="flex size-6 items-center justify-center rounded-full bg-stone-100 font-mono text-[11px] text-stone-700">
            {index + 1}
          </span>
          Pregunta {index + 1}
        </h3>
        <Badge variant="neutral">{question.type === "CLOSED" ? "Opción múltiple" : "Abierta"}</Badge>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <Textarea
          label="Enunciado"
          value={question.text}
          disabled={readOnly}
          rows={3}
          className="min-h-20"
          onChange={(event) => onChange({ ...question, text: event.target.value })}
        />

        {question.type === "CLOSED" && (
          <fieldset className="space-y-2" disabled={readOnly}>
            <legend className="mb-2 text-[13px] font-medium text-stone-800">Opciones · marca la correcta</legend>
            {question.options.map((option, optionIndex) => {
              const correct = question.answer === option && option !== "";
              return (
                <div
                  key={optionIndex}
                  className={cn(
                    "flex items-center gap-1 rounded-xl border pr-1 transition-colors",
                    correct ? "border-emerald-300 bg-emerald-50/60" : "border-transparent",
                  )}
                >
                  <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      aria-label={`Opción ${optionIndex + 1} es la respuesta correcta`}
                      checked={correct}
                      onChange={() => onChange({ ...question, answer: option })}
                      className="size-4 cursor-pointer accent-emerald-700"
                    />
                  </label>
                  <div className="flex-1 py-1">
                    <Input
                      aria-label={`Opción ${optionIndex + 1}`}
                      value={option}
                      onChange={(event) => {
                        const options = question.options.map((value, i) =>
                          i === optionIndex ? event.target.value : value,
                        );
                        const answer = question.answer === option ? event.target.value : question.answer;
                        onChange({ ...question, options, answer });
                      }}
                    />
                  </div>
                  {correct && (
                    <span className="hidden items-center gap-1 px-2 text-xs font-medium text-emerald-800 sm:inline-flex">
                      <CheckIcon width={14} height={14} />
                      Correcta
                    </span>
                  )}
                </div>
              );
            })}
          </fieldset>
        )}

        {error && <FieldMessage id={`question-${question.id}`} error={error} />}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border-soft bg-stone-50/60 px-4 py-3 sm:px-5">
          <Button variant="destructive" size="sm" onClick={onDelete} disabled={busy}>
            <TrashIcon />
            Eliminar
          </Button>
          <Button variant="secondary" size="sm" onClick={onRegenerate} loading={busy}>
            {!busy && <RefreshIcon />}
            Regenerar con IA
          </Button>
        </div>
      )}
    </Card>
  );
}

function Editor({ quiz: initial }: { quiz: Quiz }) {
  const toast = useToast();
  const [quiz, setQuiz] = useState(initial);
  const [questions, setQuestions] = useState(initial.questions);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const published = quiz.status === "PUBLISHED";

  function validateAll(): boolean {
    const found: Record<string, string> = {};
    questions.forEach((question) => {
      const problem = validate(question);
      if (problem) found[question.id] = problem;
    });
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  async function regenerate(question: QuizQuestion) {
    setBusyId(question.id);
    try {
      // TODO(api): regenerating a single question is not in the contract.
      const updated = await apiFetch<Quiz>(`/quizzes/${quiz.id}/questions/${question.id}/regenerate`, {
        method: "POST",
      });
      const fresh = updated.questions.find((item) => item.id === question.id);
      if (fresh) setQuestions((current) => current.map((item) => (item.id === fresh.id ? fresh : item)));
      toast.show("Pregunta regenerada. Revísala antes de publicar.", "info");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function save(): Promise<boolean> {
    if (!validateAll()) return false;
    const updated = await apiFetch<Quiz>(`/quizzes/${quiz.id}`, { method: "PATCH", body: { questions } });
    setQuiz(updated);
    return true;
  }

  async function onSave() {
    setSaving(true);
    try {
      if (await save()) toast.show("Cambios guardados.", "success");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function onPublish() {
    setPublishing(true);
    try {
      if (!(await save())) return;
      const result = await apiFetch<Quiz>(`/quizzes/${quiz.id}/publish`, { method: "POST" });
      setQuiz(result);
      toast.show("Cuestionario publicado.", "success");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setPublishing(false);
    }
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div className="max-w-4xl space-y-6 pb-4">
      <PageHeader
        back={{ href: "/cuestionarios", label: "Cuestionarios" }}
        title={quiz.title}
        status={
          published ? (
            <Badge variant="success">
              <CheckIcon />
              Publicado
            </Badge>
          ) : (
            <AiBadge />
          )
        }
        description={
          published
            ? undefined
            : "Revisa, edita, regenera o elimina preguntas. Nada se publica hasta que lo apruebes."
        }
      />

      {published && (
        <Alert variant="success" title="Cuestionario publicado">
          Ya está disponible para tus estudiantes. Las preguntas se muestran en modo de solo lectura.
        </Alert>
      )}

      {questions.length === 0 ? (
        <EmptyState
          title="No quedan preguntas"
          description="Eliminaste todas las preguntas. Vuelve a generar el cuestionario desde Cuestionarios."
        />
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              index={index}
              question={question}
              readOnly={published}
              busy={busyId === question.id}
              error={errors[question.id] ?? null}
              onChange={(next) =>
                setQuestions((current) => current.map((item) => (item.id === next.id ? next : item)))
              }
              onDelete={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}
              onRegenerate={() => void regenerate(question)}
            />
          ))}
        </div>
      )}

      {!published && (
        <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-border-soft bg-white/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:pl-5">
          <p className="text-[13px] text-stone-600" role="status">
            {errorCount > 0 ? (
              <span className="text-rose-700">
                {errorCount === 1 ? "1 pregunta necesita cambios." : `${errorCount} preguntas necesitan cambios.`}
              </span>
            ) : (
              <>
                <span className="font-mono font-semibold text-stone-900">{questions.length}</span> preguntas en el
                borrador
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="secondary" onClick={() => void onSave()} loading={saving} disabled={publishing}>
              Guardar borrador
            </Button>
            <Button onClick={() => void onPublish()} loading={publishing} disabled={saving || questions.length === 0}>
              Aprobar y publicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuizEditor({ quizId }: { quizId: string }) {
  const { data, error, loading, reload } = useApiQuery<Quiz>(`/quizzes/${quizId}`);

  if (error !== null) {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader back={{ href: "/cuestionarios", label: "Cuestionarios" }} title="Cuestionario" />
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div role="status" aria-label="Cargando cuestionario" className="max-w-4xl space-y-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
    );
  }
  return <Editor key={data.id} quiz={data} />;
}
