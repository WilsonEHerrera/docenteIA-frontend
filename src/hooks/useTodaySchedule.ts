"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { Course, CourseDetail, Paginated, Weekday } from "@/types/api";

export interface TodaySlot {
  courseId: string;
  courseName: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string | null;
}

const WEEKDAYS: Array<Weekday | null> = [
  null, // Sunday: the contract has no classes on Sunday
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

interface Result {
  token: number;
  slots: TodaySlot[];
  error: unknown;
}

/**
 * Today's classes, built from the real GET /courses + GET /courses/:id (schedules).
 * There is no dedicated "today" endpoint in API_CONTRATO.md.
 */
export function useTodaySchedule() {
  const [token, setToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<Paginated<Course>>("/courses", { query: { limit: 100 } });
        const details = await Promise.all(
          list.data.map((course) => apiFetch<CourseDetail>(`/courses/${course.id}`)),
        );
        const today = WEEKDAYS[new Date().getDay()];
        const slots = details
          .flatMap((course) =>
            course.schedules
              .filter((schedule) => schedule.weekday === today)
              .map((schedule) => ({
                courseId: course.id,
                courseName: course.name,
                subject: course.subject.name,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: schedule.room,
              })),
          )
          .sort((a, b) => a.startTime.localeCompare(b.startTime));
        if (!cancelled) setResult({ token, slots, error: null });
      } catch (error) {
        if (!cancelled) setResult({ token, slots: [], error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const reload = useCallback(() => setToken((value) => value + 1), []);
  const loading = result === null || result.token !== token;
  return {
    slots: result?.slots ?? [],
    error: loading ? null : (result?.error ?? null),
    loading,
    reload,
  };
}
