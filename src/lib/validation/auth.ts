import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"]).default("PATIENT"),
  specialization: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
