import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Consultation } from "@/models/Consultation";
import { Prescription } from "@/models/Prescription";
import { createPrescriptionSchema, prescriptionListQuerySchema } from "@/lib/validation/prescription";
import { handleRouteError, jsonError, jsonSuccess, readJsonBody } from "@/lib/api/http";
import { resolvePatientScope } from "@/features/appointments/server/participants";
import { serializePrescriptions } from "@/features/consultations/server/clinical-api";
import type { PrescriptionView } from "@/features/consultations/types";

/**
 * GET /api/prescriptions — prescriptions, newest first. Filters: patientId, consultationId.
 * Roles: DOCTOR, ADMIN, RECEPTIONIST, PATIENT (own prescriptions only).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["DOCTOR", "ADMIN", "RECEPTIONIST", "PATIENT"]);

    const parsed = prescriptionListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid query parameters", parsed.error.flatten().fieldErrors);
    }
    const q = parsed.data;

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    const patientScope = await resolvePatientScope(user);
    if (patientScope === null) return jsonSuccess<PrescriptionView[]>([]);
    if (patientScope) filter.patientId = patientScope;
    else if (q.patientId) filter.patientId = q.patientId;
    if (q.consultationId) filter.consultationId = q.consultationId;

    const docs = await Prescription.find(filter).sort({ createdAt: -1 }).limit(q.limit).lean();
    return jsonSuccess<PrescriptionView[]>(await serializePrescriptions(docs));
  } catch (error) {
    return handleRouteError(error, "prescriptions");
  }
}

/**
 * POST /api/prescriptions — issue a prescription linked to a consultation.
 * Roles: DOCTOR, and only for consultations they attended (authored).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["DOCTOR"]);

    const body = await readJsonBody(req);
    if (body === undefined) return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");

    const parsed = createPrescriptionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid prescription details", parsed.error.flatten().fieldErrors);
    }
    const input = parsed.data;

    await connectToDatabase();

    const consultation = await Consultation.findById(input.consultationId).select({ doctorId: 1, patientId: 1 }).lean();
    if (!consultation) return jsonError(404, "NOT_FOUND", "Consultation not found.");
    if (consultation.doctorId.toString() !== user.id) {
      return jsonError(403, "FORBIDDEN", "Doctors can only write prescriptions for consultations they attended.");
    }
    if (consultation.patientId.toString() !== input.patientId) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid prescription details", {
        patientId: ["Patient does not match the consultation"],
      });
    }

    const created = await Prescription.create({ ...input, doctorId: user.id });
    const [view] = await serializePrescriptions([created.toObject()]);
    return jsonSuccess<PrescriptionView>(view, 201);
  } catch (error) {
    return handleRouteError(error, "prescriptions");
  }
}
