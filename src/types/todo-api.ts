// TODO(api): shapes used by Fase 1 screens that are NOT in docs/API_CONTRATO.md yet.
// They exist only to type the mocks; confirm them with the backend before Fase 2.

export type QuizStatus = "PENDING_APPROVAL" | "PUBLISHED";
export type QuestionType = "OPEN" | "CLOSED";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options: string[];
  answer: string | null;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  status: QuizStatus;
  questions: QuizQuestion[];
  createdAt: string;
}

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

export interface RubricCriterionInput {
  name: string;
  weightPct: string;
}
