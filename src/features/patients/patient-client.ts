import type { ApiResponse, IPatient } from "@/types";
import type { CreatePatientPayload, UpdatePatientPayload } from "@/lib/validation/patient";
import type { PatientListResponse } from "@/features/patients/types";

/** Error raised by the patient API client, carrying the HTTP status and envelope error details. */
export class PatientApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "PatientApiError";
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new PatientApiError("Network error. Please check your connection.", 0, "NETWORK_ERROR");
  }

  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null;
  }

  if (!res.ok || !body?.success || body.data === undefined) {
    throw new PatientApiError(
      body?.error?.message ?? `Request failed with status ${res.status}`,
      res.status,
      body?.error?.code ?? "UNKNOWN_ERROR",
      body?.error?.details
    );
  }
  return body.data;
}

export function listPatients(params: { query?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params.query) search.set("query", params.query);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return request<PatientListResponse>(`/api/patients${qs ? `?${qs}` : ""}`);
}

export function getPatient(id: string) {
  return request<IPatient>(`/api/patients/${encodeURIComponent(id)}`);
}

export function createPatient(input: CreatePatientPayload) {
  return request<IPatient>("/api/patients", { method: "POST", body: JSON.stringify(input) });
}

export function updatePatient(id: string, input: UpdatePatientPayload) {
  return request<IPatient>(`/api/patients/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
