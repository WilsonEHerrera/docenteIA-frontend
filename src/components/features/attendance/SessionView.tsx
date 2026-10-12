"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { AiBadge, OriginTag } from "@/components/ai/OriginTag";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { AlertTriangleIcon, CheckCircleIcon, CheckIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useApiQuery } from "@/hooks/useApiQuery";
import { apiFetch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type {
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  Course,
  Paginated,
} from "@/types/api";
import { AttendanceGrid } from "./AttendanceGrid";

const POLL_START_MS = 2000;
const POLL_MAX_MS = 8000;

export function SessionView({ sessionId }: { sessionId: string }) {
  const toast = useToast();
  const session = useApiQuery<AttendanceSession>(`/attendance/sessions/${sessionId}`);
  const courses = useApiQuery<Paginated<Course>>("/courses", { limit: 100 });
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const delay = useRef(POLL_START_MS);

  const status = session.data?.status;
  const { reload } = session;

  // Poll with backoff while the AI is working (API_CONTRATO §5.1).
  useEffect(() => {
    if (status !== "PROCESSING") return;
    const timer = setTimeout(() => {
      delay.current = Math.min(delay.current * 1.5, POLL_MAX_MS);
      reload();
    }, delay.current);
    return () => clearTimeout(timer);
  }, [status, reload, session.fetching]);

  if (session.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Asistencia" back={{ href: "/asistencia", label: "Asistencia" }} />
        <ErrorState error={session.error} onRetry={session.reload} />
      </div>
    );
  }

  if (session.loading || !session.data) {
    return (
      <div role="status" aria-label="Cargando asistencia" className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  const data = session.data;
  const course = courses.data?.data.find((item) => item.id === data.courseId);
  const confirmed = data.status === "CONFIRMED";
  const unresolved = data.records.filter((record) => record.status === "UNRECOGNIZED").length;
  const present = data.records.filter((record) => record.status === "PRESENT").length;
  const absent = data.records.filter((record) => record.status === "ABSENT").length;

  async function mark(recordId: string, next: AttendanceStatus) {
    setBusyIds((current) => new Set(current).add(recordId));
    try {
      const updated = await apiFetch<AttendanceRecord>(
        `/attendance/sessions/${sessionId}/records/${recordId}`,
        { method: "PATCH", body: { status: next } },
      );
      session.setData((current) => {
        const records = current.records.map((record) => (record.id === updated.id ? updated : record));
        return {
          ...current,
          records,
          stats: {
            present: records.filter((r) => r.status === "PRESENT").length,
            absent: records.filter((r) => r.status === "ABSENT").length,
            excused: records.filter((r) => r.status === "EXCUSED").length,
            unrecognized: records.filter((r) => r.status === "UNRECOGNIZED").length,
          },
        };
      });
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setBusyIds((current) => {
        const copy = new Set(current);
        copy.delete(recordId);
        return copy;
      });
    }
  }

  async function confirm() {
    setConfirming(true);
    try {
      const confirmedSession = await apiFetch<AttendanceSession>(
        `/attendance/sessions/${sessionId}/confirm`,
        { method: "POST" },
      );
      session.setData(() => confirmedSession);
      toast.show("Asistencia confirmada.", "success");
    } catch (error) {
      toast.show(errorMessage(error), "danger");
    } finally {
      setConfirming(false);
    }
  }

  const stats = [
    { label: "Presentes", value: present, tone: "text-stone-900" },
    { label: "Ausentes", value: absent, tone: "text-stone-900" },
    { label: "Sin definir", value: unresolved, tone: unresolved > 0 ? "text-amber-700" : "text-stone-900" },
  ];

  return (
    <div className={confirmed ? "space-y-6" : "space-y-6 pb-4"}>
      <PageHeader
        back={{ href: "/asistencia", label: "Asistencia" }}
        title={course ? course.name : "Asistencia"}
        meta={data.id}
        status={
          confirmed ? (
            <Badge variant="success">
              <CheckIcon />
              Confirmada
            </Badge>
          ) : data.status === "PROCESSING" ? (
            <Badge variant="info">Procesando</Badge>
          ) : data.status === "MANUAL_REQUIRED" ? (
            <Badge variant="warning">Modo manual</Badge>
          ) : (
            <AiBadge />
          )
        }
      />

      {data.status === "PROCESSING" ? (
        <Card>
          <div role="status" className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900"
            />
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-stone-900">Procesando la foto…</p>
                <p className="text-[13px] leading-relaxed text-stone-600">
                  Estamos reconociendo a los estudiantes. Esto toma unos segundos; no cierres esta pantalla.
                </p>
              </div>
              <Skeleton className="h-2.5 w-2/3" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        </Card>
      ) : (
        <>
          {data.status === "MANUAL_REQUIRED" && (
            <ManualModeBanner>
              Marca a cada estudiante como presente o ausente y confirma cuando termines.
            </ManualModeBanner>
          )}

          <Card padding="none" spacing="none">
            <dl className="grid grid-cols-3 divide-x divide-border-soft">
              {stats.map((stat) => (
                <div key={stat.label} className="px-3 py-4 text-center sm:px-6 sm:text-left">
                  <dt className="text-xs text-stone-600">{stat.label}</dt>
                  <dd className={`font-mono text-2xl font-semibold tabular-nums ${stat.tone}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>
            {!confirmed && data.status === "READY" && (
              <div className="border-t border-border-soft px-4 py-3 sm:px-6">
                <OriginTag
                  origin="ai"
                  label="Propuesta de la IA a partir de la foto. Revisa a cada estudiante antes de confirmar."
                  className="whitespace-normal"
                />
              </div>
            )}
          </Card>

          {data.records.length === 0 ? (
            <ErrorState error={new Error("La sesión no tiene estudiantes. Revisa la matrícula del curso.")} />
          ) : (
            <AttendanceGrid records={data.records} readOnly={confirmed} busyIds={busyIds} onMark={mark} />
          )}

          {confirmed ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[13px] text-emerald-900" role="status">
                <CheckCircleIcon className="shrink-0 text-emerald-700" />
                Asistencia confirmada y registrada.
              </p>
              <Link
                href="/asistencia"
                className="inline-flex h-10 items-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-800 shadow-xs transition-colors hover:bg-stone-50"
              >
                Tomar otra asistencia
              </Link>
            </div>
          ) : (
            <div className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-border-soft bg-white/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:bottom-4 sm:flex-row sm:items-center sm:justify-between sm:pl-5">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-stone-700" role="status">
                {unresolved > 0 ? (
                  <>
                    <AlertTriangleIcon className="mt-px shrink-0 text-amber-700" />
                    <span>
                      Faltan <span className="font-mono font-semibold">{unresolved}</span> por definir. Los no
                      reconocidos no se marcan ausentes solos: decide tú.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="mt-px shrink-0 text-emerald-700" />
                    Todo definido. Puedes confirmar la asistencia.
                  </>
                )}
              </p>
              <Button onClick={confirm} loading={confirming} disabled={unresolved > 0} className="w-full sm:w-auto">
                Confirmar asistencia
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
