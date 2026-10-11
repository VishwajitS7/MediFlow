import { describe, it, expect } from "vitest";
import {
  createPatientSchema,
  updatePatientSchema,
  patientListQuerySchema,
} from "../../src/lib/validation/patient";
import {
  calculateAge,
  escapeRegex,
  formatPatientId,
  isPatientId,
  nextPatientId,
  toDateInputValue,
  getInitials,
} from "../../src/features/patients/patient-utils";

// Synthetic test data only — no real patient information.
const validPatient = {
  fullName: "Jane Doe",
  dateOfBirth: "1988-04-12",
  gender: "FEMALE",
  phone: "+1-555-0144",
  email: "Jane.Doe@Example.com",
  bloodGroup: "O+",
  allergies: ["Penicillin", "Peanuts"],
  emergencyContact: { name: "John Doe", relationship: "Spouse", phone: "+1-555-0145" },
  address: { street: "123 Main St", city: "Metropolis", state: "NY", zipCode: "10001" },
};

describe("Developer 2: Patient Management Suite", () => {
  describe("createPatientSchema", () => {
    it("accepts a complete valid patient payload", () => {
      const result = createPatientSchema.safeParse(validPatient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateOfBirth).toBeInstanceOf(Date);
        expect(result.data.email).toBe("jane.doe@example.com");
        expect(result.data.allergies).toEqual(["Penicillin", "Peanuts"]);
      }
    });

    it("accepts a minimal payload and defaults allergies to []", () => {
      const { email, bloodGroup, allergies, address, ...minimal } = validPatient;
      void email;
      void bloodGroup;
      void allergies;
      void address;
      const result = createPatientSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allergies).toEqual([]);
        expect(result.data.email).toBeUndefined();
        expect(result.data.address).toBeUndefined();
      }
    });

    it("treats empty optional strings as not provided", () => {
      const result = createPatientSchema.safeParse({ ...validPatient, email: "", bloodGroup: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBeUndefined();
        expect(result.data.bloodGroup).toBeUndefined();
      }
    });

    it("de-duplicates allergies", () => {
      const result = createPatientSchema.safeParse({ ...validPatient, allergies: ["Latex", "Latex", " Latex "] });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.allergies).toEqual(["Latex"]);
    });

    it("rejects a full name shorter than 2 characters", () => {
      expect(createPatientSchema.safeParse({ ...validPatient, fullName: "J" }).success).toBe(false);
    });

    it("rejects a future date of birth", () => {
      const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      expect(createPatientSchema.safeParse({ ...validPatient, dateOfBirth: future }).success).toBe(false);
    });

    it("rejects an invalid date of birth", () => {
      expect(createPatientSchema.safeParse({ ...validPatient, dateOfBirth: "not-a-date" }).success).toBe(false);
    });

    it("rejects an unknown gender", () => {
      expect(createPatientSchema.safeParse({ ...validPatient, gender: "UNKNOWN" }).success).toBe(false);
    });

    it("rejects phones shorter than 7 characters or containing letters", () => {
      expect(createPatientSchema.safeParse({ ...validPatient, phone: "12345" }).success).toBe(false);
      expect(createPatientSchema.safeParse({ ...validPatient, phone: "555-CALL-NOW" }).success).toBe(false);
    });

    it("rejects an invalid email and blood group", () => {
      expect(createPatientSchema.safeParse({ ...validPatient, email: "not-an-email" }).success).toBe(false);
      expect(createPatientSchema.safeParse({ ...validPatient, bloodGroup: "C+" }).success).toBe(false);
    });

    it("requires a complete emergency contact", () => {
      expect(createPatientSchema.safeParse({ ...validPatient, emergencyContact: undefined }).success).toBe(false);
      const result = createPatientSchema.safeParse({
        ...validPatient,
        emergencyContact: { name: "John Doe", relationship: "Spouse", phone: "" },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.join(".") === "emergencyContact.phone")).toBe(true);
      }
    });
  });

  describe("updatePatientSchema", () => {
    it("accepts a partial update", () => {
      const result = updatePatientSchema.safeParse({ allergies: ["Aspirin"] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allergies).toEqual(["Aspirin"]);
        expect(result.data.fullName).toBeUndefined();
      }
    });

    it("does not default allergies when they are omitted", () => {
      const result = updatePatientSchema.safeParse({ phone: "+1-555-0199" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.allergies).toBeUndefined();
    });

    it("still validates provided fields", () => {
      expect(updatePatientSchema.safeParse({ phone: "12" }).success).toBe(false);
    });

    it("rejects an empty update", () => {
      expect(updatePatientSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("patientListQuerySchema", () => {
    it("applies pagination defaults", () => {
      const result = patientListQuerySchema.parse({});
      expect(result).toEqual({ query: "", page: 1, limit: 20 });
    });

    it("coerces query-string numbers and caps the limit", () => {
      expect(patientListQuerySchema.parse({ page: "3", limit: "50", query: " jane " })).toEqual({
        query: "jane",
        page: 3,
        limit: 50,
      });
      expect(patientListQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
      expect(patientListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    });
  });

  describe("Patient ID generation (MED-YYYY-XXXXX)", () => {
    it("formats IDs with a zero-padded 5-digit sequence", () => {
      expect(formatPatientId(2026, 1)).toBe("MED-2026-00001");
      expect(formatPatientId(2026, 101)).toBe("MED-2026-00101");
    });

    it("rejects out-of-range sequences", () => {
      expect(() => formatPatientId(2026, 0)).toThrow(RangeError);
      expect(() => formatPatientId(2026, 100000)).toThrow(RangeError);
    });

    it("starts at 00001 when no patient exists for the year", () => {
      expect(nextPatientId(null, 2026)).toBe("MED-2026-00001");
    });

    it("increments the latest sequence for the same year", () => {
      expect(nextPatientId("MED-2026-00041", 2026)).toBe("MED-2026-00042");
    });

    it("restarts the sequence for a new year", () => {
      expect(nextPatientId("MED-2025-00987", 2026)).toBe("MED-2026-00001");
    });

    it("validates the ID format", () => {
      expect(isPatientId("MED-2026-00001")).toBe(true);
      expect(isPatientId("MED-26-1")).toBe(false);
      expect(isPatientId("6708b1f5e8a1b2c3d4e5f6a7")).toBe(false);
    });
  });

  describe("Patient helpers", () => {
    it("calculates age, accounting for birthdays not yet reached", () => {
      const now = new Date("2026-10-12T00:00:00Z");
      expect(calculateAge("1988-04-12", now)).toBe(38);
      expect(calculateAge("1988-12-25", now)).toBe(37);
    });

    it("escapes regex metacharacters in search input", () => {
      const escaped = escapeRegex("+1 (555) .*");
      expect(escaped).toBe("\\+1 \\(555\\) \\.\\*");
      expect(new RegExp(escaped).test("+1 (555) .*")).toBe(true);
    });

    it("formats values for date inputs and initials", () => {
      expect(toDateInputValue("1988-04-12T00:00:00.000Z")).toBe("1988-04-12");
      expect(toDateInputValue(undefined)).toBe("");
      expect(getInitials("Jane  Mary Doe")).toBe("JM");
    });
  });
});
