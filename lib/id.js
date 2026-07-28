// lib/id.js
// A simple unique-enough id: current time plus a few random characters.
// Good enough for a local, single-device app — there's no server involved
// that would need truly globally-unique ids. Shared by petStorage.js and
// medicineStorage.js so both kinds of records are identified the same way.

export function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
