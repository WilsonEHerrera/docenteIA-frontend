"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ManualModeBanner } from "@/components/ai/ManualModeBanner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
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
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Asistencia</h1>
        <ErrorState error={session.error} onRetry={session.reload} />
      </div>
    );
  }

  if (session.loading || !session.data) {
    return (
      <div role="status" aria-label="Cargando asistencia" className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
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
            recognized: records.filter((r) => r.status === "PRESENT" && r.source === "AI").length,
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Asistencia{course ? ` · ${course.name}` : ""}
          </h1>
          <p className="font-mono text-[11px] text-stone-500">{data.id}</p>
        </div>
        {confirmed ? (
          <Badge variant="success">Confirmada</Badge>
        ) : data.status === "PROCESSING" ? (
          <Badge variant="info">Procesando</Badge>
        ) : data.status === "MANUAL_REQUIRED" ? (
          <Badge variant="warning">Modo manual</Badge>
        ) : (
          <Badge variant="info">Sugerido por IA</Badge>
        )}
      </div>

      {data.status === "PROCESSING" ? (
        <Card>
          <div role="status" className="space-y-3">
            <p className="text-sm font-semibold text-stone-900">Procesando la foto…</p>
            <p className="text-sm text-stone-600 leading-relaxed">
              Estamos reconociendo a los estudiantes. Esto toma unos segundos; no cierres esta pantalla.
            </p>
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ) : (
        <>
          {data.status === "MANUAL_REQUIRED" && (
            <ManualModeBanner>
              Marca a cada estudiante como presente o ausente y confirma cuando termines.
            </ManualModeBanner>
          )}

          <div className="grid grid-cols-3 gap-3 text-center">
            <Card className="p-4">
              <p className="font-mono text-2xl font-semibold text-stone-900">{present}</p>
              <p className="text-xs text-stone-600">Presentes</p>
            </Card>
            <Card className="p-4">
              <p className="font-mono text-2xl font-semibold text-stone-900">{absent}</p>
              <p className="text-xs text-stone-600">Ausentes</p>
            </Card>
            <Card className="p-4">
              <p className="font-mono text-2xl font-semibold text-amber-700">{unresolved}</p>
              <p className="text-xs text-stone-600">Sin definir</p>
            </Card>
          </div>

          {data.records.length === 0 ? (
            <ErrorState error={new Error("La sesión no tiene estudiantes. Revisa la matrícula del curso.")} />
          ) : (
            <AttendanceGrid
              records={data.records}
              readOnly={confirmed}
              busyIds={busyIds}
              onMark={mark}
            />
          )}

          {confirmed ? (
            <Link
              href="/asistencia"
              className="inline-block text-xs font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900"
            >
              Tomar otra asistencia
            </Link>
          ) : (
            <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-border-soft bg-dashboard px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-stone-600" role="status">
                {unresolved > 0
                  ? `Faltan ${unresolved} por definir. Los no reconocidos no se marcan ausentes solos: decide tú.`
                  : "Todo definido. Puedes confirmar la asistencia."}
              </p>
              <Button onClick={confirm} loading={confirming} disabled={unresolved > 0}>
                Confirmar asistencia
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
