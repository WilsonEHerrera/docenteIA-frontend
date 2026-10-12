"use client";

import { useId, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { SuggestionStatus, SuggestionWithStudent } from "@/types/api";
import { AiBadge } from "./OriginTag";

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

/** Score block: says whose number it is (AI proposal vs teacher's final grade). */
function ScoreBlock({ suggestion }: { suggestion: SuggestionWithStudent }) {
  const { status, suggestedScore, finalScore } = suggestion;
  if (status === "PENDING_APPROVAL") {
    return (
      <Score label="Nota sugerida" value={suggestedScore} note="Pendiente de tu revisión" />
    );
  }
  if (status === "REJECTED") {
    return <Score label="Nota sugerida" value={suggestedScore} note="Descartada, no se publica" struck />;
  }
  const final = finalScore ?? suggestedScore;
  const changed = status === "EDITED" && suggestedScore !== null && suggestedScore !== final;
  return (
    <Score
      label="Nota final"
      value={final}
      note={changed ? `La IA sugirió ${suggestedScore}` : "Confirmada por ti"}
    />
  );
}

function Score({ label, value, note, struck }: { label: string; value: string | null; note: string; struck?: boolean }) {
  return (
    <div className="shrink-0 text-right whitespace-nowrap">
      <p className="text-[11px] font-medium tracking-wide text-stone-500 uppercase">{label}</p>
      <p
        className={cn(
          "font-mono text-2xl leading-tight font-semibold tabular-nums",
          struck ? "text-stone-400 line-through" : "text-stone-900",
        )}
      >
        {value ?? "—"}
      </p>
      <p className="text-[11px] text-stone-500">{note}</p>
    </div>
  );
}

export function AiSuggestionCard({ suggestion, busy, onApprove, onEdit, onReject }: AiSuggestionCardProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pending = suggestion.status === "PENDING_APPROVAL";
  const outcome = suggestion.status === "PENDING_APPROVAL" ? null : reviewed[suggestion.status];

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-xs transition-colors",
        pending ? "border-sky-200" : "border-border-soft",
      )}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h3 className="text-base font-semibold tracking-tight text-stone-900">{suggestion.studentName}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {outcome ? (
                <Badge variant={outcome.variant}>
                  {outcome.variant === "success" && <CheckIcon />}
                  {outcome.label}
                </Badge>
              ) : (
                <AiBadge />
              )}
              <span className="font-mono text-[11px] text-stone-400" title="Versión del modelo y del prompt">
                {suggestion.modelVersion} · {suggestion.promptVersion}
              </span>
            </div>
          </div>
          <ScoreBlock suggestion={suggestion} />
        </header>

        {suggestion.feedback && (
          <div className="space-y-1 rounded-xl bg-stone-50 p-3 sm:p-4">
            <p className="text-[11px] font-medium tracking-wide text-stone-500 uppercase">
              {pending ? "Retroalimentación propuesta" : "Retroalimentación"}
            </p>
            <p className="text-[13px] leading-relaxed text-pretty text-stone-700">{suggestion.feedback}</p>
          </div>
        )}

        {suggestion.criteria.length > 0 && (
          <div>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen((value) => !value)}
              className="-ml-1 inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-[13px] font-medium text-stone-700 transition-colors hover:text-stone-900"
            >
              <ChevronRightIcon
                width={16}
                height={16}
                className={cn("transition-transform duration-150", open && "rotate-90")}
              />
              {open ? "Ocultar criterios y evidencias" : `Ver por qué: ${suggestion.criteria.length} criterios y evidencias`}
            </button>
            {open && (
              <ul id={panelId} className="mt-3 space-y-2">
                {suggestion.criteria.map((criterion) => (
                  <li key={criterion.criterionId} className="space-y-2 rounded-xl border border-border-soft p-3 sm:p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="text-[13px] font-semibold text-stone-900">{criterion.criterionName}</p>
                      <p className="font-mono text-xs text-stone-600">
                        {criterion.level} · <span className="font-semibold text-stone-900">{criterion.score}</span>
                      </p>
                    </div>
                    <p className="text-[13px] leading-relaxed text-stone-600">{criterion.justification}</p>
                    {criterion.evidenceQuote && (
                      <blockquote className="border-l-2 border-stone-300 pl-3 text-[13px] leading-relaxed text-stone-600 italic">
                        {criterion.evidenceQuote}
                      </blockquote>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {pending && (
        <div className="grid grid-cols-3 gap-2 border-t border-border-soft bg-stone-50/60 px-4 py-3 sm:flex sm:justify-end sm:px-5">
          <Button variant="destructive" size="sm" onClick={onReject} disabled={busy}>
            Rechazar
          </Button>
          <Button variant="secondary" size="sm" onClick={onEdit} disabled={busy}>
            Editar
          </Button>
          <Button size="sm" onClick={onApprove} disabled={busy}>
            <CheckIcon />
            Aprobar
          </Button>
        </div>
      )}
    </article>
  );
}
