"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

interface Institution {
  id: string;
  name: string;
}

function InstitutionForm({
  institution,
  onSaved,
}: {
  institution: Institution;
  onSaved: (value: Institution) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(institution.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Escribe el nombre de la institución.");
    setError(undefined);
    setSaving(true);
    try {
      const updated = await apiFetch<Institution>("/institutions/me", {
        method: "PATCH",
        body: { name: name.trim() },
      });
      onSaved(updated);
      toast.show("Nombre actualizado.", "success");
    } catch (caught) {
      toast.show(errorMessage(caught), "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input label="Nombre de la institución" value={name} onChange={(e) => setName(e.target.value)} error={error} />
      </div>
      <Button type="submit" loading={saving} disabled={name.trim() === institution.name}>
        Guardar
      </Button>
    </form>
  );
}

const SECTIONS = [
  { href: "/admin/usuarios", title: "Usuarios", text: "Crea cuentas, cambia roles, desbloquea y cierra sesiones." },
  { href: "/admin/cursos", title: "Cursos", text: "Materias, cursos, docentes y horarios." },
  { href: "/admin/matricula", title: "Matrícula", text: "Importa un CSV o matricula estudiantes uno a uno." },
  { href: "/admin/auditoria", title: "Auditoría", text: "Consulta inicios de sesión y cambios de la institución." },
];

export function AdminHome() {
  const institution = useApiQuery<Institution>("/institutions/me");

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-semibold text-stone-900">Institución</h2>
        {institution.error !== null ? (
          <ErrorState error={institution.error} onRetry={institution.reload} />
        ) : institution.loading || !institution.data ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <InstitutionForm
            key={institution.data.name}
            institution={institution.data}
            onSaved={(value) => institution.setData(() => value)}
          />
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href} className="block">
            <Card className="h-full transition-colors hover:bg-stone-50">
              <h2 className="text-base font-semibold text-stone-900">{section.title}</h2>
              <p className="text-sm leading-relaxed text-stone-600">{section.text}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
