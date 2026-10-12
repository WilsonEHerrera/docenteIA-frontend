import { ApiError } from "../errors";
import { mockUser } from "./data";

const LATENCY_MS = 250;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fail(statusCode: number, code: string, message: string): never {
  throw new ApiError({ statusCode, code, message, details: null, traceId: null });
}

interface Ctx {
  params: string[];
  body: unknown;
  query: Record<string, string | number | undefined>;
}

type Handler = (ctx: Ctx) => unknown;
const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];
function route(method: string, pattern: RegExp, handler: Handler) {
  routes.push({ method, pattern, handler });
}

// Everything `ready` in API_CONTRATO.md goes to the real API (see READY_ENDPOINTS in ../config.ts).
// Only endpoints still `planned` are answered here.
route("GET", /^\/me$/, () => mockUser);

/**
 * Resolves a request against demo data (in-memory, resets on page reload).
 * Add a handler above when a `planned` endpoint needs demo data.
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
