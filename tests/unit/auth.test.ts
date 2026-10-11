import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "../../src/lib/validation/auth";

describe("Developer 1: Authentication & Validation Suite", () => {
  describe("loginSchema", () => {
    it("accepts valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "doctor@mediflow.local",
        password: "Password123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("doctor@mediflow.local");
      }
    });

    it("rejects malformed email addresses", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "Password123!",
      });

      expect(result.success).toBe(false);
    });

    it("rejects passwords under 6 characters", () => {
      const result = loginSchema.safeParse({
        email: "doctor@mediflow.local",
        password: "123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("accepts valid registration input with all fields", () => {
      const result = registerSchema.safeParse({
        name: "Dr. Gregory House",
        email: "house@mediflow.local",
        password: "DiagnosisSecure123!",
        role: "DOCTOR",
        specialization: "Nephrology & Pathology",
        phone: "+1-555-0199",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("DOCTOR");
        expect(result.data.specialization).toBe("Nephrology & Pathology");
      }
    });

    it("defaults role to PATIENT when not provided", () => {
      const result = registerSchema.safeParse({
        name: "John Patient",
        email: "patient@mediflow.local",
        password: "Password123!",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("PATIENT");
      }
    });

    it("rejects unauthorized custom role names", () => {
      const result = registerSchema.safeParse({
        name: "Hacker User",
        email: "hacker@example.com",
        password: "Password123!",
        role: "SUPERUSER",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Bcrypt Password Hashing", () => {
    it("hashes password and verifies match correctly", async () => {
      const plainPassword = "SuperSecretPassword123!";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      expect(hash).not.toBe(plainPassword);
      expect(hash.length).toBeGreaterThan(20);

      const isMatch = await bcrypt.compare(plainPassword, hash);
      expect(isMatch).toBe(true);

      const isWrongMatch = await bcrypt.compare("WrongPassword!", hash);
      expect(isWrongMatch).toBe(false);
    });
  });
});
