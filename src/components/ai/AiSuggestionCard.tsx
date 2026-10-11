"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { SuggestionStatus, SuggestionWithStudent } from "@/types/api";

interface AiSuggestionCardProps {
  suggestion: SuggestionWithStudent;
  busy?: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
}

const reviewed: Record<
  Exclude<SuggestionStatus, "PENDING_APPROVAL">,
  { label: string; variant: "success" | "danger" }
> = {
  APPROVED: { label: "Aprobada", variant: "success" },
  EDITED: { label: "Editada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "danger" },
};

export function AiSuggestionCard({
  suggestion,
  busy,
  onApprove,
  onEdit,
  onReject,
}: AiSuggestionCardProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pending = suggestion.status === "PENDING_APPROVAL";
  const outcome = suggestion.status === "PENDING_APPROVAL" ? null : reviewed[suggestion.status];
  const score = suggestion.finalScore ?? suggestion.suggestedScore;

  return (
    <article
      className={cn(
        "space-y-4 rounded-2xl border bg-white p-5 shadow-xs",
        pending ? "border-sky-200" : "border-border-soft",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-stone-900">{suggestion.studentName}</h3>
          <p className="font-mono text-[11px] text-stone-500">
            {suggestion.modelVersion} · {suggestion.promptVersion}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {outcome ? (
            <Badge variant={outcome.variant}>{outcome.label}</Badge>
          ) : (
            <Badge variant="info">Sugerido por IA</Badge>
          )}
          <span className="font-mono text-xl font-semibold text-stone-900" aria-label="Nota">
            {score ?? "—"}
          </span>
        </div>
      </header>

      <div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="cursor-pointer text-xs font-medium text-stone-700 underline-offset-2 transition-colors hover:text-stone-900 hover:underline"
        >
          {open ? "Ocultar" : "¿Por qué?"}
        </button>
        {open && (
          <div id={panelId} className="mt-3 space-y-3">
            <ul className="space-y-3">
              {suggestion.criteria.map((criterion) => (
                <li key={criterion.criterionId} className="space-y-1 rounded-xl bg-stone-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-900">{criterion.criterionName}</p>
                    <p className="font-mono text-xs text-stone-700">
                      {criterion.level} · {criterion.score}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-600">{criterion.justification}</p>
                  <blockquote className="border-l-2 border-stone-300 pl-3 text-xs italic text-stone-600">
                    {criterion.evidenceQuote}
                  </blockquote>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-stone-600">{suggestion.feedback}</p>
          </div>
        )}
      </div>

      {pending && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={onApprove} disabled={busy}>
            Aprobar
          </Button>
          <Button variant="secondary" onClick={onEdit} disabled={busy}>
            Editar
          </Button>
          <Button variant="destructive" onClick={onReject} disabled={busy}>
            Rechazar
          </Button>
        </div>
      )}
    </article>
  );
}
