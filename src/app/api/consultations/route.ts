import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Appointment } from "@/models/Appointment";
import { Consultation } from "@/models/Consultation";
import { consultationListQuerySchema, createConsultationSchema } from "@/lib/validation/consultation";
import { handleRouteError, isMongoDuplicateKeyError, jsonError, jsonSuccess, readJsonBody } from "@/lib/api/http";
import { CONSULTABLE_STATUSES, STATUS_LABELS } from "@/features/appointments/appointment-utils";
import { resolvePatientScope } from "@/features/appointments/server/participants";
import { serializeConsultations } from "@/features/consultations/server/clinical-api";
import type { ConsultationView } from "@/features/consultations/types";

/**
 * GET /api/consultations — consultation history, newest first. Filters: patientId, doctorId, appointmentId.
 * Roles: DOCTOR, ADMIN, PATIENT (own records only). Receptionists cannot read clinical notes.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["DOCTOR", "ADMIN", "PATIENT"]);

    const parsed = consultationListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid query parameters", parsed.error.flatten().fieldErrors);
    }
    const q = parsed.data;

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    const patientScope = await resolvePatientScope(user);
    if (patientScope === null) return jsonSuccess<ConsultationView[]>([]);
    if (patientScope) {
      filter.patientId = patientScope;
      filter.status = "COMPLETED"; // patients never see unfinished drafts
    } else if (q.patientId) {
      filter.patientId = q.patientId;
    }
    if (q.doctorId) filter.doctorId = q.doctorId;
    if (q.appointmentId) filter.appointmentId = q.appointmentId;

    const docs = await Consultation.find(filter).sort({ createdAt: -1 }).limit(q.limit).lean();
    return jsonSuccess<ConsultationView[]>(await serializeConsultations(docs));
  } catch (error) {
    return handleRouteError(error, "consultations");
  }
}

/**
 * POST /api/consultations — record vitals, findings, and diagnosis for an appointment.
 * Roles: DOCTOR (only the doctor assigned to the appointment).
 * Effects: COMPLETED consultations move the appointment to COMPLETED; drafts move it to IN_PROGRESS.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["DOCTOR"]);

    const body = await readJsonBody(req);
    if (body === undefined) return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");

    const parsed = createConsultationSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid consultation details", parsed.error.flatten().fieldErrors);
    }
    const input = parsed.data;

    await connectToDatabase();

    const appointment = await Appointment.findById(input.appointmentId)
      .select({ doctorId: 1, patientId: 1, status: 1 })
      .lean();
    if (!appointment) return jsonError(404, "NOT_FOUND", "Appointment not found.");
    if (appointment.doctorId.toString() !== user.id) {
      return jsonError(403, "FORBIDDEN", "Only the doctor assigned to this appointment can record its consultation.");
    }
    if (appointment.patientId.toString() !== input.patientId) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid consultation details", {
        patientId: ["Patient does not match the appointment"],
      });
    }
    if (!CONSULTABLE_STATUSES.includes(appointment.status)) {
      return jsonError(
        409,
        "CONFLICT",
        `A consultation cannot be recorded for a ${STATUS_LABELS[appointment.status].toLowerCase()} appointment.`
      );
    }

    let created;
    try {
      created = await Consultation.create({ ...input, doctorId: user.id });
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        return jsonError(409, "CONFLICT", "A consultation has already been recorded for this appointment.");
      }
      throw error;
    }

    await Appointment.updateOne(
      { _id: appointment._id },
      { $set: { status: input.status === "COMPLETED" ? "COMPLETED" : "IN_PROGRESS" } }
    );

    const [view] = await serializeConsultations([created.toObject()]);
    return jsonSuccess<ConsultationView>(view, 201);
  } catch (error) {
    return handleRouteError(error, "consultations");
  }
}
