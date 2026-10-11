// Server-only helpers for /api/appointments route handlers.
import { Types } from "mongoose";
import { Appointment, IAppointmentDocument } from "@/models/Appointment";
import { resolveClinicTimeZone, dayKeyInTimeZone, zonedDayRange } from "@/features/appointments/clinic-time";
import type { AppointmentView } from "@/features/appointments/types";
import { loadParticipants, type ParticipantMaps } from "@/features/appointments/server/participants";

export type LeanAppointment = Pick<
  IAppointmentDocument,
  "patientId" | "doctorId" | "dateTime" | "status" | "reason" | "queueNumber" | "notes" | "createdAt" | "updatedAt"
> & { _id: Types.ObjectId };

export const clinicTimeZone = () => resolveClinicTimeZone(process.env.CLINIC_TIMEZONE);

export function serializeAppointment(doc: LeanAppointment, maps?: ParticipantMaps): AppointmentView {
  return {
    _id: doc._id.toString(),
    patientId: doc.patientId.toString(),
    doctorId: doc.doctorId.toString(),
    dateTime: doc.dateTime,
    status: doc.status,
    reason: doc.reason,
    queueNumber: doc.queueNumber,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    patient: maps?.patients.get(doc.patientId.toString()),
    doctor: maps?.doctors.get(doc.doctorId.toString()),
  };
}

export async function serializeAppointments(docs: LeanAppointment[]): Promise<AppointmentView[]> {
  const maps = await loadParticipants(docs);
  return docs.map((doc) => serializeAppointment(doc, maps));
}

/** Next daily queue token for a doctor on the clinic day containing `dateTime`. */
export async function nextQueueNumber(doctorId: string, dateTime: Date): Promise<number> {
  const timeZone = clinicTimeZone();
  const { start, end } = zonedDayRange(dayKeyInTimeZone(dateTime, timeZone), timeZone);
  const last = await Appointment.findOne({ doctorId, dateTime: { $gte: start, $lt: end } })
    .sort({ queueNumber: -1 })
    .select({ queueNumber: 1 })
    .lean();
  return (last?.queueNumber ?? 0) + 1;
}
