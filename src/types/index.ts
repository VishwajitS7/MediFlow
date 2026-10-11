/**
 * MediFlow — Canonical TypeScript Type Definitions
 * Source of Truth: docs/DATA_MODEL.md & docs/API_CONTRACTS.md
 */

export type UserRole = "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ConsultationStatus = "DRAFT" | "COMPLETED";

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  specialization?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface IPatient {
  _id?: string;
  patientId: string;
  fullName: string;
  dateOfBirth: string | Date;
  gender: Gender;
  phone: string;
  email?: string;
  bloodGroup?: BloodGroup;
  allergies: string[];
  emergencyContact: IEmergencyContact;
  address?: IAddress;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IAppointment {
  _id?: string;
  patientId: string;
  doctorId: string;
  dateTime: string | Date;
  status: AppointmentStatus;
  reason: string;
  queueNumber?: number;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IVitals {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  spo2?: number;
}

export interface IConsultation {
  _id?: string;
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
}

export interface IMedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface IPrescription {
  _id?: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  medications: IMedicationItem[];
  generalInstructions?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// ============================================================================
// Standardized API Envelope Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}
