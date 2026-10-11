"use client";

import Link from "next/link";
import { useState } from "react";
import { AiSuggestionCard } from "@/components/ai/AiSuggestionCard";
import { ApprovalBar } from "@/components/ai/ApprovalBar";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage, isServiceUnavailable } from "@/lib/api/errors";
import type { AiSuggestion, Paginated, SuggestionWithStudent } from "@/types/api";
import { EditSuggestionModal } from "./EditSuggestionModal";
import { UploadPanel } from "./UploadPanel";

interface SubmissionsScreenProps {
  activityId: string;
  activityName: string;
}

export function SubmissionsScreen({ activityId, activityName }: SubmissionsScreenProps) {
  const toast = useToast();
  const list = useApiQuery<Paginated<SuggestionWithStudent>>(`/activities/${activityId}/suggestions`);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<SuggestionWithStudent | null>(null);

  const suggestions = list.data?.data ?? [];
  const reviewed = suggestions.filter((item) => item.status !== "PENDING_APPROVAL").length;

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
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div className="space-y-1">
        <Link href="/entregas" className="text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900">
          ← Entregas
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          {activityName || "Sugerencias de la actividad"}
        </h1>
        <p className="font-mono text-[11px] text-stone-500">{activityId}</p>
      </div>

      <UploadPanel activityId={activityId} onUploaded={list.reload} />

      <section className="space-y-4" aria-label="Sugerencias de la IA">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">Sugerencias por revisar</h2>

        {list.error !== null ? (
          isServiceUnavailable(list.error) ? (
            <ManualModeBanner>
              La IA no responde ahora. Tus entregas quedan guardadas; puedes volver más tarde o calificar a
              mano con la rúbrica.
            </ManualModeBanner>
          ) : (
            <ErrorState error={list.error} onRetry={list.reload} />
          )
        ) : list.loading ? (
          <div role="status" aria-label="Cargando sugerencias" className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState
            title="Aún no hay sugerencias"
            description="Sube las entregas con la rúbrica y la IA preparará una sugerencia por estudiante."
          />
        ) : (
          suggestions.map((suggestion) => (
            <AiSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              busy={busyId === suggestion.id}
              onApprove={() => void act(suggestion, "approve")}
              onEdit={() => setEditing(suggestion)}
              onReject={() => void act(suggestion, "reject")}
            />
          ))
        )}
      </section>

      <EditSuggestionModal
        suggestion={editing}
        saving={busyId !== null && editing !== null && busyId === editing.id}
        onClose={() => setEditing(null)}
        onSave={(suggestion, finalScore, feedback) =>
          void act(suggestion, "edit", { finalScore, feedback })
        }
      />

      {suggestions.length > 0 && <ApprovalBar reviewed={reviewed} total={suggestions.length} />}
    </div>
  );
}
