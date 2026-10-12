// Types derived from docs/API_CONTRATO.md §2–3. Do not add fields that are not in the contract.

export type Role = "ADMIN" | "TEACHER" | "COORDINATOR" | "STUDENT" | "GUARDIAN";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "UNRECOGNIZED" | "EXCUSED";
export type AttendanceSource = "AI" | "MANUAL";
export type SessionStatus = "PROCESSING" | "READY" | "MANUAL_REQUIRED" | "CONFIRMED";
export type SuggestionStatus = "PENDING_APPROVAL" | "APPROVED" | "EDITED" | "REJECTED";
export type SuggestionType = "GRADE" | "FEEDBACK" | "QUIZ";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "BOUNCED";

// Session user as returned by /auth/login and /auth/refresh (API_CONTRATO §6.2).
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  institutionId: string;
}

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

// API_CONTRATO §6.4
export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Course {
  id: string;
  name: string;
  period: string;
  maxAbsences: number;
  subject: Subject;
  teacher: { id: string; fullName: string };
  enrolledCount: number;
}

export type Weekday = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

export interface Schedule {
  id: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  room: string | null;
}

export interface CourseDetail extends Course {
  schedules: Schedule[];
  students: Array<{ id: string; code: string; fullName: string }>;
}

// API_CONTRATO §6.3
export interface UserView {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

// API_CONTRATO §6.5
export interface ImportReport {
  totalRows: number;
  enrolled: number;
  alreadyEnrolled: number;
  studentsCreated: number;
  errors: Array<{ row: number; message: string }>;
}

// API_CONTRATO §6.6
export interface AuditLogView {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  diff: unknown;
  at: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatus;
  source: AttendanceSource;
  confidence: number | null;
}

export interface AttendanceSession {
  id: string;
  courseId: string;
  date: string;
  status: SessionStatus;
  confirmedAt: string | null;
  facesNotMatched: number | null;
  records: AttendanceRecord[];
  stats: { present: number; absent: number; excused: number; unrecognized: number };
}

// API_CONTRATO §6.9
export interface AttendanceSummaryRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  absences: number;
  excused: number;
  maxAbsences: number;
  usagePct: number;
  alert: boolean;
}

export interface AttendanceSummary {
  maxAbsences: number;
  alertThresholdPct: number;
  confirmedSessions: number;
  rows: AttendanceSummaryRow[];
}

export interface Activity {
  id: string;
  courseId: string;
  name: string;
  weightPct: string;
  period: string;
}

export interface CriterionResult {
  criterionId: string;
  criterionName: string;
  weightPct: string;
  level: string;
  score: string;
  justification: string;
  evidenceQuote: string;
}

export interface AiSuggestion {
  id: string;
  type: SuggestionType;
  status: SuggestionStatus;
  suggestedScore: string | null;
  finalScore: string | null;
  criteria: CriterionResult[];
  feedback: string;
  modelVersion: string;
  promptVersion: string;
  createdAt: string;
}

export interface GradebookRow {
  studentId: string;
  studentCode: string;
  studentName: string;
  grades: Record<string, string | null>;
  gradeIds: Record<string, string>;
  average: string | null;
  isFinal: boolean;
  gradedWeightPct: string;
  absences: number;
  absenceAlert: boolean;
  atRisk: boolean;
}

// API_CONTRATO §6.8
export interface GradebookView {
  period: string;
  weightsTotal: string;
  weightsComplete: boolean;
  activities: Activity[];
  rows: GradebookRow[];
}

// API_CONTRATO §6.11
export interface RubricCriterionPayload {
  name: string;
  weightPct: string;
  levels: Array<{ name: string; score: string }>;
}

export interface SubmissionView {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  status: "PROCESSING" | "SUGGESTED" | "MANUAL_REQUIRED";
  updatedAt: string;
  suggestionId: string | null;
  suggestionStatus: SuggestionStatus | null;
}

export interface SubmissionsResult {
  accepted: number;
  rejected: Array<{ studentId: string; reason: string }>;
}

// API_CONTRATO §6.14
export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "OPEN";
export type QuizStatus = "GENERATING" | "DRAFT" | "MANUAL_REQUIRED" | "PUBLISHED";

export interface QuestionView {
  id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex: number | null;
  explanation: string;
  status: SuggestionStatus;
}

export interface QuizView {
  id: string;
  courseId: string;
  title: string;
  topic: string | null;
  status: QuizStatus;
  provider: string | null;
  promptVersion: string | null;
  createdAt: string;
  publishedAt: string | null;
  questions: QuestionView[];
}

export interface QuizSummaryView {
  id: string;
  title: string;
  status: QuizStatus;
  questionCount: number;
  approvedCount: number;
  pendingCount: number;
  createdAt: string;
  publishedAt: string | null;
}

// API_CONTRATO §6.10
export interface PerformanceReport {
  course: { id: string; name: string };
  period: string;
  weightsTotal: string;
  weightsComplete: boolean;
  studentCount: number;
  gradedStudents: number;
  courseAverage: string | null;
  belowPassing: number;
  absenceAlerts: number;
  atRiskCount: number;
  activities: Array<{ id: string; name: string; weightPct: string; gradedCount: number; average: string | null }>;
  atRiskStudents: Array<{
    studentId: string;
    studentCode: string;
    studentName: string;
    average: string | null;
    absences: number;
    absenceAlert: boolean;
  }>;
}

export interface AttendanceReport {
  course: { id: string; name: string };
  from: string | null;
  to: string | null;
  confirmedSessions: number;
  overallAttendancePct: string | null;
  rows: Array<{
    studentId: string;
    studentCode: string;
    studentName: string;
    present: number;
    absent: number;
    excused: number;
    attendancePct: string | null;
  }>;
}

export interface Notification {
  id: string;
  type: string;
  status: NotificationStatus;
  message: string;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
  traceId: string | null;
}

export type SuggestionWithStudent = AiSuggestion & { studentName: string };
