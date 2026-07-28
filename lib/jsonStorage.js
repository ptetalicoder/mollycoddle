// lib/jsonStorage.js
// Tiny wrapper around AsyncStorage for "one JSON array under one key" —
// the shape every list in this app (pets, medicines, dose logs) uses.
// Centralizing it means corrupted data is handled the same safe way
// everywhere, instead of three separate copies of the same JSON.parse.

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function loadJsonList(key) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // Corrupted data shouldn't take the whole app down on every future
    // launch — start fresh for this list instead of crashing.
    console.warn(`Couldn't read stored data for ${key}, starting fresh.`, error);
    return [];
  }
}

export async function saveJsonList(key, list) {
  await AsyncStorage.setItem(key, JSON.stringify(list));
}
