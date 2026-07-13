/** Sick-cert start date: past window (includes today). */
export const SICK_CERT_START_PAST_DAYS_INCLUSIVE = 7;

/** Max span from start date to end date (both days inclusive). */
export const SICK_CERT_END_SPAN_DAYS_INCLUSIVE = 14;

export function toLocalDateIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Parse YYYY-MM-DD as a local calendar date. */
export function parseDateOnlyLocal(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return null;
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function startOfLocalDay(reference: Date = new Date()): Date {
  const today = new Date(reference);
  today.setHours(0, 0, 0, 0);
  return today;
}

export function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Start date selectable range: past 7 days through today (no future dates). */
export function getSickCertStartDateBounds(reference: Date = new Date()) {
  const today = startOfLocalDay(reference);
  return {
    min: addCalendarDays(today, -(SICK_CERT_START_PAST_DAYS_INCLUSIVE - 1)),
    max: today,
  };
}

/** End date range from a chosen start date (up to 14 days inclusive). */
export function getSickCertEndDateBounds(startDateIso: string) {
  const startDate = parseDateOnlyLocal(startDateIso);
  if (!startDate) return null;
  return {
    min: startDate,
    max: addCalendarDays(startDate, SICK_CERT_END_SPAN_DAYS_INCLUSIVE - 1),
  };
}

export function validateSickCertStartDate(
  isoDate: string,
  reference: Date = new Date(),
): string | null {
  const selected = parseDateOnlyLocal(isoDate);
  if (!selected) return "Please enter a valid date.";
  const { min, max } = getSickCertStartDateBounds(reference);
  if (selected < min || selected > max) {
    return `Start date must be within the past ${SICK_CERT_START_PAST_DAYS_INCLUSIVE} days, including today (no future dates).`;
  }
  return null;
}

export function validateSickCertEndDate(endIso: string, startIso: string): string | null {
  const startDate = parseDateOnlyLocal(startIso);
  if (!startDate) return "Please select a valid Start Date first.";
  const selected = parseDateOnlyLocal(endIso);
  if (!selected) return "Please enter a valid date.";
  const bounds = getSickCertEndDateBounds(startIso);
  if (!bounds) return "Please select a valid Start Date first.";
  if (selected < bounds.min) return "End date cannot be earlier than start date.";
  if (selected > bounds.max) {
    return `End date cannot be more than ${SICK_CERT_END_SPAN_DAYS_INCLUSIVE} days from the start date (including the start day).`;
  }
  return null;
}

export function calculateInclusiveDateDiffInDays(
  startDateIso?: string | null,
  endDateIso?: string | null,
): number | null {
  if (!startDateIso || !endDateIso) return null;
  const startDate = parseDateOnlyLocal(startDateIso);
  const endDate = parseDateOnlyLocal(endDateIso);
  if (!startDate || !endDate || endDate < startDate) return null;
  const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  return diffDays + 1;
}
