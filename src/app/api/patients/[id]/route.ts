import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { Patient } from "@/models/Patient";
import { updatePatientSchema } from "@/lib/validation/patient";
import {
  buildPatientIdFilter,
  handleRouteError,
  jsonError,
  jsonSuccess,
  serializePatient,
} from "@/features/patients/server/patient-api";
import { IPatient } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/patients/:id — full patient profile. `:id` may be a Mongo ObjectId or a MED-YYYY-XXXXX ID.
 * Roles: ADMIN, DOCTOR, RECEPTIONIST, or PATIENT (own linked record only).
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireRole(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"]);
    const { id } = await params;

    const filter = buildPatientIdFilter(id);
    if (!filter) {
      return jsonError(404, "NOT_FOUND", "Patient not found.");
    }

    // Patients may only read the record linked to their own account. Mismatches return
    // 404 rather than 403 so record existence is not disclosed.
    if (user.role === "PATIENT") {
      filter.userId = user.id;
    }

    await connectToDatabase();
    const doc = await Patient.findOne(filter).lean();
    if (!doc) {
      return jsonError(404, "NOT_FOUND", "Patient not found.");
    }

    return jsonSuccess<IPatient>(serializePatient(doc));
  } catch (error) {
    return handleRouteError(error);
  }
}

/**
 * PUT /api/patients/:id — update demographics, contact info, or allergies.
 * Roles: ADMIN, RECEPTIONIST.
 */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    await requireRole(["ADMIN", "RECEPTIONIST"]);
    const { id } = await params;

    const filter = buildPatientIdFilter(id);
    if (!filter) {
      return jsonError(404, "NOT_FOUND", "Patient not found.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "VALIDATION_ERROR", "Request body must be valid JSON");
    }

    const parsed = updatePatientSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, "VALIDATION_ERROR", "Invalid patient details", parsed.error.flatten().fieldErrors);
    }
    const input = parsed.data;

    await connectToDatabase();

    const existing = await Patient.findOne(filter).select({ _id: 1 }).lean();
    if (!existing) {
      return jsonError(404, "NOT_FOUND", "Patient not found.");
    }

    const duplicateConditions: Record<string, string>[] = [];
    if (input.phone) duplicateConditions.push({ phone: input.phone });
    if (input.email) duplicateConditions.push({ email: input.email });
    if (duplicateConditions.length > 0) {
      const duplicate = await Patient.findOne({ _id: { $ne: existing._id }, $or: duplicateConditions })
        .select({ phone: 1 })
        .lean();
      if (duplicate) {
        const field = input.phone && duplicate.phone === input.phone ? "phone number" : "email address";
        return jsonError(409, "CONFLICT", `Another patient with this ${field} is already registered.`);
      }
    }

    // Build $set/$unset explicitly so optional fields cleared in the form are removed.
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, ""> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) $set[key] = value;
    }
    if (body && typeof body === "object") {
      for (const key of ["email", "bloodGroup"] as const) {
        if (key in body && input[key] === undefined) $unset[key] = "";
      }
    }

    const updated = await Patient.findByIdAndUpdate(
      existing._id,
      { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return jsonError(404, "NOT_FOUND", "Patient not found.");
    }

    return jsonSuccess<IPatient>(serializePatient(updated));
  } catch (error) {
    return handleRouteError(error);
  }
}
