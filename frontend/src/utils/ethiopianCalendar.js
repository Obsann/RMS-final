/**
 * Ethiopian Calendar ↔ Gregorian Calendar conversion utilities.
 * EC is ~7–8 years behind GC. The EC new year (Meskerem 1) falls on
 * Sept 11 (or Sept 12 in GC leap years).
 *
 * Current date example: GC 2026-05-08 → EC 2018 Miyazia 30
 */

export const EC_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Is `year` a Gregorian leap year? */
function isGcLeap(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Is `year` an Ethiopian leap year? (every 4th year, no century exception) */
function isEcLeap(year) {
  return year % 4 === 3;
}

// ── GC → EC ──────────────────────────────────────────────────────────────────

/**
 * Convert a Gregorian date string (ISO 8601 or Date) to an Ethiopian {year, month, day}.
 * Returns null on invalid input.
 */
export function gcToEc(gcDateStr) {
  if (!gcDateStr) return null;
  const date = new Date(gcDateStr);
  if (isNaN(date.getTime())) return null;

  const gcYear = date.getFullYear();
  const gcMonth = date.getMonth() + 1; // 1-indexed
  const gcDay = date.getDate();

  // Day-of-year (1-indexed)
  const daysInMonths = [31, isGcLeap(gcYear) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gcDoy = gcDay;
  for (let i = 0; i < gcMonth - 1; i++) gcDoy += daysInMonths[i];

  // Ethiopian new year (Meskerem 1) falls on GC Sept 11 (DOY 254)
  // or Sept 12 (DOY 256) when the *next* GC year is a leap year.
  const newYearDoy = isGcLeap(gcYear + 1) ? 256 : 254;

  let ecYear, daysSinceNewYear;

  if (gcDoy >= newYearDoy) {
    // We are past Meskerem 1 of this GC year
    ecYear = gcYear - 7;
    daysSinceNewYear = gcDoy - newYearDoy;
  } else {
    // We are before Meskerem 1, so still in previous EC year
    ecYear = gcYear - 8;
    const prevNewYearDoy = isGcLeap(gcYear) ? 256 : 254;
    const totalDaysInPrevGcYear = isGcLeap(gcYear - 1) ? 366 : 365;
    // Days remaining from prev GC year after new year + days into this GC year
    daysSinceNewYear = (totalDaysInPrevGcYear - prevNewYearDoy) + gcDoy;
  }

  const ecMonth = Math.floor(daysSinceNewYear / 30) + 1;
  const ecDay = (daysSinceNewYear % 30) + 1;

  return { year: ecYear, month: ecMonth, day: ecDay };
}

// ── EC → GC ──────────────────────────────────────────────────────────────────

/**
 * Convert an Ethiopian date to a Gregorian ISO date string "YYYY-MM-DD".
 * Returns '' on invalid / incomplete input.
 */
export function ecToGc(ecYear, ecMonth, ecDay) {
  if (!ecYear || !ecMonth || !ecDay) return '';

  ecYear = Number(ecYear);
  ecMonth = Number(ecMonth);
  ecDay = Number(ecDay);

  // Days from Meskerem 1 of this EC year
  const daysSinceNewYear = (ecMonth - 1) * 30 + (ecDay - 1);

  // GC year in which this EC year's Meskerem 1 falls
  const gcYearOfNewYear = ecYear + 7;

  // Meskerem 1 in GC: Sept 11 or Sept 12
  const sept11or12 = isGcLeap(gcYearOfNewYear + 1) ? 12 : 11;

  // Start from GC Sept 11/12 and add daysSinceNewYear
  const gcNewYear = new Date(gcYearOfNewYear, 8, sept11or12); // month 8 = September (0-indexed)
  gcNewYear.setDate(gcNewYear.getDate() + daysSinceNewYear);

  const y = gcNewYear.getFullYear();
  const m = String(gcNewYear.getMonth() + 1).padStart(2, '0');
  const d = String(gcNewYear.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── Helpers for UI ───────────────────────────────────────────────────────────

/** Number of days in an Ethiopian calendar month */
export function getEcDaysInMonth(year, month) {
  if (month === 13) {
    return isEcLeap(year) ? 6 : 5;
  }
  return 30;
}
