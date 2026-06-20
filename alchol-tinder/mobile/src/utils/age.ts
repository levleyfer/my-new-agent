export const MIN_AGE = 18; // IL legal drinking age — mirrors backend MIN_AGE; backend remains the source of truth

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

export function computeAge(birthDate: string, today: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function isOfAge(birthDate: string, minAge: number = MIN_AGE): boolean {
  return isValidDateString(birthDate) && computeAge(birthDate) >= minAge;
}
