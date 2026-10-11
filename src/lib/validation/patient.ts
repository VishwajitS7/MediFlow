import { z } from "zod";

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const PHONE_PATTERN = /^[+()\-\s\d]+$/;

const phoneField = (label: string) =>
  z
    .string()
    .trim()
    .min(7, `${label} must be at least 7 characters`)
    .max(20, `${label} must be at most 20 characters`)
    .regex(PHONE_PATTERN, `${label} may only contain digits, spaces, +, -, ( and )`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const emergencyContactSchema = z.object({
  name: z.string().trim().min(2, "Emergency contact name must be at least 2 characters").max(100),
  relationship: z.string().trim().min(2, "Relationship is required").max(50),
  phone: phoneField("Emergency contact phone"),
});

export const addressSchema = z.object({
  street: optionalText(200),
  city: optionalText(100),
  state: optionalText(100),
  zipCode: optionalText(20),
});

const allergiesField = z
  .array(z.string().trim().min(1).max(100))
  .max(50, "A maximum of 50 allergies can be recorded")
  .transform((items) => Array.from(new Set(items)));

export const createPatientSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(120),
  dateOfBirth: z.coerce
    .date({ error: "Date of birth must be a valid date" })
    .refine((date) => date.getTime() < Date.now(), "Date of birth must be in the past")
    .refine((date) => date.getFullYear() >= 1900, "Date of birth must be after 1900"),
  gender: z.enum(GENDERS, { error: "Gender must be MALE, FEMALE or OTHER" }),
  phone: phoneField("Phone"),
  email: z
    .union([z.literal(""), z.string().trim().toLowerCase().email("Please provide a valid email address")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  bloodGroup: z
    .union([z.literal(""), z.enum(BLOOD_GROUPS)])
    .optional()
    .transform((value) => (value ? value : undefined)),
  allergies: allergiesField.default([]),
  emergencyContact: emergencyContactSchema,
  address: addressSchema.optional(),
});

// `allergies` is redeclared without a default so omitting it in an update leaves stored allergies untouched.
export const updatePatientSchema = createPatientSchema
  .extend({ allergies: allergiesField })
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update",
  });

export const patientListQuerySchema = z.object({
  query: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
/** Raw request body accepted by POST /api/patients (before Zod transforms). */
export type CreatePatientPayload = z.input<typeof createPatientSchema>;
/** Raw request body accepted by PUT /api/patients/:id. Send "" for email/bloodGroup to clear them. */
export type UpdatePatientPayload = z.input<typeof updatePatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientListQuery = z.infer<typeof patientListQuerySchema>;
