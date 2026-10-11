// NEXT_PUBLIC_API_URL already includes the /api/v1 prefix (docs/FRONTEND.md §9).
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
).replace(/\/+$/, "");

/**
 * NEXT_PUBLIC_USE_MOCKS:
 *  - unset / "planned" (default): endpoints marked `ready` in API_CONTRATO.md go to the real API;
 *    the ones still `planned` are answered by src/lib/api/mocks.
 *  - "false": everything goes to the real API.
 */
export const MOCK_PLANNED_ENDPOINTS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

// Endpoints `ready` in docs/API_CONTRATO.md §4. Keep in sync when the backend implements more:
// remove the matching mock handler and add the route here.
const READY_ENDPOINTS: RegExp[] = [
  /^\/auth\//,
  /^\/users(\/|$)/,
  /^\/institutions\//,
  /^\/subjects$/,
  /^\/courses$/,
  /^\/courses\/import$/,
  /^\/courses\/[^/]+$/,
  /^\/courses\/[^/]+\/(schedules|enrollments)$/,
  /^\/students$/,
  /^\/audit$/,
  /^\/health\//,
];

/** True when the request must be answered by the demo data instead of the backend. */
export function shouldMock(path: string): boolean {
  if (!MOCK_PLANNED_ENDPOINTS) return false;
  return !READY_ENDPOINTS.some((pattern) => pattern.test(path));
}

/** Forces an attendance demo scenario on every new photo session (mock only). */
export const MOCK_ATTENDANCE_SCENARIO = process.env.NEXT_PUBLIC_MOCK_SCENARIO as
  | "ai-down"
  | "no-consent"
  | undefined;
