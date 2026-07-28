// lib/doseLogStorage.js
// Stores a record every time a dose is marked as given — the raw material
// for the dose history view. Same shared-list-with-a-foreign-key shape as
// medicineStorage.js: one flat list, filtered by petId or medicineId as
// needed, rather than nesting logs inside each medicine.

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mollycoddle/doseLogs";

// A dose log entry looks like: { id, medicineId, petId, givenAt }
// `givenAt` is a timestamp (from Date.now()) — when the dose was marked given.

export async function loadDoseLogs() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function saveDoseLogs(doseLogs) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(doseLogs));
}

function isSameDay(timestampA, timestampB) {
  const a = new Date(timestampA);
  const b = new Date(timestampB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Whether this medicine already has a log entry for today — used to show
// "Given today" instead of "Due today", and to let the mark-as-given
// button act as a toggle instead of piling up duplicate entries.
export function findTodayLog(doseLogs, medicineId, from = new Date()) {
  return doseLogs.find((log) => log.medicineId === medicineId && isSameDay(log.givenAt, from));
}
