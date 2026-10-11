import { z } from "zod";
import { objectIdSchema, optionalTrimmedText } from "./common";

const vital = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} must be a number` })
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`)
    .optional();

export const vitalsSchema = z
  .object({
    bloodPressureSystolic: vital("Systolic BP", 50, 260),
    bloodPressureDiastolic: vital("Diastolic BP", 30, 160),
    heartRate: vital("Heart rate", 20, 250),
    temperature: vital("Temperature (°F)", 90, 110),
    weight: vital("Weight (kg)", 0.5, 400),
    height: vital("Height (cm)", 30, 250),
    spo2: vital("SpO₂", 50, 100),
  })
  .refine(
    (v) =>
      v.bloodPressureSystolic === undefined ||
      v.bloodPressureDiastolic === undefined ||
      v.bloodPressureSystolic > v.bloodPressureDiastolic,
    { message: "Systolic BP must be greater than diastolic BP", path: ["bloodPressureDiastolic"] }
  );

const symptomsField = z
  .array(z.string().trim().min(1).max(100))
  .max(30, "A maximum of 30 symptoms can be recorded")
  .transform((items) => Array.from(new Set(items)));

const clinicalFields = {
  vitals: vitalsSchema,
  chiefComplaint: z.string().trim().min(3, "Chief complaint must be at least 3 characters").max(500),
  symptoms: symptomsField,
  diagnosis: z.string().trim().min(2, "Diagnosis must be at least 2 characters").max(500),
  clinicalNotes: optionalTrimmedText(5000),
  status: z.enum(["DRAFT", "COMPLETED"]),
};

export const createConsultationSchema = z.object({
  appointmentId: objectIdSchema,
  patientId: objectIdSchema,
  ...clinicalFields,
  vitals: vitalsSchema.default({}),
  symptoms: symptomsField.default([]),
  status: clinicalFields.status.default("COMPLETED"),
});

/** Updates are only accepted while a consultation is still a DRAFT. */
export const updateConsultationSchema = z
  .object(clinicalFields)
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update",
  });

export const consultationListQuerySchema = z.object({
  patientId: objectIdSchema.optional(),
  doctorId: objectIdSchema.optional(),
  appointmentId: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type VitalsInput = z.infer<typeof vitalsSchema>;
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type CreateConsultationPayload = z.input<typeof createConsultationSchema>;
export type UpdateConsultationPayload = z.input<typeof updateConsultationSchema>;
