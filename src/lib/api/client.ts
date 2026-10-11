import type { ApiResponse } from "@/types";

/** Error raised by browser API helpers, carrying the HTTP status and envelope error details. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/** Fetches a MediFlow API route and unwraps the `ApiResponse<T>` envelope, throwing ApiClientError on failure. */
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiClientError("Network error. Please check your connection.", 0, "NETWORK_ERROR");
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!res.ok || !body?.success || body.data === undefined) {
    throw new ApiClientError(
      body?.error?.message ?? `Request failed with status ${res.status}`,
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.details
    );
  }
  return body.data;
}

/** Builds a query string from defined, non-empty values. */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** First message per field from a Zod `flatten().fieldErrors` details object. */
export function firstFieldErrors(details: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (details && typeof details === "object") {
    for (const [key, messages] of Object.entries(details as Record<string, unknown>)) {
      if (Array.isArray(messages) && typeof messages[0] === "string") out[key] = messages[0];
    }
  }
  return out;
}
