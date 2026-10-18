/** Normalises Vietnamese phone input for equality checks, never for display. */
export function normalizePhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0084')) digits = digits.slice(4);
  else if (digits.startsWith('84')) digits = digits.slice(2);
  if (digits && !digits.startsWith('0')) digits = `0${digits}`;
  return digits;
}

export function isPlausiblePhone(value: string): boolean {
  const normalized = normalizePhone(value);
  return normalized.length >= 9 && normalized.length <= 11;
}
