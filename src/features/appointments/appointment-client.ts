import type { AppointmentStatus } from "@/types";
import type { CreateAppointmentPayload } from "@/lib/validation/appointment";
import { apiRequest, toQueryString } from "@/lib/api/client";
import type { AppointmentView, DoctorSummary } from "@/features/appointments/types";

export interface AppointmentListParams {
  doctorId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  date?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function listAppointments(params: AppointmentListParams = {}) {
  return apiRequest<AppointmentView[]>(`/api/appointments${toQueryString({ ...params })}`);
}

export function getAppointment(id: string) {
  return apiRequest<AppointmentView>(`/api/appointments/${encodeURIComponent(id)}`);
}

export function createAppointment(payload: CreateAppointmentPayload) {
  return apiRequest<AppointmentView>("/api/appointments", { method: "POST", body: JSON.stringify(payload) });
}

export function updateAppointmentStatus(id: string, status: Exclude<AppointmentStatus, "SCHEDULED">) {
  return apiRequest<AppointmentView>(`/api/appointments/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function listDoctors() {
  return apiRequest<DoctorSummary[]>("/api/appointments/doctors");
}
