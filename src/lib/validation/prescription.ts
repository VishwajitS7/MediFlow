import { z } from "zod";
import { objectIdSchema, optionalTrimmedText } from "./common";

export const medicationSchema = z.object({
  name: z.string().trim().min(2, "Medication name must be at least 2 characters").max(120),
  dosage: z.string().trim().min(1, "Dosage is required (e.g. 500mg tablet)").max(100),
  frequency: z.string().trim().min(1, "Frequency is required (e.g. 1-0-1)").max(50),
  durationDays: z.coerce
    .number({ error: "Duration must be a number of days" })
    .int("Duration must be whole days")
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration must be at most 365 days"),
  instructions: optionalTrimmedText(300),
});

export const createPrescriptionSchema = z.object({
  consultationId: objectIdSchema,
  patientId: objectIdSchema,
  medications: z
    .array(medicationSchema)
    .min(1, "Add at least one medication")
    .max(20, "A maximum of 20 medications per prescription"),
  generalInstructions: optionalTrimmedText(1000),
});

export const prescriptionListQuerySchema = z.object({
  patientId: objectIdSchema.optional(),
  consultationId: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type MedicationInput = z.infer<typeof medicationSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type CreatePrescriptionPayload = z.input<typeof createPrescriptionSchema>;
