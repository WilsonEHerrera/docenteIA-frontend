"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type {
  AiSuggestion,
  AttendanceSummary,
  Course,
  GradebookView,
  Paginated,
  Role,
  SuggestionWithStudent,
} from "@/types/api";

export interface DashboardSummary {
  riskAlerts: Array<{
    studentId: string;
    studentName: string;
    courseName: string;
    absences: number;
    maxAbsences: number;
  }>;
  pendingSuggestions: Array<{
    activityId: string;
    activityName: string;
    courseName: string;
    count: number;
  }>;
}

interface Result {
  token: number;
  data: DashboardSummary | null;
  error: unknown;
}

const EMPTY: DashboardSummary = { riskAlerts: [], pendingSuggestions: [] };

/**
 * Home summary. API_CONTRATO.md has no dashboard endpoint, so it is built from real ones:
 *  - fault alerts: GET /courses/:id/attendance/summary (TEACHER, COORDINATOR);
 *  - suggestions waiting for a decision: the course gradebook's activities plus
 *    GET /activities/:id/suggestions?status=PENDING_APPROVAL (TEACHER only).
 * Roles without those endpoints (ADMIN, STUDENT, GUARDIAN) get an empty summary without calling them.
 */
export function useDashboardSummary(role: Role | undefined) {
  const [token, setToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const reads = role === "TEACHER" || role === "COORDINATOR";

  useEffect(() => {
    if (!reads) return;
    let cancelled = false;
    (async () => {
      try {
        const courses = await apiFetch<Paginated<Course>>("/courses", { query: { limit: 100 } });
        const perCourse = await Promise.all(
          courses.data.map(async (course) => {
            const summary = await apiFetch<AttendanceSummary>(`/courses/${course.id}/attendance/summary`);
            const riskAlerts = summary.rows
              .filter((row) => row.alert)
              .map((row) => ({
                studentId: row.studentId,
                studentName: row.studentName,
                courseName: course.name,
                absences: row.absences,
                maxAbsences: summary.maxAbsences,
              }));
            if (role !== "TEACHER") return { riskAlerts, pendingSuggestions: [] };

            const book = await apiFetch<GradebookView>(`/courses/${course.id}/gradebook`);
            const counts = await Promise.all(
              book.activities.map(async (activity) => {
                const page = await apiFetch<Paginated<SuggestionWithStudent | AiSuggestion>>(
                  `/activities/${activity.id}/suggestions`,
                  { query: { status: "PENDING_APPROVAL", limit: 1 } },
                );
                return {
                  activityId: activity.id,
                  activityName: activity.name,
                  courseName: course.name,
                  count: page.meta.total,
                };
              }),
            );
            return { riskAlerts, pendingSuggestions: counts.filter((item) => item.count > 0) };
          }),
        );
        const data: DashboardSummary = {
          riskAlerts: perCourse.flatMap((item) => item.riskAlerts),
          pendingSuggestions: perCourse.flatMap((item) => item.pendingSuggestions),
        };
        if (!cancelled) setResult({ token, data, error: null });
      } catch (error) {
        if (!cancelled) setResult({ token, data: null, error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, reads, role]);

  const reload = useCallback(() => setToken((value) => value + 1), []);
  if (!reads) {
    // Without a role yet, keep loading; roles with no data sources have nothing to show.
    return { data: role === undefined ? null : EMPTY, error: null, reload };
  }
  const settled = result !== null && result.token === token;
  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    reload,
  };
}
