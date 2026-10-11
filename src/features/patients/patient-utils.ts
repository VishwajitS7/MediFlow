/**
 * Pure, framework-free helpers for the patient domain.
 * Safe to import from both server and client code (no database or Node APIs).
 */

export const PATIENT_ID_PREFIX = "MED";
export const PATIENT_ID_PATTERN = /^MED-(\d{4})-(\d{5})$/;

/** Formats a clinic patient ID: MED-<YYYY>-<5_DIGIT_SEQUENCE>. */
export function formatPatientId(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 99999) {
    throw new RangeError(`Patient ID sequence out of range: ${sequence}`);
  }
  return `${PATIENT_ID_PREFIX}-${year}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Computes the next patient ID for `year` given the highest existing ID for that year.
 * Sequences restart at 00001 each calendar year.
 */
export function nextPatientId(lastPatientId: string | null | undefined, year: number): string {
  const match = lastPatientId ? PATIENT_ID_PATTERN.exec(lastPatientId) : null;
  if (!match || Number(match[1]) !== year) {
    return formatPatientId(year, 1);
  }
  return formatPatientId(year, Number(match[2]) + 1);
}

export function isPatientId(value: string): boolean {
  return PATIENT_ID_PATTERN.test(value);
}

/** Escapes user input for safe use inside a RegExp. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Age in whole years at `now`. */
export function calculateAge(dateOfBirth: string | Date, now: Date = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age -= 1;
  }
  return Math.max(age, 0);
}

/**
 * Formats a date for display. Calendar dates (e.g. date of birth, stored as UTC midnight) render in UTC
 * so they never shift a day; timestamps (`dateOnly: false`) render in the viewer's local time zone.
 */
export function formatDate(value: string | Date | undefined, { dateOnly = true }: { dateOnly?: boolean } = {}): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  });
}

/** Converts a date into the `YYYY-MM-DD` string expected by `<input type="date">`. */
export function toDateInputValue(value: string | Date | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatGender(gender: string): string {
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}
