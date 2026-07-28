// lib/medicineStorage.js
// Stores every pet's medicines/supplements in one shared list, the same
// way petStorage.js stores pets. Each medicine records which pet it
// belongs to via `petId`, so we filter by that instead of nesting the
// data inside each pet — nesting would make "does this pet have any
// medicines" checks and future features (like a combined dose history)
// more awkward than they need to be.

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mollycoddle/medicines";

// A medicine looks like:
// { id, petId, name, dosage, frequencyType, weeklyDays, intervalDays, notes, createdAt }
//
// frequencyType is "daily" | "weekly" | "interval".
//   - weeklyDays is only used when frequencyType is "weekly", e.g. ["Mon", "Thu"]
//   - intervalDays is only used when frequencyType is "interval", e.g. 3 for "every 3 days"

export async function loadMedicines() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function saveMedicines(medicines) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
}

// Turns a medicine's frequency fields into one readable line, e.g.
// "Weekly · Mon, Thu" — used anywhere we show a medicine in a list.
export function describeFrequency(medicine) {
  if (medicine.frequencyType === "weekly") {
    return `Weekly · ${medicine.weeklyDays.join(", ")}`;
  }
  if (medicine.frequencyType === "interval") {
    return medicine.intervalDays === 1 ? "Every day" : `Every ${medicine.intervalDays} days`;
  }
  return "Daily";
}
