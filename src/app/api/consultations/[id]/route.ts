import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Appointment } from "@/models/Appointment";
import { Consultation } from "@/models/Consultation";
import { updateConsultationSchema } from "@/lib/validation/consultation";
import { handleRouteError, jsonError, jsonSuccess, readJsonBody } from "@/lib/api/http";
import { resolvePatientScope } from "@/features/appointments/server/participants";
import { serializeConsultations } from "@/features/consultations/server/clinical-api";
import type { ConsultationView } from "@/features/consultations/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/consultations/:id — consultation detail.
 * Roles: DOCTOR, ADMIN, PATIENT (own completed records only; others return 404).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole(["DOCTOR", "ADMIN", "PATIENT"]);
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError(404, "NOT_FOUND", "Consultation not found.");

    await connectToDatabase();

    const filter: Record<string, unknown> = { _id: id };
    const patientScope = await resolvePatientScope(user);
    if (patientScope === null) return jsonError(404, "NOT_FOUND", "Consultation not found.");
    if (patientScope) {
      filter.patientId = patientScope;
      filter.status = "COMPLETED";
    }

    const doc = await Consultation.findOne(filter).lean();
    if (!doc) return jsonError(404, "NOT_FOUND", "Consultation not found.");

    const [view] = await serializeConsultations([doc]);
    return jsonSuccess<ConsultationView>(view);
  } catch (error) {
    return handleRouteError(error, "consultations");
  }
}

/**
 * PUT /api/consultations/:id — edit a DRAFT consultation (vitals, findings, diagnosis, notes, status).
 * Roles: DOCTOR (author only). COMPLETED consultations are locked and return 409.
 * Setting status to COMPLETED locks the record and completes the linked appointment.
 */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole(["DOCTOR"]);
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError(404, "NOT_FOUND", "Consultation not found.");

    const body = await readJsonBody(req);
    if (body === undefined) return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");

    const parsed = updateConsultationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid consultation details", parsed.error.flatten().fieldErrors);
    }
    const input = parsed.data;

    await connectToDatabase();

    const existing = await Consultation.findById(id).select({ doctorId: 1, status: 1, appointmentId: 1 }).lean();
    if (!existing) return jsonError(404, "NOT_FOUND", "Consultation not found.");
    if (existing.doctorId.toString() !== user.id) {
      return jsonError(403, "FORBIDDEN", "Only the authoring doctor can edit this consultation.");
    }
    if (existing.status === "COMPLETED") {
      return jsonError(409, "CONFLICT", "Completed consultations are locked and cannot be edited.");
    }

    const $set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) $set[key] = value;
    }

    // Only update while still a draft, so concurrent completion cannot be overwritten.
    const updated = await Consultation.findOneAndUpdate(
      { _id: existing._id, status: "DRAFT" },
      { $set },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) return jsonError(409, "CONFLICT", "Completed consultations are locked and cannot be edited.");

    if (updated.status === "COMPLETED") {
      await Appointment.updateOne({ _id: existing.appointmentId }, { $set: { status: "COMPLETED" } });
    }

    const [view] = await serializeConsultations([updated]);
    return jsonSuccess<ConsultationView>(view);
  } catch (error) {
    return handleRouteError(error, "consultations");
  }
}
