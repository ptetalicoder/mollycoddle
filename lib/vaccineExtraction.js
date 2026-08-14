// lib/vaccineExtraction.js
// Sends a picked PDF or photo to the Mollycoddle backend (see ../backend)
// and gets back a best-effort list of { name, dateGiven, nextDueDate }
// extracted by Claude. This never touches the Anthropic API directly — the
// backend holds that key so it never ships inside the app.

import { File } from "expo-file-system";
import { VACCINE_BACKEND_URL, APP_SHARED_SECRET } from "./config";

export async function extractVaccinesFromFile(uri, mediaType) {
  const fileBase64 = await new File(uri).base64();

  const response = await fetch(VACCINE_BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": APP_SHARED_SECRET,
    },
    body: JSON.stringify({ fileBase64, mediaType }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data.vaccines ?? [];
}

// The backend returns plain "YYYY-MM-DD" strings. `new Date("2026-03-15")`
// parses that as UTC midnight, not local midnight — anywhere west of UTC
// that lands on the previous day once displayed. Parsing the components
// ourselves and building the date in local time avoids that shift.
export function parseLocalDate(dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr ?? "");
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}
