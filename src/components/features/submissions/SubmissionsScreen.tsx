"use client";

import { useEffect, useRef, useState } from "react";
import { AiSuggestionCard } from "@/components/ai/AiSuggestionCard";
import { ApprovalBar } from "@/components/ai/ApprovalBar";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SparkIcon } from "@/components/ui/icons";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage, isServiceUnavailable } from "@/lib/api/errors";
import type { AiSuggestion, Paginated, SubmissionView, SuggestionWithStudent } from "@/types/api";
import { EditSuggestionModal } from "./EditSuggestionModal";
import { UploadPanel } from "./UploadPanel";

interface SubmissionsScreenProps {
  activityId: string;
  activityName: string;
  courseId: string;
}

const POLL_START_MS = 2000;
const POLL_MAX_MS = 8000;

export function SubmissionsScreen({ activityId, activityName, courseId }: SubmissionsScreenProps) {
  const toast = useToast();
  const list = useApiQuery<Paginated<SuggestionWithStudent>>(`/activities/${activityId}/suggestions`, {
    limit: 100,
  });
  const submissions = useApiQuery<Paginated<SubmissionView>>(`/activities/${activityId}/submissions`, {
    limit: 100,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SuggestionWithStudent | null>(null);
  const delay = useRef(POLL_START_MS);

  const submissionList = submissions.data?.data ?? [];
  const processing = submissionList.filter((item) => item.status === "PROCESSING").length;
  const manualRequired = submissionList.filter((item) => item.status === "MANUAL_REQUIRED");
  const { reload: reloadList } = list;
  const { reload: reloadSubmissions } = submissions;

  // Poll with backoff while the AI is processing entregas (API_CONTRATO §5.1).
  useEffect(() => {
    if (processing === 0) {
      delay.current = POLL_START_MS;
      return;
    }
    const timer = setTimeout(() => {
      delay.current = Math.min(delay.current * 1.5, POLL_MAX_MS);
      reloadSubmissions();
      reloadList();
    }, delay.current);
    return () => clearTimeout(timer);
  }, [processing, submissions.fetching, reloadSubmissions, reloadList]);

  function reloadAll() {
    reloadList();
    reloadSubmissions();
  }

  const suggestions = list.data?.data ?? [];
  const reviewed = suggestions.filter((item) => item.status !== "PENDING_APPROVAL").length;
  const pending = suggestions.length - reviewed;

  function replace(updated: AiSuggestion) {
    list.setData((current) => ({
      ...current,
      data: current.data.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    }));
  }

  async function act(
    suggestion: SuggestionWithStudent,
    action: "approve" | "reject" | "edit",
    body?: { finalScore: string; feedback: string },
  ) {
    setBusyId(suggestion.id);
    try {
      const updated = await apiFetch<AiSuggestion>(`/suggestions/${suggestion.id}/${action}`, {
        method: "POST",
        body,
      });
      replace(updated);
      setEditing(null);
      toast.show(
        action === "reject" ? "Sugerencia rechazada." : "Nota aprobada. Ya es visible para el estudiante.",
        action === "reject" ? "info" : "success",
      );
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        back={{ href: "/entregas", label: "Entregas" }}
        title={activityName || "Sugerencias de la actividad"}
        meta={activityId}
      />

      <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:sticky lg:top-[calc(var(--navbar)+1.5rem)] lg:order-2 lg:col-span-5 lg:max-h-[calc(100dvh-var(--navbar)-3rem)] lg:overflow-y-auto lg:rounded-2xl">
          <UploadPanel activityId={activityId} courseId={courseId} onUploaded={reloadAll} />
        </div>

        <section className="space-y-4 lg:order-1 lg:col-span-7" aria-labelledby="suggestions-heading">
          <SectionHeader
            id="suggestions-heading"
            title="Sugerencias por revisar"
            description="La IA propone una nota por estudiante según la rúbrica. Nada se publica hasta que apruebes, edites o rechaces cada una."
            actions={
              suggestions.length > 0 && (
                <p className="flex items-center gap-1.5 font-mono text-xs whitespace-nowrap text-stone-600">
                  <SparkIcon width={14} height={14} />
                  {pending} pendientes
                </p>
              )
            }
          />

          {processing > 0 && (
            <p role="status" className="flex items-center gap-2 text-[13px] text-stone-600">
              <span
                aria-hidden="true"
                className="size-4 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900"
              />
              La IA está procesando {processing} {processing === 1 ? "entrega" : "entregas"}…
            </p>
          )}
          {manualRequired.length > 0 && (
            <ManualModeBanner title="Entregas para calificar a mano">
              La IA no pudo proponer nota para:{" "}
              {manualRequired.map((item) => item.studentName).join(", ")}. Califícalas desde la planilla de notas.
            </ManualModeBanner>
          )}
          {list.error !== null ? (
            isServiceUnavailable(list.error) ? (
              <ManualModeBanner>
                La IA no responde ahora. Tus entregas quedan guardadas; puedes volver más tarde o calificar a mano
                con la rúbrica.
              </ManualModeBanner>
            ) : (
              <ErrorState error={list.error} onRetry={list.reload} />
            )
          ) : list.loading ? (
            <div role="status" aria-label="Cargando sugerencias" className="space-y-3">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : suggestions.length === 0 ? (
            <EmptyState
              icon={<SparkIcon width={20} height={20} />}
              title="Aún no hay sugerencias"
              description="Sube las entregas con la rúbrica y la IA preparará una sugerencia por estudiante."
            />
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <AiSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  busy={busyId === suggestion.id}
                  onApprove={() => void act(suggestion, "approve")}
                  onEdit={() => setEditing(suggestion)}
                  onReject={() => void act(suggestion, "reject")}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <EditSuggestionModal
        suggestion={editing}
        saving={busyId !== null && editing !== null && busyId === editing.id}
        onClose={() => setEditing(null)}
        onSave={(suggestion, finalScore, feedback) => void act(suggestion, "edit", { finalScore, feedback })}
      />

      {suggestions.length > 0 && <ApprovalBar reviewed={reviewed} total={suggestions.length} />}
    </div>
  );
}
