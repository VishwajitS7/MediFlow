import type { CreateConsultationPayload, UpdateConsultationPayload } from "@/lib/validation/consultation";
import type { CreatePrescriptionPayload } from "@/lib/validation/prescription";
import { apiRequest, toQueryString } from "@/lib/api/client";
import type { ConsultationView, PrescriptionView } from "@/features/consultations/types";

export function listConsultations(params: { patientId?: string; doctorId?: string; appointmentId?: string; limit?: number }) {
  return apiRequest<ConsultationView[]>(`/api/consultations${toQueryString({ ...params })}`);
}

export function getConsultation(id: string) {
  return apiRequest<ConsultationView>(`/api/consultations/${encodeURIComponent(id)}`);
}

export function createConsultation(payload: CreateConsultationPayload) {
  return apiRequest<ConsultationView>("/api/consultations", { method: "POST", body: JSON.stringify(payload) });
}

export function updateConsultation(id: string, payload: UpdateConsultationPayload) {
  return apiRequest<ConsultationView>(`/api/consultations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listPrescriptions(params: { patientId?: string; consultationId?: string; limit?: number }) {
  return apiRequest<PrescriptionView[]>(`/api/prescriptions${toQueryString({ ...params })}`);
}

export function getPrescription(id: string) {
  return apiRequest<PrescriptionView>(`/api/prescriptions/${encodeURIComponent(id)}`);
}

export function createPrescription(payload: CreatePrescriptionPayload) {
  return apiRequest<PrescriptionView>("/api/prescriptions", { method: "POST", body: JSON.stringify(payload) });
}
