import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/rbac";
import { User } from "@/models/User";
import { handleRouteError, jsonSuccess } from "@/lib/api/http";
import type { DoctorSummary } from "@/features/appointments/types";

/**
 * GET /api/appointments/doctors — active doctors available for booking.
 * Roles: ADMIN, RECEPTIONIST, DOCTOR. Returns only non-sensitive fields.
 */
export async function GET() {
  try {
    await requireRole(["ADMIN", "RECEPTIONIST", "DOCTOR"]);
    await connectToDatabase();
    const doctors = await User.find({ role: "DOCTOR", isActive: true })
      .select({ name: 1, specialization: 1 })
      .sort({ name: 1 })
      .lean();
    return jsonSuccess<DoctorSummary[]>(
      doctors.map((d) => ({ _id: d._id.toString(), name: d.name, specialization: d.specialization }))
    );
  } catch (error) {
    return handleRouteError(error, "appointments");
  }
}
