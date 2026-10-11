/**
 * Pure appointment-domain helpers: status workflow, slot generation, and labels.
 * Safe to import from server and client code.
 */
import type { AppointmentStatus } from "@/types";

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

/** Allowed workflow transitions. COMPLETED, CANCELLED and NO_SHOW are terminal. */
export const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  SCHEDULED: ["CONFIRMED", "IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "NO_SHOW"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/** Statuses that occupy a doctor's slot (used for double-booking checks). */
export const ACTIVE_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];

/** Statuses in which a doctor may still record a consultation. */
export const CONSULTABLE_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"];

export const SLOT_MINUTES = 30;
export const CLINIC_OPEN_HOUR = 9;
export const CLINIC_CLOSE_HOUR = 17;

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

/** Two appointments conflict when they start less than one slot apart. */
export function slotsOverlap(a: Date, b: Date, slotMinutes = SLOT_MINUTES): boolean {
  return Math.abs(a.getTime() - b.getTime()) < slotMinutes * 60000;
}

/**
 * Builds the bookable slot start times for a local calendar day (`YYYY-MM-DD`), interpreted in the
 * runtime's local time zone (the browser when called from the booking UI).
 */
export function buildDaySlots(
  dayKey: string,
  { openHour = CLINIC_OPEN_HOUR, closeHour = CLINIC_CLOSE_HOUR, slotMinutes = SLOT_MINUTES } = {}
): Date[] {
  const [year, month, day] = dayKey.split("-").map(Number);
  const slots: Date[] = [];
  for (let minutes = openHour * 60; minutes < closeHour * 60; minutes += slotMinutes) {
    slots.push(new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60));
  }
  return slots;
}

/** Local calendar day (`YYYY-MM-DD`) of a date in the runtime's time zone. */
export function localDayKey(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local-time [start, end) range for a local calendar day, as ISO strings for API filters. */
export function localDayRange(dayKey: string): { from: string; to: string } {
  const [year, month, day] = dayKey.split("-").map(Number);
  return {
    from: new Date(year, month - 1, day).toISOString(),
    to: new Date(year, month - 1, day + 1).toISOString(),
  };
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Consultation",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

/** Label for the action button that moves an appointment into `status`. */
export const STATUS_ACTION_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Reschedule",
  CONFIRMED: "Confirm",
  IN_PROGRESS: "Start Visit",
  COMPLETED: "Complete",
  CANCELLED: "Cancel",
  NO_SHOW: "Mark No-show",
};

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatLongDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
