"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { BarList } from "@/components/ui/BarList";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { BookIcon, CheckCircleIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatTile } from "@/components/ui/StatTile";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { formatDateTime } from "@/lib/format";
import type { AuditLogView, Course, Paginated, Role, UserView } from "@/types/api";

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
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="flex-1">
        <Input
          aria-label="Nombre de la institución"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
      </div>
      <Button type="submit" loading={saving} disabled={name.trim() === institution.name}>
        Guardar
      </Button>
    </form>
  );
}

const ROLE_ORDER: Role[] = ["TEACHER", "STUDENT", "COORDINATOR", "GUARDIAN", "ADMIN"];
const DANGER = new Set(["LOGIN_FAILED", "LOGIN_BLOCKED", "ACCOUNT_LOCKED", "REFRESH_REUSE_DETECTED"]);

export function AdminHome() {
  const institution = useApiQuery<Institution>("/institutions/me");
  const users = useApiQuery<Paginated<UserView>>("/users", { page: 1, limit: 100 });
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 1 });
  const audit = useApiQuery<Paginated<AuditLogView>>("/audit", { page: 1, limit: 6 });
  // Captured once so the "locked" count is stable while the page is open.
  const [openedAt] = useState(() => Date.now());

  const list = users.data?.data ?? [];
  // Breakdowns are only exact when every user fits in the loaded page.
  const complete = users.data !== null && list.length >= users.data.meta.total;
  const locked = list.filter((u) => u.lockedUntil !== null && new Date(u.lockedUntil).getTime() > openedAt).length;
  const active = list.filter((u) => u.isActive).length;
  const byRole = ROLE_ORDER.map((role) => ({
    key: role,
    label: ROLE_LABELS[role],
    value: list.filter((u) => u.role === role).length,
  })).filter((item) => item.value > 0);
  const userName = (id: string | null) =>
    id ? (list.find((u) => u.id === id)?.fullName ?? id) : "Sistema";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile label="Usuarios" icon={<UsersIcon />} value={users.data ? users.data.meta.total : null} />
        <StatTile
          label="Cuentas activas"
          icon={<CheckCircleIcon />}
          value={users.data ? (complete ? active : "—") : null}
          hint={complete ? undefined : "Consulta el detalle en Usuarios."}
        />
        <StatTile
          label="Bloqueadas"
          icon={<ShieldIcon />}
          tone={locked > 0 ? "warning" : "default"}
          value={users.data ? (complete ? locked : "—") : null}
          hint={locked > 0 ? "Puedes desbloquearlas en Usuarios." : undefined}
        />
        <StatTile label="Cursos" icon={<BookIcon />} value={courses.data ? courses.data.meta.total : null} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-4 lg:col-span-7 lg:space-y-6">
          <Card>
            <CardHeader title="Usuarios por rol" description="Distribución de las cuentas de la institución." />
            {users.error !== null ? (
              <ErrorState error={users.error} onRetry={users.reload} />
            ) : !users.data ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : byRole.length === 0 ? (
              <EmptyState inset title="Sin usuarios" description="Crea el primer usuario desde la pestaña Usuarios." />
            ) : complete ? (
              <BarList label="Usuarios por rol" unit="usuarios" items={byRole} />
            ) : (
              <p className="text-[13px] text-stone-600">
                Hay más de {list.length} usuarios; consulta la distribución completa en la pestaña Usuarios.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Institución" description="Nombre visible para todos los usuarios de la plataforma." />
            {institution.error !== null ? (
              <ErrorState error={institution.error} onRetry={institution.reload} />
            ) : institution.loading || !institution.data ? (
              <Skeleton className="h-11 w-full" />
            ) : (
              <InstitutionForm
                key={institution.data.name}
                institution={institution.data}
                onSaved={(value) => institution.setData(() => value)}
              />
            )}
          </Card>
        </div>

        <Card className="lg:col-span-5">
          <CardHeader title="Actividad reciente" description="Últimos eventos registrados en la auditoría." />
          {audit.error !== null ? (
            <ErrorState error={audit.error} onRetry={audit.reload} />
          ) : !audit.data ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : audit.data.data.length === 0 ? (
            <EmptyState inset title="Sin eventos" description="Aún no hay actividad registrada." />
          ) : (
            <ol className="relative space-y-4 border-l border-border-soft pl-5">
              {audit.data.data.map((log) => (
                <li key={log.id} className="relative space-y-1">
                  <span
                    aria-hidden="true"
                    className={`absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-white ${DANGER.has(log.action) ? "bg-rose-600" : "bg-stone-400"}`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={DANGER.has(log.action) ? "danger" : "neutral"}>{log.action}</Badge>
                    <span className="font-mono text-[11px] text-stone-500">{formatDateTime(log.at)}</span>
                  </div>
                  <p className="text-[13px] text-stone-700">
                    <span className="font-medium text-stone-900">{userName(log.userId)}</span> · {log.resource}
                    {log.resourceId ? <span className="font-mono text-xs text-stone-500"> {log.resourceId}</span> : null}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
