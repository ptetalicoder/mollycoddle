// lib/schedule.js
// Pure date math: given a medicine's frequency, when's its next dose?
// No storage access, no side effects — just a date in, a date out. Kept
// separate from notifications (a later step) so the scheduling logic can
// be reasoned about — and tested — on its own.
//
// This doesn't yet know whether today's dose was actually given (that's
// dose history, a later step) — it only answers "when does the schedule
// say the next dose falls," which is the piece local notifications will
// need in the next step.

import { WEEK_DAYS } from "./weekDays";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

// Returns the Date of this medicine's next scheduled dose, on or after `from`.
export function getNextDoseDate(medicine, from = new Date()) {
  const today = startOfDay(from);

  if (medicine.frequencyType === "weekly") {
    const targetDayIndexes = medicine.weeklyDays.map((day) => WEEK_DAYS.indexOf(day));
    for (let offset = 0; offset < 7; offset++) {
      const candidate = new Date(today.getTime() + offset * DAY_MS);
      if (targetDayIndexes.includes(candidate.getDay())) return candidate;
    }
    return today; // no days selected — the form prevents this, but don't crash if it happens
  }

  if (medicine.frequencyType === "interval") {
    // The medicine's creation date anchors the cycle — "every 3 days"
    // counts from when you first added it.
    const anchor = startOfDay(new Date(medicine.createdAt));
    const sinceAnchor = daysBetween(anchor, today);
    const remainder = sinceAnchor % medicine.intervalDays;
    const daysUntilNext = remainder === 0 ? 0 : medicine.intervalDays - remainder;
    return new Date(today.getTime() + daysUntilNext * DAY_MS);
  }

  // "daily" — every day is a dose day, so the next one is always today.
  return today;
}

// Turns a next-dose date into a short phrase for display, e.g. "Due today".
// Weekly medicines show a weekday name ("Due Fri") since they're tied to
// specific days of the week. Interval medicines ("every N days") show a
// day count instead ("Due in 3 days") — a weekday name would suggest the
// day of week matters, when really it's just a countdown.
export function describeNextDose(medicine, from = new Date()) {
  const today = startOfDay(from);
  const next = getNextDoseDate(medicine, from);
  const diff = daysBetween(today, next);

  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (medicine.frequencyType === "weekly") return `Due ${WEEK_DAYS[next.getDay()]}`;
  return `Due in ${diff} days`;
}
