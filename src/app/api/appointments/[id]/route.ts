import { NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Appointment } from "@/models/Appointment";
import { handleRouteError, jsonError, jsonSuccess } from "@/lib/api/http";
import { serializeAppointments } from "@/features/appointments/server/appointment-api";
import { resolvePatientScope } from "@/features/appointments/server/participants";
import type { AppointmentView } from "@/features/appointments/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/appointments/:id — single appointment with participant details.
 * Roles: ADMIN, DOCTOR, RECEPTIONIST, PATIENT (own appointments only; others return 404).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"]);
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonError(404, "NOT_FOUND", "Appointment not found.");

    await connectToDatabase();

    const filter: Record<string, unknown> = { _id: id };
    const patientScope = await resolvePatientScope(user);
    if (patientScope === null) return jsonError(404, "NOT_FOUND", "Appointment not found.");
    if (patientScope) filter.patientId = patientScope;

    const doc = await Appointment.findOne(filter).lean();
    if (!doc) return jsonError(404, "NOT_FOUND", "Appointment not found.");

    const [view] = await serializeAppointments([doc]);
    return jsonSuccess<AppointmentView>(view);
  } catch (error) {
    return handleRouteError(error, "appointments");
  }
}
