import { z } from "zod";
import { objectIdSchema, optionalTrimmedText } from "./common";

export const APPOINTMENT_STATUS_VALUES = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

/** Bookings may be a few minutes in the past to tolerate clock skew and form-filling time. */
const BOOKING_GRACE_MS = 5 * 60 * 1000;
const MAX_BOOKING_AHEAD_MS = 366 * 24 * 60 * 60 * 1000;

export const createAppointmentSchema = z.object({
  patientId: objectIdSchema,
  doctorId: objectIdSchema,
  dateTime: z.coerce
    .date({ error: "Appointment time must be a valid date" })
    .refine((date) => date.getTime() >= Date.now() - BOOKING_GRACE_MS, "Appointment time cannot be in the past")
    .refine((date) => date.getTime() <= Date.now() + MAX_BOOKING_AHEAD_MS, "Appointments can be booked up to one year ahead"),
  reason: z.string().trim().min(3, "Reason for visit must be at least 3 characters").max(500),
  notes: optionalTrimmedText(1000),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"], {
    error: "Status must be CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED or NO_SHOW",
  }),
});

export const appointmentListQuerySchema = z
  .object({
    doctorId: objectIdSchema.optional(),
    patientId: objectIdSchema.optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
      .optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    status: z.enum(APPOINTMENT_STATUS_VALUES).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .refine((q) => !(q.from && q.to) || q.from < q.to, { message: "from must be before to", path: ["from"] });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateAppointmentPayload = z.input<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;
