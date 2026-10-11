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
  records: AttendanceRecord[];
  stats: { recognized: number; unrecognized: number };
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
  studentName: string;
  grades: Record<string, string | null>;
  average: string;
  absences: number;
  atRisk: boolean;
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
