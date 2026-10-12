"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { SparkIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import type { SuggestionWithStudent } from "@/types/api";

interface EditSuggestionModalProps {
  suggestion: SuggestionWithStudent | null;
  saving: boolean;
  onClose: () => void;
  onSave: (suggestion: SuggestionWithStudent, finalScore: string, feedback: string) => void;
}

function Form({
  formId,
  suggestion,
  onSave,
}: Pick<EditSuggestionModalProps, "onSave"> & { formId: string; suggestion: SuggestionWithStudent }) {
  const [score, setScore] = useState(suggestion.finalScore ?? suggestion.suggestedScore ?? "");
  const [feedback, setFeedback] = useState(suggestion.feedback);
  const [error, setError] = useState<string | undefined>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = score.trim().replace(",", ".");
    const number = Number(value);
    if (!/^\d(\.\d{1,2})?$/.test(value) || number < 0 || number > 5) {
      setError("Escribe una nota entre 0.00 y 5.00 (máximo dos decimales).");
      return;
    }
    onSave(suggestion, number.toFixed(2), feedback);
  }

  return (
    <form id={formId} onSubmit={submit} noValidate className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] text-sky-900">
          <SparkIcon width={16} height={16} className="shrink-0 text-sky-700" />
          Nota sugerida por la IA
        </p>
        <p className="font-mono text-lg font-semibold text-sky-900">{suggestion.suggestedScore ?? "—"}</p>
      </div>
      <Input
        label="Tu nota final"
        inputMode="decimal"
        value={score}
        onChange={(event) => setScore(event.target.value)}
        error={error}
        hint="Entre 0.00 y 5.00. Es la nota que verá el estudiante."
        className="font-mono"
      />
      <Textarea
        label="Retroalimentación para el estudiante"
        value={feedback}
        rows={6}
        onChange={(event) => setFeedback(event.target.value)}
      />
    </form>
  );
}

export function EditSuggestionModal({ suggestion, saving, onClose, onSave }: EditSuggestionModalProps) {
  const formId = useId();
  return (
    <Modal
      open={suggestion !== null}
      onClose={onClose}
      title={suggestion ? `Editar: ${suggestion.studentName}` : "Editar"}
      description="Ajusta la nota y la retroalimentación. Al guardar, quedan aprobadas con tus cambios."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Guardar y aprobar
          </Button>
        </>
      }
    >
      {suggestion && <Form key={suggestion.id} formId={formId} suggestion={suggestion} onSave={onSave} />}
    </Modal>
  );
}
