/**
 * Time-zone helpers for "clinic day" calculations (daily queue numbers, `?date=` filters).
 * Pure functions built on Intl — no dependencies, safe on server and client.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Clinic time zone from CLINIC_TIMEZONE (IANA name), falling back to UTC when unset or invalid. */
export function resolveClinicTimeZone(value: string | undefined): string {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

/** Offset of `timeZone` from UTC at `date`, in minutes (e.g. +330 for Asia/Kolkata). */
export function timeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

export function isDayKey(value: string): boolean {
  return DAY_KEY_PATTERN.test(value);
}

/** Calendar day (`YYYY-MM-DD`) of `date` in `timeZone`. */
export function dayKeyInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function zonedMidnight(dayKey: string, timeZone: string): Date {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) throw new RangeError(`Invalid day key: ${dayKey}`);
  const utcMidnight = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  // Two passes so days that start next to a DST transition resolve to the correct offset.
  const first = utcMidnight - timeZoneOffsetMinutes(new Date(utcMidnight), timeZone) * 60000;
  return new Date(utcMidnight - timeZoneOffsetMinutes(new Date(first), timeZone) * 60000);
}

/** Half-open UTC range [start, end) covering the calendar day `dayKey` in `timeZone`. */
export function zonedDayRange(dayKey: string, timeZone: string): { start: Date; end: Date } {
  return { start: zonedMidnight(dayKey, timeZone), end: zonedMidnight(addDays(dayKey, 1), timeZone) };
}

/** Shifts a `YYYY-MM-DD` key by whole days. */
export function addDays(dayKey: string, days: number): string {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) throw new RangeError(`Invalid day key: ${dayKey}`);
  const shifted = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + days * DAY_MS);
  return shifted.toISOString().slice(0, 10);
}
