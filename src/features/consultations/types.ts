import type { ConsultationStatus, IMedicationItem, IVitals } from "@/types";
import type { DoctorSummary, PatientSummary } from "@/features/appointments/types";

/** Consultation as returned by the API, with participant summaries. */
export interface ConsultationView {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  vitals: IVitals;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  clinicalNotes?: string;
  status: ConsultationStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  patient?: PatientSummary;
  doctor?: DoctorSummary;
}

/** Prescription as returned by the API, with participant summaries. */
export interface PrescriptionView {
  _id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  medications: IMedicationItem[];
  generalInstructions?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  patient?: PatientSummary;
  doctor?: DoctorSummary;
}
