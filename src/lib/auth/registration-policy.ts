import type { UserRole } from "@/types";

/** The only role an unauthenticated visitor may create for themselves via public sign-up. */
export const SELF_REGISTRATION_ROLE: UserRole = "PATIENT";

/**
 * Account provisioning policy for POST /api/auth/register.
 * - Anyone (including anonymous visitors) may create a PATIENT account.
 * - Staff roles (ADMIN, DOCTOR, RECEPTIONIST) may only be created by a signed-in ADMIN.
 */
export function canProvisionRole(requesterRole: UserRole | null | undefined, requestedRole: UserRole): boolean {
  if (requestedRole === SELF_REGISTRATION_ROLE) return true;
  return requesterRole === "ADMIN";
}
