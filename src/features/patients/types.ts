import type { IPatient } from "@/types";

export interface PatientPagination {
  page: number;
  limit: number;
  total: number;
}

/** `data` payload of GET /api/patients. */
export interface PatientListResponse {
  patients: IPatient[];
  pagination: PatientPagination;
}
