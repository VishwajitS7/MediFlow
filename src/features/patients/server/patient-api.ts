// Server-only module: imported exclusively by route handlers under src/app/api/patients.
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { Patient, IPatientDocument } from "@/models/Patient";
import { ApiResponse, IPatient } from "@/types";
import { isPatientId, nextPatientId } from "@/features/patients/patient-utils";

type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR";

export function jsonSuccess<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data, timestamp: new Date().toISOString() };
  return NextResponse.json(body, { status });
}

export function jsonError(status: number, code: ErrorCode, message: string, details?: unknown) {
  const body: ApiResponse = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

function isMongoDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}

/**
 * Maps thrown errors (RBAC guards, Mongo, connection failures) to the standard error envelope.
 * Never echoes raw internal error messages for unexpected failures.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "UNAUTHORIZED") {
      return jsonError(401, "UNAUTHORIZED", "You must be signed in to access this resource.");
    }
    if (error.name === "FORBIDDEN") {
      return jsonError(403, "FORBIDDEN", "You do not have permission to perform this action.");
    }
    if (
      error.message.includes("MONGODB_URI") ||
      error.name === "MongooseServerSelectionError" ||
      error.name === "MongoServerSelectionError"
    ) {
      return jsonError(503, "SERVICE_UNAVAILABLE", "The patient database is currently unavailable.");
    }
  }
  if (isMongoDuplicateKeyError(error)) {
    return jsonError(409, "CONFLICT", "A patient record with these unique details already exists.");
  }
  console.error("[patients] Unhandled route error:", error instanceof Error ? error.name : "unknown");
  return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
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

export { isMongoDuplicateKeyError };
