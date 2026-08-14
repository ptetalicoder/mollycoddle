// lib/config.example.js
// Template for lib/config.js. Copy this file to lib/config.js and fill in
// your real shared secret — lib/config.js is gitignored so it never gets
// committed (the secret would otherwise be visible to anyone on GitHub).

export const VACCINE_BACKEND_URL = "https://mollycoddle-vaccine-extractor.ptetalicoder.workers.dev";

// Paste the exact same value you set with:
//   npx.cmd wrangler secret put APP_SHARED_SECRET
export const APP_SHARED_SECRET = "PASTE_YOUR_SHARED_SECRET_HERE";
