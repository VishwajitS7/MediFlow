import { describe, it, expect } from "vitest";
import { canProvisionRole, SELF_REGISTRATION_ROLE } from "../../src/lib/auth/registration-policy";
import type { UserRole } from "../../src/types";

const STAFF_ROLES: UserRole[] = ["ADMIN", "DOCTOR", "RECEPTIONIST"];

describe("Account provisioning policy (POST /api/auth/register)", () => {
  it("allows anonymous self-registration only as PATIENT", () => {
    expect(SELF_REGISTRATION_ROLE).toBe("PATIENT");
    expect(canProvisionRole(null, "PATIENT")).toBe(true);
    for (const role of STAFF_ROLES) {
      expect(canProvisionRole(null, role)).toBe(false);
      expect(canProvisionRole(undefined, role)).toBe(false);
    }
  });

  it("lets a signed-in ADMIN create any role", () => {
    for (const role of [...STAFF_ROLES, "PATIENT" as const]) {
      expect(canProvisionRole("ADMIN", role)).toBe(true);
    }
  });

  it("prevents non-admin staff and patients from creating staff accounts", () => {
    for (const requester of ["DOCTOR", "RECEPTIONIST", "PATIENT"] as const) {
      for (const role of STAFF_ROLES) {
        expect(canProvisionRole(requester, role)).toBe(false);
      }
      expect(canProvisionRole(requester, "PATIENT")).toBe(true);
    }
  });
});
