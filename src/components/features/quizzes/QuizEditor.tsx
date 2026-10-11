"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
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
    <Card className="space-y-3 border-sky-200">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-stone-900">Pregunta {index + 1}</h3>
        <Badge variant="neutral">{question.type === "CLOSED" ? "Cerrada" : "Abierta"}</Badge>
      </div>

      <Textarea
        label="Enunciado"
        value={question.text}
        disabled={readOnly}
        onChange={(event) => onChange({ ...question, text: event.target.value })}
      />

      {question.type === "CLOSED" && (
        <fieldset className="space-y-2" disabled={readOnly}>
          <legend className="text-xs font-medium text-stone-700">Opciones (marca la correcta)</legend>
          {question.options.map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center gap-2">
              <input
                type="radio"
                name={`answer-${question.id}`}
                aria-label={`Opción ${optionIndex + 1} es la respuesta correcta`}
                checked={question.answer === option && option !== ""}
                onChange={() => onChange({ ...question, answer: option })}
                className="size-4 cursor-pointer accent-stone-900"
              />
              <div className="flex-1">
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
            </div>
          ))}
        </fieldset>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRegenerate} loading={busy}>
            Regenerar
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={busy}>
            Eliminar
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <div className="space-y-1">
        <Link href="/cuestionarios" className="text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900">
          ← Cuestionarios
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{quiz.title}</h1>
          {published ? <Badge variant="success">Publicado</Badge> : <Badge variant="info">Sugerido por IA</Badge>}
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          {published
            ? "Este cuestionario ya está publicado para tus estudiantes."
            : "Revisa, edita o elimina preguntas. Nada se publica hasta que lo apruebes."}
        </p>
      </div>

      {questions.length === 0 ? (
        <ErrorState error={new Error("No quedan preguntas. Vuelve a generar el cuestionario desde Cuestionarios.")} />
      ) : (
        questions.map((question, index) => (
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
        ))
      )}

      {!published && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void onSave()} loading={saving} disabled={publishing}>
            Guardar cambios
          </Button>
          <Button onClick={() => void onPublish()} loading={publishing} disabled={saving || questions.length === 0}>
            Aprobar y publicar
          </Button>
        </div>
      )}
    </div>
  );
}

export function QuizEditor({ quizId }: { quizId: string }) {
  const { data, error, loading, reload } = useApiQuery<Quiz>(`/quizzes/${quizId}`);

  if (error !== null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Cuestionario</h1>
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !data) {
    return (
      <div role="status" aria-label="Cargando cuestionario" className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return <Editor key={data.id} quiz={data} />;
}
