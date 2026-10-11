import type { ApiErrorBody } from "@/types/api";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: unknown;
  readonly traceId: string | null;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.code = body.code;
    this.details = body.details;
    this.traceId = body.traceId;
  }
}

/** 503 means the AI/external service is down: show ManualModeBanner and the manual flow. */
export function isServiceUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 503;
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

export function networkError(): ApiError {
  return new ApiError({
    statusCode: 0,
    code: "NETWORK_ERROR",
    message: "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    details: null,
    traceId: null,
  });
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.statusCode === "number" && typeof candidate.message === "string";
}

export async function toApiError(response: Response): Promise<ApiError> {
  let parsed: unknown = null;
  try {
    parsed = await response.json();
  } catch {
    // Non-JSON error body: fall through to the generic error.
  }
  if (isErrorBody(parsed)) {
    return new ApiError({
      statusCode: parsed.statusCode,
      code: typeof parsed.code === "string" ? parsed.code : "UNKNOWN",
      message: parsed.message,
      details: parsed.details ?? null,
      traceId: typeof parsed.traceId === "string" ? parsed.traceId : null,
    });
  }
  return new ApiError({
    statusCode: response.status,
    code: "UNKNOWN",
    message: "Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.",
    details: null,
    traceId: null,
  });
}

// Spanish copy per backend `code` (API_CONTRATO §6.1): says what happened and what to do next.
const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.",
  ACCOUNT_LOCKED:
    "Tu cuenta está bloqueada por intentos fallidos. Espera 15 minutos o pide a un administrador que la desbloquee.",
  TOO_MANY_REQUESTS: "Hiciste demasiados intentos seguidos. Espera un minuto e inténtalo de nuevo.",
  INVALID_REFRESH_TOKEN: "Tu sesión terminó. Inicia sesión de nuevo.",
  UNAUTHORIZED: "Tu sesión terminó. Inicia sesión de nuevo.",
  FORBIDDEN: "No tienes permiso para hacer esto. Si crees que es un error, contacta al administrador.",
  FORBIDDEN_ORIGIN: "No pudimos verificar el origen de la solicitud. Recarga la página e inténtalo de nuevo.",
  NOT_FOUND: "No encontramos lo que buscas, o no tienes acceso a ello.",
  CONFLICT: "Ya existe un registro con esos datos. Usa un correo o código distinto.",
  WEAK_PASSWORD:
    "La contraseña es muy débil. Usa al menos 10 caracteres, que no sea común y que no incluya tu correo.",
  INVALID_RESET_TOKEN: "El enlace de recuperación no es válido o ya venció. Solicita uno nuevo.",
  SELF_CHANGE_FORBIDDEN: "No puedes desactivarte ni cambiar tu propio rol. Pide a otro administrador que lo haga.",
  INVALID_SUBJECT: "La materia elegida no existe. Actualiza la lista e inténtalo de nuevo.",
  INVALID_TEACHER: "El docente elegido no es válido. Elige un usuario con rol docente.",
  INVALID_TIME_RANGE: "La hora de inicio debe ser anterior a la hora de fin.",
  STUDENT_NOT_FOUND: "No existe un estudiante con ese código. Créalo primero o revisa el código.",
  CSV_REQUIRED: "Selecciona un archivo CSV para importar.",
  EMPTY_CSV: "El archivo CSV no tiene filas de datos.",
  INVALID_CSV_HEADER: "La primera fila debe ser: course,studentCode,fullName,email.",
  CSV_TOO_LARGE: "El archivo supera el límite de 2000 filas o 1 MB. Divídelo en partes.",
};

export function isLocked(error: unknown): boolean {
  return error instanceof ApiError && (error.statusCode === 423 || error.code === "ACCOUNT_LOCKED");
}

/** User-facing message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "VALIDATION_ERROR" && Array.isArray(error.details)) {
      const lines = error.details.filter((item): item is string => typeof item === "string");
      if (lines.length > 0) return `Revisa los datos: ${lines.join("; ")}`;
    }
    return MESSAGES[error.code] ?? error.message;
  }
  return "Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.";
}
