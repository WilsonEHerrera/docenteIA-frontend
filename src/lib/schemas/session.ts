import type { Paginated, Role, SessionResponse, User } from "@/types/api";

// Hand-written runtime guards for the critical responses. Zod is not installed yet; when it is,
// replace these with schemas and keep the same `parse` signature for `apiFetch`.

const ROLES: readonly Role[] = ["ADMIN", "TEACHER", "COORDINATOR", "STUDENT", "GUARDIAN"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseUser(value: unknown): User {
  if (
    !isObject(value) ||
    typeof value.id !== "string" ||
    typeof value.email !== "string" ||
    typeof value.fullName !== "string" ||
    typeof value.institutionId !== "string" ||
    !ROLES.includes(value.role as Role)
  ) {
    throw new Error("Respuesta de sesión inesperada.");
  }
  return {
    id: value.id,
    email: value.email,
    fullName: value.fullName,
    institutionId: value.institutionId,
    role: value.role as Role,
  };
}

/** Validates the body of POST /auth/login and POST /auth/refresh. */
export function parseSessionResponse(value: unknown): SessionResponse {
  if (!isObject(value) || typeof value.accessToken !== "string" || value.accessToken === "") {
    throw new Error("Respuesta de sesión inesperada.");
  }
  return {
    accessToken: value.accessToken,
    expiresIn: typeof value.expiresIn === "number" ? value.expiresIn : 900,
    user: parseUser(value.user),
  };
}

/** Validates the pagination envelope; items are trusted to match the generic type. */
export function parsePaginated<T>(value: unknown): Paginated<T> {
  if (!isObject(value) || !Array.isArray(value.data) || !isObject(value.meta)) {
    throw new Error("Respuesta paginada inesperada.");
  }
  const { page, limit, total } = value.meta;
  if (typeof page !== "number" || typeof limit !== "number" || typeof total !== "number") {
    throw new Error("Respuesta paginada inesperada.");
  }
  return { data: value.data as T[], meta: { page, limit, total } };
}
