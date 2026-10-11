"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { RubricCriterionInput } from "@/types/todo-api";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED = /\.(pdf|docx?|txt)$/i;

interface UploadResult {
  accepted: number;
  rejected: Array<{ name: string; reason: string }>;
}

export function UploadPanel({ activityId, onUploaded }: { activityId: string; onUploaded: () => void }) {
  const toast = useToast();
  const [criteria, setCriteria] = useState<RubricCriterionInput[]>([
    { name: "Comprensión del concepto", weightPct: "40" },
    { name: "Procedimiento y desarrollo", weightPct: "40" },
    { name: "Presentación y claridad", weightPct: "20" },
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [rejected, setRejected] = useState<UploadResult["rejected"]>([]);
  const [submitting, setSubmitting] = useState(false);

  const total = criteria.reduce((sum, item) => sum + (Number(item.weightPct) || 0), 0);

  function update(index: number, patch: Partial<RubricCriterionInput>) {
    setCriteria((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    const issues: string[] = [];
    const valid = picked.filter((file) => {
      if (!ALLOWED.test(file.name)) {
        issues.push(`${file.name}: formato no admitido (usa PDF, DOC, DOCX o TXT).`);
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        issues.push(`${file.name}: pesa más de 10 MB.`);
        return false;
      }
      return true;
    });
    setProblems(issues);
    setFiles((current) => [...current, ...valid]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues: string[] = [];
    if (criteria.some((item) => item.name.trim() === "")) issues.push("Cada criterio necesita un nombre.");
    if (Math.abs(total - 100) > 0.001) issues.push(`Los pesos de la rúbrica suman ${total} %; deben sumar 100 %.`);
    if (files.length === 0) issues.push("Agrega al menos una entrega.");
    setProblems(issues);
    if (issues.length > 0) return;

    setSubmitting(true);
    try {
      await apiFetch(`/activities/${activityId}/rubric`, { method: "POST", body: { criteria } });
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      const result = await apiFetch<UploadResult>(`/activities/${activityId}/submissions`, {
        method: "POST",
        body: form,
      });
      setRejected(result.rejected);
      setFiles([]);
      toast.show(
        `${result.accepted} entrega(s) recibidas. La IA está preparando las sugerencias.`,
        "success",
      );
      onUploaded();
    } catch (error) {
      setProblems([errorMessage(error)]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="text-base font-semibold text-stone-900">Subir entregas y rúbrica</h2>
      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-stone-700">Criterios de la rúbrica</legend>
          {criteria.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_5.5rem_auto] items-end gap-2">
              <Input
                label={index === 0 ? "Criterio" : undefined}
                aria-label={`Criterio ${index + 1}`}
                value={item.name}
                onChange={(event) => update(index, { name: event.target.value })}
              />
              <Input
                label={index === 0 ? "Peso %" : undefined}
                aria-label={`Peso del criterio ${index + 1}`}
                inputMode="decimal"
                className="font-mono"
                value={item.weightPct}
                onChange={(event) => update(index, { weightPct: event.target.value })}
              />
              <Button
                variant="secondary"
                aria-label={`Quitar criterio ${index + 1}`}
                disabled={criteria.length === 1}
                onClick={() => setCriteria((current) => current.filter((_, i) => i !== index))}
              >
                Quitar
              </Button>
            </div>
          ))}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCriteria((current) => [...current, { name: "", weightPct: "0" }])}
            >
              Agregar criterio
            </Button>
            <p className="font-mono text-xs text-stone-700">Total: {total} %</p>
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="submission-files" className="block text-xs font-medium text-stone-700">
            Entregas (PDF, DOC, DOCX o TXT; máx. 10 MB)
          </label>
          <input
            id="submission-files"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={onFiles}
            className="block w-full cursor-pointer text-xs text-stone-700 file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-stone-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs text-stone-700">
                  <span className="truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                    className="cursor-pointer text-stone-500 underline hover:text-stone-900"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {problems.length > 0 && (
          <ul role="alert" className="space-y-1 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
        {rejected.length > 0 && (
          <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-stone-700">
            {rejected.map((item) => (
              <li key={item.name}>
                <span className="font-mono">{item.name}</span>: {item.reason}
              </li>
            ))}
          </ul>
        )}

        <Button type="submit" loading={submitting}>
          Enviar a revisión con IA
        </Button>
      </form>
    </Card>
  );
}
