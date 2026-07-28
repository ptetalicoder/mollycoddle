# Mollycoddle

A pet medicine & supplement tracker — iOS and Android, built with React Native + Expo.

This README is written assuming you're brand new to coding. Follow it top to bottom.

## 1. Install the tools (one-time setup)

1. **Install Node.js** — download the "LTS" version from https://nodejs.org and run the installer.
   Check it worked by opening your Terminal (Mac) or Command Prompt (Windows) and typing:
   ```
   node --version
   ```
   You should see a version number like `v20.x.x`.

2. **Install the Expo Go app** on your phone — search "Expo Go" in the App Store (iPhone) or Play Store (Android). This is what lets you preview the app live on your phone.

3. **Create a free GitHub account** at https://github.com if you don't have one yet.

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

Your phone and computer need to be on the **same Wi-Fi network** for this to work.

You should see a screen that says "Mollycoddle — Every pet, every dose, on time." That's it running live on your phone.

## 3. How the project is organized

```
mollycoddle/
├── App.js              ← home screen: the pet list (entry point of the app)
├── theme.js            ← shared colors used across every screen
├── app.json            ← app name, icon, and platform settings
├── package.json        ← lists which code libraries the project uses
├── babel.config.js     ← build tool config (you won't need to touch this)
├── assets/             ← images, icons, fonts go here
├── lib/
│   └── petStorage.js   ← saves/loads your pets to the phone's local storage
└── components/
    ├── PetAvatar.js       ← a pet's photo, or a colored circle with their initial
    ├── AddPetModal.js     ← the "add a pet" form
    └── PetDetailModal.js  ← what you see when you tap a pet
```

We've started splitting things into `lib/` (non-visual logic) and `components/` (reusable pieces of screen) now that the app has more than one screen's worth of code.

### New dependency: expo-image-picker

This step added `expo-image-picker` (lets users pick a pet photo from their
library) to `package.json`. Run `npm install` again to pull it down before
starting the app.

## 4. Push this to GitHub

From inside the `mollycoddle` folder:

```
git init
git add .
git commit -m "Initial Mollycoddle scaffold"
```

Then on GitHub.com: click the **+** icon → **New repository** → name it `mollycoddle` → **Create repository** (leave it empty, don't add a README there).

GitHub will show you commands like this — copy the ones under "…or push an existing repository":

```
git remote add origin https://github.com/YOUR-USERNAME/mollycoddle.git
git branch -M main
git push -u origin main
```

Run those, and your code is now on GitHub with version history.

## What's next

Once you've got this running on your phone, tell Claude and we'll build the next piece together — starting with the "add a pet" screen.
