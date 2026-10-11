import type { AppointmentStatus, Gender } from "@/types";

/** Minimal patient fields embedded in appointment / consultation / prescription responses. */
export interface PatientSummary {
  _id: string;
  patientId: string;
  fullName: string;
  phone: string;
  gender: Gender;
  dateOfBirth: string | Date;
  allergies: string[];
}

/** Minimal doctor (User) fields embedded in clinical responses. */
export interface DoctorSummary {
  _id: string;
  name: string;
  specialization?: string;
}

/** Appointment as returned by the API: raw IDs plus populated participant summaries. */
export interface AppointmentView {
  _id: string;
  patientId: string;
  doctorId: string;
  dateTime: string | Date;
  status: AppointmentStatus;
  reason: string;
  queueNumber?: number;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  patient?: PatientSummary;
  doctor?: DoctorSummary;
}
