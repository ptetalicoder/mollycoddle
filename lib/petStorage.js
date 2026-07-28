// lib/petStorage.js
// This file is the only place in the app that talks to AsyncStorage —
// React Native's version of a small on-device database (it just stores
// text under a key, like a private localStorage for the phone).
//
// Keeping all the load/save logic in one file means the rest of the app
// (App.js, the modals) never has to know *how* pets are stored — they just
// call loadPets() and savePets(pets).

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@mollycoddle/pets";

// A pet looks like: { id, name, species, photoUri, createdAt }
// photoUri is null when the pet has no photo yet (falls back to an icon).

export async function loadPets() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function savePets(pets) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}
