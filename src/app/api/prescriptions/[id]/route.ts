import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Prescription } from "@/models/Prescription";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/api/http";
import { resolvePatientScope } from "@/features/appointments/server/participants";
import { serializePrescriptions } from "@/features/consultations/server/clinical-api";
import type { PrescriptionView } from "@/features/consultations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/prescriptions/:id — single prescription (used by the printable view).
 * Roles: DOCTOR, ADMIN, RECEPTIONIST, PATIENT (own prescriptions only; others return 404).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole(["DOCTOR", "ADMIN", "RECEPTIONIST", "PATIENT"]);
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError(404, "NOT_FOUND", "Prescription not found.");

    await connectToDatabase();

    const filter: Record<string, unknown> = { _id: id };
    const patientScope = await resolvePatientScope(user);
    if (patientScope === null) return jsonError(404, "NOT_FOUND", "Prescription not found.");
    if (patientScope) filter.patientId = patientScope;

    const doc = await Prescription.findOne(filter).lean();
    if (!doc) return jsonError(404, "NOT_FOUND", "Prescription not found.");

    const [view] = await serializePrescriptions([doc]);
    return jsonSuccess<PrescriptionView>(view);
  } catch (error) {
    return handleRouteError(error, "prescriptions");
  }
}
