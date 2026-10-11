import type {
  Activity,
  AttendanceRecord,
  Course,
  CriterionResult,
  SuggestionWithStudent,
  User,
} from "@/types/api";
import type { Quiz } from "@/types/todo-api";

// Demo data for USE_MOCKS. Shapes follow docs/API_CONTRATO.md §3.
// Demo scenarios (documented here so the screens can be exercised end to end):
//  - Grado 10-A (crs_01): attendance goes PROCESSING -> READY with unrecognized students.
//  - Grado 11-B (crs_02): the AI is down (503) -> ManualModeBanner and manual flow.
//  - Grado 9-C  (crs_03): students without biometric consent; no activities (empty states).

// Courses, users and schedules are REAL since Fase 2 (GET /courses, /users, /courses/:id).
// The mock rosters/activities below only feed the screens whose endpoints are still `planned`
// (attendance, gradebook, submissions, quizzes). Unknown (real) course ids fall back to crs_01.
const DEMO_TEACHER = { id: "usr_teacher_01", fullName: "Laura Gómez" };

export const mockUser: User = {
  id: DEMO_TEACHER.id,
  fullName: DEMO_TEACHER.fullName,
  email: "laura.gomez@colegio.edu.co",
  role: "TEACHER",
  institutionId: "inst_01",
};

function demoCourse(id: string, name: string, subject: string, enrolled: number, maxAbsences: number): Course {
  return {
    id,
    name,
    period: "2026-2",
    maxAbsences,
    subject: { id: `sub_${id}`, name: subject, code: subject.slice(0, 3).toUpperCase() },
    teacher: DEMO_TEACHER,
    enrolledCount: enrolled,
  };
}

export const mockCourses: Course[] = [
  demoCourse("crs_01", "Grado 10-A", "Matemáticas", 6, 8),
  demoCourse("crs_02", "Grado 11-B", "Física", 4, 8),
  demoCourse("crs_03", "Grado 9-C", "Matemáticas", 3, 6),
];

export const FALLBACK_COURSE_ID = "crs_01";

export interface MockStudent {
  id: string;
  name: string;
  absences: number;
  grades: Array<string | null>; // aligned with the course's activities
}

export const mockRosters: Record<string, MockStudent[]> = {
  crs_01: [
    { id: "stu_01", name: "Valentina Rojas", absences: 1, grades: ["4.50", "4.20", "4.80"] },
    { id: "stu_02", name: "Santiago Mejía", absences: 3, grades: ["3.80", "3.50", "4.00"] },
    { id: "stu_03", name: "Camila Torres", absences: 7, grades: ["4.00", "3.20", null] },
    { id: "stu_04", name: "Mateo Herrera", absences: 0, grades: ["2.80", "2.50", "3.10"] },
    { id: "stu_05", name: "Isabela Cruz", absences: 9, grades: ["3.00", "2.90", "3.40"] },
    { id: "stu_06", name: "Daniel Vargas", absences: 2, grades: ["4.90", "4.60", "5.00"] },
  ],
  crs_02: [
    { id: "stu_11", name: "Sofía Londoño", absences: 2, grades: ["4.10", "3.90"] },
    { id: "stu_12", name: "Andrés Pineda", absences: 5, grades: ["3.30", "3.60"] },
    { id: "stu_13", name: "Juliana Ortiz", absences: 0, grades: ["4.70", "4.40"] },
    { id: "stu_14", name: "Felipe Castro", absences: 8, grades: ["2.60", "3.00"] },
  ],
  crs_03: [
    { id: "stu_21", name: "Luciana Ramírez", absences: 1, grades: [] },
    { id: "stu_22", name: "Tomás Aguirre", absences: 0, grades: [] },
    { id: "stu_23", name: "Mariana Soto", absences: 2, grades: [] },
  ],
};

export const mockActivities: Record<string, Activity[]> = {
  crs_01: [
    { id: "act_01", courseId: "crs_01", name: "Taller de funciones", weightPct: "30.00", period: "2026-2" },
    { id: "act_02", courseId: "crs_01", name: "Parcial 1", weightPct: "30.00", period: "2026-2" },
    { id: "act_03", courseId: "crs_01", name: "Proyecto de estadística", weightPct: "40.00", period: "2026-2" },
  ],
  // Weights add up to 80 %: exercises the "porcentajes ≠ 100 %" state.
  crs_02: [
    { id: "act_11", courseId: "crs_02", name: "Laboratorio de cinemática", weightPct: "50.00", period: "2026-2" },
    { id: "act_12", courseId: "crs_02", name: "Quiz de dinámica", weightPct: "30.00", period: "2026-2" },
  ],
  crs_03: [],
};

/** Records the "AI" proposes for a photo of crs_01. Never ABSENT: low confidence is UNRECOGNIZED. */
export function proposedRecords(courseId: string): AttendanceRecord[] {
  const confidences: Array<number | null> = [0.96, 0.91, 0.88, 0.93, 0.42, null];
  const roster = mockRosters[courseId] ?? mockRosters[FALLBACK_COURSE_ID];
  return roster.map((student, index) => {
    const confidence = confidences[index] ?? null;
    const recognized = confidence !== null && confidence >= 0.7;
    return {
      id: `rec_${student.id}`,
      studentId: student.id,
      studentName: student.name,
      status: recognized ? "PRESENT" : "UNRECOGNIZED",
      source: "AI",
      confidence,
    };
  });
}

/** Manual mode: every student starts as pending (UNRECOGNIZED) until the teacher marks them. */
export function manualRecords(courseId: string): AttendanceRecord[] {
  return (mockRosters[courseId] ?? mockRosters[FALLBACK_COURSE_ID]).map((student) => ({
    id: `rec_${student.id}`,
    studentId: student.id,
    studentName: student.name,
    status: "UNRECOGNIZED",
    source: "MANUAL",
    confidence: null,
  }));
}

function criteria(base: number): CriterionResult[] {
  const fmt = (n: number) => Math.min(5, Math.max(0, n)).toFixed(2);
  return [
    {
      criterionId: "crit_01",
      criterionName: "Comprensión del concepto",
      level: base >= 4 ? "Alto" : base >= 3 ? "Medio" : "Bajo",
      score: fmt(base + 0.2),
      justification: "Define con claridad la función y distingue dominio y rango.",
      evidenceQuote: "“Una función asigna a cada valor de x un único valor de y…”",
    },
    {
      criterionId: "crit_02",
      criterionName: "Procedimiento y desarrollo",
      level: base >= 4 ? "Alto" : base >= 3 ? "Medio" : "Bajo",
      score: fmt(base - 0.1),
      justification: "El procedimiento es correcto, pero omite un paso intermedio en el ejercicio 3.",
      evidenceQuote: "“Reemplazo x = 2 y obtengo directamente f(2) = 7.”",
    },
    {
      criterionId: "crit_03",
      criterionName: "Presentación y claridad",
      level: "Medio",
      score: fmt(base - 0.3),
      justification: "El documento es ordenado; faltan unidades en dos respuestas.",
      evidenceQuote: "“Respuesta final: 12”",
    },
  ];
}

export function makeSuggestion(
  id: string,
  studentName: string,
  score: number,
): SuggestionWithStudent {
  return {
    id,
    studentName,
    type: "GRADE",
    status: "PENDING_APPROVAL",
    suggestedScore: score.toFixed(2),
    finalScore: null,
    criteria: criteria(score),
    feedback:
      "Buen trabajo en general. Revisa los pasos intermedios y agrega unidades a las respuestas finales.",
    modelVersion: "eval-model-2026.09",
    promptVersion: "rubric-v3",
    createdAt: "2026-10-11T13:00:00.000Z",
  };
}

export const mockSuggestions: Record<string, SuggestionWithStudent[]> = {
  act_01: [
    makeSuggestion("sug_01", "Valentina Rojas", 4.4),
    makeSuggestion("sug_02", "Santiago Mejía", 3.7),
    makeSuggestion("sug_03", "Camila Torres", 4.0),
    makeSuggestion("sug_04", "Mateo Herrera", 2.9),
  ],
};

export const mockQuizzes: Quiz[] = [
  {
    id: "qz_01",
    courseId: "crs_01",
    title: "Funciones lineales",
    status: "PUBLISHED",
    createdAt: "2026-10-02T15:00:00.000Z",
    questions: [
      {
        id: "q_01",
        type: "CLOSED",
        text: "¿Cuál es la pendiente de la recta y = 3x + 2?",
        options: ["2", "3", "5", "-3"],
        answer: "3",
      },
      {
        id: "q_02",
        type: "OPEN",
        text: "Explica con tus palabras qué representa el intercepto con el eje y.",
        options: [],
        answer: null,
      },
    ],
  },
];
