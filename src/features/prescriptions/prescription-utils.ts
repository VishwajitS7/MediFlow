/** Common dosing frequencies (morning-afternoon-night notation). */
export const FREQUENCY_PRESETS = ["1-0-1", "1-1-1", "1-0-0", "0-0-1", "0-1-0", "SOS"] as const;

/**
 * Returns the recorded allergies that a medication name appears to match (case-insensitive, either
 * direction substring). A safety hint only — not a substitute for clinical drug-allergy checking.
 */
export function matchingAllergies(medicationName: string, allergies: string[]): string[] {
  const name = medicationName.trim().toLowerCase();
  if (name.length < 3) return [];
  return allergies.filter((allergy) => {
    const a = allergy.trim().toLowerCase();
    return a.length >= 3 && (name.includes(a) || a.includes(name));
  });
}

/** Total units implied by an "a-b-c" frequency over `durationDays`, or undefined for free-text (e.g. SOS). */
export function totalDoses(frequency: string, durationDays: number): number | undefined {
  if (!/^\d+(-\d+){1,3}$/.test(frequency.trim())) return undefined;
  const perDay = frequency.split("-").reduce((sum, part) => sum + Number(part), 0);
  return perDay * durationDays;
}
