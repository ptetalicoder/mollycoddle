// lib/vaccineStorage.js
// Vaccination records for pets — same shared-list-with-a-foreign-key shape
// as medicineStorage.js. Unlike medicines (which repeat on a frequency), a
// vaccine just has one "next due" date at a time; getting a booster means
// editing the record with a new given date and a new next-due date.

import { loadJsonList, saveJsonList } from "./jsonStorage";

const STORAGE_KEY = "@mollycoddle/vaccines";

// A vaccine record looks like:
// { id, petId, name, dateGiven, nextDueDate, reminderTime, notes,
//   documentUri, documentName, notificationId, createdAt }
//
// dateGiven/nextDueDate are timestamps (ms). documentUri/documentName are
// null when no supporting PDF was attached.

export async function loadVaccines() {
  return loadJsonList(STORAGE_KEY);
}

export async function saveVaccines(vaccines) {
  await saveJsonList(STORAGE_KEY, vaccines);
}
