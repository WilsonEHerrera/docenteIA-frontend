"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Pager } from "@/components/ui/Pager";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDateTime } from "@/lib/format";
import type { AuditLogView, Paginated, UserView } from "@/types/api";

const LIMIT = 25;

// Actions listed in API_CONTRATO §6.6.
const ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGIN_BLOCKED",
  "ACCOUNT_LOCKED",
  "LOGOUT",
  "REFRESH_REUSE_DETECTED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_ROLE_CHANGE",
  "USER_SESSIONS_REVOKED",
  "INSTITUTION_UPDATE",
  "SUBJECT_CREATE",
  "COURSE_CREATE",
  "SCHEDULE_CREATE",
  "STUDENT_CREATE",
  "ENROLLMENT_CREATE",
  "ENROLLMENT_IMPORT",
];
const DANGER = new Set(["LOGIN_FAILED", "LOGIN_BLOCKED", "ACCOUNT_LOCKED", "REFRESH_REUSE_DETECTED"]);

interface Filters {
  userId: string;
  action: string;
  from: string;
  to: string;
}

const EMPTY: Filters = { userId: "", action: "", from: "", to: "" };

/** `<input type="date">` value -> ISO instant at the start/end of that local day. */
function dayBoundary(value: string, end: boolean): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function diffPreview(diff: unknown): string {
  if (diff === null || diff === undefined) return "—";
  const text = JSON.stringify(diff);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

export function AuditScreen() {
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const users = useApiQuery<Paginated<UserView>>("/users", { page: 1, limit: 100 });
  const logs = useApiQuery<Paginated<AuditLogView>>("/audit", {
    page,
    limit: LIMIT,
    userId: filters.userId || undefined,
    action: filters.action || undefined,
    from: dayBoundary(filters.from, false),
    to: dayBoundary(filters.to, true),
  });

  const userName = (id: string | null) =>
    id ? (users.data?.data.find((user) => user.id === id)?.fullName ?? id) : "Sistema";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-stone-900">Auditoría</h2>

      <Card className="space-y-3">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setFilters(draft);
          }}
        >
          <Select
            label="Usuario"
            value={draft.userId}
            onChange={(e) => setDraft({ ...draft, userId: e.target.value })}
          >
            <option value="">Todos</option>
            {users.data?.data.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName}
              </option>
            ))}
          </Select>
          <Select
            label="Acción"
            value={draft.action}
            onChange={(e) => setDraft({ ...draft, action: e.target.value })}
          >
            <option value="">Todas</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </Select>
          <Input
            label="Desde"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
          />
          <Input
            label="Hasta"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Filtrar</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(EMPTY);
                setFilters(EMPTY);
                setPage(1);
              }}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </Card>

      {logs.error !== null ? (
        <ErrorState error={logs.error} onRetry={logs.reload} />
      ) : logs.loading || !logs.data ? (
        <div role="status" aria-label="Cargando auditoría" className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : logs.data.data.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay eventos de auditoría con esos filtros." />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <TH>Fecha</TH>
                <TH>Usuario</TH>
                <TH>Acción</TH>
                <TH>Recurso</TH>
                <TH>IP</TH>
                <TH>Detalle</TH>
              </TR>
            </THead>
            <TBody>
              {logs.data.data.map((log) => (
                <TR key={log.id}>
                  <TD className="whitespace-nowrap font-mono">{formatDateTime(log.at)}</TD>
                  <TD>{userName(log.userId)}</TD>
                  <TD>
                    <Badge variant={DANGER.has(log.action) ? "danger" : "neutral"}>{log.action}</Badge>
                  </TD>
                  <TD className="font-mono">
                    {log.resource}
                    {log.resourceId ? ` · ${log.resourceId}` : ""}
                  </TD>
                  <TD className="font-mono">{log.ip ?? "—"}</TD>
                  <TD className="max-w-xs break-all font-mono text-[11px] text-stone-600">
                    {diffPreview(log.diff)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pager page={page} limit={LIMIT} total={logs.data.meta.total} onChange={setPage} />
        </>
      )}
    </div>
  );
}
