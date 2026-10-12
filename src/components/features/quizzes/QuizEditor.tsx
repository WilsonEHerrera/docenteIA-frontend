"use client";

import { useEffect, useRef, useState } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { AiBadge } from "@/components/ai/OriginTag";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FieldMessage } from "@/components/ui/Field";
import { CheckIcon, PlusIcon, RefreshIcon, TrashIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/cn";
import type { QuestionType, QuestionView, QuizView } from "@/types/api";

const POLL_START_MS = 2000;
const POLL_MAX_MS = 8000;
const TRUE_FALSE_OPTIONS = ["Verdadero", "Falso"];

/** A question as edited in the screen: `isNew` ones do not exist in the backend yet. */
interface Draft extends QuestionView {
  isNew?: boolean;
  dirty?: boolean;
}

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Opción múltiple",
  TRUE_FALSE: "Verdadero / falso",
  OPEN: "Abierta",
};

function validate(question: Draft): string | null {
  if (question.prompt.trim() === "") return "Escribe el enunciado de la pregunta.";
  if (question.type === "MULTIPLE_CHOICE") {
    const options = question.options.map((option) => option.trim());
    if (options.length < 2 || options.some((option) => option === "")) {
      return "Una pregunta de opción múltiple necesita al menos dos opciones con texto.";
    }
    if (new Set(options).size !== options.length) return "Las opciones no pueden repetirse.";
  }
  if (question.type !== "OPEN") {
    const index = question.correctIndex;
    if (index === null || index < 0 || index >= question.options.length) {
      return "Marca cuál es la respuesta correcta.";
    }
  }
  return null;
}

/** Body for create/update: OPEN questions carry neither options nor correctIndex. */
function contentOf(question: Draft) {
  const base = { prompt: question.prompt.trim() };
  if (question.type === "OPEN") return base;
  return {
    ...base,
    options: question.options.map((option) => option.trim()),
    correctIndex: question.correctIndex,
  };
}

function statusBadge(status: QuestionView["status"]) {
  if (status === "APPROVED") return <Badge variant="success">Aprobada</Badge>;
  if (status === "EDITED") return <Badge variant="success">Editada</Badge>;
  if (status === "REJECTED") return <Badge variant="neutral">Descartada</Badge>;
  return <AiBadge />;
}

interface QuestionCardProps {
  index: number;
  question: Draft;
  readOnly: boolean;
  busy: boolean;
  error: string | null;
  onChange: (question: Draft) => void;
  onReject: () => void;
  onApprove: () => void;
}

function QuestionCard({ index, question, readOnly, busy, error, onChange, onReject, onApprove }: QuestionCardProps) {
  const rejected = question.status === "REJECTED";
  const locked = readOnly || rejected;
  return (
    <Card
      padding="none"
      spacing="none"
      tone={error ? "danger" : locked ? "default" : "ai"}
      aria-label={`Pregunta ${index + 1}`}
      className={rejected ? "opacity-70" : undefined}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-soft px-4 py-3 sm:px-5">
        <h3 className="flex items-center gap-2.5 text-sm font-semibold text-stone-900">
          <span className="flex size-6 items-center justify-center rounded-full bg-stone-100 font-mono text-[11px] text-stone-700">
            {index + 1}
          </span>
          Pregunta {index + 1}
        </h3>
        <span className="flex items-center gap-2">
          {!question.isNew && statusBadge(question.status)}
          <Badge variant="neutral">{TYPE_LABEL[question.type]}</Badge>
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <Textarea
          label="Enunciado"
          value={question.prompt}
          disabled={locked}
          rows={3}
          className="min-h-20"
          onChange={(event) => onChange({ ...question, prompt: event.target.value, dirty: true })}
        />

        {question.type !== "OPEN" && (
          <fieldset className="space-y-2" disabled={locked}>
            <legend className="mb-2 text-[13px] font-medium text-stone-800">Opciones · marca la correcta</legend>
            {question.options.map((option, optionIndex) => {
              const correct = question.correctIndex === optionIndex;
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
                      onChange={() => onChange({ ...question, correctIndex: optionIndex, dirty: true })}
                      className="size-4 cursor-pointer accent-emerald-700"
                    />
                  </label>
                  <div className="flex-1 py-1">
                    <Input
                      aria-label={`Opción ${optionIndex + 1}`}
                      value={option}
                      // True/false options are fixed by the contract.
                      disabled={question.type === "TRUE_FALSE"}
                      onChange={(event) => {
                        const options = question.options.map((value, i) =>
                          i === optionIndex ? event.target.value : value,
                        );
                        onChange({ ...question, options, dirty: true });
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
          {!rejected && (
            <Button variant="destructive" size="sm" onClick={onReject} disabled={busy}>
              <TrashIcon />
              {question.isNew ? "Quitar" : "Descartar"}
            </Button>
          )}
          {(rejected || (!question.isNew && question.status === "PENDING_APPROVAL")) && (
            <Button variant="secondary" size="sm" onClick={onApprove} loading={busy}>
              {!busy && (rejected ? <RefreshIcon /> : <CheckIcon />)}
              {rejected ? "Restaurar" : "Aprobar"}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function Editor({ quiz: initial }: { quiz: QuizView }) {
  const toast = useToast();
  const [quiz, setQuiz] = useState(initial);
  const [questions, setQuestions] = useState<Draft[]>(initial.questions);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newType, setNewType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const newCounter = useRef(0);
  const published = quiz.status === "PUBLISHED";

  /** Replaces the local state with what the backend now has. */
  async function refresh(): Promise<QuizView> {
    const fresh = await apiFetch<QuizView>(`/quizzes/${quiz.id}`);
    setQuiz(fresh);
    setQuestions(fresh.questions);
    return fresh;
  }

  function validateAll(): boolean {
    const found: Record<string, string> = {};
    questions
      .filter((question) => question.status !== "REJECTED")
      .forEach((question) => {
        const problem = validate(question);
        if (problem) found[question.id] = problem;
      });
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  /** Writes new and edited questions. Returns false (and writes nothing) if any is invalid. */
  async function persist(): Promise<boolean> {
    if (!validateAll()) return false;
    for (const question of questions) {
      if (question.status === "REJECTED") continue;
      if (question.isNew) {
        await apiFetch(`/quizzes/${quiz.id}/questions`, {
          method: "POST",
          body: { type: question.type, ...contentOf(question) },
        });
      } else if (question.dirty) {
        await apiFetch(`/quizzes/${quiz.id}/questions/${question.id}`, {
          method: "PATCH",
          body: contentOf(question),
        });
      }
    }
    return true;
  }

  async function onSave() {
    setSaving(true);
    try {
      if (await persist()) {
        await refresh();
        toast.show("Cambios guardados.", "success");
      }
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function setQuestionStatus(question: Draft, status: "APPROVED" | "REJECTED") {
    if (question.isNew) {
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      return;
    }
    if (status === "APPROVED") {
      const problem = validate(question);
      if (problem) {
        setErrors((current) => ({ ...current, [question.id]: problem }));
        return;
      }
    }
    setBusyId(question.id);
    try {
      // Edits first (they leave the question EDITED), then the explicit decision.
      if (question.dirty && status === "APPROVED") {
        await apiFetch(`/quizzes/${quiz.id}/questions/${question.id}`, {
          method: "PATCH",
          body: contentOf(question),
        });
      }
      await apiFetch(`/quizzes/${quiz.id}/questions/${question.id}`, { method: "PATCH", body: { status } });
      await refresh();
      toast.show(status === "APPROVED" ? "Pregunta aprobada." : "Pregunta descartada.", "info");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setBusyId(null);
    }
  }

  async function onPublish() {
    setPublishing(true);
    try {
      if (!(await persist())) return;
      // "Aprobar y publicar" is the teacher's explicit decision on every pending question.
      const fresh = await refresh();
      if (fresh.questions.some((question) => question.status === "PENDING_APPROVAL")) {
        await apiFetch<QuizView>(`/quizzes/${quiz.id}/questions/approve`, { method: "POST" });
      }
      const result = await apiFetch<QuizView>(`/quizzes/${quiz.id}/publish`, { method: "POST" });
      setQuiz(result);
      setQuestions(result.questions);
      toast.show("Cuestionario publicado.", "success");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
      // Keep the screen in step with whatever did get written.
      void refresh().catch(() => undefined);
    } finally {
      setPublishing(false);
    }
  }

  function addQuestion() {
    newCounter.current += 1;
    const draft: Draft = {
      id: `new-${newCounter.current}`,
      position: questions.length + 1,
      type: newType,
      prompt: "",
      options: newType === "MULTIPLE_CHOICE" ? ["", ""] : newType === "TRUE_FALSE" ? TRUE_FALSE_OPTIONS : [],
      correctIndex: newType === "TRUE_FALSE" ? 0 : null,
      explanation: "",
      status: "APPROVED",
      isNew: true,
      dirty: true,
    };
    setQuestions((current) => [...current, draft]);
  }

  const errorCount = Object.keys(errors).length;
  const active = questions.filter((question) => question.status !== "REJECTED").length;

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
            : "Revisa, edita, aprueba o descarta preguntas. Nada se publica hasta que lo apruebes."
        }
      />

      {published && (
        <Alert variant="success" title="Cuestionario publicado">
          Ya está disponible para tus estudiantes. Las preguntas se muestran en modo de solo lectura.
        </Alert>
      )}

      {quiz.status === "MANUAL_REQUIRED" && (
        <ManualModeBanner>
          La IA no pudo generar preguntas válidas. Escríbelas tú con «Agregar pregunta» y publica cuando estés
          listo.
        </ManualModeBanner>
      )}

      {questions.length === 0 ? (
        <EmptyState
          title="Aún no hay preguntas"
          description={
            published
              ? "Este cuestionario no tiene preguntas."
              : "Agrega la primera pregunta con el botón de abajo."
          }
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
              onReject={() => void setQuestionStatus(question, "REJECTED")}
              onApprove={() => void setQuestionStatus(question, "APPROVED")}
            />
          ))}
        </div>
      )}

      {!published && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Select
            label="Tipo de pregunta"
            value={newType}
            onChange={(event) => setNewType(event.target.value as QuestionType)}
            className="sm:w-56"
          >
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={addQuestion}>
            <PlusIcon />
            Agregar pregunta
          </Button>
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
                <span className="font-mono font-semibold text-stone-900">{active}</span> preguntas en el borrador
              </>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="secondary" onClick={() => void onSave()} loading={saving} disabled={publishing}>
              Guardar borrador
            </Button>
            <Button onClick={() => void onPublish()} loading={publishing} disabled={saving || active === 0}>
              Aprobar y publicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function QuizEditor({ quizId }: { quizId: string }) {
  const { data, error, loading, reload, fetching } = useApiQuery<QuizView>(`/quizzes/${quizId}`);
  const delay = useRef(POLL_START_MS);
  const status = data?.status;

  // Poll with backoff while the AI is generating (API_CONTRATO §5.1).
  useEffect(() => {
    if (status !== "GENERATING") return;
    const timer = setTimeout(() => {
      delay.current = Math.min(delay.current * 1.5, POLL_MAX_MS);
      reload();
    }, delay.current);
    return () => clearTimeout(timer);
  }, [status, reload, fetching]);

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
  if (data.status === "GENERATING") {
    return (
      <div className="max-w-4xl space-y-6">
        <PageHeader back={{ href: "/cuestionarios", label: "Cuestionarios" }} title={data.title} />
        <Card>
          <div role="status" className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900"
            />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-stone-900">Generando preguntas…</p>
              <p className="text-[13px] leading-relaxed text-stone-600">
                La IA prepara un borrador. Esto toma unos segundos; no cierres esta pantalla.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  return <Editor key={`${data.id}-${data.status}`} quiz={data} />;
}
