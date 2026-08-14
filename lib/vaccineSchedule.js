// lib/vaccineSchedule.js
// Pure date math for vaccine due status. Unlike medicines (lib/schedule.js),
// which always project forward to find the *next* upcoming dose, a vaccine
// has one fixed next-due date that can genuinely be overdue — so this
// reports how many days until (or past) that date, rather than always
// finding a future slot.

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}

// Short phrase for display: "Due today", "Due in 12 days", "Overdue by 3 days".
export function describeVaccineStatus(vaccine, from = new Date()) {
  const today = startOfDay(from);
  const due = startOfDay(new Date(vaccine.nextDueDate));
  const diff = daysBetween(today, due);

  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff > 1) return `Due in ${diff} days`;
  if (diff === -1) return "Overdue by 1 day";
  return `Overdue by ${Math.abs(diff)} days`;
}

export function isOverdue(vaccine, from = new Date()) {
  return startOfDay(new Date(vaccine.nextDueDate)) < startOfDay(from);
}

// Shared display format for a due/given date, e.g. "Mar 3, 2026".
export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
