// Server-only: bulk-loads patient and doctor summaries for clinical records (avoids N+1 populates).
import { Types } from "mongoose";
import { Patient } from "@/models/Patient";
import { User } from "@/models/User";
import type { UserRole } from "@/types";
import type { DoctorSummary, PatientSummary } from "@/features/appointments/types";

interface HasParticipants {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
}

export interface ParticipantMaps {
  patients: Map<string, PatientSummary>;
  doctors: Map<string, DoctorSummary>;
}

export async function loadParticipants(records: HasParticipants[]): Promise<ParticipantMaps> {
  const patientIds = [...new Set(records.map((r) => r.patientId.toString()))];
  const doctorIds = [...new Set(records.map((r) => r.doctorId.toString()))];

  const [patients, doctors] = await Promise.all([
    patientIds.length
      ? Patient.find({ _id: { $in: patientIds } })
          .select({ patientId: 1, fullName: 1, phone: 1, gender: 1, dateOfBirth: 1, allergies: 1 })
          .lean()
      : [],
    doctorIds.length
      ? User.find({ _id: { $in: doctorIds } }).select({ name: 1, specialization: 1 }).lean()
      : [],
  ]);

  return {
    patients: new Map(
      patients.map((p) => [
        p._id.toString(),
        {
          _id: p._id.toString(),
          patientId: p.patientId,
          fullName: p.fullName,
          phone: p.phone,
          gender: p.gender,
          dateOfBirth: p.dateOfBirth,
          allergies: p.allergies ?? [],
        },
      ])
    ),
    doctors: new Map(
      doctors.map((d) => [d._id.toString(), { _id: d._id.toString(), name: d.name, specialization: d.specialization }])
    ),
  };
}

/**
 * For PATIENT sessions, returns the `_id` of the patient record linked to the account (or null when
 * no record is linked). For staff roles returns undefined, meaning "no patient restriction".
 */
export async function resolvePatientScope(user: { id: string; role: UserRole }): Promise<Types.ObjectId | null | undefined> {
  if (user.role !== "PATIENT") return undefined;
  if (!Types.ObjectId.isValid(user.id)) return null;
  const record = await Patient.findOne({ userId: user.id }).select({ _id: 1 }).lean();
  return record?._id ?? null;
}
