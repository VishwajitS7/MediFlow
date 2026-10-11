import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Appointment } from "@/models/Appointment";
import { Consultation } from "@/models/Consultation";
import { updateAppointmentStatusSchema } from "@/lib/validation/appointment";
import { handleRouteError, jsonError, jsonSuccess, readJsonBody } from "@/lib/api/http";
import { canTransition, STATUS_LABELS } from "@/features/appointments/appointment-utils";
import { serializeAppointments } from "@/features/appointments/server/appointment-api";
import type { AppointmentView } from "@/features/appointments/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/appointments/:id/status — move an appointment through its workflow.
 * Roles: ADMIN, RECEPTIONIST, DOCTOR (doctors may only update their own appointments).
 * Invalid transitions return 409. COMPLETED requires a completed consultation record.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole(["ADMIN", "RECEPTIONIST", "DOCTOR"]);
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError(404, "NOT_FOUND", "Appointment not found.");

    const body = await readJsonBody(req);
    if (body === undefined) return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");

    const parsed = updateAppointmentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid status", parsed.error.flatten().fieldErrors);
    }
    const { status } = parsed.data;

    await connectToDatabase();

    const appointment = await Appointment.findById(id).select({ status: 1, doctorId: 1 }).lean();
    if (!appointment) return jsonError(404, "NOT_FOUND", "Appointment not found.");

    if (user.role === "DOCTOR" && appointment.doctorId.toString() !== user.id) {
      return jsonError(403, "FORBIDDEN", "Doctors can only update their own appointments.");
    }
    if (!canTransition(appointment.status, status)) {
      return jsonError(
        409,
        "CONFLICT",
        `Cannot change an appointment from ${STATUS_LABELS[appointment.status]} to ${STATUS_LABELS[status]}.`
      );
    }
    if (status === "COMPLETED") {
      const consultation = await Consultation.exists({ appointmentId: appointment._id, status: "COMPLETED" });
      if (!consultation) {
        return jsonError(409, "CONFLICT", "Complete the consultation record before completing this appointment.");
      }
    }

    // Conditional update guards against concurrent status changes.
    const updated = await Appointment.findOneAndUpdate(
      { _id: appointment._id, status: appointment.status },
      { $set: { status } },
      { new: true }
    ).lean();
    if (!updated) return jsonError(409, "CONFLICT", "The appointment was updated by someone else. Please refresh.");

    const [view] = await serializeAppointments([updated]);
    return jsonSuccess<AppointmentView>(view);
  } catch (error) {
    return handleRouteError(error, "appointments");
  }
}
