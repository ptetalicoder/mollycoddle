// lib/petStorage.js
// Pet records, saved through the shared JSON-list helper (lib/jsonStorage.js)
// so the rest of the app never has to know *how* pets are stored — they
// just call loadPets() and savePets(pets).

import { loadJsonList, saveJsonList } from "./jsonStorage";

const STORAGE_KEY = "@mollycoddle/pets";

// A pet looks like: { id, name, species, photoUri, createdAt }
// photoUri is null when the pet has no photo yet (falls back to an icon).

export async function loadPets() {
  return loadJsonList(STORAGE_KEY);
}

export async function savePets(pets) {
  await saveJsonList(STORAGE_KEY, pets);
}
