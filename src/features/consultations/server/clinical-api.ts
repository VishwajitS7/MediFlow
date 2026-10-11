// Server-only serializers for consultation and prescription route handlers.
import { Types } from "mongoose";
import type { IConsultationDocument } from "@/models/Consultation";
import type { IPrescriptionDocument } from "@/models/Prescription";
import { loadParticipants } from "@/features/appointments/server/participants";
import type { ConsultationView, PrescriptionView } from "@/features/consultations/types";

export type LeanConsultation = Pick<
  IConsultationDocument,
  | "appointmentId"
  | "patientId"
  | "doctorId"
  | "vitals"
  | "chiefComplaint"
  | "symptoms"
  | "diagnosis"
  | "clinicalNotes"
  | "status"
  | "createdAt"
  | "updatedAt"
> & { _id: Types.ObjectId };

export type LeanPrescription = Pick<
  IPrescriptionDocument,
  "consultationId" | "patientId" | "doctorId" | "medications" | "generalInstructions" | "createdAt" | "updatedAt"
> & { _id: Types.ObjectId };

export async function serializeConsultations(docs: LeanConsultation[]): Promise<ConsultationView[]> {
  const maps = await loadParticipants(docs);
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    appointmentId: doc.appointmentId.toString(),
    patientId: doc.patientId.toString(),
    doctorId: doc.doctorId.toString(),
    vitals: { ...(doc.vitals ?? {}) },
    chiefComplaint: doc.chiefComplaint,
    symptoms: doc.symptoms ?? [],
    diagnosis: doc.diagnosis,
    clinicalNotes: doc.clinicalNotes,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    patient: maps.patients.get(doc.patientId.toString()),
    doctor: maps.doctors.get(doc.doctorId.toString()),
  }));
}

export async function serializePrescriptions(docs: LeanPrescription[]): Promise<PrescriptionView[]> {
  const maps = await loadParticipants(docs);
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    consultationId: doc.consultationId.toString(),
    patientId: doc.patientId.toString(),
    doctorId: doc.doctorId.toString(),
    medications: (doc.medications ?? []).map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      durationDays: m.durationDays,
      instructions: m.instructions,
    })),
    generalInstructions: doc.generalInstructions,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    patient: maps.patients.get(doc.patientId.toString()),
    doctor: maps.doctors.get(doc.doctorId.toString()),
  }));
}
