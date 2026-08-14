// lib/dateMath.js
// Tiny shared day-math used by every "how many days until X" calculation
// in the app (medicine schedules, vaccine due dates, medicine expiration).
// Kept in one place so all of them treat "a day" the same way.

export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);
}
