# Mollycoddle

A pet medicine, supplement, and vaccine tracker — iOS and Android, built with React Native + Expo.

This README is written assuming you're brand new to coding. Follow it top to bottom.

## What it does

- Keep a list of your pets, each with a photo or icon avatar.
- Track medicines and supplements: dosage, how often they're given, and local reminder notifications.
- Track vaccinations: date given, next due date, with overdue ones flagged in red.
- Add records two ways: fill in a form by hand, or take a photo (or attach a PDF) of a label/vaccination sheet and let AI pull out the details for you to review before saving.
- See a dose history timeline per pet.
- Get an optional expiration date on medicines/supplements, with an "Expires in N days" / "Expired N days ago" label.

## 1. Install the tools (one-time setup)

1. **Install Node.js** — download the "LTS" version from https://nodejs.org and run the installer.
   Check it worked by opening your Terminal (Mac) or Command Prompt (Windows) and typing:
   ```
   node --version
   ```
   You should see a version number like `v20.x.x`.

2. **Install the Expo Go app** on your phone — search "Expo Go" in the App Store (iPhone) or Play Store (Android). This is what lets you preview the app live on your phone.

## 2. Get the project running

Open Terminal/Command Prompt, navigate into this folder, then run:

```
npm install
```

This downloads all the code libraries the project depends on (Expo, React Native, etc). It'll take a minute and create a `node_modules` folder — that's normal, don't touch it.

Then start the app:

```
npx expo start
```

A QR code will appear in your terminal.
- **iPhone**: open your Camera app and point it at the QR code, then tap the notification.
- **Android**: open the Expo Go app and use its built-in QR scanner.

Your phone and computer need to be on the **same Wi-Fi network** for this to work (use `npx expo start --tunnel` instead if they aren't).

### Optional: enable AI photo/PDF import

The "import from photo/PDF" feature (for both medicines and vaccines) calls a small backend that talks to Claude. To enable it locally:

1. Copy `.env.example` to `.env` (already gitignored — this file holds a real secret, never commit it).
2. Fill in `EXPO_PUBLIC_VACCINE_BACKEND_URL` and `EXPO_PUBLIC_APP_SHARED_SECRET` — ask whoever deployed the backend (see [Backend](#backend--ai-import) below) for these values.

For cloud builds (`eas build`), these also need to be set as EAS environment variables (`npx eas-cli env:create`) for whichever environment the build profile uses — a local `.env` file only covers `npx expo start` and `eas update` publishes, which bundle on your own machine.

Without this file, the rest of the app works fine — you just won't be able to use the photo/PDF import buttons.

## 3. How the project is organized

```
mollycoddle/
├── App.js                      ← top-level state and screen wiring (entry point)
├── theme.js                    ← shared colors used across every screen
├── app.json                    ← app name, icon, permissions, EAS/update config
├── package.json                ← lists which code libraries the project uses
├── assets/                     ← images, icons, fonts
├── docs/
│   ├── SDLC.md                 ← the build roadmap this app followed, step by step
│   └── APP_STORE_CHECKLIST.md  ← what's left before submitting to app stores
├── lib/                        ← non-visual logic (storage, scheduling, date math)
│   ├── petStorage.js           ← save/load pets
│   ├── medicineStorage.js      ← save/load medicines/supplements
│   ├── vaccineStorage.js       ← save/load vaccination records
│   ├── doseLogStorage.js       ← save/load "given today" history
│   ├── jsonStorage.js          ← shared AsyncStorage read/write helper
│   ├── schedule.js             ← "when is the next dose due" logic
│   ├── vaccineSchedule.js      ← "is this vaccine overdue" logic + date formatting
│   ├── medicineExpiry.js       ← "is this expired / expiring soon" logic
│   ├── dateMath.js             ← shared day-math used by the three files above
│   ├── documentExtraction.js   ← calls the AI backend to read a photo/PDF
│   ├── notifications.js        ← schedules local reminder notifications
│   ├── weekDays.js             ← weekday name constants
│   └── id.js                   ← generates local IDs for new records
└── components/                 ← reusable screen pieces
    ├── PetAvatar.js            ← a pet's photo, or a colored circle with their initial
    ├── PetFormModal.js         ← add/edit a pet
    ├── PetDetailModal.js       ← what you see when you tap a pet
    ├── MedicineFormModal.js    ← add/edit a medicine or supplement
    ├── MedicineImportModal.js  ← photo/PDF import + review checklist for medicines
    ├── MedicineRow.js          ← one medicine in the list
    ├── VaccineFormModal.js     ← add/edit a vaccination record
    ├── VaccineImportModal.js   ← photo/PDF import + review checklist for vaccines
    ├── VaccineRow.js           ← one vaccine in the list
    ├── DoseHistoryModal.js     ← per-pet dose history timeline
    └── ErrorBoundary.js        ← catches and displays unexpected crashes
```

## 4. Backend (AI import)

The photo/PDF import feature is backed by a small Cloudflare Worker in a **separate project**, `f:\mollycoddle\backend` (not part of this git repo, since it's deployed independently). It holds the Anthropic API key server-side so it never ships inside the app.

To redeploy it after changing the extraction prompt or schema:
```
cd f:\mollycoddle\backend
npx wrangler deploy
```

## 5. Beta testing (EAS Update)

Testers can try the app without your computer needing to be on, via [EAS Update](https://docs.expo.dev/eas-update/introduction/). They just need the free Expo Go app installed.

Shareable link: https://expo.dev/accounts/mollycoddle/projects/mollycoddle/updates

To publish a new build after making changes:
```
npx eas-cli update --branch preview --message "describe what changed"
```
Testers automatically get the latest version next time they open the app in Expo Go — no new link needed.

## 6. Git

This project is already on GitHub at `github.com/ptetalicoder/mollycoddle`. Standard workflow:
```
git add <files>
git commit -m "describe the change"
git push
```

## Project history

See [`docs/SDLC.md`](docs/SDLC.md) for the step-by-step roadmap this app was built against, and [`docs/APP_STORE_CHECKLIST.md`](docs/APP_STORE_CHECKLIST.md) for what's left before submitting to the App Store / Play Store.
