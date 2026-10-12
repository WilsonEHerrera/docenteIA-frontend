"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { FileChip, FileInput } from "@/components/ui/FileInput";
import { PlusIcon, SparkIcon, TrashIcon } from "@/components/ui/icons";
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
  const totalOk = Math.abs(total - 100) <= 0.001;

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
    if (!totalOk) issues.push(`Los pesos de la rúbrica suman ${total} %; deben sumar 100 %.`);
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
      toast.show(`${result.accepted} entrega(s) recibidas. La IA está preparando las sugerencias.`, "success");
      onUploaded();
    } catch (error) {
      setProblems([errorMessage(error)]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="Subir entregas y rúbrica"
        description="La IA usará estos criterios para proponer una nota y una retroalimentación por estudiante."
      />
      <form onSubmit={submit} noValidate className="space-y-6">
        <fieldset>
          <legend className="mb-3 flex w-full items-center justify-between gap-3 text-[13px] font-medium text-stone-800">
            Criterios de la rúbrica
            <Badge variant={totalOk ? "success" : "warning"} aria-live="polite">
              Total {total} %
            </Badge>
          </legend>
          <ol className="mb-3 space-y-2">
            {criteria.map((item, index) => (
              <li key={index} className="grid grid-cols-[1fr_5rem_auto] items-start gap-2 sm:grid-cols-[1fr_6rem_auto]">
                <Input
                  aria-label={`Nombre del criterio ${index + 1}`}
                  placeholder="Nombre del criterio"
                  value={item.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                />
                <div className="relative">
                  <Input
                    aria-label={`Peso del criterio ${index + 1} en porcentaje`}
                    inputMode="decimal"
                    className="pr-7 text-right font-mono"
                    value={item.weightPct}
                    onChange={(event) => update(index, { weightPct: event.target.value })}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs text-stone-500"
                  >
                    %
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar criterio ${index + 1}`}
                  title="Quitar criterio"
                  disabled={criteria.length === 1}
                  onClick={() => setCriteria((current) => current.filter((_, i) => i !== index))}
                >
                  <TrashIcon />
                </Button>
              </li>
            ))}
          </ol>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCriteria((current) => [...current, { name: "", weightPct: "0" }])}
          >
            <PlusIcon />
            Agregar criterio
          </Button>
        </fieldset>

        <FileInput
          label="Entregas de los estudiantes"
          hint="PDF, DOC, DOCX o TXT; máximo 10 MB por archivo."
          accept=".pdf,.doc,.docx,.txt"
          multiple
          onChange={onFiles}
        >
          {files.length > 0 && (
            <ul className="space-y-1.5" aria-label="Archivos seleccionados">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`}>
                  <FileChip
                    name={file.name}
                    onRemove={() => setFiles((current) => current.filter((_, i) => i !== index))}
                  />
                </li>
              ))}
            </ul>
          )}
        </FileInput>

        {problems.length > 0 && (
          <Alert variant="danger" title="Revisa antes de enviar">
            <ul className="list-disc space-y-0.5 pl-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Alert>
        )}
        {rejected.length > 0 && (
          <Alert variant="warning" title="Algunos archivos no se procesaron">
            <ul className="space-y-0.5">
              {rejected.map((item) => (
                <li key={item.name}>
                  <span className="font-mono">{item.name}</span>: {item.reason}
                </li>
              ))}
            </ul>
          </Alert>
        )}

        <div className="flex flex-col gap-3 border-t border-border-soft pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-stone-500">
            {files.length > 0
              ? `${files.length} archivo(s) listos para enviar.`
              : "Las sugerencias aparecerán abajo para tu revisión."}
          </p>
          <Button type="submit" loading={submitting} className="w-full sm:w-auto">
            {!submitting && <SparkIcon />}
            Enviar a revisión con IA
          </Button>
        </div>
      </form>
    </Card>
  );
}
