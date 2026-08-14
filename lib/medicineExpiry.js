// lib/medicineExpiry.js
// Pure date math for a medicine's expiration date — a separate concept
// from its dose schedule (lib/schedule.js). A medicine can be "due today"
// for a dose while also being expired, or not expiring for months — the
// two don't interact.

import { startOfDay, daysBetween } from "./dateMath";

// Short phrase for display, or null if no expiration date is set.
export function describeExpiration(medicine, from = new Date()) {
  if (!medicine.expirationDate) return null;
  const today = startOfDay(from);
  const expires = startOfDay(new Date(medicine.expirationDate));
  const diff = daysBetween(today, expires);

  if (diff === 0) return "Expires today";
  if (diff === 1) return "Expires tomorrow";
  if (diff > 1) return `Expires in ${diff} days`;
  if (diff === -1) return "Expired 1 day ago";
  return `Expired ${Math.abs(diff)} days ago`;
}

export function isExpired(medicine, from = new Date()) {
  if (!medicine.expirationDate) return false;
  return startOfDay(new Date(medicine.expirationDate)) < startOfDay(from);
}
