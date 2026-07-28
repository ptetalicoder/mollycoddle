# SDLC Roadmap — Mollycoddle

## 1. Requirements (done, evolving)
- Multi-pet profiles (photo or icon avatar)
- Medicine/supplement scheduling (daily, weekly, interval-based)
- Dose reminders (local notifications)
- Dose history / "dose ring" visualization
- v1 constraint: **all data stored locally on-device** (no accounts, no server) —
  keeps the app simple to build and sidesteps App Store account-deletion
  requirements until/unless we add cloud sync later.

## 2. Design
- Follow iOS Human Interface Guidelines (https://developer.apple.com/design/human-interface-guidelines)
  and Android Material Design (https://m3.material.io) for platform-native feel —
  React Native + Expo handles a lot of this automatically (native components
  per platform), but things like navigation patterns and touch targets still
  need attention.
- Keep the color/typography system consistent across screens (see App.js for
  the current palette).

## 3. Development
Build in small, testable increments. Rough order:
1. ~~Hello world screen~~ ✅
2. ~~Home screen — pet list~~ ✅
3. ~~Add/edit pet screen~~ ✅
4. ~~Add/edit medicine/supplement screen~~ ✅
5. ~~Dose scheduling logic~~ ✅
6. ~~Local notifications for reminders~~ ✅
7. ~~Dose history view~~ ✅
8. ~~Polish, empty states, error handling~~ ✅

## 4. Testing
- **Manual, on-device**: Expo Go during development (fastest feedback loop)
- **Pre-release**: TestFlight (iOS) and Google Play Internal Testing track —
  required for Google Play's new-developer testing requirement anyway
- Test on at least one small-screen and one large-screen device per platform

## 5. Deployment
- Apple Developer Program account ($99/year) required to publish to the
  App Store
- Google Play Developer account ($25 one-time) required to publish to
  Google Play
- See `APP_STORE_CHECKLIST.md` before submitting either

## 6. Maintenance
- Both stores update their guidelines periodically — re-check before major
  releases, not just the first one
- Keep Expo SDK updated (`npx expo install --check`)
