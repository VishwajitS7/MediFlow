// Server-only module: imported exclusively by route handlers under src/app/api/patients.
import { Types } from "mongoose";
import { Patient, IPatientDocument } from "@/models/Patient";
import { IPatient } from "@/types";
import { isPatientId, nextPatientId } from "@/features/patients/patient-utils";
import { handleRouteError as handleApiError } from "@/lib/api/http";

export { jsonSuccess, jsonError, isMongoDuplicateKeyError } from "@/lib/api/http";

export function handleRouteError(error: unknown) {
  return handleApiError(error, "patients");
}

type LeanPatient = Pick<
  IPatientDocument,
  | "patientId"
  | "fullName"
  | "dateOfBirth"
  | "gender"
  | "phone"
  | "email"
  | "bloodGroup"
  | "allergies"
  | "emergencyContact"
  | "address"
  | "userId"
  | "createdAt"
  | "updatedAt"
> & { _id: Types.ObjectId };

export function serializePatient(doc: LeanPatient): IPatient {
  return {
    _id: doc._id.toString(),
    patientId: doc.patientId,
    fullName: doc.fullName,
    dateOfBirth: doc.dateOfBirth,
    gender: doc.gender,
    phone: doc.phone,
    email: doc.email,
    bloodGroup: doc.bloodGroup,
    allergies: doc.allergies ?? [],
    emergencyContact: {
      name: doc.emergencyContact.name,
      relationship: doc.emergencyContact.relationship,
      phone: doc.emergencyContact.phone,
    },
    address: doc.address
      ? {
          street: doc.address.street,
          city: doc.address.city,
          state: doc.address.state,
          zipCode: doc.address.zipCode,
        }
      : undefined,
    userId: doc.userId?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Builds a Mongo filter for a route `[id]` segment. Accepts either a Mongo ObjectId
 * or a clinic patient ID (MED-YYYY-XXXXX). Returns null for malformed identifiers.
 */
export function buildPatientIdFilter(id: string): Record<string, unknown> | null {
  if (Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id)) {
    return { _id: new Types.ObjectId(id) };
  }
  if (isPatientId(id)) {
    return { patientId: id };
  }
  return null;
}

/** Generates the next sequential MED-YYYY-XXXXX identifier for the current year. */
export async function generatePatientId(now: Date = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const latest = await Patient.findOne({ patientId: { $regex: `^MED-${year}-` } })
    .sort({ patientId: -1 })
    .select({ patientId: 1 })
    .lean<{ patientId: string }>();
  return nextPatientId(latest?.patientId, year);
}

