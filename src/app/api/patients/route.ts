import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Patient } from "@/models/Patient";
import { User } from "@/models/User";
import { createPatientSchema, patientListQuerySchema } from "@/lib/validation/patient";
import { escapeRegex } from "@/features/patients/patient-utils";
import {
  generatePatientId,
  handleRouteError,
  isMongoDuplicateKeyError,
  jsonError,
  jsonSuccess,
  serializePatient,
} from "@/features/patients/server/patient-api";
import type { PatientListResponse } from "@/features/patients/types";
import { IPatient } from "@/types";

const MAX_ID_GENERATION_ATTEMPTS = 5;

/**
 * GET /api/patients — search and paginate the patient directory.
 * Roles: ADMIN, DOCTOR, RECEPTIONIST.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST"]);

    const parsed = patientListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid query parameters", parsed.error.flatten().fieldErrors);
    }
    const { query, page, limit } = parsed.data;

    await connectToDatabase();

    // Case-insensitive partial match on name, phone, or clinic ID so search works as-you-type.
    const filter = query
      ? {
          $or: [
            { fullName: { $regex: escapeRegex(query), $options: "i" } },
            { phone: { $regex: escapeRegex(query), $options: "i" } },
            { patientId: { $regex: escapeRegex(query), $options: "i" } },
          ],
        }
      : {};

    const [docs, total] = await Promise.all([
      Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Patient.countDocuments(filter),
    ]);

    return jsonSuccess<PatientListResponse>({
      patients: docs.map(serializePatient),
      pagination: { page, limit, total },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * POST /api/patients — register a new patient.
 * Roles: ADMIN, RECEPTIONIST.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "RECEPTIONIST"]);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");
    }

    const parsed = createPatientSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid patient details", parsed.error.flatten().fieldErrors);
    }
    const input = parsed.data;

    await connectToDatabase();

    const duplicateConditions: Record<string, string>[] = [{ phone: input.phone }];
    if (input.email) duplicateConditions.push({ email: input.email });
    const duplicate = await Patient.findOne({ $or: duplicateConditions }).select({ phone: 1, email: 1 }).lean();
    if (duplicate) {
      const field = duplicate.phone === input.phone ? "phone number" : "email address";
      return jsonError(409, "CONFLICT", `A patient with this ${field} is already registered.`);
    }

    // Retry on patientId collisions caused by concurrent registrations.
    for (let attempt = 1; attempt <= MAX_ID_GENERATION_ATTEMPTS; attempt++) {
      const patientId = await generatePatientId();
      try {
        const created = await Patient.create({ ...input, patientId });

        // If email was provided, auto-link or provision a portal User account so the patient can log in
        if (input.email) {
          try {
            const normalizedEmail = input.email.toLowerCase();
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
              created.userId = existingUser._id;
              await created.save();
            } else {
              const salt = await bcrypt.genSalt(10);
              const passwordHash = await bcrypt.hash("Password123!", salt);
              const portalUser = await User.create({
                name: input.fullName,
                email: normalizedEmail,
                passwordHash,
                role: "PATIENT",
                phone: input.phone,
                isActive: true,
              });
              created.userId = portalUser._id;
              await created.save();
            }
          } catch (userProvisionError) {
            console.error("Failed to provision portal user for patient:", userProvisionError);
          }
        }

        return jsonSuccess<IPatient>(serializePatient(created.toObject()), 201);
      } catch (error) {
        const isIdCollision =
          isMongoDuplicateKeyError(error) &&
          typeof error === "object" &&
          error !== null &&
          "keyPattern" in error &&
          Boolean((error as { keyPattern?: Record<string, unknown> }).keyPattern?.patientId);
        if (!isIdCollision || attempt === MAX_ID_GENERATION_ATTEMPTS) throw error;
      }
    }

    return jsonError(500, "INTERNAL_SERVER_ERROR", "Could not allocate a patient ID.");
  } catch (error) {
    return handleRouteError(error);
  }
}
