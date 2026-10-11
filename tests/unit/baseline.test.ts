import { describe, it, expect } from "vitest";
import { cn } from "../../src/lib/utils";
import type { ApiResponse, IUser, IPatient } from "../../src/types";

describe("MediFlow Baseline Quality Assurance", () => {
  it("merges CSS classes correctly using cn utility", () => {
    const result = cn("text-red-500", "p-4", { "font-bold": true, "hidden": false });
    expect(result).toContain("text-red-500");
    expect(result).toContain("p-4");
    expect(result).toContain("font-bold");
    expect(result).not.toContain("hidden");
  });

  it("resolves conflicting Tailwind classes properly", () => {
    const result = cn("p-2", "p-4");
    expect(result).toBe("p-4");
  });

  it("conforms to canonical IUser type structure", () => {
    const user: IUser = {
      name: "Dr. Alexander Fleming",
      email: "fleming@mediflow.local",
      role: "DOCTOR",
      specialization: "Microbiology",
      isActive: true,
    };

    expect(user.role).toBe("DOCTOR");
    expect(user.isActive).toBe(true);
  });

  it("conforms to canonical IPatient type structure", () => {
    const patient: IPatient = {
      patientId: "MED-2026-00001",
      fullName: "Synthetic John Doe",
      dateOfBirth: "1990-01-01",
      gender: "MALE",
      phone: "+1-555-0100",
      allergies: ["Penicillin"],
      emergencyContact: {
        name: "Jane Doe",
        relationship: "Spouse",
        phone: "+1-555-0101",
      },
    };

    expect(patient.patientId).toMatch(/^MED-\d{4}-\d{5}$/);
    expect(patient.allergies).toHaveLength(1);
  });

  it("validates ApiResponse structure", () => {
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "System initialized" },
      timestamp: new Date().toISOString(),
    };

    expect(response.success).toBe(true);
    expect(response.data?.message).toBe("System initialized");
    expect(response.timestamp).toBeDefined();
  });
});
