"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
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
  suggestion,
  saving,
  onClose,
  onSave,
}: Omit<EditSuggestionModalProps, "suggestion"> & { suggestion: SuggestionWithStudent }) {
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
    <form onSubmit={submit} noValidate className="space-y-4">
      <p className="text-xs text-stone-600">
        La IA sugirió <span className="font-mono font-semibold">{suggestion.suggestedScore ?? "—"}</span>.
        Tu nota es la que se publica.
      </p>
      <Input
        label="Nota final"
        inputMode="decimal"
        value={score}
        onChange={(event) => setScore(event.target.value)}
        error={error}
        className="font-mono"
      />
      <Textarea
        label="Retroalimentación"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          Guardar y aprobar
        </Button>
      </div>
    </form>
  );
}

export function EditSuggestionModal({ suggestion, saving, onClose, onSave }: EditSuggestionModalProps) {
  return (
    <Modal
      open={suggestion !== null}
      onClose={onClose}
      title={suggestion ? `Editar: ${suggestion.studentName}` : "Editar"}
    >
      {suggestion && (
        <Form key={suggestion.id} suggestion={suggestion} saving={saving} onClose={onClose} onSave={onSave} />
      )}
    </Modal>
  );
}
