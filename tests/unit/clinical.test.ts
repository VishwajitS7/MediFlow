import { describe, it, expect } from "vitest";
import {
  addDays,
  dayKeyInTimeZone,
  resolveClinicTimeZone,
  timeZoneOffsetMinutes,
  zonedDayRange,
} from "../../src/features/appointments/clinic-time";
import {
  buildDaySlots,
  canTransition,
  isTerminalStatus,
  localDayRange,
  slotsOverlap,
} from "../../src/features/appointments/appointment-utils";
import {
  appointmentListQuerySchema,
  createAppointmentSchema,
  updateAppointmentStatusSchema,
} from "../../src/lib/validation/appointment";
import { createConsultationSchema, updateConsultationSchema, vitalsSchema } from "../../src/lib/validation/consultation";
import { createPrescriptionSchema } from "../../src/lib/validation/prescription";
import { matchingAllergies, totalDoses } from "../../src/features/prescriptions/prescription-utils";
import { calculateBmi } from "../../src/features/consultations/vitals-utils";

// Synthetic IDs only.
const PATIENT = "6708b1f5e8a1b2c3d4e5f6a7";
const DOCTOR = "6708a0d2f1a1b2c3d4e5f6a8";
const APPOINTMENT = "6708c2a11ba1b2c3d4e5f6a9";
const CONSULTATION = "6708d3e99ca1b2c3d4e5f6aa";
const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe("Developer 3: Appointments, Consultations & Prescriptions", () => {
  describe("Clinic time zone helpers", () => {
    it("falls back to UTC for missing or invalid zones", () => {
      expect(resolveClinicTimeZone(undefined)).toBe("UTC");
      expect(resolveClinicTimeZone("Not/AZone")).toBe("UTC");
      expect(resolveClinicTimeZone("Asia/Kolkata")).toBe("Asia/Kolkata");
    });

    it("computes offsets and calendar days in a zone", () => {
      const instant = new Date("2026-10-12T20:00:00Z");
      expect(timeZoneOffsetMinutes(instant, "Asia/Kolkata")).toBe(330);
      expect(timeZoneOffsetMinutes(instant, "UTC")).toBe(0);
      expect(dayKeyInTimeZone(instant, "UTC")).toBe("2026-10-12");
      expect(dayKeyInTimeZone(instant, "Asia/Kolkata")).toBe("2026-10-13");
    });

    it("builds half-open day ranges in the clinic zone", () => {
      expect(zonedDayRange("2026-10-12", "UTC")).toEqual({
        start: new Date("2026-10-12T00:00:00Z"),
        end: new Date("2026-10-13T00:00:00Z"),
      });
      expect(zonedDayRange("2026-10-12", "Asia/Kolkata")).toEqual({
        start: new Date("2026-10-11T18:30:00Z"),
        end: new Date("2026-10-12T18:30:00Z"),
      });
    });

    it("handles DST days (23-hour day in New York)", () => {
      const { start, end } = zonedDayRange("2026-03-08", "America/New_York");
      expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z");
      expect((end.getTime() - start.getTime()) / 3600000).toBe(23);
    });

    it("shifts day keys across month and year boundaries", () => {
      expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
      expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
      expect(() => addDays("12/10/2026", 1)).toThrow(RangeError);
    });
  });

  describe("Appointment workflow", () => {
    it("allows the documented status transitions", () => {
      expect(canTransition("SCHEDULED", "CONFIRMED")).toBe(true);
      expect(canTransition("CONFIRMED", "IN_PROGRESS")).toBe(true);
      expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
      expect(canTransition("SCHEDULED", "CANCELLED")).toBe(true);
      expect(canTransition("CONFIRMED", "NO_SHOW")).toBe(true);
    });

    it("blocks invalid or backwards transitions", () => {
      expect(canTransition("SCHEDULED", "COMPLETED")).toBe(false);
      expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(false);
      expect(canTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
      expect(canTransition("CANCELLED", "CONFIRMED")).toBe(false);
      expect(isTerminalStatus("NO_SHOW")).toBe(true);
      expect(isTerminalStatus("CONFIRMED")).toBe(false);
    });

    it("detects overlapping 30-minute slots", () => {
      const a = new Date("2026-10-12T09:00:00Z");
      expect(slotsOverlap(a, new Date("2026-10-12T09:15:00Z"))).toBe(true);
      expect(slotsOverlap(a, new Date("2026-10-12T09:30:00Z"))).toBe(false);
      expect(slotsOverlap(a, new Date("2026-10-12T08:31:00Z"))).toBe(true);
    });

    it("builds 16 half-hour slots from 09:00 to 16:30 local time", () => {
      const slots = buildDaySlots("2026-10-12");
      expect(slots).toHaveLength(16);
      expect(slots[0].getHours()).toBe(9);
      expect(slots[15].getHours()).toBe(16);
      expect(slots[15].getMinutes()).toBe(30);
      const { from, to } = localDayRange("2026-10-12");
      expect(new Date(to).getTime() - new Date(from).getTime()).toBeGreaterThanOrEqual(23 * 3600000);
    });
  });

  describe("Appointment validation", () => {
    const valid = { patientId: PATIENT, doctorId: DOCTOR, dateTime: inOneHour(), reason: "Routine follow-up" };

    it("accepts a valid booking", () => {
      const result = createAppointmentSchema.safeParse({ ...valid, notes: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dateTime).toBeInstanceOf(Date);
        expect(result.data.notes).toBeUndefined();
      }
    });

    it("rejects past times, malformed IDs, and short reasons", () => {
      expect(createAppointmentSchema.safeParse({ ...valid, dateTime: "2020-01-01T10:00:00Z" }).success).toBe(false);
      expect(createAppointmentSchema.safeParse({ ...valid, patientId: "not-an-id" }).success).toBe(false);
      expect(createAppointmentSchema.safeParse({ ...valid, reason: "x" }).success).toBe(false);
    });

    it("only accepts workflow statuses for PATCH (not SCHEDULED)", () => {
      expect(updateAppointmentStatusSchema.safeParse({ status: "CONFIRMED" }).success).toBe(true);
      expect(updateAppointmentStatusSchema.safeParse({ status: "SCHEDULED" }).success).toBe(false);
      expect(updateAppointmentStatusSchema.safeParse({ status: "DONE" }).success).toBe(false);
    });

    it("validates list filters", () => {
      expect(appointmentListQuerySchema.safeParse({ date: "2026-10-12" }).success).toBe(true);
      expect(appointmentListQuerySchema.safeParse({ date: "12-10-2026" }).success).toBe(false);
      expect(
        appointmentListQuerySchema.safeParse({ from: "2026-10-13T00:00:00Z", to: "2026-10-12T00:00:00Z" }).success
      ).toBe(false);
      expect(appointmentListQuerySchema.parse({}).limit).toBe(200);
    });
  });

  describe("Consultation validation", () => {
    const valid = {
      appointmentId: APPOINTMENT,
      patientId: PATIENT,
      vitals: { bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, temperature: 98.6, spo2: 99 },
      chiefComplaint: "Persistent dry cough for 5 days",
      symptoms: ["Dry cough", "Dry cough", "Mild throat irritation"],
      diagnosis: "Acute upper respiratory tract infection (viral)",
    };

    it("accepts the contract example and defaults status to COMPLETED", () => {
      const result = createConsultationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("COMPLETED");
        expect(result.data.symptoms).toEqual(["Dry cough", "Mild throat irritation"]);
      }
    });

    it("rejects out-of-range vitals and inverted blood pressure", () => {
      expect(vitalsSchema.safeParse({ spo2: 101 }).success).toBe(false);
      expect(vitalsSchema.safeParse({ heartRate: Number.NaN }).success).toBe(false);
      expect(vitalsSchema.safeParse({ bloodPressureSystolic: 80, bloodPressureDiastolic: 90 }).success).toBe(false);
      expect(vitalsSchema.safeParse({}).success).toBe(true);
    });

    it("requires a diagnosis and chief complaint", () => {
      expect(createConsultationSchema.safeParse({ ...valid, diagnosis: "" }).success).toBe(false);
      expect(createConsultationSchema.safeParse({ ...valid, chiefComplaint: "" }).success).toBe(false);
    });

    it("rejects empty draft updates", () => {
      expect(updateConsultationSchema.safeParse({}).success).toBe(false);
      expect(updateConsultationSchema.safeParse({ status: "COMPLETED" }).success).toBe(true);
    });

    it("computes BMI from weight and height", () => {
      expect(calculateBmi(70, 175)).toBe(22.9);
      expect(calculateBmi(70, undefined)).toBeUndefined();
    });
  });

  describe("Prescription validation & helpers", () => {
    const valid = {
      consultationId: CONSULTATION,
      patientId: PATIENT,
      medications: [
        { name: "Paracetamol", dosage: "500mg tablet", frequency: "1-0-1", durationDays: "3", instructions: "After food" },
      ],
    };

    it("accepts the contract example and coerces duration", () => {
      const result = createPrescriptionSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.medications[0].durationDays).toBe(3);
    });

    it("requires at least one well-formed medication", () => {
      expect(createPrescriptionSchema.safeParse({ ...valid, medications: [] }).success).toBe(false);
      expect(
        createPrescriptionSchema.safeParse({ ...valid, medications: [{ ...valid.medications[0], durationDays: "0" }] }).success
      ).toBe(false);
      expect(
        createPrescriptionSchema.safeParse({ ...valid, medications: [{ ...valid.medications[0], durationDays: "2.5" }] }).success
      ).toBe(false);
    });

    it("flags medications matching recorded allergies", () => {
      expect(matchingAllergies("Penicillin V", ["Penicillin", "Dust"])).toEqual(["Penicillin"]);
      expect(matchingAllergies("Amoxicillin", ["Penicillin"])).toEqual([]);
      expect(matchingAllergies("Ab", ["Ab"])).toEqual([]);
    });

    it("computes total doses for numeric frequencies only", () => {
      expect(totalDoses("1-0-1", 5)).toBe(10);
      expect(totalDoses("1-1-1", 3)).toBe(9);
      expect(totalDoses("SOS", 3)).toBeUndefined();
    });
  });
});
