import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Appointment } from "@/models/Appointment";
import { Patient } from "@/models/Patient";
import { User } from "@/models/User";
import { appointmentListQuerySchema, createAppointmentSchema } from "@/lib/validation/appointment";
import { handleRouteError, jsonError, jsonSuccess, readJsonBody } from "@/lib/api/http";
import { ACTIVE_STATUSES, SLOT_MINUTES } from "@/features/appointments/appointment-utils";
import { zonedDayRange } from "@/features/appointments/clinic-time";
import {
  clinicTimeZone,
  nextQueueNumber,
  serializeAppointments,
} from "@/features/appointments/server/appointment-api";
import { resolvePatientScope } from "@/features/appointments/server/participants";
import type { AppointmentView } from "@/features/appointments/types";

/**
 * GET /api/appointments — list appointments with participant details, sorted by time.
 * Filters: doctorId, patientId, status, date (YYYY-MM-DD in CLINIC_TIMEZONE) or from/to (ISO range).
 * Roles: ADMIN, DOCTOR, RECEPTIONIST, PATIENT (PATIENT always limited to their own record).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"]);

    const parsed = appointmentListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid query parameters", parsed.error.flatten().fieldErrors);
    }
    const q = parsed.data;

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    const patientScope = await resolvePatientScope(user);
    if (patientScope === null) return jsonSuccess<AppointmentView[]>([]);
    if (patientScope) filter.patientId = patientScope;
    else if (q.patientId) filter.patientId = q.patientId;
    if (q.doctorId) filter.doctorId = q.doctorId;
    if (q.status) filter.status = q.status;

    if (q.from || q.to) {
      filter.dateTime = { ...(q.from ? { $gte: q.from } : {}), ...(q.to ? { $lt: q.to } : {}) };
    } else if (q.date) {
      const { start, end } = zonedDayRange(q.date, clinicTimeZone());
      filter.dateTime = { $gte: start, $lt: end };
    }

    const docs = await Appointment.find(filter).sort({ dateTime: 1 }).limit(q.limit).lean();
    return jsonSuccess<AppointmentView[]>(await serializeAppointments(docs));
  } catch (error) {
    return handleRouteError(error, "appointments");
  }
}

/**
 * POST /api/appointments — book an appointment (status SCHEDULED, daily queue number assigned).
 * Roles: ADMIN, RECEPTIONIST, DOCTOR.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "RECEPTIONIST", "DOCTOR"]);

    const body = await readJsonBody(req);
    if (body === undefined) return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");

    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid appointment details", parsed.error.flatten().fieldErrors);
    }
    const input = parsed.data;

    await connectToDatabase();

    const [patient, doctor] = await Promise.all([
      Patient.exists({ _id: input.patientId }),
      User.exists({ _id: input.doctorId, role: "DOCTOR", isActive: true }),
    ]);
    if (!patient) return jsonError(404, "NOT_FOUND", "Patient not found.");
    if (!doctor) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid appointment details", {
        doctorId: ["Selected doctor does not exist or is inactive"],
      });
    }

    const windowMs = SLOT_MINUTES * 60000;
    const overlap = {
      status: { $in: ACTIVE_STATUSES },
      dateTime: {
        $gt: new Date(input.dateTime.getTime() - windowMs),
        $lt: new Date(input.dateTime.getTime() + windowMs),
      },
    };
    const [doctorClash, patientClash] = await Promise.all([
      Appointment.exists({ ...overlap, doctorId: input.doctorId }),
      Appointment.exists({ ...overlap, patientId: input.patientId }),
    ]);
    if (doctorClash) return jsonError(409, "CONFLICT", "The doctor already has an appointment in this time slot.");
    if (patientClash) return jsonError(409, "CONFLICT", "The patient already has an appointment in this time slot.");

    const created = await Appointment.create({
      ...input,
      status: "SCHEDULED",
      queueNumber: await nextQueueNumber(input.doctorId, input.dateTime),
    });

    const [view] = await serializeAppointments([created.toObject()]);
    return jsonSuccess<AppointmentView>(view, 201);
  } catch (error) {
    return handleRouteError(error, "appointments");
  }
}
