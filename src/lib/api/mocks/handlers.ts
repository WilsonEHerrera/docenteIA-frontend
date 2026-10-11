import type {
  AiSuggestion,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
  GradebookRow,
  Paginated,
} from "@/types/api";
import type { DashboardSummary, Quiz, QuizQuestion } from "@/types/todo-api";
import { MOCK_ATTENDANCE_SCENARIO } from "../config";
import { ApiError } from "../errors";
import {
  FALLBACK_COURSE_ID,
  makeSuggestion,
  manualRecords,
  mockActivities,
  mockCourses,
  mockQuizzes,
  mockRosters,
  mockSuggestions,
  mockUser,
  proposedRecords,
} from "./data";

const LATENCY_MS = 250;
const POLLS_UNTIL_READY = 2;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fail(statusCode: number, code: string, message: string): never {
  throw new ApiError({ statusCode, code, message, details: null, traceId: null });
}

// In-memory state so actions (confirm, approve, publish) survive navigation within the tab.
let idCounter = 100;
const nextId = (prefix: string) => `${prefix}_${++idCounter}`;
const sessions = new Map<string, { session: AttendanceSession; polls: number }>();
const suggestions: Record<string, ReturnType<typeof makeSuggestion>[]> = structuredClone(mockSuggestions);
const quizzes: Quiz[] = structuredClone(mockQuizzes);

interface Ctx {
  params: string[];
  body: unknown;
  query: Record<string, string | number | undefined>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function field(body: unknown, key: string): string | null {
  if (body instanceof FormData) {
    const value = body.get(key);
    return typeof value === "string" ? value : null;
  }
  const value = asRecord(body)[key];
  return typeof value === "string" ? value : null;
}

function recalc(session: AttendanceSession): AttendanceSession {
  return {
    ...session,
    stats: {
      recognized: session.records.filter((r) => r.status === "PRESENT" && r.source === "AI").length,
      unrecognized: session.records.filter((r) => r.status === "UNRECOGNIZED").length,
    },
  };
}

/** Real course ids (from GET /courses) reuse the crs_01 demo data. */
function demoCourseId(courseId: string): string {
  return mockRosters[courseId] ? courseId : FALLBACK_COURSE_ID;
}

function gradebook(requestedCourseId: string) {
  const courseId = demoCourseId(requestedCourseId);
  const activities = mockActivities[courseId] ?? [];
  const course = mockCourses.find((c) => c.id === courseId);
  if (!course) fail(404, "COURSE_NOT_FOUND", "No encontramos ese curso.");
  const rows: GradebookRow[] = (mockRosters[courseId] ?? [])
    .filter(() => activities.length > 0)
    .map((student) => {
      // The real backend computes the weighted average; this is only demo data.
      let weighted = 0;
      let weight = 0;
      activities.forEach((activity, index) => {
        const grade = student.grades[index];
        if (grade !== null && grade !== undefined) {
          weighted += Number(grade) * Number(activity.weightPct);
          weight += Number(activity.weightPct);
        }
      });
      return {
        studentId: student.id,
        studentName: student.name,
        grades: Object.fromEntries(
          activities.map((activity, index) => [activity.id, student.grades[index] ?? null]),
        ),
        average: weight > 0 ? (weighted / weight).toFixed(2) : "0.00",
        absences: student.absences,
        atRisk: student.absences >= course.maxAbsences * 0.8,
      };
    });
  return { activities, rows };
}

function pendingCount(activityId: string): number {
  return (suggestions[activityId] ?? []).filter((s) => s.status === "PENDING_APPROVAL").length;
}

function newQuiz(courseId: string, topic: string): Quiz {
  const questions: QuizQuestion[] = [
    { id: nextId("q"), type: "CLOSED", text: `¿Cuál de estas afirmaciones describe mejor "${topic}"?`, options: ["Opción A", "Opción B", "Opción C", "Opción D"], answer: "Opción A" },
    { id: nextId("q"), type: "CLOSED", text: `Identifica el ejemplo correcto de "${topic}".`, options: ["Ejemplo 1", "Ejemplo 2", "Ejemplo 3"], answer: "Ejemplo 2" },
    { id: nextId("q"), type: "CLOSED", text: `¿Qué error es común al trabajar con "${topic}"?`, options: ["Error 1", "Error 2", "Error 3", "Error 4"], answer: "Error 3" },
    { id: nextId("q"), type: "OPEN", text: `Explica con tus palabras la idea principal de "${topic}".`, options: [], answer: null },
    { id: nextId("q"), type: "OPEN", text: `Propón un ejemplo propio relacionado con "${topic}" y justifícalo.`, options: [], answer: null },
  ];
  return {
    id: nextId("qz"),
    courseId,
    title: topic,
    status: "PENDING_APPROVAL",
    questions,
    createdAt: new Date().toISOString(),
  };
}

type Handler = (ctx: Ctx) => unknown;
const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];
function route(method: string, pattern: RegExp, handler: Handler) {
  routes.push({ method, pattern, handler });
}

// Auth, users, courses, students and audit are real (see READY_ENDPOINTS in ../config.ts).
route("GET", /^\/me$/, () => mockUser);

route("GET", /^\/courses\/([^/]+)\/gradebook$/, ({ params }) => gradebook(params[0]));

// TODO(api): dashboard summary is not in the contract (alerts and pending suggestions only;
// today's schedule is built in the UI from the real GET /courses/:id).
route("GET", /^\/dashboard$/, (): DashboardSummary => {
  const riskAlerts = mockCourses.flatMap((course) =>
    gradebook(course.id)
      .rows.filter((row) => row.atRisk)
      .map((row) => ({
        studentId: row.studentId,
        studentName: row.studentName,
        courseName: course.name,
        absences: row.absences,
        maxAbsences: course.maxAbsences,
      })),
  );
  const pendingSuggestions = mockCourses.flatMap((course) =>
    (mockActivities[course.id] ?? [])
      .map((activity) => ({
        activityId: activity.id,
        activityName: activity.name,
        courseName: course.name,
        count: pendingCount(activity.id),
      }))
      .filter((item) => item.count > 0),
  );
  return { riskAlerts, pendingSuggestions };
});

// --- Attendance ---
route("POST", /^\/attendance\/sessions$/, ({ body }) => {
  const courseId = field(body, "courseId") ?? "";
  // Scenarios: demo course ids, or NEXT_PUBLIC_MOCK_SCENARIO to force one on any course.
  if (courseId === "crs_02" || MOCK_ATTENDANCE_SCENARIO === "ai-down") {
    fail(503, "AI_UNAVAILABLE", "El reconocimiento por foto no está disponible ahora. Puedes continuar en modo manual.");
  }
  if (courseId === "crs_03" || MOCK_ATTENDANCE_SCENARIO === "no-consent") {
    // TODO(api): the contract does not define the "missing consent" error code.
    fail(409, "BIOMETRIC_CONSENT_MISSING", "Hay estudiantes sin consentimiento biométrico en este curso. Toma la asistencia en modo manual.");
  }
  const id = nextId("ses");
  const session: AttendanceSession = {
    id,
    courseId,
    date: new Date().toISOString(),
    status: "PROCESSING",
    records: [],
    stats: { recognized: 0, unrecognized: 0 },
  };
  sessions.set(id, { session, polls: 0 });
  return session;
});
route("POST", /^\/attendance\/sessions\/manual$/, ({ body }) => {
  const courseId = field(body, "courseId") ?? "";
  const id = nextId("ses");
  const session = recalc({
    id,
    courseId,
    date: new Date().toISOString(),
    status: "MANUAL_REQUIRED",
    records: manualRecords(courseId),
    stats: { recognized: 0, unrecognized: 0 },
  });
  sessions.set(id, { session, polls: 0 });
  return session;
});
route("GET", /^\/attendance\/sessions\/([^/]+)$/, ({ params }) => {
  const entry = sessions.get(params[0]);
  if (!entry) fail(404, "SESSION_NOT_FOUND", "No encontramos esa sesión de asistencia.");
  if (entry.session.status === "PROCESSING") {
    entry.polls += 1;
    if (entry.polls >= POLLS_UNTIL_READY) {
      entry.session = recalc({
        ...entry.session,
        status: "READY",
        records: proposedRecords(entry.session.courseId),
      });
    }
  }
  return entry.session;
});
route("PATCH", /^\/attendance\/sessions\/([^/]+)\/records\/([^/]+)$/, ({ params, body }) => {
  const entry = sessions.get(params[0]);
  if (!entry) fail(404, "SESSION_NOT_FOUND", "No encontramos esa sesión de asistencia.");
  if (entry.session.status === "CONFIRMED") {
    fail(409, "SESSION_CONFIRMED", "Esta asistencia ya fue confirmada y no se puede modificar.");
  }
  const status = field(body, "status") as AttendanceStatus | null;
  if (!status) fail(422, "VALIDATION_ERROR", "Indica el estado de asistencia.");
  let updated: AttendanceRecord | undefined;
  const records = entry.session.records.map((record) => {
    if (record.id !== params[1]) return record;
    updated = { ...record, status, source: "MANUAL" };
    return updated;
  });
  if (!updated) fail(404, "RECORD_NOT_FOUND", "No encontramos ese estudiante en la sesión.");
  entry.session = recalc({ ...entry.session, records });
  return updated;
});
route("POST", /^\/attendance\/sessions\/([^/]+)\/confirm$/, ({ params }) => {
  const entry = sessions.get(params[0]);
  if (!entry) fail(404, "SESSION_NOT_FOUND", "No encontramos esa sesión de asistencia.");
  if (entry.session.status === "CONFIRMED") {
    fail(409, "SESSION_CONFIRMED", "Esta asistencia ya fue confirmada.");
  }
  entry.session = { ...entry.session, status: "CONFIRMED" };
  return entry.session;
});

// --- Submissions / suggestions ---
route("POST", /^\/activities\/([^/]+)\/rubric$/, () => ({ id: nextId("rub") }));
route("POST", /^\/activities\/([^/]+)\/submissions$/, ({ params, body }) => {
  const files = body instanceof FormData ? body.getAll("files") : [];
  const accepted: string[] = [];
  const rejected: Array<{ name: string; reason: string }> = [];
  files.forEach((file, index) => {
    if (!(file instanceof File)) return;
    if (!/\.(pdf|docx?|txt)$/i.test(file.name)) {
      rejected.push({ name: file.name, reason: "Formato no admitido (usa PDF, DOC, DOCX o TXT)." });
      return;
    }
    const student = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
    const list = (suggestions[params[0]] ??= []);
    list.push(makeSuggestion(nextId("sug"), student, 3 + ((index * 7) % 20) / 10));
    accepted.push(file.name);
  });
  return { accepted: accepted.length, rejected };
});
route("GET", /^\/activities\/([^/]+)\/suggestions$/, ({ params, query }) => {
  let list = suggestions[params[0]] ?? [];
  if (query.status) list = list.filter((s) => s.status === query.status);
  const page: Paginated<(typeof list)[number]> = {
    data: list,
    meta: { page: 1, limit: 100, total: list.length },
  };
  return page;
});

function updateSuggestion(id: string, change: Partial<AiSuggestion>): AiSuggestion {
  for (const list of Object.values(suggestions)) {
    const index = list.findIndex((s) => s.id === id);
    if (index >= 0) {
      list[index] = { ...list[index], ...change };
      return list[index];
    }
  }
  return fail(404, "SUGGESTION_NOT_FOUND", "No encontramos esa sugerencia.");
}
route("POST", /^\/suggestions\/([^/]+)\/approve$/, ({ params }) => {
  const current = Object.values(suggestions).flat().find((s) => s.id === params[0]);
  return updateSuggestion(params[0], { status: "APPROVED", finalScore: current?.suggestedScore ?? null });
});
route("POST", /^\/suggestions\/([^/]+)\/edit$/, ({ params, body }) => {
  const finalScore = field(body, "finalScore");
  if (finalScore === null || Number.isNaN(Number(finalScore)) || Number(finalScore) < 0 || Number(finalScore) > 5) {
    fail(422, "VALIDATION_ERROR", "La nota debe estar entre 0.00 y 5.00.");
  }
  return updateSuggestion(params[0], {
    status: "EDITED",
    finalScore,
    feedback: field(body, "feedback") ?? "",
  });
});
route("POST", /^\/suggestions\/([^/]+)\/reject$/, ({ params }) =>
  updateSuggestion(params[0], { status: "REJECTED", finalScore: null }),
);

// --- Quizzes (TODO(api): list, regenerate and the Quiz shape are not in the contract) ---
route("GET", /^\/quizzes$/, ({ query }) => {
  const list = query.courseId ? quizzes.filter((q) => q.courseId === query.courseId) : quizzes;
  return list;
});
route("GET", /^\/quizzes\/([^/]+)$/, ({ params }) => {
  const quiz = quizzes.find((q) => q.id === params[0]);
  return quiz ?? fail(404, "QUIZ_NOT_FOUND", "No encontramos ese cuestionario.");
});
route("POST", /^\/quizzes\/generate$/, ({ body }) => {
  const courseId = field(body, "courseId") ?? "";
  const file = body instanceof FormData ? body.get("file") : null;
  const topic = field(body, "topic")?.trim() || (file instanceof File ? file.name.replace(/\.[^.]+$/, "") : "");
  if (!topic) fail(422, "VALIDATION_ERROR", "Escribe un tema o adjunta un documento.");
  const quiz = newQuiz(courseId, topic);
  quizzes.unshift(quiz);
  return quiz;
});
route("PATCH", /^\/quizzes\/([^/]+)$/, ({ params, body }) => {
  const quiz = quizzes.find((q) => q.id === params[0]);
  if (!quiz) fail(404, "QUIZ_NOT_FOUND", "No encontramos ese cuestionario.");
  const questions = asRecord(body).questions;
  if (Array.isArray(questions)) quiz.questions = questions as QuizQuestion[];
  return quiz;
});
route("POST", /^\/quizzes\/([^/]+)\/questions\/([^/]+)\/regenerate$/, ({ params }) => {
  const quiz = quizzes.find((q) => q.id === params[0]);
  const question = quiz?.questions.find((q) => q.id === params[1]);
  if (!quiz || !question) fail(404, "QUESTION_NOT_FOUND", "No encontramos esa pregunta.");
  const regenerated: QuizQuestion = {
    ...question,
    text: `${quiz.title}: nueva versión de la pregunta (${nextId("v")}).`,
  };
  quiz.questions = quiz.questions.map((q) => (q.id === question.id ? regenerated : q));
  return quiz;
});
route("POST", /^\/quizzes\/([^/]+)\/publish$/, ({ params }) => {
  const quiz = quizzes.find((q) => q.id === params[0]);
  if (!quiz) fail(404, "QUIZ_NOT_FOUND", "No encontramos ese cuestionario.");
  if (quiz.questions.length === 0) fail(409, "QUIZ_EMPTY", "Agrega al menos una pregunta antes de publicar.");
  quiz.status = "PUBLISHED";
  return quiz;
});

// --- Export (CSV stands in for pdf/xlsx in demo mode) ---
route("GET", /^\/reports\/export$/, ({ query }) => {
  const { activities, rows } = gradebook(String(query.courseId ?? ""));
  const header = ["Estudiante", ...activities.map((a) => a.name), "Promedio", "Fallas"];
  const lines = rows.map((row) =>
    [row.studentName, ...activities.map((a) => row.grades[a.id] ?? ""), row.average, row.absences].join(","),
  );
  return new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
});

/**
 * Resolves a request against demo data (in-memory, resets on page reload).
 * Each new screen adds its handlers above.
 */
export async function mockRequest(
  method: string,
  path: string,
  body?: unknown,
  query: Record<string, string | number | undefined> = {},
): Promise<unknown> {
  await wait(LATENCY_MS);
  const verb = method.toUpperCase();
  for (const candidate of routes) {
    if (candidate.method !== verb) continue;
    const match = candidate.pattern.exec(path);
    if (match) {
      const result = candidate.handler({ params: match.slice(1), body, query });
      // Hand out copies so screens can never mutate the in-memory store by accident.
      return result === undefined ? undefined : structuredClone(result);
    }
  }
  return fail(404, "MOCK_NOT_IMPLEMENTED", `No hay datos de demostración para ${path}.`);
}
